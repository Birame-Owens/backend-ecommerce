<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('model:prune', ['--model' => 'App\\Models\\AdminAuditLog'])->daily();
Schedule::command('commandes:liberer-stock-expire')->everyFiveMinutes()->withoutOverlapping();
// Relances e-mail des paniers abandonnés (sans effet tant qu'elles sont désactivées dans l'admin).
// Toutes les 15 min : l'e-mail part au plus 15 min après le délai (2 h / 24 h), pas jusqu'à 59 min.
Schedule::command('paniers:relancer')->everyFifteenMinutes()->withoutOverlapping();
