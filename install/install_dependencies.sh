#!/bin/bash

echo "=== [1/3] Mise à jour du système ==="
sudo apt update && sudo apt upgrade -y

echo "=== [2/3] Installation des dépendances système ==="
sudo apt update && sudo apt install -y \
  python3 \
  python3-dev \
  python3-pip \
  python3-venv \
  redis-server \
  tesseract-ocr \
  tesseract-ocr-fra \
  tesseract-ocr-eng \
  ghostscript \
  unpaper \
  pngquant \
  qpdf \
  libtiff-tools \
  libjpeg-dev \
  libffi-dev \
  libheif1 \
  libssl-dev \
  libpng-dev \
  zlib1g-dev \
  libopenjp2-7-dev \
  libtiff-dev \
  libimage-exiftool-perl \
  libfreetype6-dev \
  liblcms2-dev \
  libwebp-dev \
  libharfbuzz-dev \
  libfribidi-dev \
  libxcb1-dev \
  libleptonica-dev \
  poppler-utils \
  build-essential \
  autoconf \
  automake \
  libtool \
  git

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
