#!/bin/bash
set -euo pipefail

# Sélectionne l'environnement  prod et copie le fichier .env adapté.

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../environments" && pwd)"
TARGET_ENV="$ENV_DIR/../../.env"

echo
echo "==================================================================="
echo "       Activation de l'environnement PDFTOOLS"
echo "==================================================================="
echo "1) Environnement PROD  —  Usage en production"
echo "   - API ouverte sur localhost"
echo "   - Logs en mode WARNING"
echo
cp "$ENV_DIR/.env.prod" "$TARGET_ENV"
echo "Environnement PROD copié vers .env (ancien fichier écrasé s'il existait)."