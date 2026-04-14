<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'batch_no',
        'expiry_date',
        'quantity_received',
        'current_quantity',
        'status',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
