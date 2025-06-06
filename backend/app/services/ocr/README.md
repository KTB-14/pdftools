# backend/app/services/ocr

## A PROPOS / OBJECTIFS
Composants réalisant l’OCR et la compression des PDF.

## SCOPE
Développeurs souhaitant ajuster le traitement des fichiers.

## PRÉREQUIS
- `ocrmypdf` et `pikepdf` présents dans l’environnement Python.
- Accès à `tesseract-ocr` via les packages APT.

## CONTENU DU DOSSIER
- `ocr_service.py` : classe principale assurant l’analyse des PDF et la génération des résultats.
- `__init__.py` : init du module.

## INSTRUCTIONS PRINCIPALES
Instancier `OCRService(job_id)` puis appeler `process()` pour lancer le traitement. Les fichiers d’entrée/sortie se trouvent dans `data/jobs/<job_id>/`.

## NOTES
Le service gère la détection des erreurs courantes : PDF protégé par mot de passe, taille trop importante, signatures numériques, etc.


