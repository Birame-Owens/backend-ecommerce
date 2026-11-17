<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

/**
 * Horodatage des événements à la milliseconde (au lieu de la seconde) :
 * le rythme des clics (humain ≈ secondes, robot ≈ dizaines de ms) est un
 * signal clé de la détection d'anomalies. Augmenter la précision d'un
 * timestamp ne réécrit pas la table sous PostgreSQL ; les valeurs existantes
 * sont conservées telles quelles.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE evenements ALTER COLUMN created_at TYPE timestamp(3) without time zone');

            return;
        }

        Schema::table('evenements', function (Blueprint $table) {
            $table->timestamp('created_at', 3)->useCurrent()->change();
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE evenements ALTER COLUMN created_at TYPE timestamp(0) without time zone');

            return;
        }

        Schema::table('evenements', function (Blueprint $table) {
            $table->timestamp('created_at')->useCurrent()->change();
        });
    }
};
