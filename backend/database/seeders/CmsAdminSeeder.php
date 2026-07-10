<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\CmsAdmin;
use Illuminate\Support\Facades\Hash;

class CmsAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        CmsAdmin::updateOrCreate(
            ['username' => 'app.talaqee.com'],
            ['password' => Hash::make('Jakarta1945@@')]
        );
    }
}
