import sys
import os

# Ajoute le chemin parent à PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.filename_utils import secure_filename

def test_secure_filename_basic():
    assert secure_filename("Rapport & Synthèse 2025.pdf") == "rapport-synthese-2025.pdf"
    assert secure_filename("Épreuve finale.PDF") == "epreuve-finale.pdf"
    assert secure_filename("Super document final (version 2).pdf") == "super-document-final-(version-2).pdf"


def test_secure_filename_empty():
    name = secure_filename("")
    # Un nom vide doit être remplacé par un identifiant aléatoire
    assert name
    assert "." not in name  # pas d'extension par défaut

