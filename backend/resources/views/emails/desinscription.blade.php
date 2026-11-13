<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Désinscription — {{ $boutiqueNom }}</title>
</head>
<body style="margin: 0; padding: 48px 16px; background-color: #F8F3ED; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E1E1E;">
    <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; padding: 36px 28px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #B76E4D; font-weight: bold;">{{ $boutiqueNom }}</p>
        <h1 style="margin: 0 0 14px 0; font-size: 22px; color: #4A2C22;">Vous êtes désinscrit</h1>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #4A4843;">
            Vous ne recevrez plus nos offres ni nos rappels de panier par e-mail.
            Les e-mails liés à vos commandes (confirmation, livraison) restent envoyés.
        </p>
        @if($lienSite)
            <a href="{{ $lienSite }}" style="display: inline-block; background-color: #B76E4D; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 10px;">
                Retour au site
            </a>
        @endif
    </div>
</body>
</html>
