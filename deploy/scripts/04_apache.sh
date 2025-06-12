#!/bin/bash
set -euo pipefail

# Configure Apache2 comme reverse proxy pour l'API et sert le frontend statique.

# Variables globales
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APACHE_SRC="$PROJECT_ROOT/deploy/apache2/pdftools.conf"
APACHE_DEST="/etc/apache2/sites-available/pdftools.conf"

echo "==================================================================="
echo "=========== INSTALLATION CONFIGURATION APACHE2 PDFTOOLS ==========="
echo "==================================================================="
echo

APACHE_CONF_SRC="$PROJECT_ROOT/deploy/apache/*.conf"
APACHE_CONF_DEST="/etc/apache2/sites-available/*.conf"

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
    echo "Ce script doit être exécuté en tant que root (sudo)."
    exit 1
fi

# Installation Apache2 si non présent
if ! dpkg -l | grep -q apache2; then
    echo "Installation d'Apache2..."
    sudo apt install -y apache2
else
    echo "Apache2 déjà installé."
fi

# Vérification de Listen 81
if ! grep -q "Listen 81" "$PORT_CONF"; then
    echo "➔ Ajout de 'Listen 81' dans $PORT_CONF..."
    echo "Listen 81" >> "$PORT_CONF"
else
    echo "Port 81 déjà configuré dans ports.conf"
fi

# Activation des modules
echo "Activation des modules nécessaires..."
sudo a2enmod proxy proxy_http headers rewrite

# Copie de la configuration
echo "Copie de la configuration Apache PDFTools..."
sudo cp "$APACHE_CONF_SRC" "$APACHE_CONF_DEST"

# Activation du site
#echo "Activation du site PDFTools..."
#sudo a2ensite pdftools.conf

# Désactivation du site par défaut si actif
if sudo a2query -s 000-default.conf > /dev/null 2>&1; then
    echo "Désactivation du site par défaut..."
    sudo a2dissite 000-default.conf
fi

# Test de config Apache
echo "Test de la configuration Apache..."
sudo apache2ctl configtest

# Redémarrage Apache
echo "Redémarrage d'Apache2..."
sudo systemctl restart apache2

# Firewall (optionnel)
if command -v ufw > /dev/null; then
    echo "Ouverture du pare-feu pour Apache2..."
    sudo ufw allow 'Apache Full'
fi

echo
echo "Apache2 est maintenant configuré pour PDFTools."

