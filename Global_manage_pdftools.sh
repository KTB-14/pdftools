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
