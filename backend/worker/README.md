# backend/worker

## A PROPOS / OBJECTIFS
Contient la configuration Celery pour exécuter les tâches d’OCR en arrière-plan.

## SCOPE
Admins ou développeurs déployant le worker.

## PRÉREQUIS
- Redis lancé et accessible
- Environnement Python avec les packages de `requirements/base.txt`

## CONTENU DU DOSSIER
- `tasks.py` : déclaration des tâches Celery et logique de gestion d’état.
- `__init__.py` : charge Celery.

## INSTRUCTIONS PRINCIPALES
Lancer `celery -A worker.tasks worker --loglevel=INFO` depuis `backend/`. Les variables broker/backends sont dans `app/config.py`.

## NOTES
Les logs des tâches sont redirigés via Loguru dans `backend/logs/ocr.log`.


