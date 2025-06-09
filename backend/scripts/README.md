# backend/scripts

## A PROPOS / OBJECTIFS
Scripts Python utilitaires liés à la maintenance des jobs OCR.

## SCOPE
Admins système souhaitant nettoyer régulièrement les répertoires de travail.

## PRÉREQUIS
- Exécution depuis l’environnement Python du projet.

## CONTENU DU DOSSIER
- `purge_old_jobs.py` : supprime les jobs dont la durée de vie a expiré (paramètre `JOB_TTL_SECONDS`).
- `__init__.py` : fichier vide.

## INSTRUCTIONS PRINCIPALES
`python purge_old_jobs.py` supprime les dossiers de jobs terminés au-delà de la durée configurée.

## NOTES
Peut être appelé automatiquement via le timer systemd `purge-ocr.timer`.


