<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Piste d'audit comportementale de première partie (first-party) — écrite
     * uniquement côté serveur ou via un appel same-origin, donc fiable
     * contrairement à un traceur tiers (bloqueurs de pub, navigateurs
     * intégrés, Consent Mode — voir la longue saga Google Analytics).
     * Sert à la fois au tableau de bord business intelligence admin et à la
     * future table d'interactions du système de recommandation (voir
     * backend/docs/MEMOIRE_RECOMMANDATION_TEMPS_REEL.md).
     *
     * `type` reste une simple chaîne (pas d'enum SQL) pour pouvoir ajouter de
     * nouveaux types d'événements sans nouvelle migration. Types couverts au
     * lancement (voir App\Services\Client\EvenementService) :
     *
     *   Navigation    : vue_accueil, vue_categorie, vue_produit, recherche,
     *                   clic_resultat_recherche
     *   Produit       : changement_variante, partage_produit, clic_whatsapp
     *   Panier        : ajout_panier, retrait_panier, modification_quantite,
     *                   vue_panier
     *   Wishlist      : ajout_wishlist, retrait_wishlist
     *   Compte        : inscription, connexion
     *   Paiement      : debut_checkout, commande_creee, paiement_initie,
     *                   paiement_echoue, paiement_annule, achat_confirme
     *
     * `metadata` porte tout ce qui ne mérite pas sa propre colonne indexée
     * (quantité, méthode de paiement, raison d'échec, montant, etc.).
     */
    public function up(): void
    {
        Schema::create('evenements', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 100);
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('type', 40);
            $table->foreignId('produit_id')->nullable()->constrained('produits')->nullOnDelete();
            $table->foreignId('categorie_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('commande_id')->nullable()->constrained('commandes')->nullOnDelete();
            $table->string('terme_recherche')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['type', 'created_at']);
            $table->index(['session_id', 'created_at']);
            $table->index(['produit_id', 'type']);
            $table->index(['categorie_id', 'type']);
            $table->index(['commande_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evenements');
    }
};
