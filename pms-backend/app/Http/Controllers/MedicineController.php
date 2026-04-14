<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Inventory;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    private function determineStatus($expiryDate)
    {
        if (!$expiryDate) return 'active';
        $expiry = \Carbon\Carbon::parse($expiryDate)->endOfDay();
        if ($expiry->isPast()) {
            return 'expired';
        } elseif ($expiry->lte(now()->addDays(60))) {
            return 'near_expiry';
        }
        return 'active';
    }

    public function index(Request $request)
    {
        $perPage = min((int)($request->query('per_page', 15)), 500);
        return response()->json(Medicine::with('inventory')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'batch_no' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'manufacturer' => 'nullable|string|max:255',
        ]);

        if (isset($validated['expiry_date'])) {
            $validated['status'] = $this->determineStatus($validated['expiry_date']);
        } else {
            $validated['status'] = 'active';
        }

        $medicine = Medicine::create($validated);

        // Auto-initialize inventory for new medicine
        Inventory::create([
            'medicine_id' => $medicine->id, 
            'quantity' => 0, 
            'min_stock_level' => 10
        ]);

        // Auto-create initial batch record if details provided
        if ($medicine->batch_no && $medicine->expiry_date) {
            \App\Models\Batch::create([
                'medicine_id' => $medicine->id,
                'batch_no' => $medicine->batch_no,
                'expiry_date' => $medicine->expiry_date,
                'quantity_received' => 0,
                'current_quantity' => 0,
                'status' => $medicine->status
            ]);
        }

        return response()->json(['message' => 'Medicine created successfully', 'data' => $medicine], 201);
    }

    public function show(Medicine $medicine)
    {
        return response()->json($medicine);
    }

    public function update(Request $request, Medicine $medicine)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string|max:255',
            'batch_no' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
            'purchase_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'manufacturer' => 'nullable|string|max:255',
        ]);

        if (array_key_exists('expiry_date', $validated)) {
            $validated['status'] = $this->determineStatus($validated['expiry_date']);
        }

        $medicine->update($validated);

        // Sync changes back to the next-to-expire Batch
        if ($request->has('batch_no') || $request->has('expiry_date')) {
            $activeBatch = \App\Models\Batch::where('medicine_id', $medicine->id)
                ->whereIn('status', ['active', 'near_expiry'])
                ->orderBy('expiry_date', 'asc')
                ->first();

            if ($activeBatch) {
                $activeBatch->update([
                    'batch_no' => $medicine->batch_no,
                    'expiry_date' => $medicine->expiry_date,
                    'status' => $medicine->status
                ]);
            }
        }

        return response()->json(['message' => 'Medicine updated', 'data' => $medicine]);
    }

    public function destroy(Medicine $medicine)
    {
        $medicine->delete();
        return response()->json(['message' => 'Medicine deleted']);
    }
}
