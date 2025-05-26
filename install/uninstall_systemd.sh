#!/bin/bash

echo "==================================================================="
echo "========== DEBUT DU SCRIPT - UNINSTALL_SYSTEMD.SH ================="
echo "==================================================================="
echo
echo

echo "----------------------------------------------------------------------"
echo "        Ce script désinstalle les services systemd de PDFTools        "
echo "----------------------------------------------------------------------"
echo

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté en tant que root."
  exit 1
fi

# Liste des services à désactiver et supprimer
SERVICES=(
  ocr-api.service
  celery-ocr.service
  purge-ocr.service
  purge-ocr.timer
)

echo "Désactivation et arrêt des services..."
for svc in "${SERVICES[@]}"; do
  sudo systemctl disable --now "$svc" 2>/dev/null
done

echo "Suppression des fichiers systemd..."
for svc in "${SERVICES[@]}"; do
  FILE="/etc/systemd/system/$svc"
  if [ -f "$FILE" ]; then
    sudo rm "$FILE"
  fi
done

echo "Rechargement de systemd..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload

echo
echo "==================================================================="
echo "=========== FIN DU SCRIPT - UNINSTALL_SYSTEMD.SH =================="
echo "==================================================================="
