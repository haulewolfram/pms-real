<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $fillable = [
        'medicine_id', 'quantity', 'min_stock_level', 'last_updated'
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
