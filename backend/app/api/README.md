# backend/app/api

## A PROPOS / OBJECTIFS
Expose les endpoints FastAPI permettant de téléverser des PDF, suivre le statut et récupérer les fichiers traités.

## SCOPE
Développeurs ou intégrateurs d’API.

## PRÉREQUIS
Avoir l’application à la racine du projet et l’environnement Python préparé.

## CONTENU DU DOSSIER
- `upload.py` : enregistrement des fichiers et lancement de la tâche Celery.
- `status.py` : consultation de l’état d’un job.
- `download.py` : récupération des fichiers compressés.
- `__init__.py` : définition du router principal.
 
## INSTRUCTIONS PRINCIPALES
Les routes sont incluses via `app.include_router` dans `main.py`. Chaque route retourne des modèles Pydantic définis dans `../models`.

## NOTES
Vérifier les droits d’écriture sur le dossier `data/jobs` pour que l’upload fonctionne.


