import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import config
from scripts import purge_old_jobs


def test_purge(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)
    monkeypatch.setattr(config, "JOB_TTL_SECONDS", 1)

    old_job = tmp_path / "old"
    new_job = tmp_path / "new"
    old_job.mkdir()
    new_job.mkdir()

    status = config.STATUS_FILENAME
    (old_job / status).write_text("{}")
    (new_job / status).write_text("{}")

    past = time.time() - 3600
    os.utime(old_job / status, (past, past))

    purge_old_jobs.purge()
    assert not old_job.exists()
    assert new_job.exists()
