<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id', 'medicine_id', 'quantity', 'price'
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
