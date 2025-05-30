#!/bin/bash

echo "==================================================================="
echo "=========== DEBUT DU SCRIPT - INSTALL_PYTHON.SH ==================="
echo "==================================================================="
echo
echo

echo "----------------------------------------------------------------------"
echo "       Ce script installe les dépendances Python de PDFTools         "
echo "----------------------------------------------------------------------"
echo

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté avec sudo."
  exit 1
fi

REQUIREMENTS="/opt/pdftools/backend/requirements.txt"

echo "Chemin du fichier requirements : $REQUIREMENTS"
if [ ! -f "$REQUIREMENTS" ]; then
  echo "Erreur : fichier requirements.txt introuvable."
  exit 1
fi

echo
echo "Installation des paquets Python globaux (hors environnement virtuel)"
echo
pip3 install -r "$REQUIREMENTS" --upgrade

if [ $? -eq 0 ]; then
  echo
  echo "Les dépendances Python ont été installées avec succès."
else
  echo
  echo "Erreur lors de l'installation des dépendances Python."
  exit 1
fi

echo
echo "==================================================================="
echo "============ FIN DU SCRIPT - INSTALL_PYTHON.SH ===================="
echo "==================================================================="
