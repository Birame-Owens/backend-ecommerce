<?php

namespace App\Services\Admin;

use App\Models\Commande;
use App\Models\ShopSetting;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Prépare les données de l'étiquette de livraison (PDF 100x150mm collé sur le colis).
 *
 * Tout le branding (nom, logo, téléphone) vient de ShopSetting : la boutique est revendue
 * en marque blanche, rien ne doit être écrit en dur. Les textes libres sont tronqués pour
 * que l'étiquette tienne toujours sur une seule page.
 */
class DeliveryLabelService
{
    /**
     * Lignes d'articles affichables quand la partie livraison est minimale. Chaque bloc
     * supplémentaire (adresse longue, indications, message cadeau) en retire une, pour ne
     * jamais déborder sur le bloc de paiement ancré en bas de l'étiquette.
     */
    private const MAX_ARTICLES = 5;

    public function build(Commande $commande, bool $estPayee): array
    {
        $commande->loadMissing(['articles_commandes', 'deliveryZone']);

        $boutiqueNom   = ShopSetting::getValue('boutique_nom', config('app.name', 'Boutique'));
        $estRetrait    = $this->estRetrait($commande);
        $adresse       = $estRetrait ? null : $this->adresseDistincte($commande);
        $instructions  = $commande->instructions_livraison ? Str::limit($commande->instructions_livraison, 110) : null;
        $messageCadeau = $commande->message_cadeau ? Str::limit($commande->message_cadeau, 80) : null;

        $articles = $commande->articles_commandes;
        $max = $this->articlesAffichables($estRetrait, $adresse, $instructions, $messageCadeau);
        // Plutôt que « + 1 autre article », on affiche directement la dernière ligne.
        if ($articles->count() === $max + 1) {
            $max++;
        }
        $lignes = $articles->take($max)->map(fn ($a) => [
            'quantite' => (int) $a->quantite,
            'nom'      => Str::limit((string) $a->nom_produit, 34),
            'details'  => collect([$a->taille_choisie, $a->couleur_choisie])->filter()->implode(' · '),
            'cadeau'   => (bool) $a->est_cadeau,
        ]);

        return [
            'commande'        => $commande,
            'estPayee'        => $estPayee,
            'boutiqueNom'     => $boutiqueNom,
            'monogramme'      => $this->monogramme($boutiqueNom),
            'logo'            => $this->logoDataUri(),
            'boutiqueTel'     => $this->formaterTelephone((string) ShopSetting::getValue('boutique_telephone', '')),
            'siteWeb'         => $this->siteWeb(),
            'telephone'       => $this->formaterTelephone((string) $commande->telephone_livraison),
            'estRetrait'      => $estRetrait,
            'zone'            => $estRetrait ? null : $commande->zone_livraison_nom,
            'adresse'         => $adresse,
            'instructions'    => $instructions,
            'articles'        => $lignes,
            'articlesRestants'=> max(0, $articles->count() - $lignes->count()),
            'nbPieces'        => (int) $articles->sum('quantite'),
            'estCadeau'       => (bool) $commande->est_cadeau,
            'messageCadeau'   => $messageCadeau,
            'date'            => optional($commande->created_at)->format('d/m/Y'),
        ];
    }

    private function articlesAffichables(bool $estRetrait, ?string $adresse, ?string $instructions, ?string $messageCadeau): int
    {
        $max = self::MAX_ARTICLES;
        if (!$estRetrait) {
            $max--;                                   // ligne de la zone
        }
        if ($adresse) {
            $max -= mb_strlen($adresse) > 48 ? 2 : 1; // l'adresse tient sur une ou deux lignes
        }
        if ($instructions) {
            $max -= mb_strlen($instructions) > 55 ? 2 : 1;
        }
        if ($messageCadeau) {
            $max--;
        }

        return max(1, $max);
    }

    /**
     * Retrait en boutique : mode « boutique » (commandes saisies par l'admin), zone de retrait
     * (prix 0 et première de la liste, même règle que isPickupZone côté front) ou adresse
     * explicitement « Retrait sur place » (valeur posée par le checkout client).
     */
    private function estRetrait(Commande $commande): bool
    {
        if ($commande->mode_livraison === 'boutique') {
            return true;
        }

        $zone = $commande->deliveryZone;
        if ($zone && (float) $zone->prix === 0.0 && (int) $zone->ordre_affichage === 0) {
            return true;
        }

        return $this->normaliser($commande->adresse_livraison) === 'retrait sur place';
    }

    /**
     * Le checkout met le nom de la zone dans l'adresse quand le client n'a rien précisé :
     * on n'affiche alors l'adresse qu'une fois.
     */
    private function adresseDistincte(Commande $commande): ?string
    {
        $adresse = trim((string) $commande->adresse_livraison);
        if ($adresse === '' || $this->normaliser($adresse) === $this->normaliser($commande->zone_livraison_nom)) {
            return null;
        }

        return Str::limit($adresse, 120);
    }

    private function normaliser(?string $texte): string
    {
        return Str::lower(trim((string) $texte));
    }

    /** Logo de la boutique en data URI : dompdf n'a pas accès aux URL distantes. */
    private function logoDataUri(): ?string
    {
        $chemin = ShopSetting::getValue('boutique_logo');
        if (!$chemin || !Storage::disk('public')->exists($chemin)) {
            return null;
        }

        $mime = Storage::disk('public')->mimeType($chemin);
        if (!in_array($mime, ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], true)) {
            return null; // SVG non rendu de façon fiable par dompdf : on retombe sur le monogramme
        }

        return 'data:' . $mime . ';base64,' . base64_encode(Storage::disk('public')->get($chemin));
    }

    /** « ND World » -> « ND » ; « Ndeya Shop » -> « NS ». */
    private function monogramme(string $nom): string
    {
        $mots = preg_split('/\s+/', trim($nom)) ?: [];
        $premier = $mots[0] ?? '';

        if (mb_strlen($premier) <= 3 && mb_strtoupper($premier) === $premier && $premier !== '') {
            return $premier;
        }

        return mb_strtoupper(collect($mots)->take(2)->map(fn ($m) => mb_substr($m, 0, 1))->implode(''));
    }

    private function siteWeb(): ?string
    {
        $host = parse_url((string) config('services.frontend_url'), PHP_URL_HOST);

        return $host && !in_array($host, ['localhost', '127.0.0.1'], true) ? $host : null;
    }

    /**
     * Numéro sénégalais lisible par le livreur : « +221771234567 » -> « 77 123 45 67 ».
     * Les autres formats sont laissés tels quels.
     */
    private function formaterTelephone(string $tel): string
    {
        $chiffres = preg_replace('/\D+/', '', $tel);
        if (strlen($chiffres) === 12 && str_starts_with($chiffres, '221')) {
            $chiffres = substr($chiffres, 3);
        }
        if (strlen($chiffres) === 9) {
            return substr($chiffres, 0, 2) . ' ' . substr($chiffres, 2, 3) . ' '
                . substr($chiffres, 5, 2) . ' ' . substr($chiffres, 7, 2);
        }

        return trim($tel);
    }
}
