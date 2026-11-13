<?php

namespace App\Console\Commands;

use App\Services\Admin\RelancePanierService;
use Illuminate\Console\Command;

/**
 * Relance par e-mail les paniers abandonnés des clients connectés et consentants.
 * Planifiée toutes les heures (routes/console.php) ; sans effet tant que
 * « Relance des paniers abandonnés » est désactivée dans Admin → Paramètres.
 */
class RelancerPaniersAbandonnesCommand extends Command
{
    protected $signature = 'paniers:relancer';

    protected $description = 'Envoie les e-mails de relance des paniers abandonnés (2 h puis 24 h)';

    public function handle(RelancePanierService $service): int
    {
        $resultat = $service->executer();

        if (!$resultat['active']) {
            $this->info("Relances désactivées dans les paramètres. Paniers récupérés suivis : {$resultat['recuperees']}.");
            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Relances envoyées : %d (étape 1), %d (étape 2). Paniers récupérés : %d.',
            $resultat['envoyees'][1], $resultat['envoyees'][2], $resultat['recuperees']
        ));

        return self::SUCCESS;
    }
}
