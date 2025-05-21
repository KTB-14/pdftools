#!/bin/bash
echo "========================================================"
echo "======== DEBUT SCRIPT - INSTALL_DEPENDENCIES.SH ========"
echo "========================================================"

echo "=== [1/3] Mise à jour du système ==="
sudo apt update && sudo apt upgrade -y

echo "===================================================="

echo "=== [2/3] Installation des dépendances système ==="
sudo apt update && sudo apt install -y \

echo "--- Langage & environnement Python ---"
sudo apt update && sudo apt install -y \
  python3 \
  python3-dev \
  python3-pip \
  python3-venv \

echo "--- Services essentiels ---"
sudo apt update && sudo apt install -y \
  redis-server \
  git 

echo "--- OCR (Reconnaissance de texte) ---"
sudo apt update && sudo apt install -y \
  tesseract-ocr \
  tesseract-ocr-fra \
  tesseract-ocr-eng \
  ocrad 

echo "--- Outils PDF ---"
sudo apt update && sudo apt install -y \
  ghostscript \
  unpaper \
  qpdf \
  pdftk \
  poppler-utils \
  xpdf 

echo "--- Optimisation d'images ---"
sudo apt update && sudo apt install -y \
  pngquant \
  imagemagick \
  libjpeg-dev \
  libjpeg-turbo-progs \
  libwebp-dev \
  libopenjp2-7-dev \
  libtiff-tools \
  libtiff-dev \
  libleptonica-dev \
  libfreetype6-dev \
  liblcms2-dev \
  libpng-dev \
  libheif1 

echo "--- Typographie (PDF lisibles, polices) ---"
sudo apt update && sudo apt install -y \
  fonts-dejavu \
  fonts-liberation 

echo "--- Métadonnées, formats de fichiers ---"
sudo apt update && sudo apt install -y \
  exiftool \
  libimage-exiftool-perl \
  libmagic1 \
  libpoppler-cpp-dev 

echo "--- Librairies de rendu texte / PDF ---"
sudo apt update && sudo apt install -y \
  libharfbuzz-dev \
  libfribidi-dev \
  libxcb1-dev

echo "--- Sécurité, compression, cryptographie ---"
sudo apt update && sudo apt install -y \
  libssl-dev \
  libffi-dev \
  zlib1g-dev \
  ffmpeg \
  cups 

echo "--- Compilation & outils de build ---"
sudo apt update && sudo apt install -y \
  build-essential \
  autoconf \
  automake \
  libtool 

echo "--- Debug & développement avancé ---"
sudo apt update && sudo apt install -y \
  inkscape \
  strace

echo "===================================================="

echo "=== [3/3] Clonage et compilation de jbig2enc ==="
cd /opt

if [ ! -d "/opt/jbig2enc" ]; then
  sudo git clone https://github.com/agl/jbig2enc.git
else
  echo "Dossier /opt/jbig2enc déjà présent. Suppression et nouveau clonage..."
  sudo rm -rf /opt/jbig2enc
  sudo git clone https://github.com/agl/jbig2enc.git
fi

cd /opt/jbig2enc
sudo ./autogen.sh
sudo ./configure
sudo make -j"$(nproc)"
sudo make install

echo "✅ Installation système terminée avec succès."

echo "========================================================"
echo "====+==== FIN SCRIPT - INSTALL_DEPENDENCIES.SH ====+===="
echo "========================================================"