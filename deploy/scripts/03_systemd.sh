#!/bin/bash
set -euo pipefail

# Variables globales
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SYSTEMD_DIR="/etc/systemd/system"
SOURCE_DIR="$PROJECT_ROOT/deploy/systemd"

echo "==================================================================="
echo "=========== INSTALLATION DES SERVICES SYSTEMD PDFTOOLS ============"
echo "==================================================================="
echo

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ce script doit être exécuté en tant que root (sudo)."
    exit 1
fi

# Chemins
SYSTEMD_DIR="/etc/systemd/system"
SOURCE_DIR="$PROJECT_ROOT/deploy/systemd"

# Copier tous les .service et .timer
echo "➤ Copie des fichiers .service et .timer vers $SYSTEMD_DIR"
sudo cp "$SOURCE_DIR"/*.service "$SYSTEMD_DIR"/
sudo cp "$SOURCE_DIR"/*.timer "$SYSTEMD_DIR"/

# Recharger systemd
echo "➤ Rechargement de systemd..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload

# Activer et démarrer services
echo "➤ Activation et démarrage de ocr-api.service..."
sudo systemctl enable --now ocr-api.service

echo "➤ Activation et démarrage de celery-ocr.service..."
sudo systemctl enable --now celery-ocr.service

echo "➤ Activation et démarrage de purge-ocr.timer..."
sudo systemctl enable --now purge-ocr.timer

echo
echo "✅ Services systemd installés et démarrés avec succès."
