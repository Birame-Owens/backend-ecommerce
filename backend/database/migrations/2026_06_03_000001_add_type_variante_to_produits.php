<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produits', function (Blueprint $table) {
            $table->string('type_variante', 20)->default('vetement')->after('tags');
        });

        // Produits avec couleur_tailles renseigné = ont des variantes → 'vetement'
        // Produits sans couleur_tailles = sans variante → 'aucun'
        DB::table('produits')
            ->whereNull('couleur_tailles')
            ->orWhere('couleur_tailles', '')
            ->orWhere('couleur_tailles', '[]')
            ->orWhere('couleur_tailles', '{}')
            ->update(['type_variante' => 'aucun']);
    }

    public function down(): void
    {
        Schema::table('produits', function (Blueprint $table) {
            $table->dropColumn('type_variante');
        });
    }
};
