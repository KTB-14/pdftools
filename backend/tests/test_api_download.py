import os
import sys
import json

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import config
from app.api import download


def create_job(tmp_path, files):
    job_id = "job1"
    job_dir = tmp_path / job_id / config.OUTPUT_SUBDIR
    job_dir.mkdir(parents=True)
    for name, content in files.items():
        with (job_dir / name).open("wb") as f:
            f.write(content)
    return job_id, job_dir.parent


def test_download_single_file(tmp_path, monkeypatch):
    job_id, job_dir = create_job(tmp_path, {"a.pdf": b"data"})
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)

    resp = download.download_single_or_multiple(job_id)
    with open(tmp_path / job_id / config.OUTPUT_SUBDIR / "a.pdf", "rb") as f:
        assert f.read() == b"data"


def test_download_multiple_files(tmp_path, monkeypatch):
    job_id, job_dir = create_job(tmp_path, {"a.pdf": b"1", "b.pdf": b"2"})
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)
    with pytest.raises(Exception):
        download.download_single_or_multiple(job_id)


def test_download_by_file_id(tmp_path, monkeypatch):
    job_id, job_dir = create_job(tmp_path, {"a.pdf": b"data"})
    status_data = {"files": [{"id": "x", "original": "a.pdf", "output": "a.pdf", "final_name": "final.pdf"}]}
    with (job_dir / config.STATUS_FILENAME).open("w", encoding="utf-8") as f:
        json.dump(status_data, f)
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)

    resp = download.download_by_file_id(job_id, "x")
    with open(tmp_path / job_id / config.OUTPUT_SUBDIR / "a.pdf", "rb") as f:
        assert f.read() == b"data"


def test_download_by_file_id_missing(tmp_path, monkeypatch):
    job_id, job_dir = create_job(tmp_path, {"a.pdf": b"data"})
    status_data = {"files": []}
    with (job_dir / config.STATUS_FILENAME).open("w", encoding="utf-8") as f:
        json.dump(status_data, f)
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)

    with pytest.raises(Exception):
        download.download_by_file_id(job_id, "x")
