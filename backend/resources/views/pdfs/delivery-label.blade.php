<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Étiquette {{ $commande->numero_commande }}</title>
    <style>
        @page {
            size: 100mm 150mm;
            margin: 6mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #111;
        }
        .card {
            border: 2px solid #111;
            border-radius: 6px;
            padding: 10px;
            height: 100%;
        }
        .shop {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
            padding-bottom: 6px;
            border-bottom: 1px dashed #111;
            margin-bottom: 8px;
        }
        .order-number {
            text-align: center;
            font-size: 10px;
            color: #444;
            margin-bottom: 10px;
        }
        .label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
            margin-bottom: 2px;
        }
        .value {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.3;
        }
        .value.address {
            font-size: 14px;
            font-weight: normal;
        }
        .divider {
            border-top: 1px dashed #111;
            margin: 10px 0;
        }
        .total-row {
            display: table;
            width: 100%;
        }
        .total-label {
            display: table-cell;
            font-size: 13px;
            font-weight: bold;
            vertical-align: middle;
        }
        .total-amount {
            display: table-cell;
            text-align: right;
            font-size: 22px;
            font-weight: bold;
            vertical-align: middle;
        }
        .payment-status {
            text-align: center;
            margin-top: 8px;
            padding: 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .payment-status.paid {
            background: #e6f4ea;
            color: #1a7431;
            border: 1px solid #1a7431;
        }
        .payment-status.unpaid {
            background: #fdecea;
            color: #a61b1b;
            border: 1px solid #a61b1b;
        }
        .instructions {
            margin-top: 10px;
            font-size: 11px;
            color: #444;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="shop">{{ $boutiqueNom }}</div>
        <div class="order-number">Commande N&deg; {{ $commande->numero_commande }}</div>

        <div class="label">Destinataire</div>
        <div class="value">{{ $commande->nom_destinataire }}</div>

        <div class="label">T&eacute;l&eacute;phone</div>
        <div class="value">{{ $commande->telephone_livraison }}</div>

        <div class="label">Adresse de livraison</div>
        <div class="value address">
            {{ $commande->adresse_livraison }}
            @if($commande->zone_livraison_nom)
                <br>{{ $commande->zone_livraison_nom }}
            @endif
        </div>

        @if($commande->instructions_livraison)
            <div class="label">Indications</div>
            <div class="instructions">{{ $commande->instructions_livraison }}</div>
        @endif

        <div class="divider"></div>

        <div class="total-row">
            <div class="total-label">MONTANT TOTAL</div>
            <div class="total-amount">{{ number_format($commande->montant_total, 0, ',', ' ') }} F</div>
        </div>

        <div class="payment-status {{ $estPayee ? 'paid' : 'unpaid' }}">
            {{ $estPayee ? 'DEJA PAYE - NE RIEN ENCAISSER' : 'A ENCAISSER A LA LIVRAISON' }}
        </div>
    </div>
</body>
</html>
