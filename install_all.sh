#!/bin/bash
set -euo pipefail

# ================================ CONFIGURATION GLOBALE ================================

# Variables globales
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/deploy/scripts"

# Fonction de log
log() {
  echo
  echo "==================================================================="
  echo "➤ $1"
  echo "==================================================================="
  echo
}

# Fonction pour demander confirmation
ask_continue() {
  read -p "Continuer avec $1 ? (y/n) : " answer
  if [[ "$answer" != "y" ]]; then
    echo "⛔️ Installation interrompue par l'utilisateur."
    exit 1
  fi
}

# ================================ SCRIPT D'INSTALLATION ================================

echo
echo "==================================================================="
echo "         INSTALLATION COMPLETE DE PDFTOOLS"
echo "==================================================================="
echo

# 0️ - Sélection de l'environnement
log "0. Sélection de l'environnement (DEV ou PROD)"
bash "$SCRIPTS_DIR/00_select_env.sh"

# 1️ - Installation des dépendances système APT
log "1. Installation des dépendances système (APT)"
bash "$SCRIPTS_DIR/01_apt.sh"

# 2️ - Installation environnement Python + venv + pip
ask_continue "installation de l'environnement Python (venv + pip)"
log "2. Installation des dépendances Python"
bash "$SCRIPTS_DIR/02_python.sh"

# 3️ - Déploiement des services systemd
ask_continue "déploiement des services systemd"
log "3. Déploiement des services systemd"
bash "$SCRIPTS_DIR/03_systemd.sh"

# 4️ - Déploiement configuration Apache
ask_continue "déploiement configuration Apache2"
log "4. Déploiement de la configuration Apache2 (Reverse Proxy)"
bash "$SCRIPTS_DIR/04_apache.sh"

echo
echo "==================================================================="
echo "✅ INSTALLATION COMPLETE TERMINEE AVEC SUCCES."
echo
