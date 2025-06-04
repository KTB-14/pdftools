#!/bin/bash

echo "==================================================================="
echo "          SCRIPT DE GESTION D'APACHE2 POUR PDFTOOLS"
echo "==================================================================="

APACHE_CONF_SRC="/opt/pdftools/install/apache2/pdftools.conf"
APACHE_CONF_DEST="/etc/apache2/sites-available/pdftools.conf"
APACHE_SYMLINK="/etc/apache2/sites-enabled/pdftools.conf"

echo
echo "1) Installer et activer Apache2 pour PDFTools"
echo "2) Désinstaller la configuration Apache2 PDFTools"
echo "3) Quitter"
echo
read -p "Choix [1-3] : " choice

case "$choice" in
  1)
    echo
    echo "----------------------------------------------------------------------"
    echo "           [1/2] INSTALLATION ET CONFIGURATION D'APACHE2              "
    echo "----------------------------------------------------------------------"

    echo "Installation de Apache2 si nécessaire..."
    sudo apt install -y apache2

    echo "Activation des modules nécessaires..."
    sudo a2enmod proxy proxy_http headers rewrite

    echo "Copie de la configuration PDFTools..."
    if [ -f "$APACHE_CONF_SRC" ]; then
      sudo cp "$APACHE_CONF_SRC" "$APACHE_CONF_DEST"
    else
      echo "Erreur : fichier introuvable à $APACHE_CONF_SRC"
      exit 1
    fi

    echo "Activation du site PDFTools..."
    sudo a2ensite pdftools.conf

    echo "Désactivation du site par défaut..."
    sudo a2dissite 000-default.conf

    echo "Test de configuration Apache..."
    sudo apache2ctl configtest || exit 1

    echo "Redémarrage d'Apache..."
    sudo systemctl restart apache2

    if command -v ufw > /dev/null; then
      echo "Ouverture du pare-feu pour Apache2..."
      sudo ufw allow 'Apache Full'
    fi

    echo
    echo "✅ Apache2 est maintenant configuré pour PDFTools à http://<IP_DU_SERVEUR>/"
    echo
    ;;

  2)
    echo
    echo "----------------------------------------------------------------------"
    echo "            [2/2] DÉSINSTALLATION DE LA CONFIGURATION APACHE2         "
    echo "----------------------------------------------------------------------"

    echo "Désactivation de la configuration PDFTools..."
    sudo a2dissite pdftools.conf

    echo "Suppression du fichier de configuration PDFTools..."
    sudo rm -f "$APACHE_CONF_DEST"

    echo "Redémarrage de Apache2..."
    sudo systemctl restart apache2

    echo
    echo "✅ Configuration PDFTools supprimée d'Apache2"
    echo
    ;;

  3)
    echo "Sortie."
    exit 0
    ;;

  *)
    echo "❌ Option invalide."
    ;;
esac
 