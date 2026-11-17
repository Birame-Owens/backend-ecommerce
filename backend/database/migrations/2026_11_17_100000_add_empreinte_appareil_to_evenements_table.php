<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Données nécessaires à la détection d'anomalies (robots, faux profils) :
 * - empreinte : hachage non réversible de (préfixe IP + navigateur). Permet de
 *   relier des sessions différentes venant du même appareil sans stocker l'IP.
 * - appareil  : mobile / tablette / ordinateur / robot (déduit du navigateur).
 * Colonnes nullables : ajout instantané sur PostgreSQL, historique inchangé.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evenements', function (Blueprint $table) {
            $table->string('empreinte', 32)->nullable()->after('session_id');
            $table->string('appareil', 12)->nullable()->after('empreinte');
            $table->index(['empreinte', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('evenements', function (Blueprint $table) {
            $table->dropIndex(['empreinte', 'created_at']);
            $table->dropColumn(['empreinte', 'appareil']);
        });
    }
};
