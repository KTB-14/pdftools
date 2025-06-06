# deploy

## A PROPOS / OBJECTIFS
Scripts et configurations pour installer PDFTools sur un serveur Linux (packages, services systemd, Apache).

## SCOPE
Administrateurs système.

## PRÉREQUIS
- Accès root ou sudo
- Distribution Debian/Ubuntu conseillée

## CONTENU DU DOSSIER
- `apt/` : listes de paquets à installer.
- `scripts/` : scripts d’installation et de désinstallation.
- `apache/` : fichier de configuration du virtual host Apache.
- `systemd/` : unités de services et timer.
- `environments/` : exemples de fichiers `.env`.

## INSTRUCTIONS PRINCIPALES
Exécuter `sudo bash install_all.sh` à la racine pour une installation complète ou lancer les scripts de ce dossier individuellement.

## NOTES
Les chemins cibles `/etc/systemd/system` et `/etc/apache2` sont codés dans les scripts. Adapter si besoin.


