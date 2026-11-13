<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre panier — {{ $boutiqueNom }}</title>
    <style>
        body { margin: 0; padding: 0; width: 100% !important; background-color: #F8F3ED; -webkit-text-size-adjust: 100%; }
        img { border: 0; outline: none; text-decoration: none; display: block; }
        table { border-collapse: collapse !important; }
        body, td { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E1E1E; }
        @media only screen and (max-width: 600px) {
            .wrapper { width: 100% !important; }
            .px { padding-left: 20px !important; padding-right: 20px !important; }
        }
    </style>
</head>
<body style="background-color: #F8F3ED; margin: 0; padding: 32px 0;">
<table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" class="wrapper" style="background-color: #FFFFFF; max-width: 600px; width: 100%; border-radius: 14px; overflow: hidden;">

                {{-- En-tête --}}
                <tr>
                    <td align="center" style="background-color: #4A2C22; padding: 28px 20px;">
                        @if($logo)
                            <img src="{{ $logo }}" alt="{{ $boutiqueNom }}" width="64" height="64" style="border-radius: 32px; margin: 0 auto 10px auto;">
                        @endif
                        <p style="margin: 0; font-size: 20px; letter-spacing: 4px; text-transform: uppercase; color: #F8F3ED; font-weight: bold;">{{ $boutiqueNom }}</p>
                    </td>
                </tr>

                {{-- Message --}}
                <tr>
                    <td class="px" style="padding: 32px 40px 8px 40px;">
                        <p style="margin: 0 0 6px 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #B76E4D; font-weight: bold;">
                            {{ $etape === 1 ? 'Votre panier' : 'Toujours là pour vous' }}
                        </p>
                        <h1 style="margin: 0 0 14px 0; font-size: 24px; color: #4A2C22;">
                            @if($etape === 1)
                                {{ $prenom }}, vous avez oublié quelque chose
                            @else
                                Vos articles vous attendent encore
                            @endif
                        </h1>
                        <p style="margin: 0; font-size: 15px; line-height: 24px; color: #4A4843;">
                            @if($etape === 1)
                                Vous avez ajouté ces articles à votre panier sans finaliser votre commande. Ils sont toujours disponibles : il vous suffit de vous connecter pour les retrouver.
                            @else
                                Votre sélection est toujours enregistrée dans votre compte. Finalisez votre commande avant que vos articles préférés ne soient plus disponibles.
                            @endif
                        </p>
                    </td>
                </tr>

                {{-- Articles --}}
                <tr>
                    <td class="px" style="padding: 20px 40px 0 40px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            @foreach($articles as $article)
                                <tr>
                                    <td width="76" style="padding: 12px 0; border-bottom: 1px solid #ECE2D4;">
                                        <a href="{{ $article['lien'] }}"><img src="{{ $article['image'] }}" alt="{{ $article['nom'] }}" width="64" height="64" style="border-radius: 10px; object-fit: cover;"></a>
                                    </td>
                                    <td style="padding: 12px 10px; border-bottom: 1px solid #ECE2D4;">
                                        <a href="{{ $article['lien'] }}" style="font-size: 15px; font-weight: bold; color: #1E1E1E; text-decoration: none;">{{ $article['nom'] }}</a>
                                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #8A8278;">
                                            Quantité : {{ $article['quantite'] }}@if($article['details']) · {{ $article['details'] }}@endif
                                        </p>
                                    </td>
                                    <td align="right" style="padding: 12px 0; border-bottom: 1px solid #ECE2D4; font-size: 15px; font-weight: bold; color: #4A2C22; white-space: nowrap;">
                                        {{ number_format($article['prix'], 0, ',', ' ') }} F
                                    </td>
                                </tr>
                            @endforeach
                            <tr>
                                <td colspan="2" style="padding: 14px 0 0 0; font-size: 15px; font-weight: bold;">Total</td>
                                <td align="right" style="padding: 14px 0 0 0; font-size: 18px; font-weight: bold; color: #B76E4D; white-space: nowrap;">
                                    {{ number_format($total, 0, ',', ' ') }} F
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Bouton --}}
                <tr>
                    <td align="center" class="px" style="padding: 28px 40px 8px 40px;">
                        <a href="{{ $lienPanier }}" style="display: inline-block; background-color: #B76E4D; color: #FFFFFF; font-size: 15px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 10px;">
                            Finaliser ma commande
                        </a>
                    </td>
                </tr>

                @if($seuilLivraisonGratuite && $total < $seuilLivraisonGratuite)
                    <tr>
                        <td align="center" class="px" style="padding: 8px 40px 0 40px; font-size: 13px; color: #4A4843;">
                            Livraison gratuite dès {{ number_format($seuilLivraisonGratuite, 0, ',', ' ') }} F dans les zones éligibles.
                        </td>
                    </tr>
                @endif

                <tr>
                    <td align="center" class="px" style="padding: 10px 40px 28px 40px; font-size: 13px; color: #4A4843;">
                        Paiement par Wave, Orange Money ou à la livraison.
                    </td>
                </tr>

                {{-- Pied --}}
                <tr>
                    <td align="center" style="background-color: #F8F3ED; padding: 20px 30px; font-size: 12px; line-height: 18px; color: #8A8278;">
                        Vous recevez cet e-mail car vous avez accepté de recevoir les offres de {{ $boutiqueNom }}.<br>
                        <a href="{{ $lienDesinscription }}" style="color: #8A8278; text-decoration: underline;">Ne plus recevoir ces e-mails</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
