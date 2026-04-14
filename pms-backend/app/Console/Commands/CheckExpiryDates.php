<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Medicine;
use App\Models\Notification;
use Carbon\Carbon;

class CheckExpiryDates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-expiry-dates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check medicines for near_expiry or expired status and spawn notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Updating batch statuses and checking for expiry (60-day threshold)...");

        $today = Carbon::today();
        $threshold = Carbon::today()->addDays(60); // 2-month threshold
        
        $batches = \App\Models\Batch::with('medicine')->get();
        $allMedicineIds = [];

        foreach ($batches as $batch) {
            $expiryDate = Carbon::parse($batch->expiry_date)->startOfDay();
            $newStatus = 'active';
            $allMedicineIds[] = $batch->medicine_id;

            // Use explicit comparison operators to avoid Carbon's isBetween behavior
            if ($expiryDate->lte($today)) {
                $newStatus = 'expired';
            } elseif ($expiryDate->lte($threshold)) {
                $newStatus = 'near_expiry';
            }

            if ($batch->status !== $newStatus) {
                $oldStatus = $batch->status;
                $batch->status = $newStatus;
                $batch->save();
                
                // Create Notification for state change
                $message = "Batch [{$batch->batch_no}] of " . ($batch->medicine->name ?? 'Unknown') . " status changed from " . str_replace('_', ' ', $oldStatus) . " to " . str_replace('_', ' ', $newStatus) . ".";
                $this->triggerNotification($batch->medicine_id, $newStatus, $message);
                $this->line("Batch [{$batch->batch_no}]: {$oldStatus} -> {$newStatus}");
            }
        }

        // Re-sync medicine metadata for ALL medicines with batches to ensure consistent summary state
        $uniqueMedicineIds = array_unique($allMedicineIds);
        $this->info("Synchronizing metadata for " . count($uniqueMedicineIds) . " medicines...");
        foreach ($uniqueMedicineIds as $medicineId) {
            $this->syncMedicineMetadata($medicineId);
        }

        $this->info("Expiry check and status synchronization completed.");
    }

    private function triggerNotification($medicineId, $type, $message)
    {
        $exists = Notification::where('medicine_id', $medicineId)
            ->where('type', $type)
            ->where('status', 'unread')
            ->exists();

        if (!$exists) {
            Notification::create([
                'medicine_id' => $medicineId,
                'type' => $type,
                'message' => $message,
                'status' => 'unread'
            ]);
        }
    }

    private function syncMedicineMetadata($medicineId)
    {
        $bestBatch = \App\Models\Batch::where('medicine_id', $medicineId)
            ->whereIn('status', ['active', 'near_expiry'])
            ->where('current_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->first();

        // If no active batches found, determine if truly expired or just out of stock.
        $status = 'active';
        if ($bestBatch) {
            $status = $bestBatch->status;
        } else {
            $anyBatch = \App\Models\Batch::where('medicine_id', $medicineId)->orderBy('expiry_date', 'desc')->first();
            if ($anyBatch && $anyBatch->status === 'expired') {
                $status = 'expired';
            }
        }

        \App\Models\Medicine::where('id', $medicineId)->update([
            'batch_no' => $bestBatch ? $bestBatch->batch_no : null,
            'expiry_date' => $bestBatch ? $bestBatch->expiry_date : null,
            'status' => $status
        ]);
    }
}
