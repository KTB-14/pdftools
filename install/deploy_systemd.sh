#!/bin/bash
echo "========================================================"
echo "===== ===== DEBUT SCRIPT - DEPLOY_SYSTEMD.SH ===== ====="
echo "========================================================"

echo "Déploiement des fichiers systemd pour PDFTools..."

# Dossiers
PROJECT_DIR="/opt/pdftools"
SYSTEMD_DIR="/etc/systemd/system"
SOURCE_DIR="$PROJECT_DIR/install/systemd"

# Vérification des droits
if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté en tant que root (sudo)."
  exit 1
fi

# Copie des fichiers systemd
echo "Copie des fichiers .service et .timer depuis $SOURCE_DIR"
cp "$SOURCE_DIR"/*.service "$SYSTEMD_DIR"/
cp "$SOURCE_DIR"/*.timer "$SYSTEMD_DIR"/

# Recharger systemd
echo "Rechargement de systemd..."
systemctl daemon-reexec
systemctl daemon-reload

# Activer les services OCR et Celery
echo "Activation des services OCR et Celery..."
systemctl enable --now ocr-api.service
systemctl enable --now celery-ocr.service

# Activer le timer de purge automatique
echo "⏱Activation du timer de purge OCR..."
systemctl enable --now purge-ocr.timer

# Vérifications
echo "État des services :"
systemctl status ocr-api.service --no-pager
systemctl status celery-ocr.service --no-pager
systemctl list-timers --all | grep purge-ocr

echo "Déploiement terminé avec succès."

echo "========================================================"
echo "===== ====== FIN SCRIPT - DEPLOY_SYSTEMD.SH ====== ====="
echo "========================================================"