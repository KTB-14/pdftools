# Stage – Service OCR & Compression PDF

**Objectif** :  
Fournir une API web pour déposer des PDF, lancer un traitement OCR + compression, et récupérer le résultat en ZIP.

### 1. Prérequis système (Ubuntu 22.04)
```bash
sudo apt update
sudo apt install -y \
  python3 python3-pip python3-venv \
  redis-server \
  tesseract-ocr tesseract-ocr-eng tesseract-ocr-fra \
  ghostscript pngquant libtiff-tools \
  libjpeg-dev libpng-dev zlib1g-dev \
  libopenjp2-7-dev libtiff-dev libfreetype6-dev \
  liblcms2-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev \
  libleptonica-dev \
  autoconf automake libtool

Installer jbig2enc (optionnel, pour meilleure compression JBIG2)
cd /opt
sudo git clone https://github.com/agl/jbig2enc.git
cd jbig2enc
sudo ./autogen.sh && sudo ./configure
sudo make -j$(nproc) && sudo make install

### 2. Configuration Python
cd /opt/Stage
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

### 3. Variables d’environnement
Dupliquer .env.example en .env et ajuster si besoin (ports, Redis URL…).

###4. Services systemd
OCR API : /etc/systemd/system/ocr-api.service
Celery worker : /etc/systemd/system/ocr-worker.service

# ocr-api.service
[Unit]
Description=OCR FastAPI backend
After=network.target

[Service]
WorkingDirectory=/opt/Stage
ExecStart=/opt/Stage/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
User=homeserver
Group=homeserver
Restart=always

[Install]
WantedBy=multi-user.target

# ocr-worker.service
[Unit]
Description=Celery Worker for OCR Service
After=network.target redis.service

[Service]
WorkingDirectory=/opt/Stage
ExecStart=/opt/Stage/venv/bin/celery -A worker.celery_app worker --loglevel=info
User=homeserver
Group=homeserver
Restart=on-failure

[Install]
WantedBy=multi-user.target

### Démarrage :
sudo systemctl daemon-reload
sudo systemctl enable ocr-api ocr-worker
sudo systemctl start ocr-api ocr-worker

### 5. Utilisation
Ouvrir le front : http://<vm_ip>:81 (config Nginx sur port 81)
Déposer des PDF, suivre le statut, télécharger le ZIP.1

