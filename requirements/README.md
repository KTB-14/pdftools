# requirements

## A PROPOS / OBJECTIFS
Fichiers listant les dépendances Python du projet.

## SCOPE
Développeurs et administrateurs installant l’environnement.

## PRÉREQUIS
Python 3.11 et `pip`.

## CONTENU DU DOSSIER
- `base.txt` : dépendances communes à tous les environnements.
- `dev.txt` : packages additionnels pour le développement et les tests.
- `prod.txt` : référence vers `base.txt` (minimal en production).

## INSTRUCTIONS PRINCIPALES
Depuis la racine, `python -m venv venv && source venv/bin/activate` puis `pip install -r requirements/dev.txt` pour un environnement complet.

## NOTES
Les scripts d’installation utilisent ces fichiers pour configurer la venv automatiquement.


