# PDFTools – OCR et Compression

## A PROPOS / OBJECTIFS
Application permettant l’OCR et la compression de fichiers PDF via une API FastAPI couplée à un worker Celery. Les scripts de déploiement fournissent une installation clef en main sur un serveur Linux.

## SCOPE
Destiné aux développeurs et administrateurs système souhaitant déployer ou contribuer à l’outil.

## PRÉREQUIS
- Système Linux avec `python3`, `pip`, `redis-server`, `git` et `apache2`.
- Droits sudo pour l’installation des paquets et des services systemd.

## ORGANISATION DU PROJET
- `backend/` : API FastAPI et worker Celery.
- `frontend/` : pages statiques de téléversement des PDF.
- `deploy/` : scripts shell et fichiers de configuration pour installer l’application (packages APT, services systemd, Apache).
- `requirements/` : listes de dépendances Python.
- `Global_manage_pdftools.sh` et `install_all.sh` : scripts globaux d’installation et de gestion du projet.

## INSTALLATION RAPIDE
1. Cloner le dépôt puis se placer à la racine.
2. Exécuter `sudo bash install_all.sh` pour une installation guidée (environnement, dépendances, services, Apache).
3. Utiliser `sudo bash Global_manage_pdftools.sh` pour gérer les services (démarrage, logs, purge, etc.).

## CONTRIBUTION
- Fork du projet puis création de branches thématiques.
- Respecter la structure existante et fournir des tests unitaires pour chaque nouvelle fonctionnalité.
- Les scripts de déploiement nécessitent un shell POSIX et peuvent être adaptés pour votre distribution.


