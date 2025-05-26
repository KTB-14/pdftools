echo
echo
echo "==================================================================="
echo "============== DEBUT DU SCRIPT - INSTALL_DEPENDENCIES ============="
echo "==================================================================="
echo
echo

echo "----------------------------------------------------------------------"
echo "                           [1/3] MISE À JOUR                          "
echo "           Mise à jour de la liste des paquets et du système         "
echo "----------------------------------------------------------------------"
echo
sudo apt update && sudo apt upgrade -y
echo
echo

echo "----------------------------------------------------------------------"
echo "               [2/3] INSTALLATION DES DÉPENDANCES SYSTÈME            "
echo "----------------------------------------------------------------------"
echo

echo "----------------------------------------------------------------------"
echo "           [2.1] Langage et environnement Python                      "
echo "----------------------------------------------------------------------"
sudo apt install -y python3 python3-dev python3-pip python3-venv
echo

echo "----------------------------------------------------------------------"
echo "           [2.2] Services essentiels                                  "
echo "----------------------------------------------------------------------"
sudo apt install -y redis-server git
echo

echo "----------------------------------------------------------------------"
echo "           [2.3] OCR – Reconnaissance de texte                        "
echo "----------------------------------------------------------------------"
sudo apt install -y tesseract-ocr tesseract-ocr-fra tesseract-ocr-eng ocrad
echo

echo "----------------------------------------------------------------------"
echo "           [2.4] Outils PDF                                           "
echo "----------------------------------------------------------------------"
sudo apt install -y ghostscript unpaper qpdf pdftk poppler-utils xpdf
echo

echo "----------------------------------------------------------------------"
echo "           [2.5] Optimisation d’images                                "
echo "----------------------------------------------------------------------"
sudo apt install -y pngquant imagemagick libjpeg-dev libjpeg-turbo-progs libwebp-dev \\
libopenjp2-7-dev libtiff-tools libtiff-dev libleptonica-dev libfreetype6-dev \\
liblcms2-dev libpng-dev libheif1
echo

echo "----------------------------------------------------------------------"
echo "           [2.6] Polices et typographie                               "
echo "----------------------------------------------------------------------"
sudo apt install -y fonts-dejavu fonts-liberation
echo

echo "----------------------------------------------------------------------"
echo "           [2.7] Métadonnées et formats                               "
echo "----------------------------------------------------------------------"
sudo apt install -y exiftool libimage-exiftool-perl libmagic1 libpoppler-cpp-dev
echo

echo "----------------------------------------------------------------------"
echo "           [2.8] Librairies PDF et rendu texte                        "
echo "----------------------------------------------------------------------"
sudo apt install -y libharfbuzz-dev libfribidi-dev libxcb1-dev
echo

echo "----------------------------------------------------------------------"
echo "           [2.9] Sécurité, compression et cryptographie              "
echo "----------------------------------------------------------------------"
sudo apt install -y libssl-dev libffi-dev zlib1g-dev ffmpeg cups
echo

echo "----------------------------------------------------------------------"
echo "           [2.10] Compilation et outils de build                      "
echo "----------------------------------------------------------------------"
sudo apt install -y build-essential autoconf automake libtool
echo

echo "----------------------------------------------------------------------"
echo "           [2.11] Debug et développement avancé                       "
echo "----------------------------------------------------------------------"
sudo apt install -y inkscape strace
echo

echo "----------------------------------------------------------------------"
echo "           [2.12] Serveur Web (Nginx pour frontend)                   "
echo "----------------------------------------------------------------------"
sudo apt install -y nginx
echo
echo

echo "----------------------------------------------------------------------"
echo "             [3/3] CLONAGE ET COMPILATION DE JBIG2ENC                "
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
echo
echo
echo
echo
cd /opt/jbig2enc
sudo ./autogen.sh
sudo ./configure
sudo make -j"$(nproc)"
sudo make install
echo
echo

echo "==================================================================="
echo "============== FIN DU SCRIPT - INSTALL_DEPENDENCIES =============="
echo "==================================================================="
echo
echo
