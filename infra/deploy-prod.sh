#!/usr/bin/env bash
# Déploiement production — à lancer sur le serveur :  /opt/ndeya-shop/infra/deploy-prod.sh
#
# Refuse de déployer tant que la CI GitHub (backend, frontend, nginx) n'est pas
# verte sur le commit de main visé. Si elle l'est : sauvegarde de la base,
# git pull, rebuild des seuls services concernés, migrations, cache, contrôle.
#
# Options :
#   --all      reconstruit backend, queue, nginx et frontend même sans changement
#   --dry-run  vérifie la CI et affiche ce qui serait fait, sans rien modifier
set -euo pipefail

REPO="Birame-Owens/backend-ecommerce"
BRANCH="main"
REQUIRED_CHECKS="backend frontend nginx"
HEALTH_HOST="${HEALTH_HOST:-api.nd-world.site}"
BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
BACKUPS_TO_KEEP=10

FORCE_ALL=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --all) FORCE_ALL=1 ;;
    --dry-run) DRY_RUN=1 ;;
    *) echo "Option inconnue : $arg" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f infra/docker-compose.yml --env-file infra/.env"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✔ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✘ %s\033[0m\n' "$*" >&2; exit 1; }

command -v python3 >/dev/null || fail "python3 est requis (lecture de la réponse GitHub)."

# ── 1. Commit visé ──────────────────────────────────────────────────────────
step "Récupération de origin/$BRANCH"
[ "$(git branch --show-current)" = "$BRANCH" ] || fail "Le serveur n'est pas sur la branche $BRANCH."
git fetch --quiet origin "$BRANCH"
CURRENT=$(git rev-parse HEAD)
TARGET=$(git rev-parse "origin/$BRANCH")

if [ "$CURRENT" = "$TARGET" ] && [ "$FORCE_ALL" -eq 0 ]; then
  ok "Déjà à jour ($(git log --oneline -1 HEAD)). Rien à déployer."
  exit 0
fi
git merge-base --is-ancestor "$CURRENT" "$TARGET" \
  || fail "origin/$BRANCH n'est pas une suite de HEAD (historique réécrit ?). Déploiement manuel requis."
echo "Actuel : $(git log --oneline -1 "$CURRENT")"
echo "Visé   : $(git log --oneline -1 "$TARGET")"

# ── 2. Barrière CI ──────────────────────────────────────────────────────────
step "Vérification de la CI GitHub sur ${TARGET:0:7}"
CI_JSON=$(curl -fsS -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/commits/$TARGET/check-runs?per_page=100") \
  || fail "Impossible de joindre l'API GitHub."

CI_REPORT=$(REQUIRED="$REQUIRED_CHECKS" python3 -c '
import json, os, sys
runs = json.load(sys.stdin).get("check_runs", [])
latest = {}
for r in sorted(runs, key=lambda r: r.get("started_at") or ""):
    latest[r["name"]] = r
bad = 0
for name in os.environ["REQUIRED"].split():
    r = latest.get(name)
    if r is None:
        print(f"MISSING {name}"); bad = 1
    elif r["status"] != "completed":
        print(f"PENDING {name}"); bad = bad or 2
    elif r["conclusion"] != "success":
        print("FAILED  %s (%s) %s" % (name, r["conclusion"], r["html_url"])); bad = 1
    else:
        print(f"OK      {name}")
sys.exit(bad)
' <<<"$CI_JSON") && CI_STATUS=0 || CI_STATUS=$?

echo "$CI_REPORT"
case "$CI_STATUS" in
  0) ok "CI verte." ;;
  2) fail "CI encore en cours sur ce commit. Réessayez dans une minute." ;;
  *) fail "CI rouge ou incomplète : déploiement refusé." ;;
esac

# ── 3. Ce qui change ────────────────────────────────────────────────────────
CHANGED=$(git diff --name-only "$CURRENT" "$TARGET")
SERVICES=""
if [ "$FORCE_ALL" -eq 1 ]; then
  SERVICES="backend queue nginx frontend"
else
  echo "$CHANGED" | grep -qE '^(backend/|infra/Dockerfile$|infra/docker/(entrypoint\.sh|php-fpm\.conf))' && SERVICES="$SERVICES backend queue"
  echo "$CHANGED" | grep -qE '^(infra/Dockerfile\.nginx$|infra/docker/nginx/backend\.conf$|backend/public/)' && SERVICES="$SERVICES nginx"
  echo "$CHANGED" | grep -qE '^(front/|infra/Dockerfile\.frontend$|infra/docker/nginx/frontend\.conf$)' && SERVICES="$SERVICES frontend"
fi
SERVICES=$(echo "$SERVICES" | xargs -n1 2>/dev/null | awk '!seen[$0]++' | xargs)
HAS_MIGRATIONS=0
echo "$CHANGED" | grep -q '^backend/database/migrations/' && HAS_MIGRATIONS=1

echo "Services à reconstruire : ${SERVICES:-aucun}"
echo "Nouvelles migrations    : $([ $HAS_MIGRATIONS -eq 1 ] && echo oui || echo non)"

if [ "$DRY_RUN" -eq 1 ]; then
  ok "Mode --dry-run : rien n'a été modifié."
  exit 0
fi

# ── 4. Sauvegarde de la base ────────────────────────────────────────────────
step "Sauvegarde de la base"
mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/ndeya_$(date +%Y%m%d_%H%M%S)_${CURRENT:0:7}.sql.gz"
docker exec ndeya_db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$BACKUP"
[ "$(gzip -dc "$BACKUP" | head -c 1000 | wc -c)" -gt 0 ] || fail "Sauvegarde vide : $BACKUP"
ok "Sauvegarde : $BACKUP ($(du -h "$BACKUP" | cut -f1))"
ls -1t "$BACKUP_DIR"/ndeya_*.sql.gz | tail -n +$((BACKUPS_TO_KEEP + 1)) | xargs -r rm --

# ── 5. Code ─────────────────────────────────────────────────────────────────
step "Mise à jour du code"
# --ff-only : garde les réglages locaux de prod (infra/), refuse tout conflit.
git pull --ff-only --quiet origin "$BRANCH" \
  || fail "git pull impossible (conflit avec les fichiers locaux ?). Rien n'a été reconstruit."
ok "$(git log --oneline -1 HEAD)"

# ── 6. Rebuild ──────────────────────────────────────────────────────────────
if [ -n "$SERVICES" ]; then
  step "Rebuild : $SERVICES"
  # shellcheck disable=SC2086
  $COMPOSE up -d --build $SERVICES
fi

# ── 7. Migrations + cache ───────────────────────────────────────────────────
if echo " $SERVICES " | grep -q ' backend '; then
  if [ "$HAS_MIGRATIONS" -eq 1 ]; then
    step "Migrations"
    $COMPOSE exec -T backend php artisan migrate --force
  fi
  step "Vidage du cache applicatif"
  $COMPOSE exec -T backend php artisan cache:clear
fi

# ── 8. Contrôle ─────────────────────────────────────────────────────────────
step "Contrôle de santé"
for i in $(seq 1 30); do
  if curl -fsSk --max-time 5 --resolve "$HEALTH_HOST:443:127.0.0.1" "https://$HEALTH_HOST/up" >/dev/null; then
    ok "API en ligne (https://$HEALTH_HOST/up)."
    $COMPOSE ps
    printf '\n\033[1;32mDéploiement terminé : %s\033[0m\n' "$(git log --oneline -1 HEAD)"
    exit 0
  fi
  sleep 2
done

$COMPOSE ps
echo "Retour arrière (garde les réglages locaux de infra/) :" >&2
echo "  git reset --keep $CURRENT && $COMPOSE up -d --build backend queue nginx frontend" >&2
echo "Base avant déploiement : $BACKUP (les migrations ne sont pas annulées automatiquement)" >&2
fail "L'API ne répond pas après 60 s. Voir : $COMPOSE logs --tail=100 backend"
