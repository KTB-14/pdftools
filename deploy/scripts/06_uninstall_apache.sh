#!/bin/bash
set -euo pipefail

# Variables globales
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APACHE_SITE="pdftools.conf"

echo
echo "==================================================================="
echo "============== DÉSINSTALLATION DE LA CONFIG APACHE ================"
echo "==================================================================="
echo

echo "➤ Désactivation du site Apache PDFTools..."
sudo a2dissite "$APACHE_SITE"

echo "➤ Reload d'Apache pour prise en compte..."
sudo systemctl reload apache2

echo
echo " Config Apache PDFTools désactivée avec succès."