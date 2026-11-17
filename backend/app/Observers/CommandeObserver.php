<?php

namespace App\Observers;

use App\Models\Commande;
use App\Services\Client\EvenementService;

/**
 * Journalise l'annulation d'une commande, quel que soit le chemin qui l'a
 * provoquée (admin, paiement annulé/expiré chez le prestataire…). Observer le
 * modèle plutôt que chaque contrôleur garantit qu'aucune annulation n'échappe
 * à la collecte : un signal négatif après achat, utile à la recommandation et
 * à la détection d'anomalies (ex. : vagues d'annulations).
 */
class CommandeObserver
{
    public function __construct(private EvenementService $evenements)
    {
    }

    public function updated(Commande $commande): void
    {
        if (!$commande->wasChanged('statut') || $commande->statut !== 'annulee') {
            return;
        }

        $this->evenements->log('annulation_commande', [
            // Contexte de la COMMANDE, pas de la requête (qui peut être celle
            // d'un admin, d'un webhook de paiement ou d'une tâche planifiée).
            'session_id'  => 'commande_' . $commande->id,
            'empreinte'   => null,
            'appareil'    => null,
            'client_id'   => $commande->client_id,
            'commande_id' => $commande->id,
            'metadata'    => [
                'ancien_statut' => $commande->getOriginal('statut'),
                'montant'       => (float) $commande->montant_total,
                'origine'       => $this->origine(),
            ],
        ]);
    }

    /** Qui a annulé : un admin, une tâche automatique, ou le parcours de paiement. */
    private function origine(): string
    {
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return 'automatique';
        }

        $user = request()->user() ?? auth()->user();

        return $user?->role === 'admin' ? 'admin' : 'paiement';
    }
}
