#!/bin/bash
set -euo pipefail

# Aller à la racine du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "==================================================================="
echo "============ INSTALLATION ENVIRONNEMENT PYTHON ===================="
echo "==================================================================="
echo

# Définir les chemins
VENV_DIR="$PROJECT_ROOT/venv"
REQUIREMENTS_FILE="$PROJECT_ROOT/requirements/prod.txt"

# Vérifier que requirements existe
if [ ! -f "$REQUIREMENTS_FILE" ]; then
  echo "❌ Erreur : $REQUIREMENTS_FILE introuvable."
  exit 1
fi

# Créer un venv si non existant
if [ ! -d "$VENV_DIR" ]; then
    echo "➤ Création de l'environnement virtuel..."
    python3 -m venv "$VENV_DIR"
else
    echo "ℹ️ Environnement virtuel déjà existant."
fi

# Activer venv
source "$VENV_DIR/bin/activate"

# Mettre à jour pip
pip install --upgrade pip

# Installer requirements
pip install -r "$REQUIREMENTS_FILE"

echo
echo "✅ Installation Python terminée dans $VENV_DIR"
