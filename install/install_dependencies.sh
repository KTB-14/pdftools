
#!/bin/bash

echo "==================================================================="
echo "============== DEBUT DU SCRIPT - INSTALL_DEPENDENCIES ============="
echo "==================================================================="
echo
echo

echo "----------------------------------------------------------------------"
echo "                           [1/4] MISE À JOUR                          "
echo "           Mise à jour de la liste des paquets et du système         "
echo "----------------------------------------------------------------------"
echo
sudo apt update && sudo apt upgrade -y
echo
echo

echo "----------------------------------------------------------------------"
echo "               [2/4] INSTALLATION DES DÉPENDANCES SYSTÈME            "
echo "----------------------------------------------------------------------"
echo

echo "----------------------------------------------------------------------"
echo "           [2.1] Langage et environnement Python                      "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  python3 \
  python3-dev \
  python3-pip \
  python3-venv
echo

echo "----------------------------------------------------------------------"
echo "           [2.2] Services essentiels                                  "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  redis-server \
  git
echo

echo "----------------------------------------------------------------------"
echo "           [2.3] OCR – Reconnaissance de texte                        "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  tesseract-ocr \
  tesseract-ocr-fra \
  tesseract-ocr-eng \
  ocrad
echo

echo "----------------------------------------------------------------------"
echo "           [2.4] Outils PDF                                           "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  ghostscript \
  unpaper \
  qpdf \
  pdftk \
  poppler-utils \
  xpdf
echo

echo "----------------------------------------------------------------------"
echo "           [2.5] Optimisation d’images                                "
echo "----------------------------------------------------------------------"
sudo apt install -y \
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
echo

echo "----------------------------------------------------------------------"
echo "           [2.6] Polices et typographie                               "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  fonts-dejavu \
  fonts-liberation
echo

echo "----------------------------------------------------------------------"
echo "           [2.7] Métadonnées et formats                               "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  exiftool \
  libimage-exiftool-perl \
  libmagic1 \
  libpoppler-cpp-dev
echo

echo "----------------------------------------------------------------------"
echo "           [2.8] Librairies PDF et rendu texte                        "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  libharfbuzz-dev \
  libfribidi-dev \
  libxcb1-dev
echo

echo "----------------------------------------------------------------------"
echo "           [2.9] Sécurité, compression et cryptographie              "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  libssl-dev \
  libffi-dev \
  zlib1g-dev \
  ffmpeg \
  cups
echo

echo "----------------------------------------------------------------------"
echo "           [2.10] Compilation et outils de build                      "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  build-essential \
  autoconf \
  automake \
  libtool
echo

echo "----------------------------------------------------------------------"
echo "           [2.11] Debug et développement avancé                       "
echo "----------------------------------------------------------------------"
sudo apt install -y \
  inkscape \
  strace
echo

echo "----------------------------------------------------------------------"
echo "           [2.12] Serveur Web (Nginx pour frontend)                   "
echo "----------------------------------------------------------------------"
sudo apt install -y nginx
echo
echo

echo "----------------------------------------------------------------------"
echo "             [3/4] CLONAGE ET COMPILATION DE JBIG2ENC                "
echo "----------------------------------------------------------------------"
cd /opt

if [ ! -d "/opt/jbig2enc" ]; then
  echo "Clonage de jbig2enc..."
  sudo git clone https://github.com/agl/jbig2enc.git
else
  echo "Répertoire jbig2enc déjà présent, suppression puis nouveau clonage..."
  sudo rm -rf /opt/jbig2enc
  sudo git clone https://github.com/agl/jbig2enc.git
fi

cd /opt/jbig2enc
sudo ./autogen.sh
sudo ./configure
sudo make -j"$(nproc)"
sudo make install
echo
echo

echo "----------------------------------------------------------------------"
echo "             [4/4] CONFIGURATION DE NGINX POUR PDFTOOLS              "
echo "----------------------------------------------------------------------"

NGINX_CONF_SRC="/opt/pdftools/nginx/pdftools.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/pdftools"
NGINX_SYMLINK="/etc/nginx/sites-enabled/pdftools"

echo "Copie de la configuration Nginx..."
if [ -f "$NGINX_CONF_SRC" ]; then
  sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
else
  echo "Erreur : fichier de configuration introuvable : $NGINX_CONF_SRC"
  exit 1
fi

echo "Activation de la configuration..."
if [ ! -L "$NGINX_SYMLINK" ]; then
  sudo ln -s "$NGINX_CONF_DEST" "$NGINX_SYMLINK"
fi

echo "Désactivation de la configuration par défaut..."
if [ -L "/etc/nginx/sites-enabled/default" ]; then
  sudo rm /etc/nginx/sites-enabled/default
fi

echo "Vérification de la configuration Nginx..."
sudo nginx -t

echo "Redémarrage de Nginx..."
sudo systemctl reload nginx

if command -v ufw > /dev/null; then
  echo "Ouverture du pare-feu pour Nginx..."
  sudo ufw allow 'Nginx Full'
fi

echo
echo "Accès au site : http://<IP_DU_SERVEUR>/"
echo

echo "==================================================================="
echo "============== FIN DU SCRIPT - INSTALL_DEPENDENCIES =============="
echo "==================================================================="
