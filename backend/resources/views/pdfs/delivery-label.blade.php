<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Étiquette {{ $commande->numero_commande }}</title>
    <style>
        /* Étiquette 100 x 150 mm — palette du site (tailwind.config.ts) :
           brun #4A2C22 (logo), crème #F8F3ED, sable #E8D8C4, camel #C9A98A,
           accent #B76E4D, vert « payé » #3E8E5A.
           dompdf : pas de flexbox, on met en page avec des tableaux. */
        @page { size: 100mm 150mm; margin: 0; }
        * { margin: 0; padding: 0; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #1E1E1E;
            font-size: 9pt;
        }
        .page { position: relative; height: 150mm; }
        .contenu { padding: 4.5mm 5mm 0 5mm; }
        table { border-collapse: collapse; width: 100%; }
        td { vertical-align: middle; }

        /* En-tête */
        .entete {
            background: #F8F3ED;
            border: 1px solid #E8D8C4;
            border-radius: 8px;
            padding: 2.5mm 3mm;
        }
        .logo { width: 15mm; height: 15mm; border-radius: 7.5mm; }
        /* Monogramme (sans logo configuré) : une cellule de tableau centre le texte de façon fiable dans dompdf */
        .monogramme { width: 14mm; border-collapse: separate; }
        .monogramme td {
            width: 14mm; height: 14mm; padding: 0;
            border-radius: 7mm;
            background: #4A2C22; color: #F8F3ED;
            text-align: center; vertical-align: middle;
            font-weight: bold; font-size: 12pt; letter-spacing: 0.5pt;
        }
        .boutique { font-size: 12pt; font-weight: bold; color: #4A2C22; letter-spacing: 0.5pt; white-space: nowrap; }
        .document { font-size: 6pt; color: #B76E4D; letter-spacing: 1pt; margin-top: 0.6mm; white-space: nowrap; }
        .numero { width: 31mm; text-align: right; font-size: 6.5pt; color: #8A8278; line-height: 1.5; }
        .numero strong { display: block; font-size: 6.8pt; color: #4A2C22; white-space: nowrap; }

        /* Blocs */
        .bloc { margin-top: 3.2mm; }
        .titre {
            font-size: 6.5pt; color: #B76E4D; letter-spacing: 1.2pt;
            text-transform: uppercase; font-weight: bold;
            border-bottom: 1px solid #ECE2D4; padding-bottom: 0.8mm; margin-bottom: 1.6mm;
        }
        .nom { font-size: 15pt; font-weight: bold; color: #1E1E1E; line-height: 1.15; }
        .tel { font-size: 14pt; font-weight: bold; color: #4A2C22; margin-top: 1mm; letter-spacing: 0.5pt; }
        .tel span { font-size: 7pt; font-weight: normal; color: #8A8278; letter-spacing: 0; }

        .badge {
            display: inline-block;
            padding: 1mm 2.6mm; border-radius: 10px;
            font-size: 7pt; font-weight: bold; letter-spacing: 0.8pt;
        }
        .badge.domicile { background: #4A2C22; color: #F8F3ED; }
        .badge.retrait  { background: #C9A98A; color: #FFFFFF; }
        .badge.cadeau   { background: #FCF8F2; color: #B76E4D; border: 1px solid #B76E4D; }
        .zone { font-size: 11pt; font-weight: bold; margin-top: 1.6mm; }
        .adresse { font-size: 9.5pt; margin-top: 0.6mm; line-height: 1.35; }
        .note {
            margin-top: 1.6mm; padding: 1.4mm 2mm;
            background: #FCF8F2; border-left: 2px solid #C9A98A;
            font-size: 8pt; font-style: italic; color: #4A4843; line-height: 1.35;
        }

        /* Articles */
        .article td { padding: 0.7mm 0; font-size: 8.5pt; border-bottom: 1px dotted #E0D2BF; }
        .qte { width: 9mm; font-weight: bold; color: #B76E4D; }
        .details { color: #8A8278; font-size: 7.5pt; }
        .reste { font-size: 7.5pt; color: #8A8278; margin-top: 1mm; }

        /* Bas de page, ancré en bas de l'étiquette */
        .bas { position: absolute; left: 5mm; right: 5mm; bottom: 4mm; }
        .paiement { border-radius: 8px; padding: 2.6mm 3.5mm; }
        .paiement.a-encaisser { background: #4A2C22; color: #FFFFFF; }
        .paiement.paye { background: #3E8E5A; color: #FFFFFF; }
        .paiement .libelle { font-size: 7pt; letter-spacing: 1.2pt; font-weight: bold; }
        .paiement .sous { font-size: 6.5pt; opacity: 0.85; margin-top: 0.5mm; }
        .paiement .montant { text-align: right; font-size: 17pt; font-weight: bold; white-space: nowrap; }
        .paiement.paye .montant { font-size: 12pt; }
        .pied {
            margin-top: 2mm; text-align: center;
            font-size: 6.5pt; color: #8A8278; letter-spacing: 0.3pt;
        }
    </style>
</head>
<body>
<div class="page">
    <div class="contenu">

        {{-- En-tête : logo, boutique, numéro --}}
        <div class="entete">
            <table>
                <tr>
                    <td style="width: 17mm;">
                        @if($logo)
                            <img class="logo" src="{{ $logo }}" alt="{{ $boutiqueNom }}">
                        @else
                            <table class="monogramme"><tr><td>{{ $monogramme }}</td></tr></table>
                        @endif
                    </td>
                    <td>
                        <div class="boutique">{{ mb_strtoupper($boutiqueNom) }}</div>
                        <div class="document">BON DE LIVRAISON</div>
                    </td>
                    <td class="numero">
                        <strong>{{ $commande->numero_commande }}</strong>
                        @if($date){{ $date }}@endif
                    </td>
                </tr>
            </table>
        </div>

        {{-- Destinataire --}}
        <div class="bloc">
            <div class="titre">Destinataire</div>
            <div class="nom">{{ $commande->nom_destinataire }}</div>
            <div class="tel"><span>Tél.&nbsp;</span>{{ $telephone }}</div>
        </div>

        {{-- Livraison --}}
        <div class="bloc">
            <div class="titre">Livraison</div>
            @if($estRetrait)
                <span class="badge retrait">RETRAIT EN BOUTIQUE</span>
            @else
                <span class="badge domicile">LIVRAISON À DOMICILE</span>
            @endif
            @if($estCadeau)
                &nbsp;<span class="badge cadeau">CADEAU</span>
            @endif

            @if($zone)
                <div class="zone">{{ $zone }}</div>
            @endif
            @if($adresse)
                <div class="adresse">{{ $adresse }}</div>
            @endif
            @if($instructions)
                <div class="note">{{ $instructions }}</div>
            @endif
            @if($messageCadeau)
                <div class="note">« {{ $messageCadeau }} »</div>
            @endif
        </div>

        {{-- Contenu du colis --}}
        @if($articles->isNotEmpty())
            <div class="bloc">
                <div class="titre">Contenu du colis · {{ $nbPieces }} {{ $nbPieces > 1 ? 'pièces' : 'pièce' }}</div>
                <table>
                    @foreach($articles as $article)
                        <tr class="article">
                            <td class="qte">{{ $article['quantite'] }}×</td>
                            <td>
                                {{ $article['nom'] }}
                                @if($article['details'])
                                    <span class="details">&nbsp;· {{ $article['details'] }}</span>
                                @endif
                                @if($article['cadeau'])
                                    <span class="details">&nbsp;· offert</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </table>
                @if($articlesRestants > 0)
                    <div class="reste">+ {{ $articlesRestants }} autre{{ $articlesRestants > 1 ? 's' : '' }} article{{ $articlesRestants > 1 ? 's' : '' }}</div>
                @endif
            </div>
        @endif
    </div>

    {{-- Paiement + contact, toujours en bas --}}
    <div class="bas">
        <div class="paiement {{ $estPayee ? 'paye' : 'a-encaisser' }}">
            <table>
                <tr>
                    <td>
                        @if($estPayee)
                            <div class="libelle">DÉJÀ PAYÉ</div>
                            <div class="sous">Ne rien encaisser</div>
                        @else
                            <div class="libelle">À ENCAISSER</div>
                            <div class="sous">à la livraison</div>
                        @endif
                    </td>
                    <td class="montant">{{ number_format($commande->montant_total, 0, ',', ' ') }} F</td>
                </tr>
            </table>
        </div>
        <div class="pied">
            {{ $boutiqueNom }}@if($boutiqueTel) · {{ $boutiqueTel }}@endif @if($siteWeb) · {{ $siteWeb }}@endif
        </div>
    </div>
</div>
</body>
</html>
