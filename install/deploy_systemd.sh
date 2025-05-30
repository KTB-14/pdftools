#!/bin/bash

echo "==================================================================="
echo "=========== DEBUT DU SCRIPT - DEPLOY_SYSTEMD.SH ==================="
echo "==================================================================="
echo
echo

echo "----------------------------------------------------------------------"
echo "        Ce script déploie les services systemd pour PDFTools         "
echo "----------------------------------------------------------------------"
echo

# Variables
PROJECT_DIR="/opt/pdftools"
SYSTEMD_DIR="/etc/systemd/system"
SOURCE_DIR="$PROJECT_DIR/install/systemd"

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté en tant que root."
  exit 1
fi

echo "Copie des fichiers .service et .timer..."
sudo cp "$SOURCE_DIR"/*.service "$SYSTEMD_DIR"/
sudo cp "$SOURCE_DIR"/*.timer "$SYSTEMD_DIR"/

echo "Rechargement de systemd..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload

echo "Activation et démarrage des services OCR et Celery..."
sudo systemctl enable --now ocr-api.service
sudo systemctl enable --now celery-ocr.service

echo "Activation et démarrage du timer de purge automatique..."
sudo systemctl enable --now purge-ocr.timer

echo
echo "Vérification des statuts :"
sudo systemctl status ocr-api.service --no-pager
sudo systemctl status celery-ocr.service --no-pager
sudo systemctl list-timers --all | grep purge-ocr || echo "(Timer inactif)"

echo
echo "==================================================================="
echo "=========== FIN DU SCRIPT - DEPLOY_SYSTEMD.SH ====================="
echo "==================================================================="
