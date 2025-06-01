#!/bin/bash
#
# manage_pdftools.sh — Script interactif de gestion PDFTools

LOGFILE="/opt/pdftools/backend/logs/ocr.log"

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

# Menu principal
while true; do
  clear
  echo "==================================================================="
  echo "         SCRIPT GLOBAL DE GESTION DU PROJET PDFTOOLS"
  echo "==================================================================="
  echo
  echo "====================== INSTALLATION & PRÉPARATION ======================"
  echo " 1) Cloner et préparer le dépôt PDFTools"
  echo " 2) Installer les dépendances système (OCR, PDF, ...)"
  echo " 3) Installer les dépendances Python (bibliothèques, ...) "
  echo " 4) Installer ou désinstaller la configuration Apache2 uniquement"
  echo
  echo "=========== GESTION DES SERVICES (ocr-api, celery, purge OCR)==========="
  echo " 5) Déployer les services systemd"
  echo " 6) Désinstaller les services systemd"
  echo " 7) Vérifier les services"
  echo " 8) Redémarrer tous les services"
  echo
  echo "==================== SUPERVISION & MAINTENANCE ======================"
  echo " 9) Voir les logs du backend (50 dernières lignes)"
  echo "10) Purger les jobs expirés manuellement"
  echo "11) Supprimer tous les jobs OCR"
  echo "12) Lancer un test API"
  echo
  echo "============================= QUITTER =============================="
  echo "13) Quitter"
  echo
  read -p "Choix [1-13] : " choice 

  case "$choice" in
    1)
      to_log "Clonage du dépôt PDFTools"
      cd /opt || exit
      sudo rm -rf pdftools
      sudo git clone https://github.com/KTB-14/pdftools.git
      sudo chown -R "$USER:$USER" /opt/pdftools
      chmod +x /opt/pdftools/install/*.sh
      echo "✅ Dépôt cloné."
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    2)
      to_log "Installation des dépendances système"
      bash /opt/pdftools/install/install_dependencies.sh
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    3)
      to_log "Installation des dépendances Python"
      bash /opt/pdftools/install/install_python.sh
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    4)
      to_log "Configuration Apache2 (install/désinstall)"
      if [ -f "/opt/pdftools/install/apache2_install.sh" ]; then
        bash /opt/pdftools/install/apache2_install.sh
      else
        echo "Erreur : /opt/pdftools/install/apache2_install.sh introuvable"
      fi
      read -p "Appuyez sur Entrée pour continuer..."
      ;;

    5)
      to_log "Déploiement des services systemd"
      bash /opt/pdftools/install/deploy_systemd.sh
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    6)
      to_log "Suppression des services systemd"
      bash /opt/pdftools/install/uninstall_systemd.sh
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    7)
      to_log "Vérification des services systemd"
      systemctl status ocr-api.service --no-pager
      systemctl status celery-ocr.service --no-pager
      systemctl list-timers --all | grep purge-ocr || echo "(timer non actif)"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    8)
      to_log "Redémarrage des services FastAPI et Celery"
      sudo systemctl restart ocr-api.service
      sudo systemctl restart celery-ocr.service
      echo "✅ Services redémarrés."
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    9)
      to_log "Affichage des logs du backend"
      tail -n 50 /opt/pdftools/backend/logs/ocr.log
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    10)
      to_log "Purge manuelle des jobs expirés"
      python3 /opt/pdftools/backend/scripts/purge_old_jobs.py
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    11)
      to_log "Suppression de tous les jobs OCR"
      rm -rf /opt/pdftools/data/jobs/*
      echo "✅ Tous les jobs supprimés."
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    12)
      to_log "Test API FastAPI"
      curl -s http://localhost/api/
      echo
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    13)
      to_log "Sortie du script"
      echo "-------------------"
      exit 0
      ;;
    *)
      echo "❌ Option invalide."
      read -p "Appuyez sur Entrée pour réessayer..."
      ;;
  esac
done
do clear