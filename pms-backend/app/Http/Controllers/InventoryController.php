<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Notification;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        return response()->json(Inventory::paginate(15));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer',
            'action' => 'required|in:add,subtract,set',
        ]);

        $inventory = Inventory::findOrFail($id);
        
        if ($request->action === 'add') {
            $inventory->quantity += $request->quantity;
        } elseif ($request->action === 'subtract') {
            $inventory->quantity = max(0, $inventory->quantity - $request->quantity);
        } else {
            $inventory->quantity = max(0, $request->quantity);
        }

        $inventory->save();

        // Check alerts
        if ($inventory->quantity == 0) {
            Notification::create([
                'medicine_id' => $inventory->medicine_id,
                'type' => 'out_of_stock',
                'message' => "Medicine ID {$inventory->medicine_id} is out of stock.",
            ]);
        } elseif ($inventory->quantity <= $inventory->min_stock_level) {
            Notification::create([
                'medicine_id' => $inventory->medicine_id,
                'type' => 'low_stock',
                'message' => "Medicine ID {$inventory->medicine_id} is running low ({$inventory->quantity} in stock).",
            ]);
        }

        return response()->json(['message' => 'Inventory updated', 'data' => $inventory]);
    }
}
