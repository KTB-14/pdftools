# deploy/scripts

## A PROPOS / OBJECTIFS
Contient les scripts shell d’installation et de maintenance (APT, Python, systemd, Apache).

## SCOPE
Admins souhaitant automatiser le déploiement de PDFTools.

## PRÉREQUIS
- Shell POSIX
- Droits sudo

## CONTENU DU DOSSIER
- `00_select_env.sh` : choix de l’environnement (dev ou prod) et génération du fichier `.env`.
- `01_apt.sh` : installation des paquets.
- `02_python.sh` : mise en place de la venv Python et installation des requirements.
- `03_systemd.sh` : déploiement des unités systemd.
- `04_apache.sh` : configuration du virtual host Apache.
- `05_uninstall_systemd.sh` : suppression des services.
- `06_uninstall_apache.sh` : désactivation du site Apache.

## INSTRUCTIONS PRINCIPALES
Les scripts sont pensés pour être exécutés depuis `install_all.sh`. Ils peuvent toutefois être lancés individuellement avec `sudo bash <script>`.

## NOTES
Certains scripts redémarrent les services. Prévoir un accès root et vérifier le contenu du fichier `.env` avant d’exécuter.


