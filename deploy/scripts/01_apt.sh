#!/bin/bash
set -euo pipefail

# Aller à la racine du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "==================================================================="
echo "============== INSTALLATION DES DÉPENDANCES APT ==================="
echo "==================================================================="
echo

# Mise à jour système
echo "➤ Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# Lecture des paquets APT depuis les fichiers .txt
for list in deploy/apt/*.txt; do
    echo "➤ Installation des paquets listés dans : $list"
    while read -r pkg; do
        # Ignorer lignes vides ou lignes commentaires
        if [[ -n "$pkg" && ! "$pkg" =~ ^# ]]; then
            echo "    ➔ Installation : $pkg"
            sudo apt install -y "$pkg"
        fi
    done < "$list"
done

echo
echo "✅ Installation complète des dépendances APT terminée."