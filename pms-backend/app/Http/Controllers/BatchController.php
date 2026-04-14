<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Medicine;
use Illuminate\Http\Request;

class BatchController extends Controller
{
    public function index()
    {
        return response()->json(Batch::with('medicine')->get());
    }

    private function determineStatus($expiryDate)
    {
        $expiry = \Carbon\Carbon::parse($expiryDate)->endOfDay();
        if ($expiry->isPast()) {
            return 'expired';
        } elseif ($expiry->lte(now()->addDays(60))) {
            return 'near_expiry';
        }
        return 'active';
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'batch_no' => 'required|string',
            'expiry_date' => 'required|date',
            'quantity_received' => 'required|integer|min:0',
        ]);

        $validated['current_quantity'] = $validated['quantity_received'];
        $validated['status'] = $this->determineStatus($validated['expiry_date']);

        $batch = Batch::create($validated);
        $this->syncInventory($batch->medicine_id);

        return response()->json($batch, 201);
    }

    public function update(Request $request, Batch $batch)
    {
        $validated = $request->validate([
            'batch_no' => 'sometimes|string',
            'expiry_date' => 'sometimes|date',
            'current_quantity' => 'sometimes|integer|min:0',
        ]);

        if (isset($validated['expiry_date'])) {
            $validated['status'] = $this->determineStatus($validated['expiry_date']);
        }

        $batch->update($validated);
        $this->syncInventory($batch->medicine_id);

        return response()->json($batch);
    }

    public function destroy(Batch $batch)
    {
        $medicineId = $batch->medicine_id;
        $batch->delete();
        $this->syncInventory($medicineId);
        
        return response()->json(null, 204);
    }

    private function syncInventory($medicineId)
    {
        $totalQuantity = Batch::where('medicine_id', $medicineId)
            ->whereIn('status', ['active', 'near_expiry'])
            ->sum('current_quantity');

        \App\Models\Inventory::updateOrCreate(
            ['medicine_id' => $medicineId],
            [
                'quantity' => $totalQuantity,
                'last_updated' => now()
            ]
        );

        // Sync Medicine summary with the most relevant active batch (earliest expiry)
        $bestBatch = Batch::where('medicine_id', $medicineId)
            ->whereIn('status', ['active', 'near_expiry'])
            ->where('current_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->first();

        if ($bestBatch) {
            Medicine::where('id', $medicineId)->update([
                'batch_no' => $bestBatch->batch_no,
                'expiry_date' => $bestBatch->expiry_date,
                'status' => $bestBatch->status
            ]);
        } else {
            // No active/near_expiry batches with quantity. 
            // Check if there are ANY batches to determine if truly expired or just out of stock.
            $anyBatch = Batch::where('medicine_id', $medicineId)->orderBy('expiry_date', 'desc')->first();
            Medicine::where('id', $medicineId)->update([
                'status' => ($anyBatch && $anyBatch->status === 'expired') ? 'expired' : 'active'
            ]);
        }
    }
}
