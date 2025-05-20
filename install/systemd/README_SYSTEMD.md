# Déploiement et suppression des services systemd

## Déploiement

1. Aller à la racine du projet :
cd /opt/pdftools

2. Rendre le script exécutable :
chmod +x install/systemd/deploy_systemd.sh

3. Lancer le script avec les droits administrateur :
sudo install/systemd/deploy_systemd.sh


Cela copie et active les services suivants :
    purge-ocr.timer
    ocr-api.service
    celery-ocr.service
    purge-ocr.timer


## Suppression

1. Rendre le script exécutable :
chmod +x install/systemd/uninstall_systemd.sh

2. Lancer le script avec les droits administrateur :
sudo install/systemd/uninstall_systemd.sh


Cela désactive et supprime les fichiers systemd liés au projet.