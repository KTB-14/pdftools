import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import config
from app.services.ocr import ocr_service


class DummyPDF:
    is_encrypted = False
    Root = {}
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        pass


def test_write_status(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)
    svc = ocr_service.OCRService("job")
    svc._write_status("done", "ok", [])
    content = (tmp_path / "job" / config.STATUS_FILENAME).read_text()
    assert "\"status\": \"done\"" in content


def test_process_ok(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)
    input_dir = tmp_path / "job" / config.INPUT_SUBDIR
    input_dir.mkdir(parents=True)
    pdf_path = input_dir / "f.pdf"
    pdf_path.write_bytes(b"data")

    monkeypatch.setattr(os.path, "getsize", lambda p: 10)
    monkeypatch.setattr(ocr_service.pikepdf, "open", lambda *a, **k: DummyPDF())
    monkeypatch.setattr(ocr_service.ocrmypdf, "ocr", lambda *a, **k: None)

    svc = ocr_service.OCRService("job")
    svc.process()
    status_file = tmp_path / "job" / config.STATUS_FILENAME
    assert status_file.exists()

