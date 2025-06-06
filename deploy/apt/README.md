# deploy/apt

## A PROPOS / OBJECTIFS
Listes de paquets APT nécessaires au fonctionnement de l’application (Python, OCR, PDF, outils divers).

## SCOPE
Administrateurs lors de l’installation sur Debian/Ubuntu.

## PRÉREQUIS
Avoir `apt` et les droits sudo.

## CONTENU DU DOSSIER
- `base.txt` : paquets de base (python3, redis, libs de compilation, etc.).
- `ocr.txt` : paquets spécifiques à la reconnaissance de texte (tesseract, libjpeg...).
- `pdf.txt` : outils supplémentaires pour la manipulation des PDF.

## INSTRUCTIONS PRINCIPALES
Utilisé par `deploy/scripts/01_apt.sh`. Les paquets peuvent être installés manuellement via `sudo xargs -a <fichier> apt install -y`.

## NOTES
Adapter les fichiers selon la distribution cible si certains packages sont absents.


