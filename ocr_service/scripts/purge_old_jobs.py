# /opt/Stage/ocr_service/scripts/purge_old_jobs.py
import shutil
import time
from pathlib import Path
from app.config import OCR_ROOT, JOB_TTL_SECONDS

def purge():
    now = time.time()
    for jobdir in OCR_ROOT.iterdir():
        if not jobdir.is_dir():
            continue
        status_file = jobdir / "status.json"
        if status_file.exists():
            age = now - status_file.stat().st_mtime
            if age > JOB_TTL_SECONDS:
                print(f"Deleting {jobdir} (age: {int(age/86400)} days)")
                shutil.rmtree(jobdir)

if __name__ == "__main__":
    purge()
