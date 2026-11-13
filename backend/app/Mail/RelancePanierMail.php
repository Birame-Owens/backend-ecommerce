<?php

namespace App\Mail;

use App\Models\Client;
use App\Models\ShippingSetting;
use App\Models\ShopSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * E-mail de relance d'un panier abandonné (étape 1 : après 2 h, étape 2 : après 24 h).
 *
 * Les données des articles sont figées en tableaux à la construction : l'e-mail part
 * en file d'attente, et un article retiré du panier entre-temps ne doit pas le faire
 * échouer. Le branding vient de ShopSetting (boutique revendue en marque blanche).
 */
class RelancePanierMail extends Mailable
{
    use Queueable;

    public string $prenom;
    public array $articles;
    public float $total;
    public string $lienPanier;
    public string $lienDesinscription;
    public string $boutiqueNom;
    public ?string $logo;
    public ?float $seuilLivraisonGratuite;

    public function __construct(Client $client, Collection $articles, public int $etape)
    {
        $front = rtrim((string) config('services.frontend_url'), '/');
        $utm = 'utm_source=email&utm_medium=relance_panier&utm_campaign=relance_' . $etape;

        $this->prenom = (string) ($client->prenom ?: 'cher client');
        $this->boutiqueNom = (string) ShopSetting::getValue('boutique_nom', config('app.name', 'Boutique'));
        $logo = ShopSetting::getValue('boutique_logo');
        $this->logo = $logo ? asset('storage/' . $logo) : null;

        $this->articles = $articles->map(fn ($a) => [
            'nom'      => Str::limit((string) $a->produit->nom, 60),
            'image'    => $a->produit->image_url,
            'details'  => collect([$a->taille_choisie, $a->couleur_choisie])->filter()->implode(' · '),
            'quantite' => (int) $a->quantite,
            'prix'     => (float) $a->prix_total,
            'lien'     => $front . '/produits/' . $a->produit->slug . '?' . $utm,
        ])->values()->all();
        $this->total = (float) $articles->sum('prix_total');

        $this->lienPanier = $front . '/panier?' . $utm;
        // Lien signé et sans expiration : seul le destinataire peut se désinscrire.
        $this->lienDesinscription = URL::signedRoute('relance.desinscription', ['client' => $client->id]);

        $livraison = ShippingSetting::getSettings();
        $this->seuilLivraisonGratuite = ($livraison->is_enabled && (float) $livraison->free_threshold > 0)
            ? (float) $livraison->free_threshold
            : null;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->etape === 1
                ? "{$this->prenom}, vous avez oublié quelque chose"
                : "Votre panier vous attend toujours chez {$this->boutiqueNom}",
        );
    }

    public function headers(): Headers
    {
        // Désinscription en un clic proposée par Gmail / Outlook.
        return new Headers(text: ['List-Unsubscribe' => '<' . $this->lienDesinscription . '>']);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.relance-panier');
    }
}
