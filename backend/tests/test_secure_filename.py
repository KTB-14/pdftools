# backend/tests/test_secure_filename.py
from app.utils.filename_utils import secure_filename

cases = [
    ("A&B.pdf", "a-b.pdf"),
    ("   Épreuve finale 2025.PDF", "epreuve-finale-2025.pdf"),
    ("Résumé_étude_économie.pdf", "resume-etude-economie.pdf"),
    ("📄 Important Document 2025.PDF", "important-document-2025.pdf"),
]

def test_secure_filename():
    for raw, expected in cases:
        assert secure_filename(raw) == expected
