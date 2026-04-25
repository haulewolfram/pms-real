<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('batches')) {
            Schema::create('batches', function (Blueprint $table) {
                $table->id();
                $table->foreignId('medicine_id')->constrained()->cascadeOnDelete();
                $table->string('batch_no');
                $table->date('expiry_date');
                $table->integer('quantity_received')->default(0);
                $table->integer('current_quantity')->default(0);
                $table->string('status')->default('active'); // active, near_expiry, expired
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
