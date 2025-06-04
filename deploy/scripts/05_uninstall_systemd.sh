#!/bin/bash
set -euo pipefail

# Aller à la racine du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "==================================================================="
echo "============ DÉSINSTALLATION DES SERVICES SYSTEMD PDFTOOLS =========="
echo "==================================================================="
echo

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ce script doit être exécuté en tant que root (sudo)."
    exit 1
fi

# Liste des services à désactiver et supprimer
SERVICES=(
  ocr-api.service
  celery-ocr.service
  purge-ocr.service
  purge-ocr.timer
)

# Désactivation et arrêt des services
for svc in "${SERVICES[@]}"; do
  if systemctl list-units --full -all | grep -q "$svc"; then
    echo "➤ Désactivation et arrêt de $svc..."
    sudo systemctl disable --now "$svc" || true
  else
    echo "ℹ️ $svc non trouvé, passage..."
  fi
done

# Suppression des fichiers systemd
for svc in "${SERVICES[@]}"; do
  FILE="/etc/systemd/system/$svc"
  if [ -f "$FILE" ]; then
    echo "➤ Suppression de $FILE"
    sudo rm "$FILE"
  fi
done

# Rechargement de systemd
echo "➤ Rechargement de systemd..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload

echo
echo "Désinstallation complète des services systemd PDFTools."
