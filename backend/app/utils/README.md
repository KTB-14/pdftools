# backend/app/utils

## A PROPOS / OBJECTIFS
Fonctions utilitaires utilisées par l’API et le worker.

## SCOPE
Développeurs Python.

## PRÉREQUIS
Aucun en dehors des dépendances Python de base du projet.

## CONTENU DU DOSSIER
- `filename_utils.py` : nettoyage et sécurisation des noms de fichiers uploadés.
- `id_generator.py` : création d’identifiants de jobs horodatés.
- `__init__.py` : expose les fonctions du module.

## INSTRUCTIONS PRINCIPALES
Importer les fonctions depuis `app.utils` pour garantir une résolution correcte des modules.

## NOTES
Le nettoyage de nom de fichier suit la convention ASCII et remplace les caractères non sûrs.


