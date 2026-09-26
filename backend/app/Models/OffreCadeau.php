<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Offre « produit acheté → cadeau offert » : acheter quantite_declencheur × le
 * produit déclencheur donne quantite_offerte × le produit offert, à 0 F.
 *
 * @property int $id
 * @property int $produit_declencheur_id
 * @property int $produit_offert_id
 * @property int $quantite_declencheur
 * @property int $quantite_offerte
 * @property string|null $couleur_offerte
 * @property string|null $taille_offerte
 * @property bool $est_active
 * @property \Carbon\Carbon|null $date_debut
 * @property \Carbon\Carbon|null $date_fin
 */
class OffreCadeau extends Model
{
    protected $table = 'offres_cadeaux';

    protected $fillable = [
        'produit_declencheur_id',
        'produit_offert_id',
        'quantite_declencheur',
        'quantite_offerte',
        'couleur_offerte',
        'taille_offerte',
        'est_active',
        'date_debut',
        'date_fin',
    ];

    protected $casts = [
        'produit_declencheur_id' => 'int',
        'produit_offert_id' => 'int',
        'quantite_declencheur' => 'int',
        'quantite_offerte' => 'int',
        'est_active' => 'bool',
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
    ];

    public function produitDeclencheur()
    {
        return $this->belongsTo(Produit::class, 'produit_declencheur_id');
    }

    public function produitOffert()
    {
        return $this->belongsTo(Produit::class, 'produit_offert_id');
    }

    /** Offres actives et dans leur période de validité (hors contrôle du stock). */
    public function scopeEnCours(Builder $query): Builder
    {
        return $query->where('est_active', true)
            ->where(fn ($q) => $q->whereNull('date_debut')->orWhere('date_debut', '<=', now()))
            ->where(fn ($q) => $q->whereNull('date_fin')->orWhere('date_fin', '>=', now()));
    }

    /** Nombre de cadeaux dus pour une quantité achetée du produit déclencheur. */
    public function cadeauxPour(int $quantiteAchetee): int
    {
        $palier = max(1, $this->quantite_declencheur);

        return intdiv(max(0, $quantiteAchetee), $palier) * max(1, $this->quantite_offerte);
    }

    /**
     * Stock disponible du cadeau (variante fixée si elle a un stock propre).
     * null = illimité (pas de gestion de stock ou fait sur mesure).
     */
    public function stockCadeauDisponible(): ?int
    {
        $produit = $this->produitOffert;

        if (!$produit) {
            return 0;
        }

        if (!$produit->gestion_stock || $produit->fait_sur_mesure) {
            return null;
        }

        $stockData = $produit->couleur_tailles_stock;
        if (is_string($stockData)) {
            $stockData = json_decode($stockData, true);
        }

        if (is_array($stockData) && $stockData) {
            if ($this->couleur_offerte && $this->taille_offerte
                && isset($stockData[$this->couleur_offerte][$this->taille_offerte])) {
                return (int) $stockData[$this->couleur_offerte][$this->taille_offerte];
            }

            $total = 0;
            foreach ($stockData as $tailles) {
                foreach ((array) $tailles as $qty) {
                    $total += (int) $qty;
                }
            }
            return $total;
        }

        return (int) ($produit->stock_disponible ?? 0);
    }

    /**
     * Pourquoi l'offre n'est pas proposée aux clients (null = elle l'est).
     * Un cadeau en rupture désactive automatiquement l'offre.
     */
    public function raisonIndisponibilite(): ?string
    {
        if (!$this->est_active) {
            return 'inactive';
        }
        if ($this->date_debut && now()->lt($this->date_debut)) {
            return 'programmee';
        }
        if ($this->date_fin && now()->gt($this->date_fin)) {
            return 'expiree';
        }
        if (!$this->produitDeclencheur?->est_visible || !$this->produitOffert) {
            return 'produit_indisponible';
        }

        $stock = $this->stockCadeauDisponible();
        if ($stock !== null && $stock < max(1, $this->quantite_offerte)) {
            return 'rupture_cadeau';
        }

        return null;
    }

    public function estDisponible(): bool
    {
        return $this->raisonIndisponibilite() === null;
    }
}
