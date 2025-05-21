#!/bin/bash

echo "Suppression des services systemd PDFTools..."

# Fichiers à supprimer
SERVICES=(
  ocr-api.service
  celery-ocr.service
  purge-ocr.service
  purge-ocr.timer
)

# Vérification des droits
if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté en tant que root (sudo)."
  exit 1
fi

# Désactivation + arrêt
for svc in "${SERVICES[@]}"; do
  echo "Désactivation de $svc..."
  systemctl disable --now "$svc" 2>/dev/null
done

# Suppression des fichiers
for svc in "${SERVICES[@]}"; do
  FILE="/etc/systemd/system/$svc"
  if [ -f "$FILE" ]; then
    echo "Suppression de $FILE"
    rm "$FILE"
  fi
done

# Recharger systemd
echo "🔄 Rechargement de systemd..."
systemctl daemon-reexec
systemctl daemon-reload

echo "Désinstallation terminée."
