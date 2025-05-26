#!/bin/bash
#
# manage_pdftools.sh
# Script interactif pour installer/déployer/désinstaller les composants PDFTools
# Placez-le dans /opt ou lancez-le après avoir cloné le dépôt.

# Chemins
BASE_DIR="/opt/pdftools"
INSTALL_DIR="$BASE_DIR/install"
LOGFILE="$BASE_DIR/backend/logs/ocr.log"

# Fonction de log
to_log() {
  local message="$*"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOGFILE"
}

# Vérifie si root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Ce script doit être exécuté avec sudo."
  exit 1
fi

# Menu
while true; do
  clear
  echo "=== Gestion PDFTools ==="
  echo "1) Cloner le projet & préparer les scripts"
  echo "2) Installer dépendances système"
  echo "3) Installer dépendances Python"
  echo "4) Déployer services systemd"
  echo "5) Désinstaller services systemd"
  echo "6) Quitter"
  read -p "Choix [1-6] : " choice

  case "$choice" in
    1)
      echo "Clonage du dépôt PDFTools..."
      cd /opt || exit 1
      rm -rf pdftools
      git clone https://github.com/KTB-14/pdftools.git
      chown -R "$SUDO_USER:$SUDO_USER" pdftools
      cd "$INSTALL_DIR" || exit 1
      chmod +x *.sh
      echo "✅ Dépôt cloné et scripts préparés dans $INSTALL_DIR"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    2)
      to_log "Démarrage de l'installation des dépendances système"
      bash "$INSTALL_DIR/install_dependencies.sh"
      to_log "Fin de l'installation des dépendances système"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    3)
      to_log "Démarrage de l'installation des dépendances Python"
      bash "$INSTALL_DIR/install_python.sh"
      to_log "Fin de l'installation des dépendances Python"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    4)
      to_log "Démarrage du déploiement des services systemd"
      bash "$INSTALL_DIR/deploy_systemd.sh"
      to_log "Fin du déploiement des services systemd"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    5)
      to_log "Démarrage de la désinstallation des services systemd"
      bash "$INSTALL_DIR/uninstall_systemd.sh"
      to_log "Fin de la désinstallation des services systemd"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    6)
      to_log "Sortie du script de gestion PDFTools"
      exit 0
      ;;
    *)
      echo "❌ Option invalide."
      read -p "Appuyez sur Entrée pour réessayer..."
      ;;
  esac
done
