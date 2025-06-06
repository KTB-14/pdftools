# backend

## A PROPOS / OBJECTIFS
Implémente l’API FastAPI ainsi que le worker Celery pour l’OCR et la compression de PDF.

## SCOPE
Utilisé par les développeurs backend et par les administrateurs lors du déploiement.

## PRÉREQUIS
- Python 3.11 ou plus
- Redis en service pour Celery

## CONTENU DU DOSSIER
- `app/` : code de l’application (routes, services, utils).
- `scripts/` : utilitaires administratifs (purge des anciens jobs).
- `tests/` : tests unitaires.
- `worker/` : définition des tâches Celery.
- `logs/` : destination des logs d’exécution.

## INSTRUCTIONS PRINCIPALES
- Lancer l’API : `uvicorn app.main:app --reload` depuis ce dossier (appli dev).
- Exécuter un worker : `celery -A worker.tasks worker --loglevel=INFO`.
- Purger les anciens jobs : `python scripts/purge_old_jobs.py`.

## NOTES
Les chemins des dossiers (données, frontend) sont configurés dans `app/config.py`. Adapter la variable `CELERY_BROKER_URL` si Redis n’est pas local.


