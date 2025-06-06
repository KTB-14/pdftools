# backend/app

## A PROPOS / OBJECTIFS
Cœur de l’application FastAPI : configuration, routes API, services et utilitaires.

## SCOPE
Développeurs Python souhaitant modifier l’API ou les traitements OCR.

## PRÉREQUIS
- Activation de l’environnement virtuel Python
- Variables d’environnement dans `.env` si nécessaire

## CONTENU DU DOSSIER
- `main.py` : point d’entrée FastAPI.
- `config.py` : paramètres généraux (chemins, ports, Redis).
- `api/` : routes HTTP (upload, statut, téléchargement).
- `services/` : logique métier, notamment `ocr_service.py`.
- `utils/` : fonctions d’aide (génération d’ID, sécurisation de noms de fichiers).
- `models/` : modèles Pydantic pour la réponse API.
- `logger.py` : configuration Loguru.

## INSTRUCTIONS PRINCIPALES
Lancer directement `uvicorn app.main:app` pour exposer l’API. Les chemins par défaut pointent vers `../data/jobs` pour stocker les traitements.

## NOTES
Les fichiers de log sont écrits dans `../logs/ocr.log`. Veiller à créer ce dossier avec les droits adéquats.


