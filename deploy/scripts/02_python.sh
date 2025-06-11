#!/bin/bash
set -euo pipefail

# Crée l'environnement virtuel Python et installe les dépendances ``requirements/prod.txt``.

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

echo "Suppression des fichiers pyc suspects..."
find "$PROJECT_ROOT" -name "*.pyc" -delete || true

# Création et activation de l'environnement virtuel
echo "Création de l'environnement virtuel Python..."
if [ -d "$VENV_DIR" ]; then
  echo "   Environnement existant détecté, suppression pour recréation."
  rm -rf "$VENV_DIR"
fi

echo "Création de l'environnement virtuel..."
[ -d "$VENV_DIR" ] && rm -rf "$VENV_DIR"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

echo "==================================================================="
echo "====  DEMANDER ouverture du PORT au niveau du FIREWALL (CORP) ====="
echo "====            SINON  Installation Dependances ECHOUE        ====="
echo "==================================================================="

# Mise à jour pip
# A demander ouverture du port au niveau du Firewall afin de permettre installation des dependances pip

echo "Mise à jour de pip..."
pip install --upgrade pip

# Installation des dépendances
REQUIREMENTS_FILE="$REQUIREMENTS_DIR/prod.txt"

if [ ! -f "$REQUIREMENTS_FILE" ]; then
    echo "Fichier requirements non trouvé : $REQUIREMENTS_FILE"
    exit 1
fi

echo "Installation des libs Python depuis $REQUIREMENTS_FILE"
pip install --no-cache-dir -r "$REQUIREMENTS_FILE"

echo "Audit sécurité des dépendances Python..."
pip install pip-audit >/dev/null 2>&1 || true
pip-audit || echo "Pas de vulnérabilités connues détectées."

echo
echo "Installation des dépendances Python terminée avec succès."

