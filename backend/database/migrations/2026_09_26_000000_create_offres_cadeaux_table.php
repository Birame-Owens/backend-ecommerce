<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Offre « produit acheté → cadeau offert » : acheter N × A donne M × B à 0 F.
        Schema::create('offres_cadeaux', function (Blueprint $table) {
            $table->id();

            // Une seule offre par produit déclencheur.
            $table->foreignId('produit_declencheur_id')->unique()->constrained('produits')->cascadeOnDelete();
            $table->foreignId('produit_offert_id')->constrained('produits')->cascadeOnDelete();

            $table->unsignedInteger('quantite_declencheur')->default(1);
            $table->unsignedInteger('quantite_offerte')->default(1);

            // Variante du cadeau fixée par l'admin (le client ne choisit pas).
            $table->string('couleur_offerte')->nullable();
            $table->string('taille_offerte')->nullable();

            $table->boolean('est_active')->default(true);
            $table->timestamp('date_debut')->nullable();
            $table->timestamp('date_fin')->nullable();

            $table->timestamps();
        });

        Schema::table('articles_commande', function (Blueprint $table) {
            $table->boolean('est_cadeau')->default(false);
            // Valeur catalogue du cadeau au moment de la commande (coût de l'offre).
            $table->decimal('valeur_cadeau', 10, 2)->nullable();
            $table->foreignId('offre_cadeau_id')->nullable()->constrained('offres_cadeaux')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('articles_commande', function (Blueprint $table) {
            $table->dropConstrainedForeignId('offre_cadeau_id');
            $table->dropColumn(['est_cadeau', 'valeur_cadeau']);
        });

        Schema::dropIfExists('offres_cadeaux');
    }
};
