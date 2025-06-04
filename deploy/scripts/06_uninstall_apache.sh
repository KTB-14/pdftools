#!/bin/bash

# ================================
# Désactivation de la config Apache PDFTools
# ================================

echo
echo "==================================================================="
echo "============== DÉSINSTALLATION DE LA CONFIG APACHE ================"
echo "==================================================================="
echo

SITE_NAME="pdftools.conf"

echo "Désactivation du site PDFTools..."
sudo a2dissite "$SITE_NAME"

echo "Reload Apache pour appliquer les changements..."
sudo systemctl reload apache2

echo
echo "✅ Config Apache désactivée et rechargée."
