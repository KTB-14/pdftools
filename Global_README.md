# PDFTools – Guide de démarrage rapide (DEV)

Ce projet peut être installé et configuré en une seule commande, en utilisant le script interactif `Global_manage_pdftools.sh`.

---

## 🚀 Installation complète

### 1. Copier le script de gestion

Sur la machine cible, placez ce fichier :

Global_manage_pdftools.sh

Puis :

chmod +x Global_manage_pdftools.sh
sudo ./Global_manage_pdftools.sh

Menu interactif
Le script vous guidera avec ce menu :
=== GESTION PDFTOOLS ===
1) Cloner et préparer le dépôt Git
2) Installer les dépendances système
3) Installer les dépendances Python
4) Déployer les services systemd
5) Désinstaller les services systemd
6) Vérifier les services et tester l’API
7) Quitter

🔍 Vérifications manuelles (facultatives)
# Vérifier les services
sudo systemctl status ocr-api.service
sudo systemctl status celery-ocr.service
sudo systemctl list-timers --all | grep purge-ocr

# Tester l'API
curl http://localhost:8000
# ou depuis un client
curl http://<IP_DU_SERVEUR>:8000

# Désinstallation
sudo ./manage_pdftools.sh  → Option 5

# Remarque :
Le script peut être utilisé sur une machine vide, il gère tout automatiquement (clonage, installation, déploiement).



#================================================================
#================================================================
#                   Global_manage_pdftools.sh
#================================================================
#================================================================

#!/bin/bash
#
# manage_pdftools.sh — Script interactif de gestion PDFTools

LOGFILE="/opt/pdftools/backend/logs/ocr.log"

# Fonction de log
to_log() {
  local message="$*"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOGFILE"
}

# Vérifie si root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Ce script doit être exécuté avec sudo."
  exit 1
fi

# Menu principal
while true; do
  clear
  echo "=== GESTION PDFTOOLS ==="
  echo "1) Cloner et préparer le dépôt Git"
  echo "2) Installer les dépendances système"
  echo "3) Installer les dépendances Python"
  echo "4) Déployer les services systemd"
  echo "5) Désinstaller les services systemd"
  echo "6) Vérifier les services et tester l’API"
  echo "7) Quitter"
  echo "========================="
  read -p "Choix [1-7] : " choice

  case "$choice" in
    1)
      echo "=== Clonage du dépôt Git ==="
      cd /opt || exit
      if [ -d "/opt/pdftools" ]; then
        echo "📁 Le dossier /opt/pdftools existe déjà. Suppression..."
        rm -rf /opt/pdftools
      fi
      git clone https://github.com/KTB-14/pdftools.git
      chown -R "$USER:$USER" /opt/pdftools
      cd /opt/pdftools/install || exit
      chmod +x *.sh
      echo -e "\n✅ Dépôt cloné et scripts prêts."
      echo "ℹ️ Vous pouvez maintenant exécuter ce script depuis /opt/pdftools/install/"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    2)
      to_log "🔧 Installation des dépendances système"
      bash /opt/pdftools/install/install_dependencies.sh
      to_log "✅ Dépendances système installées"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    3)
      to_log "📦 Installation des dépendances Python"
      bash /opt/pdftools/install/install_python.sh
      to_log "✅ Dépendances Python installées"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    4)
      to_log "🚀 Déploiement des services systemd"
      bash /opt/pdftools/install/deploy_systemd.sh
      to_log "✅ Services systemd déployés"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    5)
      to_log "🧹 Désinstallation des services systemd"
      bash /opt/pdftools/install/uninstall_systemd.sh
      to_log "✅ Services systemd désinstallés"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    6)
      echo "=== État des services ==="
      systemctl status ocr-api.service --no-pager
      systemctl status celery-ocr.service --no-pager
      systemctl list-timers --all | grep purge-ocr || echo "(timer non actif)"
      echo -e "\n=== Test API (local) ==="
      curl -s http://localhost:8000 && echo -e "\n✅ API répond"
      echo "Ou test distant : curl http://<IP_DU_SERVEUR>:8000"
      read -p "Appuyez sur Entrée pour continuer..."
      ;;
    7)
      echo "👋 Fin du script. À bientôt."
      exit 0
      ;;
    *)
      echo "❌ Option invalide."
      read -p "Appuyez sur Entrée pour réessayer..."
      ;;
  esac
done
