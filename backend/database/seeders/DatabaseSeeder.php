<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    
   public function run(): void
{
    $this->call([
        AdminUserSeeder::class,
        AdminProductsAndCategoriesSeeder::class,  // Créer produits et catégories
        ImagesProduitSeeder::class,                 // Ajouter images aux produits
        // DemoDataSeeder::class, // On créera ça après
    ]);
}
    
}
