<?php

namespace App\Providers;

use App\Listeners\NomExpediteurBoutique;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        // Nom d'expéditeur des e-mails = nom de la boutique (admin), pas MAIL_FROM_NAME.
        Event::listen(MessageSending::class, NomExpediteurBoutique::class);
    }
}
