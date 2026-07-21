# Mémoire M2 — Système de recommandation hybride à apprentissage en ligne pour une plateforme e-commerce en production

> Cas d'étude : ND WORLD (Laravel 11 + PostgreSQL + Redis + React, en production sur Coolify).
> Ce document est le plan de projet. Il s'appuie sur `RECOMMANDATION_IA.md` (feuille de route
> produit pragmatique, mai 2026) pour la partie tracking, mais s'en distingue sur l'essentiel :
> ce mémoire vise un **vrai apprentissage en ligne** (mise à jour incrémentale en continu),
> pas un réentraînement batch planifié.

---

## 1. Cadrage du sujet

### 1.1 Contexte et motivation : le problème dans le e-commerce sénégalais et africain

La recherche en systèmes de recommandation est presque entièrement construite sur des cas
Amazon/Netflix/Spotify — des plateformes à des millions d'utilisateurs, des clusters Kafka, des
budgets infrastructure quasi illimités. Cette littérature suppose implicitement des conditions
qui n'existent quasiment jamais dans le e-commerce ouest-africain :

1. **Rareté des données, structurelle et non transitoire.** Aux États-Unis, un e-commerce
   atteint des millions d'interactions en quelques mois. Au Sénégal, la majorité des boutiques
   en ligne (ND WORLD compris, et plus largement les commerçants visés par une éventuelle
   diffusion en marque blanche) resteront durablement dans une zone de faible volume — pas
   parce qu'elles sont jeunes, mais parce que le marché lui-même est plus petit et plus
   fragmenté. Les techniques classiques de filtrage collaboratif, pensées pour des matrices
   denses, se comportent différemment dans ce régime. C'est un vide identifiable dans la
   littérature : peu de travaux étudient la recommandation sous une sparsité **permanente**,
   plutôt que transitoire (simple problème de démarrage à froid qui se résorbe avec le temps).

2. **Contrainte d'infrastructure réelle, non théorique.** Un serveur à 2 vCPU / 4 Go n'est pas
   un choix de confort, c'est la réalité économique d'un e-commerçant sénégalais qui ne peut pas
   financer un cluster type AWS/Kafka. Le choix architectural de Redis Streams plutôt que Kafka
   (section 3.2) n'est donc pas qu'une décision d'ingénierie pragmatique : c'est une réponse à
   une contrainte structurelle du marché local, et constitue une contribution à part entière —
   « comment faire de l'apprentissage en ligne avec un budget de PME africaine », plutôt qu'avec
   un budget de plateforme occidentale à grande échelle.

3. **Absence d'outils accessibles pour ce segment.** Les solutions commerciales existantes
   (Algolia Recommend, AWS Personalize, moteurs intégrés à Shopify) sont soit trop coûteuses,
   soit calibrées pour des volumes que la quasi-totalité des commerçants sénégalais n'atteignent
   pas. Un commerçant local n'a aujourd'hui essentiellement aucune option abordable pour
   personnaliser sa boutique. Un système pensé pour être réutilisable au-delà de ND WORLD
   (cohérent avec le modèle de revente en marque blanche évoqué par ailleurs) répond à un manque
   réel, pas seulement à un exercice académique isolé.

4. **Comportement d'achat différent du contexte occidental habituel.** Achat mobile-first,
   paiement par Wave/Orange Money plutôt que par carte, commande fréquente initiée via WhatsApp
   plutôt que via le tunnel web classique. Les signaux d'interaction (vue, ajout panier, achat)
   ne se comportent pas nécessairement comme dans les jeux de données occidentaux sur lesquels
   la littérature s'appuie habituellement — point à mentionner sans en faire le cœur du sujet.

**Synthèse** : les systèmes de recommandation existants sont conçus pour des contextes de
données massives et d'infrastructures extensibles, un cadre qui ne correspond ni à la réalité du
e-commerce sénégalais ni, plus largement, à celle de la majorité des plateformes marchandes
africaines. Ce mémoire propose et évalue une architecture adaptée à ces contraintes structurelles.

### 1.2 Problématique proposée

> Comment concevoir et évaluer, dans le contexte réel d'une plateforme e-commerce en production
> à faible trafic et à infrastructure contrainte — représentatif du e-commerce sénégalais et
> ouest-africain plus largement —, un système de recommandation hybride (filtrage collaboratif
> item-based et user-based) capable de s'actualiser en continu à partir d'un flux d'événements,
> et en quoi cette actualisation en ligne améliore-t-elle la pertinence des recommandations par
> rapport à une approche par réentraînement périodique ?

### 1.3 Ce qui distingue ce travail d'un mémoire classique

- La plupart des mémoires en recommandation travaillent sur un **dataset statique public**
  (MovieLens, Amazon Reviews). Ici, les données proviennent d'un **site réel en production**,
  avec toutes les contraintes que ça implique (données rares au début, trafic irrégulier,
  serveur à ressources limitées, contraintes de latence pour ne pas dégrader l'expérience client).
- L'évaluation ne se limite pas à des métriques offline : un **A/B test en production** est
  possible (groupe avec recommandations personnalisées vs groupe témoin), ce qu'un dataset
  statique ne permet jamais.
- La contribution technique porte spécifiquement sur la **mise à jour incrémentale** des modèles
  (vs. réentraînement complet périodique), sous contrainte d'infrastructure modeste (serveur
  2 vCPU / 4 Go, pas de cluster Kafka).

### 1.4 Livrable final

- Mémoire écrit complet (état de l'art, méthodologie, implémentation, évaluation, discussion).
- Système fonctionnel intégré à ND WORLD (pas un prototype isolé).
- Soutenance avec démonstration live sur le site réel.

---

## 2. État de l'art à couvrir (chapitre 2 du mémoire)

- **Filtrage collaboratif classique** : Sarwar et al. (2001) *Item-based collaborative filtering
  recommendation algorithms* ; Linden, Smith & York (2003) *Amazon.com recommendations: item-to-item
  collaborative filtering* — référence historique directement pertinente puisque item-based CF
  est au cœur du sujet.
- **Filtrage collaboratif user-based** : k-NN sur profils utilisateurs, mesures de similarité
  (cosinus, corrélation de Pearson), et ses limites connues (passage à l'échelle, sensibilité
  à la sparsité).
- **Systèmes hybrides** : Burke (2002) *Hybrid recommender systems: survey and experiments* —
  justifie la combinaison item-based + user-based + popularité (fallback cold-start).
- **Apprentissage en ligne / recommandation en flux** : littérature sur les *streaming
  recommender systems*, mise à jour incrémentale de matrices de similarité, pondération
  temporelle (*time decay*) des interactions récentes.
- **Architectures de traitement de flux** : comparaison Kafka vs. alternatives légères
  (Redis Streams) — justifier le choix retenu par les contraintes d'infrastructure réelles
  du projet (argument de recherche appliquée, pas seulement un choix d'ingénierie).
- **Évaluation des systèmes de recommandation** : precision@k, recall@k, NDCG, hit rate,
  et évaluation en ligne (A/B testing, CTR, taux de conversion) — Gunawardana & Shani (2009)
  *A survey of accuracy evaluation metrics of recommendation tasks*.

---

## 3. Architecture technique

### 3.1 Vue d'ensemble

```
┌─────────────┐     événement      ┌───────────────┐     consomme      ┌──────────────────────┐
│  Front React │ ──(vue/panier/──▶ │ Redis Stream   │ ──────────────▶  │ Worker de mise à jour │
│  (ND WORLD)  │    achat/wishlist) │ "interactions" │                   │ incrémentale          │
└─────────────┘                    └───────────────┘                   └──────────┬───────────┘
                                                                                     │ met à jour
                                                                                     ▼
                                                                    ┌───────────────────────────────┐
                                                                    │ Similarités item-item (Redis)  │
                                                                    │ Profils utilisateurs (Redis)   │
                                                                    │ Top-N précalculés (Redis cache)│
                                                                    └───────────────┬───────────────┘
                                                                                     │ lecture rapide
                                                                                     ▼
                                                                    ┌───────────────────────────────┐
                                                                    │ API recommandations (Laravel)  │
                                                                    │ → fiche produit / panier /     │
                                                                    │   accueil                      │
                                                                    └───────────────────────────────┘
```

### 3.2 Pourquoi Redis Streams et pas Kafka

Kafka est la référence industrielle, mais implique un cluster à maintenir, une empreinte
mémoire/CPU significative, et une complexité opérationnelle disproportionnée pour un serveur
2 vCPU / 4 Go déjà sous tension (voir `scaling_cache_architecture` — le site a déjà connu des
incidents de charge). Redis est **déjà présent** dans la stack (cache applicatif, sessions,
queues Laravel) ; Redis Streams (`XADD`/`XREAD`/consumer groups) offre les garanties nécessaires
(persistance, consumer groups, rejeu) pour un volume d'événements de cet ordre de grandeur, sans
nouvelle brique d'infrastructure. **Ce choix est lui-même un résultat de recherche appliquée** à
documenter : trade-off performance/simplicité sous contrainte de ressources réelles.

### 3.3 Table de collecte des interactions

Étend la table `product_views` déjà envisagée dans `RECOMMANDATION_IA.md` (Phase 1) pour couvrir
tous les types de signaux, pas seulement les vues :

```php
Schema::create('interactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('produit_id')->constrained('produits')->onDelete('cascade');
    $table->string('session_id', 100)->index();
    $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
    $table->enum('type', ['vue', 'ajout_panier', 'wishlist', 'achat']);
    $table->unsignedTinyInteger('poids'); // vue=1, wishlist=2, ajout_panier=3, achat=5
    $table->timestamp('created_at')->useCurrent();

    $table->index(['produit_id', 'created_at']);
    $table->index(['client_id', 'created_at']);
});
```

Chaque écriture dans cette table déclenche aussi un `XADD` dans le stream Redis `interactions`
(écriture double : la table PostgreSQL sert de source de vérité pour l'évaluation offline et le
split temporel train/test ; le stream Redis alimente la mise à jour incrémentale en temps réel).

### 3.4 Modèles

**Item-based CF (similarité incrémentale)**
Matrice de co-occurrence item-item mise à jour à chaque événement consommé (pas de recalcul
complet) : à réception d'une interaction `(session, item)`, incrémenter les compteurs de
co-occurrence avec les items récemment interagis par la même session/client, avec pondération
temporelle décroissante (fenêtre glissante, ex. demi-vie de 14 jours). Similarité cosinus
recalculée localement (ligne/colonne concernée uniquement, pas la matrice entière).

**User-based CF (k-NN)**
Profils utilisateurs sous forme de vecteurs pondérés produit → poids d'interaction. Mise à jour
incrémentale du vecteur du client à chaque événement. Similarité utilisateur calculée par
approximation (LSH/MinHash) pour rester scalable, ou k-NN exact si le volume de clients le
permet (probable au vu du trafic attendu — à mesurer en Phase 2).

**Baseline (obligatoire pour la comparaison)**
Recommandation par popularité (best-sellers), non personnalisée — point de comparaison
systématique dans la littérature en recommandation.

**Fallback cold-start**
Popularité par catégorie pour les nouveaux visiteurs/produits sans historique — combine avec
`RECOMMANDATION_IA.md` Phase 2 (règles SQL "populaires dans la même catégorie").

### 3.5 Service applicatif

- Précalcul des Top-N (par produit et par utilisateur) stocké dans Redis, invalidé/rafraîchi à
  chaque mise à jour incrémentale — l'affichage sur le site reste en lecture pure, jamais de
  calcul synchrone dans la requête HTTP (contrainte de latence).
- Endpoint API : `GET /api/client/produits/{id}/recommandations` (item-based, section fiche
  produit + panier) et `GET /api/client/recommandations` (user-based, section accueil si
  session/client identifiable).
- Fallback systématique vers la popularité si le modèle personnalisé n'a pas assez de signal
  (cold-start utilisateur ou produit).

---

## 4. Plan sur 7 mois (~30 semaines)

### Phase 0 — Cadrage & état de l'art (semaines 1-3)
- Valider la problématique avec l'encadrant.
- Rédiger le chapitre état de l'art (premier jet).
- Justifier par écrit le choix Redis Streams vs Kafka.
- **Livrable** : plan de mémoire validé, chapitre 2 (état de l'art) en premier jet.

### Phase 1 — Pipeline de collecte des interactions (semaines 4-8)
- Migration `interactions` (section 3.3).
- Instrumentation : vue produit, ajout panier, wishlist, achat confirmé → écriture table +
  `XADD` Redis Stream.
- Anonymisation session pour les invités (déjà en place côté panier via `session_id`).
- Dashboard admin simple : volume d'interactions collectées par semaine (sert aussi de preuve
  empirique dans le mémoire).
- **À démarrer au plus tôt** : chaque semaine de retard ici réduit directement le volume de
  données disponible pour l'évaluation finale (risque n°1 du projet, voir section 6).
- **Livrable** : pipeline en production, premières données réelles qui commencent à s'accumuler.

### Phase 2 — Modèles baseline hors ligne (semaines 9-14)
- Implémentation batch (non encore incrémentale) : popularité, item-based, user-based.
- Split temporel train/test sur les données collectées en Phase 1.
- Évaluation offline : precision@k, recall@k, NDCG, hit rate.
- **Point de décision (fin semaine 14)** : si le volume réel est insuffisant pour une évaluation
  robuste, documenter la décision de compléter avec un dataset public pour la partie comparaison
  d'algorithmes (l'intégration ND WORLD reste sur données réelles pour la démo/A-B test).
- **Livrable** : chapitre méthodologie + premiers résultats comparatifs (baseline).

### Phase 3 — Passage à l'apprentissage en ligne (semaines 15-20)
- Worker de consommation du Redis Stream (mise à jour incrémentale, section 3.4).
- Pondération temporelle / fenêtre glissante.
- Cache Redis des Top-N, invalidation incrémentale.
- Intégration front : "Produits similaires" (fiche produit), "Vous pourriez aussi aimer"
  (panier), "Recommandé pour vous" (accueil).
- Surveillance de charge serveur (worker tournant en continu sur une infra déjà contrainte —
  isoler/limiter la fréquence si nécessaire).
- **Livrable** : système en ligne fonctionnel sur ND WORLD, chapitre architecture technique rédigé.

### Phase 4 — Évaluation en production (semaines 21-25)
- A/B test réel : groupe test (recommandations personnalisées) vs groupe témoin (popularité).
- Métriques : taux de clic, taux d'ajout panier, taux de conversion.
- Comparaison batch (Phase 2) vs en ligne (Phase 3) : démontrer l'apport spécifique de
  l'actualisation continue (ex. vitesse de prise en compte d'un produit tendance ou d'un nouveau
  client, par rapport à un modèle qui ne se remet à jour qu'une fois par nuit).
- Analyse de significativité statistique des résultats.
- **Livrable** : chapitre résultats/évaluation.

### Phase 5 — Rédaction finale & soutenance (semaines 26-30)
- Rédaction complète (introduction, état de l'art, méthodologie, implémentation, résultats,
  discussion, limites, conclusion).
- Slides + démonstration live sur ND WORLD.
- Marge de sécurité (2-3 semaines) avant la deadline institutionnelle.

---

## 5. Méthodologie d'évaluation

| Type | Méthode | Objectif |
|---|---|---|
| Offline | Split temporel train/test, precision@k / recall@k / NDCG / hit rate | Comparer objectivement item-based, user-based, hybride, popularité |
| Online (A/B test) | Groupe test vs groupe témoin sur ND WORLD réel | Mesurer l'impact business réel (CTR, taux de conversion) |
| Comparatif | Batch (Phase 2) vs en ligne (Phase 3) | Isoler la contribution spécifique de l'apprentissage en ligne |

Point de vigilance rédactionnel : bien distinguer dans le mémoire le **traitement en flux
continu** (l'architecture Redis Streams) de la **mise à jour incrémentale du modèle**
(l'algorithme). Un jury peut challenger l'emploi du terme « temps réel » si cette distinction
n'est pas explicite — les deux sont nécessaires conjointement pour justifier le terme.

---

## 6. Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Données trop rares (site jeune, trafic limité) | CF classique, surtout user-based, souffre en sparsité | Démarrer la collecte dès la Phase 1 ; fallback popularité systématique ; point de décision semaine 14 pour compléter avec un dataset public si besoin (évaluation offline uniquement) |
| Charge serveur (2 vCPU, déjà sous tension par le passé) | Worker en continu peut dégrader les perfs du site | Isoler le worker, limiter la fréquence de mise à jour si nécessaire, surveiller via les outils déjà en place (voir `scaling_cache_architecture`) |
| Ambiguïté du terme « temps réel » face au jury | Remise en cause de la contribution scientifique | Distinguer explicitement architecture en flux vs. mise à jour incrémentale (section 5) |
| Données personnelles (tracking par client) | Conformité | Anonymisation par session pour les invités ; mention dans la politique de confidentialité (déjà recommandé dans `RECOMMANDATION_IA.md`) |

---

## 7. Structure suggérée du mémoire écrit

1. Introduction (contexte ND WORLD, problématique, objectifs)
2. État de l'art (section 2 de ce document)
3. Contexte technique et données disponibles (stack existante, données collectées)
4. Méthodologie (modèles retenus, architecture, choix justifiés)
5. Implémentation (pipeline, worker, intégration front)
6. Évaluation et résultats (offline + A/B test + comparaison batch/en ligne)
7. Discussion (limites, sparsité des données, généralisation)
8. Conclusion et perspectives

---

## 8. Lien avec `RECOMMANDATION_IA.md`

| `RECOMMANDATION_IA.md` (roadmap produit) | Ce document (mémoire) |
|---|---|
| Phase 1 — table `product_views`, vues uniquement | Étendue en table `interactions`, tous types de signaux |
| Phase 2 — règles SQL statiques | Reprises comme fallback cold-start / baseline de comparaison |
| Phase 3 — Python/Surprise, réentraînement batch nocturne | Remplacé par mise à jour incrémentale en continu (contribution du mémoire) |
| Phase 4 — embeddings pgvector | Hors périmètre du mémoire (piste de perspective en conclusion) |

---

*Document créé le 2026-07-20. Stack : Laravel 11, PostgreSQL, Redis, React, Coolify.*
