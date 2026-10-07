#!/usr/bin/env bash
# Sauvegarde quotidienne de la base (cron sur le VPS, voir README
# "Déploiement"). Garde les BACKUP_RETENTION_DAYS derniers jours.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/kine-maxillo}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/kine-maxillo}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
cd "$APP_DIR"

file="$BACKUP_DIR/kine_maxillo_$(date +%Y-%m-%d_%H%M).sql.gz"
# Variables lues dans le conteneur : pas de mot de passe sur la ligne de commande.
docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' \
  | gzip > "$file.tmp"
mv "$file.tmp" "$file"
chmod 600 "$file"

find "$BACKUP_DIR" -name 'kine_maxillo_*.sql.gz' -mtime +"$BACKUP_RETENTION_DAYS" -delete
echo "Sauvegarde OK : $file"
