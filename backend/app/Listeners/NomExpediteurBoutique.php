<?php

namespace App\Listeners;

use App\Models\ShopSetting;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mime\Address;

/**
 * Nom d'expéditeur de TOUS les e-mails = nom de la boutique défini dans
 * l'admin (Paramètres → Général), et non la valeur figée de MAIL_FROM_NAME
 * dans la configuration du serveur. La boutique est revendue en marque
 * blanche : le client doit reconnaître le nom de la boutique qui lui écrit.
 *
 * Seul le NOM change, et seulement pour l'adresse d'envoi par défaut ;
 * l'adresse elle-même (authentifiée SPF/DKIM) n'est jamais modifiée.
 */
class NomExpediteurBoutique
{
    public function handle(MessageSending $event): void
    {
        try {
            $nom = trim((string) ShopSetting::getValue('boutique_nom', ''));
            $adresseParDefaut = (string) config('mail.from.address');
            if ($nom === '' || $adresseParDefaut === '') {
                return;
            }

            $expediteurs = $event->message->getFrom();
            if (count($expediteurs) !== 1 || strcasecmp($expediteurs[0]->getAddress(), $adresseParDefaut) !== 0) {
                return;
            }

            $event->message->from(new Address($expediteurs[0]->getAddress(), $nom));
        } catch (\Throwable $e) {
            // Jamais bloquant : l'e-mail part avec le nom par défaut.
            Log::warning('Nom d\'expéditeur non appliqué', ['error' => $e->getMessage()]);
        }
    }
}
