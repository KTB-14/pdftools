#!/bin/bash
echo "========================================================"
echo "=========== DEBUT SCRIPT - INSTALL_PYTHON.SH ==========="
echo "========================================================"

echo "=== Installation des dépendances Python pour PDFTools ==="

# Vérifie si le script est lancé en root (obligatoire pour une install globale)
if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté avec sudo (en tant que root)."
  exit 1
fi

REQUIREMENTS="/opt/pdftools/backend/requirements.txt"

if [ ! -f "$REQUIREMENTS" ]; then
  echo "Fichier requirements.txt introuvable à l'emplacement : $REQUIREMENTS"
  exit 1
fi

# Installation des paquets Python globalement (hors venv)
pip3 install -r "$REQUIREMENTS" --upgrade

if [ $? -eq 0 ]; then
  echo "✅ Dépendances Python installées avec succès."
else
  echo "❌ Une erreur est survenue lors de l'installation des dépendances."
  exit 1
fi

echo "========================================================"
echo "============ FIN SCRIPT - INSTALL_PYTHON.SH ============"
echo "========================================================"