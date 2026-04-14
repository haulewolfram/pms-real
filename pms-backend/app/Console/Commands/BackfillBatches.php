<?php

namespace App\Console\Commands;

use App\Models\Medicine;
use App\Models\Batch;
use Illuminate\Console\Command;

class BackfillBatches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pms:backfill-batches';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Creates missing Batch records for medicines that have batch metadata but no related Batch models.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting batch backfill process...');

        $medicines = Medicine::whereNotNull('batch_no')
            ->whereDoesntHave('batches')
            ->with('inventory')
            ->get();

        if ($medicines->isEmpty()) {
            $this->info('No medicines found without batches. Everything is synchronized.');
            return 0;
        }

        $count = $medicines->count();
        $this->info("Found {$count} medicines requiring backfill.");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($medicines as $medicine) {
            Batch::create([
                'medicine_id' => $medicine->id,
                'batch_no' => $medicine->batch_no,
                'expiry_date' => $medicine->expiry_date,
                'quantity_received' => $medicine->inventory->quantity ?? 0,
                'current_quantity' => $medicine->inventory->quantity ?? 0,
                'status' => 'active',
            ]);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Batch backfill completed successfully.');

        return 0;
    }
}
