<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Inventory;
use App\Models\Batch;
use App\Models\Medicine;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index()
    {
        return response()->json(
            Sale::with(['items.medicine', 'user'])->latest()->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'discount'       => 'nullable|numeric|min:0',
            'tax'            => 'nullable|numeric|min:0',
            'payment_method' => 'required|string|in:cash,card,insurance',
            'items'          => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity'    => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $user_id     = $request->user()->id;
            $total_amount = 0;
            $resolvedItems = [];

            // First pass: validate stock and resolve prices from the Medicine catalog
            foreach ($validated['items'] as $item) {
                $medicine  = Medicine::findOrFail($item['medicine_id']);
                $inventory = Inventory::where('medicine_id', $item['medicine_id'])->first();

                if (!$inventory || $inventory->quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for: {$medicine->name}");
                }

                $unit_price = (float) $medicine->selling_price;
                $total_amount += $item['quantity'] * $unit_price;

                $resolvedItems[] = [
                    'medicine_id' => $item['medicine_id'],
                    'medicine'    => $medicine,
                    'quantity'    => $item['quantity'],
                    'price'       => $unit_price,
                    'inventory'   => $inventory,
                ];
            }

            // Apply discount and tax
            $discount = (float)($validated['discount'] ?? 0);
            $tax      = (float)($validated['tax'] ?? 0);
            $final_total = $total_amount - $discount + $tax;

            // Create master Sale record
            $sale = Sale::create([
                'user_id'        => $user_id,
                'total_amount'   => round($final_total, 2),
                'discount'       => $discount,
                'tax'            => $tax,
                'payment_method' => $validated['payment_method'],
                'status'         => 'completed',
            ]);

            // Second pass: create SaleItems and deduct stock (FEFO from batches)
            foreach ($resolvedItems as $item) {
                SaleItem::create([
                    'sale_id'     => $sale->id,
                    'medicine_id' => $item['medicine_id'],
                    'quantity'    => $item['quantity'],
                    'price'       => $item['price'],
                ]);

                // Deduct from batches using FEFO (earliest expiry first)
                $remaining = $item['quantity'];
                $batches = Batch::where('medicine_id', $item['medicine_id'])
                    ->whereIn('status', ['active', 'near_expiry'])
                    ->where('current_quantity', '>', 0)
                    ->orderBy('expiry_date', 'asc')
                    ->get();

                foreach ($batches as $batch) {
                    if ($remaining <= 0) break;
                    $deduct = min($remaining, $batch->current_quantity);
                    $batch->current_quantity -= $deduct;
                    if ($batch->current_quantity === 0) {
                        $batch->status = 'depleted';
                    }
                    $batch->save();
                    $remaining -= $deduct;
                }

                // Update inventory aggregate
                $inv = $item['inventory'];
                $inv->quantity -= $item['quantity'];
                $inv->save();

                // Low stock / out-of-stock alerts
                if ($inv->quantity === 0) {
                    Notification::firstOrCreate(
                        ['medicine_id' => $item['medicine_id'], 'type' => 'out_of_stock', 'status' => 'unread'],
                        ['message' => "{$item['medicine']->name} is now out of stock."]
                    );
                } elseif ($inv->quantity <= $inv->min_stock_level) {
                    Notification::firstOrCreate(
                        ['medicine_id' => $item['medicine_id'], 'type' => 'low_stock', 'status' => 'unread'],
                        ['message' => "{$item['medicine']->name} is running low ({$inv->quantity} left)."]
                    );
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Sale processed successfully',
                'data'    => $sale->load('items.medicine', 'user'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to process sale',
                'error'   => $e->getMessage(),
            ], 400);
        }
    }

    public function show(Sale $sale)
    {
        return response()->json($sale->load('items.medicine', 'user'));
    }

    public function refund(Request $request, Sale $sale)
    {
        if ($sale->status === 'refunded') {
            return response()->json(['message' => 'Sale is already refunded.'], 400);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $sale->status        = 'refunded';
            $sale->refund_reason = $validated['reason'];
            $sale->save();

            // Restore inventory stock
            foreach ($sale->items as $item) {
                $inventory = Inventory::where('medicine_id', $item->medicine_id)->first();
                if ($inventory) {
                    $inventory->quantity += $item->quantity;
                    $inventory->save();
                }

                // Restore to most recent batch (add back to the last depleted/near_expiry batch)
                $batch = Batch::where('medicine_id', $item->medicine_id)
                    ->orderBy('expiry_date', 'asc')
                    ->first();
                if ($batch) {
                    $batch->current_quantity += $item->quantity;
                    if ($batch->status === 'depleted') {
                        $batch->status = 'active';
                    }
                    $batch->save();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Sale refunded successfully',
                'data'    => $sale->load('items.medicine'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to refund sale',
                'error'   => $e->getMessage(),
            ], 400);
        }
    }
}
