<?php

namespace Tests\Feature;

use App\Models\ShopSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NomExpediteurTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'mail.default'      => 'array',
            'mail.from.address' => 'ndw@exemple.test',
            'mail.from.name'    => 'NDEYA SHOP',
        ]);
    }

    /** @return \Symfony\Component\Mime\Address */
    private function expediteurEnvoye(?Mailable $mail = null)
    {
        Mail::to('client@exemple.test')->send($mail ?? new MailDeTest());
        $messages = app('mailer')->getSymfonyTransport()->messages();

        return $messages->last()->getOriginalMessage()->getFrom()[0];
    }

    public function test_le_nom_de_la_boutique_remplace_le_nom_de_la_configuration(): void
    {
        ShopSetting::setValue('boutique_nom', 'ND WORLD', 'general');

        $expediteur = $this->expediteurEnvoye();

        $this->assertSame('ND WORLD', $expediteur->getName());
        $this->assertSame('ndw@exemple.test', $expediteur->getAddress()); // adresse authentifiée inchangée
    }

    public function test_sans_nom_de_boutique_le_nom_par_defaut_est_garde(): void
    {
        $this->assertSame('NDEYA SHOP', $this->expediteurEnvoye()->getName());
    }

    public function test_une_autre_adresse_d_expediteur_n_est_pas_modifiee(): void
    {
        ShopSetting::setValue('boutique_nom', 'ND WORLD', 'general');

        $expediteur = $this->expediteurEnvoye((new MailDeTest())->from('support@exemple.test', 'Support'));

        $this->assertSame('Support', $expediteur->getName());
    }
}

class MailDeTest extends Mailable
{
    public function build(): static
    {
        return $this->subject('Test')->html('<p>Bonjour</p>');
    }
}
