#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/venv"
LOGFILE="$BACKEND_DIR/logs/ocr.log"

echo
echo "==================================================================="
echo "============== INSTALLATION DES DÉPENDANCES APT ==================="
echo "==================================================================="
echo

# Vérification du sources.list avec sauvegarde
check_sources_list() {
    if [ ! -s /etc/apt/sources.list ]; then
        if [ -f /etc/apt/sources.list.d/ubuntu.sources ]; then
            echo "Système Ubuntu 24.04 détecté avec ubuntu.sources."
        else
            echo "/etc/apt/sources.list vide. Sauvegarde et régénération..."
            TIMESTAMP=$(date +%Y%m%d-%H%M%S)
            sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak.$TIMESTAMP || true
            cat <<EOF | sudo tee /etc/apt/sources.list
deb http://archive.ubuntu.com/ubuntu noble main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu noble-updates main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu noble-backports main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu noble-security main restricted universe multiverse
EOF
            echo "Nouveau sources.list créé."
        fi
    else
        echo "/etc/apt/sources.list détecté et non vide."
    fi
}



wait_for_apt() {
  while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    echo "⏳ Attente de libération du lock APT..."
    sleep 5
  done
}

safe_install() {
  local package="$1"
  if dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -q "install ok installed"; then
    echo "$package déjà installé, on passe."
  else
    echo "    ➔ Installation : $package"
    if sudo apt-get install -y "$package"; then
      echo "$package installé avec succès."
    else
      echo "Échec de l'installation de $package. Vérification alternative..."
      if which "$package" >/dev/null 2>&1; then
        echo "$package est présent dans le système (binaire trouvé), on considère OK."
      else
        echo "$package non trouvable, échec critique."
        exit 1
      fi
    fi
  fi
}

check_sources_list

# Activer universe et multiverse
echo "Activation des dépôts Universe et Multiverse..."
sudo add-apt-repository -y main
sudo add-apt-repository -y universe
sudo add-apt-repository -y multiverse

# Mise à jour système
echo "Vérification du lock APT..."
wait_for_apt

echo "Mise à jour de la liste des paquets..."
sudo apt-get update -y

# Installation de Python 3
echo "Installation de Python 3 + pip + venv pour Ubuntu 24.04..."

# Liste des paquets restants
packages=(
python-is-python3
python3
python3-pip
python3-venv
build-essential
fonts-dejavu
fonts-liberation
ghostscript
imagemagick
libffi-dev
libfreetype6-dev
libfribidi-dev
libharfbuzz-dev
libheif1
libjpeg-dev
libjpeg-turbo-progs
liblcms2-dev
libleptonica-dev
libopenjp2-7-dev
libpng-dev
libpoppler-cpp-dev
libqpdf-dev
libssl-dev
libtiff-dev
libtiff-tools
libwebp-dev
libxcb1-dev
libjbig2enc-dev
pdftk
pngquant
poppler-utils
redis-server
tesseract-ocr
tesseract-ocr-eng
tesseract-ocr-fra
unpaper
xpdf
zlib1g-dev
)

for pkg in "${packages[@]}"; do
  safe_install "$pkg"
done

echo
echo "Installation complète des dépendances APT terminée."
