<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Medicine;
use App\Models\Inventory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // 2. Pharmacist User
        User::create([
            'name' => 'Pharmacist User',
            'email' => 'pharmacist@example.com',
            'password' => Hash::make('password'),
            'role' => 'pharmacist',
        ]);

        // 3. Cashier User
        User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@example.com',
            'password' => Hash::make('password'),
            'role' => 'cashier',
        ]);

        // 2. Add Dummy Medicines
        $medicines = [
            [
                'name' => 'Amoxicillin 500mg',
                'category' => 'Antibiotic',
                'batch_no' => 'AMX2026',
                'expiry_date' => now()->addMonths(12)->format('Y-m-d'),
                'purchase_price' => 2.50,
                'selling_price' => 5.00,
                'manufacturer' => 'PharmaCorp',
                'qty' => 150
            ],
            [
                'name' => 'Paracetamol 500mg',
                'category' => 'Painkiller',
                'batch_no' => 'PAR2025',
                'expiry_date' => now()->addDays(20)->format('Y-m-d'), // Near Expiry
                'purchase_price' => 0.50,
                'selling_price' => 1.50,
                'manufacturer' => 'HealthMeds',
                'qty' => 300
            ],
            [
                'name' => 'Ibuprofen 400mg',
                'category' => 'NSAID',
                'batch_no' => 'IBU2024',
                'expiry_date' => now()->subDays(5)->format('Y-m-d'), // Expired
                'purchase_price' => 1.00,
                'selling_price' => 3.00,
                'manufacturer' => 'ReliefInc',
                'qty' => 50
            ],
            [
                'name' => 'Cetirizine 10mg',
                'category' => 'Antihistamine',
                'batch_no' => 'CET2027',
                'expiry_date' => now()->addMonths(24)->format('Y-m-d'),
                'purchase_price' => 1.20,
                'selling_price' => 4.00,
                'manufacturer' => 'AllergyCo',
                'qty' => 0 // Out of Stock
            ],
            [
                'name' => 'Omeprazole 20mg',
                'category' => 'Antacid',
                'batch_no' => 'OMZ2025',
                'expiry_date' => now()->addMonths(8)->format('Y-m-d'),
                'purchase_price' => 3.00,
                'selling_price' => 8.00,
                'manufacturer' => 'GastricLife',
                'qty' => 8 // Low Stock (Assuming default min 10)
            ],
        ];

        foreach ($medicines as $med) {
            $createdMed = Medicine::create([
                'name' => $med['name'],
                'category' => $med['category'],
                'batch_no' => $med['batch_no'],
                'expiry_date' => $med['expiry_date'],
                'purchase_price' => $med['purchase_price'],
                'selling_price' => $med['selling_price'],
                'manufacturer' => $med['manufacturer'],
            ]);

            Inventory::create([
                'medicine_id' => $createdMed->id,
                'quantity' => $med['qty'],
                'min_stock_level' => 10
            ]);
        }
    }
}
