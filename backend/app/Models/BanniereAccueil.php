<?php
 
namespace App\Models;
 
// A placer dans : app/Models/BanniereAccueil.php
 
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
 
class BanniereAccueil extends Model
{
    use HasFactory;
 
    protected $table = 'bannieres_accueil';
 
    protected $fillable = [
        'titre',
        'sous_titre',
        'image',
        'lien_url',
        'ordre_affichage',
        'est_active',
    ];
 
    protected $casts = [
        'est_active' => 'boolean',
        'ordre_affichage' => 'integer',
    ];
 
    // Ajoute automatiquement image_url dans les reponses JSON,
    // construite avec APP_URL comme pour les images de categories.
    protected $appends = ['image_url'];
 
    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }
 
        return Storage::disk('public')->url($this->image);
    }
 
    public function scopeActives($query)
    {
        return $query->where('est_active', true)->orderBy('ordre_affichage');
    }
}
 

