<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Dashboard summary KPIs
     */
    public function summary()
    {
        $totalSales      = Sale::where('status', 'completed')->sum('total_amount');
        $totalRefunds    = Sale::where('status', 'refunded')->count();
        $medicineCount   = Medicine::count();
        $lowStockCount   = Inventory::whereColumn('quantity', '<=', 'min_stock_level')->count();
        $nearExpiryCount = Medicine::where('status', 'near_expiry')->count();
        $expiredCount    = Medicine::where('status', 'expired')->count();
        $todaySales      = Sale::where('status', 'completed')
            ->whereDate('created_at', Carbon::today())
            ->sum('total_amount');
        $totalTxns       = Sale::where('status', 'completed')->count();
        $avgTransaction  = $totalTxns > 0 ? $totalSales / $totalTxns : 0;

        return response()->json([
            'total_revenue'      => (float)$totalSales,
            'today_revenue'      => (float)$todaySales,
            'medicines_total'    => $medicineCount,
            'low_stock_alerts'   => $lowStockCount,
            'near_expiry_alerts' => $nearExpiryCount,
            'expired_alerts'     => $expiredCount,
            'total_transactions' => $totalTxns,
            'avg_transaction'    => round((float)$avgTransaction, 2),
            'total_refunds'      => $totalRefunds,
        ]);
    }

    /**
     * Daily revenue for the last N days (default 30)
     */
    public function salesByDay(Request $request)
    {
        $days = (int)($request->query('days', 30));
        $days = max(7, min($days, 365));

        $sales = Sale::where('status', 'completed')
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($sales);
    }

    /**
     * Top-selling medicines by quantity sold
     */
    public function topMedicines(Request $request)
    {
        $limit = (int)($request->query('limit', 10));

        $top = SaleItem::select('medicine_id',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(quantity * price) as total_revenue')
            )
            ->with('medicine:id,name,category')
            ->groupBy('medicine_id')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get();

        return response()->json($top);
    }

    /**
     * Revenue breakdown by payment method
     */
    public function paymentMethodBreakdown()
    {
        $data = Sale::where('status', 'completed')
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as total'))
            ->groupBy('payment_method')
            ->get();

        return response()->json($data);
    }

    /**
     * Expiry risk report
     */
    public function expiryReport()
    {
        $now      = Carbon::now();
        $in30     = Carbon::now()->addDays(30);
        $in60     = Carbon::now()->addDays(60);

        $expiringSoon = Medicine::with('inventory')
            ->whereIn('status', ['near_expiry', 'expired'])
            ->orderBy('expiry_date')
            ->get(['id', 'name', 'category', 'batch_no', 'expiry_date', 'status']);

        return response()->json([
            'expiring_within_30' => $expiringSoon->filter(fn($m) => $m->expiry_date && Carbon::parse($m->expiry_date)->lte($in30))->values(),
            'expiring_within_60' => $expiringSoon->filter(fn($m) => $m->expiry_date && Carbon::parse($m->expiry_date)->lte($in60))->values(),
            'already_expired'    => $expiringSoon->filter(fn($m) => $m->status === 'expired')->values(),
        ]);
    }

    /**
     * Low stock report
     */
    public function stockReport()
    {
        $lowStock = Inventory::whereColumn('quantity', '<=', 'min_stock_level')
            ->with('medicine:id,name,category')
            ->get();

        $outOfStock = $lowStock->filter(fn($i) => $i->quantity === 0)->values();
        $critical   = $lowStock->filter(fn($i) => $i->quantity > 0)->values();

        return response()->json([
            'out_of_stock' => $outOfStock,
            'critical'     => $critical,
        ]);
    }
}
