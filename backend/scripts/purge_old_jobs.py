import shutil
import time
from pathlib import Path
from app.config import config
from app.logger import logger

def purge():
    now = time.time()
    logger.info("🧹 Lancement de la purge des anciens jobs...")
    
    deleted = 0
    for jobdir in config.OCR_ROOT.iterdir():
        if not jobdir.is_dir():
            continue

        status_file = jobdir / config.STATUS_FILENAME
        if status_file.exists():
            age = now - status_file.stat().st_mtime
            if age > config.JOB_TTL_SECONDS:
                try:
                    shutil.rmtree(jobdir)
                    logger.info(f"🗑️ Job supprimé : {jobdir.name} (âge : {int(age/3600)} h)")
                    deleted += 1
                except Exception as e:
                    logger.exception(f"❌ Erreur suppression du dossier {jobdir}: {e}")

    logger.info(f"✅ Purge terminée — {deleted} job(s) supprimé(s)")

if __name__ == "__main__":
    purge()
