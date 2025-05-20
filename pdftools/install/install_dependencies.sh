#!/bin/bash

echo "=== Installation des dépendances système ==="
sudo apt update && sudo apt install -y \
  python3 python3-pip python3-venv redis-server \
  tesseract-ocr tesseract-ocr-fra tesseract-ocr-eng \
  ghostscript pngquant \
  libtiff-tools \
  libjpeg-dev libpng-dev zlib1g-dev \
  libopenjp2-7-dev libtiff-dev libfreetype6-dev \
  liblcms2-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev \
  libleptonica-dev \
  autoconf automake libtool

echo "=== Clonage jbig2enc ==="
cd /opt
sudo git clone https://github.com/agl/jbig2enc.git
cd jbig2enc
sudo ./autogen.sh && sudo ./configure
sudo make -j$(nproc)
sudo make install

echo "=== Fin de l'installation. Vérifiez les logs si erreur ==="
