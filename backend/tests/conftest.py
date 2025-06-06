import os
import sys
import types
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

if 'pydantic_settings' not in sys.modules:
    sys.modules['pydantic_settings'] = types.SimpleNamespace(BaseSettings=object)

if 'multipart' not in sys.modules:
    multipart_mod = types.ModuleType('multipart')
    multipart_mod.__version__ = '0'
    sub = types.ModuleType('multipart')
    sub.parse_options_header = lambda *a, **k: None
    multipart_mod.multipart = sub
    sys.modules['multipart'] = multipart_mod
    sys.modules['multipart.multipart'] = sub

from app.config import config

@pytest.fixture(autouse=True)
def patch_root(tmp_path, monkeypatch):
    """Redirige OCR_ROOT vers un dossier temporaire pour chaque test."""
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)

if 'celery' not in sys.modules:
    class DummyCelery:
        def __init__(self, *a, **k):
            pass

        def task(self, *args, **kwargs):
            def decorator(fn):
                def wrapper(job_id):
                    dummy = types.SimpleNamespace(update_state=lambda *a, **k: None)
                    return fn(dummy, job_id)

                return wrapper

            return decorator

    states = types.SimpleNamespace(FAILURE='FAILURE')

    class Ignore(Exception):
        pass

    sys.modules['celery'] = types.SimpleNamespace(Celery=DummyCelery, states=states)
    sys.modules['celery.exceptions'] = types.SimpleNamespace(Ignore=Ignore)

if 'ocrmypdf' not in sys.modules:
    ocrmypdf_mod = types.ModuleType('ocrmypdf')
    ocrmypdf_mod.ocr = lambda *a, **k: None
    exc_mod = types.ModuleType('exceptions')
    exc_mod.DigitalSignatureError = Exception
    ocrmypdf_mod.exceptions = exc_mod
    sys.modules['ocrmypdf'] = ocrmypdf_mod
    sys.modules['ocrmypdf.exceptions'] = exc_mod

if 'pikepdf' not in sys.modules:
    class DummyPDF:
        is_encrypted = False
        Root = {}

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            pass

    sys.modules['pikepdf'] = types.SimpleNamespace(
        open=lambda *a, **k: DummyPDF(),
        PasswordError=Exception,
        PdfError=Exception,
    )
