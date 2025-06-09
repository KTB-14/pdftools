#!/bin/bash
set -euo pipefail

# Sélectionne l'environnement (dev ou prod) et copie le fichier .env adapté.

ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../environments" && pwd)"
TARGET_ENV="$ENV_DIR/../../.env"

echo
echo "==================================================================="
echo "       Sélection de l'environnement PDFTOOLS"
echo "==================================================================="
echo
echo "Veuillez choisir l'environnement de déploiement :"
echo
echo "1) Environnement DEV  —  Usage en développement local"
echo "   - API ouverte sur localhost"
echo "   - Logs en mode DEBUG"
echo "   - CORS permissif (*, tout autorisé)"
echo
echo "2) Environnement PROD —  Déploiement en production"
echo "   - API ouverte sur IP publique"
echo "   - Logs en mode WARNING"
echo "   - CORS restreint (site officiel uniquement)"
echo
read -p "Votre choix [1-2]: " choice

case "$choice" in
    1)
        cp "$ENV_DIR/.env.dev" "$TARGET_ENV"
        echo "Environnement DEV copié vers .env (ancien fichier écrasé s'il existait)."
        ;;
    2)
        cp "$ENV_DIR/.env.prod" "$TARGET_ENV"
        echo "Environnement PROD copié vers .env (ancien fichier écrasé s'il existait)."
        ;;
    *)
        echo "Choix invalide. Annulation."
        exit 1
        ;;
esac

