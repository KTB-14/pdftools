# PDFTools — Plateforme OCR & Compression de PDF

**PDFTools** est une application Web simple et modulaire permettant aux utilisateurs de téléverser des fichiers PDF et d’obtenir une version optimisée grâce à l’OCR et à la compression (via `ocrmypdf`). Le système est extensible à d'autres services PDF.

## Fonctionnalités actuelles

- Téléversement de plusieurs fichiers PDF
- Traitement asynchrone (via Celery)
- OCR + compression automatique (`ocrmypdf`)
- Archivage au format ZIP des résultats
- Suivi du statut du job en temps réel
- Interface Web HTML simple

## Technologies

- **FastAPI** (backend REST)
- **Celery** (worker OCR)
- **Redis** (queue + backend)
- **ocrmypdf** (OCR & compression PDF)
- **Uvicorn** (serveur ASGI)
- **HTML/JavaScript** (frontend simple)
