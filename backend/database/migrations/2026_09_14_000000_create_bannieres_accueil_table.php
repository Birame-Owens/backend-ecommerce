<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
// A placer dans : database/migrations/
// (renomme la date en prefixe si besoin pour qu'elle soit apres les migrations existantes)
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bannieres_accueil', function (Blueprint $table) {
            $table->id();
            $table->string('titre')->nullable();
            $table->string('sous_titre', 500)->nullable();
            $table->string('image'); // chemin relatif, meme logique que categories.image
            $table->string('lien_url')->nullable(); // ex: /categories/mode-femme
            $table->unsignedInteger('ordre_affichage')->default(0);
            $table->boolean('est_active')->default(true);
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('bannieres_accueil');
    }
};
 