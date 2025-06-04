#!/bin/bash
set -euo pipefail

# Variables globales
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/venv"
REQUIREMENTS_DIR="$PROJECT_ROOT/requirements"

echo
echo "==================================================================="
echo "============== INSTALLATION ENV PYTHON & LIBS ===================="
echo "==================================================================="
echo

# Création et activation de l'environnement virtuel
echo "➤ Création de l'environnement virtuel Python..."
if [ -d "$VENV_DIR" ]; then
  echo "    ➔ Environnement existant détecté, suppression pour recréation."
  rm -rf "$VENV_DIR"
fi

python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# Mise à jour pip
echo "➤ Mise à jour de pip..."
pip install --upgrade pip

# Installation des dépendances
REQUIREMENTS_FILE="$REQUIREMENTS_DIR/prod.txt"

if [ ! -f "$REQUIREMENTS_FILE" ]; then
    echo "❌ Fichier requirements non trouvé : $REQUIREMENTS_FILE"
    exit 1
fi

echo "➤ Installation des dépendances Python depuis $REQUIREMENTS_FILE..."
pip install -r "$REQUIREMENTS_FILE"

echo
echo "Installation des dépendances Python terminée avec succès."
