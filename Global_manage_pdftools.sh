#!/bin/bash

# ================================ CONFIG GLOBAL ================================

# Script interactif pour installer et gérer les différents composants de
# PDFTools (dépendances APT, venv Python, services systemd et Apache).

# Variables globales
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/venv"
LOGFILE="$BACKEND_DIR/logs/ocr.log"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Trap sur erreurs
trap 'echo -e "${RED}Une erreur est survenue. Abandon.${NC}"; exit 1' ERR

# Fonction de log avec timestamp
to_log() {
  local message="$*"
  echo -e "[\033[0;36m$(date '+%Y-%m-%d %H:%M:%S')\033[0m] $message" | tee -a "$LOGFILE"
}

# ================================ FONCTIONS ===================================
# Chaque fonction appelle un script dédié situé dans ``deploy/scripts``.


if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté avec sudo."
  exit 1
fi

# ================================ VÉRIFICATION PRÉREQUIS ================================

check_prerequisites() {
  echo -e "${BLUE}Vérification des prérequis...${NC}"

  for cmd in python3 pip3 apache2ctl systemctl; do
      if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Prérequis manquant : $cmd n'est pas installé.${NC}"
        exit 1
      fi
  done

  echo -e "${GREEN}Prérequis OK.${NC}"
}

# ================================ MENU PRINCIPAL ================================

show_menu() {
  # Affiche le menu principal dans le terminal
  clear
  echo "==================================================================="
  echo "         SCRIPT GLOBAL DE GESTION DU PROJET PDFTOOLS"
  echo "==================================================================="
  echo
  echo "====================== INSTALLATION & PRÉPARATION ======================"
  echo " 0) Sélectionner l'environnement (DEV / PROD)"
  echo " 1) Installer les dépendances système (APT)"
  echo " 2) Installer les dépendances Python (venv + pip)"
  echo " 3) Installer/Configurer Apache2 (reverse proxy)"
  echo " 4) Désinstaller la config Apache2 "
  echo
  echo "=========== GESTION DES SERVICES (ocr-api, celery, purge OCR)==========="
  echo " 5) Déployer les services systemd"
  echo " 6) Désinstaller les services systemd"
  echo " 7) Vérifier l'état des services"
  echo " 8) Redémarrer les services"
  echo " 9) Stopper tous les services"
  echo
  echo "==================== SUPERVISION & MAINTENANCE ======================"
  echo " 10) Voir les derniers logs du backend (50 lignes)"
  echo "11) Purger manuellement les jobs expirés"
  echo "12) Supprimer tous les jobs OCR"
  echo
  echo "============================= QUITTER =============================="
  echo "13) Quitter"
  echo
}

# ================================ ACTIONS ================================

select_env() {
  to_log "Selection de l'environnement prod"
  bash "$PROJECT_ROOT/deploy/scripts/00_select_env.sh"
}

install_apt() {
  to_log "Installation des dépendances système APT"
  bash "$PROJECT_ROOT/deploy/scripts/01_apt.sh"
}

install_python() {
  to_log "Installation des dépendances Python"
  bash "$PROJECT_ROOT/deploy/scripts/02_python.sh"
}

install_apache() {
  to_log "Installation/Configuration Apache2"
  bash "$PROJECT_ROOT/deploy/scripts/04_apache.sh"
}

uninstall_apache() {
  to_log "Désinstallation de la config Apache"
  bash "$PROJECT_ROOT/deploy/scripts/06_uninstall_apache.sh"
}

deploy_services() {
  to_log "Déploiement des services systemd"
  bash "$PROJECT_ROOT/deploy/scripts/03_systemd.sh"
}

uninstall_services() {
  to_log "Désinstallation des services systemd"
  bash "$PROJECT_ROOT/deploy/scripts/05_uninstall_systemd.sh"
}

check_services() {
  to_log "Vérification de l'état des services"
  systemctl status ocr-api.service --no-pager || echo -e "${RED}ocr-api.service non actif${NC}"
  systemctl status celery-ocr.service --no-pager || echo -e "${RED}celery-ocr.service non actif${NC}"
  systemctl list-timers --all | grep purge-ocr || echo -e "${RED}purge-ocr.timer non actif${NC}"
}

restart_services() {
  to_log "Redémarrage des services FastAPI et Celery"
  sudo systemctl restart ocr-api.service
  sudo systemctl restart celery-ocr.service
  sudo systemctl restart purge-ocr.timer
  echo -e "${GREEN}Services redémarrés.${NC}"
}

stop_services() {
  to_log "Arrêt des services FastAPI, Celery et purge"
  sudo systemctl stop ocr-api.service
  sudo systemctl stop celery-ocr.service
  sudo systemctl stop purge-ocr.timer
  # Stop processes Uvicorn & Celery en brut si besoin
  sudo pkill -f "uvicorn" || true
  sudo pkill -f "celery" || true
  echo -e "${GREEN}Tous les services et processus arrêtés.${NC}"
}

show_logs() {
  to_log "Affichage des logs du backend"
  tail -n 50 "$LOGFILE"
}

purge_jobs() {
  to_log "Purge manuelle des jobs expirés"
  source "$VENV_DIR/bin/activate"
  python "$BACKEND_DIR/scripts/purge_old_jobs.py"
}

delete_all_jobs() {
  to_log "Suppression de tous les jobs OCR"
  rm -rf "$PROJECT_ROOT/data/jobs/*"
  echo -e "${GREEN}Tous les jobs supprimés.${NC}"
}

# ================================ BOUCLE MENU ================================

check_prerequisites

while true; do
  show_menu
  read -p "Choix [0-13] : " choice

  case "$choice" in
    0) select_env; read -p "Appuyez sur Entrée pour continuer..." ;;
    1) install_apt; read -p "Appuyez sur Entrée pour continuer..." ;;
    2) install_python; read -p "Appuyez sur Entrée pour continuer..." ;;
    3) install_apache; read -p "Appuyez sur Entrée pour continuer..." ;;
    4) uninstall_apache; read -p "Appuyez sur Entrée pour continuer..." ;;
    5) deploy_services; read -p "Appuyez sur Entrée pour continuer..." ;;
    6) uninstall_services; read -p "Appuyez sur Entrée pour continuer..." ;;
    7) check_services; read -p "Appuyez sur Entrée pour continuer..." ;;
    8) restart_services; read -p "Appuyez sur Entrée pour continuer..." ;;
    9) stop_services; read -p "Appuyez sur Entrée pour continuer..." ;;
    10) show_logs; read -p "Appuyez sur Entrée pour continuer..." ;;
    11) purge_jobs; read -p "Appuyez sur Entrée pour continuer..." ;;
    12) delete_all_jobs; read -p "Appuyez sur Entrée pour continuer..." ;;
    13) echo -e "${BLUE}Bye !${NC}"; exit 0 ;;
    *) echo -e "${RED}Option invalide.${NC}"; read -p "Appuyez sur Entrée pour réessayer..." ;;
  esac
done

