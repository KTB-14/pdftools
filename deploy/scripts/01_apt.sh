#!/bin/bash
set -euo pipefail

# Variables globales
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/venv"
LOGFILE="$BACKEND_DIR/logs/ocr.log"

echo "==================================================================="
echo "============== INSTALLATION DES DÉPENDANCES APT ==================="
echo "==================================================================="
echo

# 🔒 Attendre que APT soit libre
echo "🔍 Vérification du lock APT..."
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
  echo "⏳ Attente de libération du lock APT..."
  sleep 5
done

# Mise à jour système
echo "➤ Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# Lecture des paquets APT depuis les fichiers .txt
for list in deploy/apt/*.txt; do
    echo "➤ Installation des paquets listés dans : $list"
    while read -r pkg; do
        # Ignorer lignes vides ou lignes commentaires
        if [[ -n "$pkg" && ! "$pkg" =~ ^# ]]; then
            echo "    ➔ Installation : $pkg"
            sudo apt install -y "$pkg"
        fi
    done < "$list"
done

# Installation de jbig2enc
echo
echo "➤ Installation de jbig2enc (optimisation OCR PDF)..."
cd /opt
if [ -d "jbig2enc" ]; then
  echo "    ➔ jbig2enc existe déjà, suppression pour réinstallation."
  sudo rm -rf jbig2enc
fi
sudo git clone https://github.com/agl/jbig2enc.git
cd jbig2enc
sudo ./autogen.sh
sudo ./configure
sudo make -j"$(nproc)"
sudo make install

echo
echo "Installation complète des dépendances APT + jbig2enc terminée."