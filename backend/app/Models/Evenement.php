<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evenement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'client_id',
        'type',
        'produit_id',
        'categorie_id',
        'commande_id',
        'terme_recherche',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }

    public function categorie()
    {
        return $this->belongsTo(Category::class, 'categorie_id');
    }

    public function commande()
    {
        return $this->belongsTo(Commande::class);
    }
}
