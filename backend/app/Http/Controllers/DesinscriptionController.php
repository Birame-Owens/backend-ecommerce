<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ShopSetting;
use Illuminate\Http\Request;

/**
 * Désinscription des e-mails commerciaux (relances de panier, offres) depuis le lien
 * présent dans chaque e-mail. Le lien est signé (middleware « signed ») : personne
 * ne peut désinscrire un autre client en changeant l'identifiant dans l'URL.
 */
class DesinscriptionController extends Controller
{
    public function __invoke(Request $request, Client $client)
    {
        $client->update(['accepte_promotions' => false]);

        return response()->view('emails.desinscription', [
            'boutiqueNom' => ShopSetting::getValue('boutique_nom', config('app.name', 'Boutique')),
            'lienSite'    => config('services.frontend_url'),
        ]);
    }
}
