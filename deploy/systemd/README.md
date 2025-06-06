# deploy/systemd

## A PROPOS / OBJECTIFS
Unités systemd permettant de lancer le backend FastAPI, le worker Celery et la purge périodique.

## SCOPE
Administrateurs système.

## PRÉREQUIS
- Sudo et accès à `/etc/systemd/system`

## CONTENU DU DOSSIER
- `ocr-api.service` : lance l’API FastAPI via Uvicorn.
- `celery-ocr.service` : worker Celery pour le traitement des PDF.
- `purge-ocr.service` : exécute la purge manuelle.
- `purge-ocr.timer` : planifie la purge toutes les 30 minutes.

## INSTRUCTIONS PRINCIPALES
Copier ces fichiers dans `/etc/systemd/system` puis exécuter `systemctl daemon-reload`. Utiliser `enable --now` pour activer chaque service. Le script `deploy/scripts/03_systemd.sh` automatise cette opération.

## NOTES
Adapter les chemins dans les unités si le projet n’est pas installé dans `/opt/pdftools`.


