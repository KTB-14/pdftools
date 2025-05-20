# Installation Manuelle — PDFTools

Ce guide décrit les étapes pour installer et lancer PDFTools sur un serveur Ubuntu 22.04.

## 1. Dépendances système

sudo apt update
sudo apt install -y \
  python3 python3-pip python3-venv redis-server \
  tesseract-ocr tesseract-ocr-fra tesseract-ocr-eng \
  ghostscript pngquant \
  libtiff-tools \
  libjpeg-dev libpng-dev zlib1g-dev \
  libopenjp2-7-dev libtiff-dev libfreetype6-dev \
  liblcms2-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev \
  libleptonica-dev \
  autoconf automake libtool

## 2. Installation de jbig2enc (compression avancée)

cd /opt
sudo git clone https://github.com/agl/jbig2enc.git
cd jbig2enc
sudo ./autogen.sh && sudo ./configure
sudo make -j$(nproc)
sudo make install

## 3. Clonage et préparation du projet

cd /opt
git clone https://github.com/votre-repo/pdftools.git
cd pdftools

## 4. Installation des dépendances Python

cd backend
pip3 install -r requirements.txt

## 5. Lancer Redis

sudo systemctl enable redis-server
sudo systemctl start redis-server

## 6. Services backend (FastAPI + Celery)

sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ocr-api celery-ocr
sudo systemctl start ocr-api celery-ocr

## 7. Vérifications

API : curl http://localhost:8000
Logs : sudo journalctl -u ocr-api -f


## 8. Interface utilisateur

Accès local via navigateur : http://<IP>:8000/frontend/index.html