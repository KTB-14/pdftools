# Définir les chemins
PROJECT_ROOT := $(shell pwd)
DEPLOY_SCRIPTS := $(PROJECT_ROOT)/deploy/scripts
VENV_DIR := $(PROJECT_ROOT)/venv

# 🛠️ INSTALLATION
install:
	@echo "\n=== 1. Installation des dépendances système (APT) ===\n"
	bash $(DEPLOY_SCRIPTS)/01_apt.sh

python:
	@echo "\n=== 2. Installation de l'environnement Python (venv + pip) ===\n"
	bash $(DEPLOY_SCRIPTS)/02_python.sh

systemd:
	@echo "\n=== 3. Déploiement des services systemd ===\n"
	bash $(DEPLOY_SCRIPTS)/03_systemd.sh

apache:
	@echo "\n=== 4. Déploiement de la configuration Apache2 ===\n"
	bash $(DEPLOY_SCRIPTS)/04_apache.sh

# 🛑 DESTRUCT
uninstall-services:
	@echo "\n=== Désinstallation des services systemd ===\n"
	bash $(DEPLOY_SCRIPTS)/05_uninstall_systemd.sh

uninstall-apache:
	@echo "\n=== Désinstallation de la configuration Apache ===\n"
	bash $(DEPLOY_SCRIPTS)/06_uninstall_apache.sh

# 🚀 DÉMARRER / STOPPER SERVICES
start:
	@echo "\n=== Démarrage des services OCR API et Celery ===\n"
	sudo systemctl start ocr-api.service
	sudo systemctl start celery-ocr.service
	sudo systemctl start purge-ocr.timer

stop:
	@echo "\n=== Arrêt des services OCR API et Celery ===\n"
	sudo systemctl stop ocr-api.service
	sudo systemctl stop celery-ocr.service
	sudo systemctl stop purge-ocr.timer

restart:
	@echo "\n=== Redémarrage des services OCR API et Celery ===\n"
	sudo systemctl restart ocr-api.service
	sudo systemctl restart celery-ocr.service

# 🧹 MAINTENANCE
logs:
	@echo "\n=== Derniers logs backend OCR ===\n"
	tail -n 50 $(PROJECT_ROOT)/backend/logs/ocr.log

purge:
	@echo "\n=== Purge manuelle des jobs expirés ===\n"
	$(VENV_DIR)/bin/python3 $(PROJECT_ROOT)/backend/scripts/purge_old_jobs.py

clean:
	@echo "\n=== Suppression de tous les jobs OCR ===\n"
	rm -rf $(PROJECT_ROOT)/data/jobs/*

# ✅ INSTALLATION RAPIDE (tout enchaîner)
full-install: install python systemd apache

# ℹ️ HELP
help:
	@echo "\nCommandes disponibles :"
	@echo "  make install            # Installer dépendances APT"
	@echo "  make python             # Installer dépendances Python (venv)"
	@echo "  make systemd            # Déployer services systemd"
	@echo "  make apache             # Déployer configuration Apache2"
	@echo "  make uninstall-services # Désinstaller services systemd"
	@echo "  make uninstall-apache   # Désinstaller configuration Apache"
	@echo "  make start              # Démarrer les services"
	@echo "  make stop               # Stopper les services"
	@echo "  make restart            # Redémarrer les services"
	@echo "  make logs               # Voir les logs du backend"
	@echo "  make purge              # Purger les jobs expirés"
	@echo "  make clean              # Supprimer tous les jobs OCR"
	@echo "  make full-install       # Tout installer rapidement (APT + Python + systemd + Apache)"
