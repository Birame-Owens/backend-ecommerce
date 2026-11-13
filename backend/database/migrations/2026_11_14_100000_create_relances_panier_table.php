<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Relances par e-mail des paniers abandonnés (clients connectés et consentants).
     *
     * Un « épisode » de panier est identifié par (panier_id, activite_panier) :
     * si le client modifie son panier après une relance, c'est un nouvel épisode
     * qui peut être relancé à nouveau. Chaque épisode reçoit au plus une relance
     * par étape (1 = après 2 h, 2 = après 24 h).
     */
    public function up(): void
    {
        Schema::create('relances_panier', function (Blueprint $table) {
            $table->id();
            $table->foreignId('panier_id')->constrained('paniers')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->unsignedTinyInteger('etape');
            $table->timestamp('activite_panier');
            $table->unsignedInteger('nombre_articles')->default(0);
            $table->decimal('montant_panier', 12, 2)->default(0);
            $table->timestamp('envoye_at');
            $table->timestamp('recupere_at')->nullable();
            $table->foreignId('commande_id')->nullable()->constrained('commandes')->nullOnDelete();
            $table->decimal('montant_recupere', 12, 2)->nullable();
            $table->timestamps();

            $table->unique(['panier_id', 'activite_panier', 'etape']);
            $table->index(['client_id', 'envoye_at']);
            $table->index('envoye_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relances_panier');
    }
};
