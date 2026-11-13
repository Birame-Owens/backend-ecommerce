<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Relance e-mail d'un panier abandonné (voir RelancePanierService).
 *
 * @property int $id
 * @property int $panier_id
 * @property int $client_id
 * @property int $etape
 * @property \Carbon\Carbon $activite_panier
 * @property int $nombre_articles
 * @property float $montant_panier
 * @property \Carbon\Carbon $envoye_at
 * @property \Carbon\Carbon|null $recupere_at
 * @property int|null $commande_id
 * @property float|null $montant_recupere
 */
class RelancePanier extends Model
{
    protected $table = 'relances_panier';

    protected $fillable = [
        'panier_id', 'client_id', 'etape', 'activite_panier', 'nombre_articles',
        'montant_panier', 'envoye_at', 'recupere_at', 'commande_id', 'montant_recupere',
    ];

    protected $casts = [
        'etape'            => 'int',
        'activite_panier'  => 'datetime',
        'envoye_at'        => 'datetime',
        'recupere_at'      => 'datetime',
        'nombre_articles'  => 'int',
        'montant_panier'   => 'float',
        'montant_recupere' => 'float',
    ];

    public function panier(): BelongsTo
    {
        return $this->belongsTo(Panier::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class);
    }
}
