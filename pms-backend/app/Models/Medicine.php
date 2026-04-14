<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = [
        'name', 'category', 'batch_no', 'expiry_date', 'status',
        'purchase_price', 'selling_price', 'manufacturer'
    ];

    public function inventory()
    {
        return $this->hasOne(Inventory::class);
    }

    public function batches()
    {
        return $this->hasMany(Batch::class);
    }
}
