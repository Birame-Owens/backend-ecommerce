<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_zones', function (Blueprint $table) {
            // Zone éligible à la livraison gratuite au-dessus du seuil (Dakar / zones proches).
            // Les régions lointaines restent payantes même au-dessus du seuil.
            $table->boolean('eligible_gratuite')->default(false)->after('ordre_affichage');
        });

        // Zones proches éligibles par défaut à la gratuité au-dessus du seuil.
        DB::table('delivery_zones')
            ->whereIn('nom', ['Dakar centre', 'Dakar banlieue'])
            ->update(['eligible_gratuite' => true]);

        // Seuil de gratuité : passer la valeur par défaut à 20 000 F
        // (uniquement si le commerçant n'a pas déjà personnalisé le seuil).
        DB::table('shipping_settings')
            ->where('free_threshold', 50000)
            ->update(['free_threshold' => 20000]);
    }

    public function down(): void
    {
        Schema::table('delivery_zones', function (Blueprint $table) {
            $table->dropColumn('eligible_gratuite');
        });
    }
};
