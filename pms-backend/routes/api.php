<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SystemJobController;

// Public Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected APIs (require Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth status & logout
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin, Pharmacist & Cashier shared read/write for Terminal and Dashboard
    Route::middleware('role:admin,pharmacist,cashier')->group(function () {
        Route::apiResource('sales', SaleController::class)->only(['index', 'show', 'store']);
        Route::post('sales/{sale}/refund', [SaleController::class, 'refund']);
        Route::get('medicines', [MedicineController::class, 'index']);
        Route::get('medicines/{medicine}', [MedicineController::class, 'show']);
        Route::get('inventories', [InventoryController::class, 'index']);
        Route::get('reports/summary', [ReportController::class, 'summary']);
        Route::get('reports/sales-by-day', [ReportController::class, 'salesByDay']);
        Route::get('reports/top-medicines', [ReportController::class, 'topMedicines']);
        Route::get('reports/payment-methods', [ReportController::class, 'paymentMethodBreakdown']);
        Route::get('reports/expiry', [ReportController::class, 'expiryReport']);
        Route::get('reports/stock', [ReportController::class, 'stockReport']);
    });

    // Admin & Pharmacist Roles (Product & Stock Write Management)
    Route::middleware('role:admin,pharmacist')->group(function () {
        Route::apiResource('medicines', MedicineController::class)->except(['index', 'show']);
        Route::apiResource('batches', BatchController::class);
        Route::put('inventories/{id}', [InventoryController::class, 'update']);
    });

    // Admin Only Role (System Management)
    Route::post('users', [UserController::class, 'store']); // Temporarily public
    Route::middleware('role:admin')->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::get('users/{user}', [UserController::class, 'show']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('jobs', [SystemJobController::class, 'index']);
        Route::delete('jobs/{id}', [SystemJobController::class, 'destroy']);
    });

    // All Roles (Notifications)
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
});
