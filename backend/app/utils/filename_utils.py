"""Outils de nettoyage de noms de fichiers pour un usage serveur."""

from __future__ import annotations
import re
import unicodedata
import uuid
from pathlib import Path

# =============================== FILENAME UTILS ==============================
# Fonctions utilitaires pour garantir des noms de fichiers sûrs sur tout
# système de fichiers (ASCII uniquement, aucun espace ni accent).

SAFE_CHARS = "-_.()abcdefghijklmnopqrstuvwxyz0123456789"

def secure_filename(name: str, ext: str | None = None) -> str:
    """Nettoie un nom de fichier pour un usage serveur.

    Exemple : ``Rapport d’audit 2025.pdf`` → ``rapport-daudit-2025.pdf``.
    """
    # Séparer extension si absente
    ext = ext or Path(name).suffix.lower()
    stem = Path(name).stem

    # Normalisation unicode → ASCII
    nfkd = unicodedata.normalize("NFKD", stem)
    ascii_only = nfkd.encode("ascii", "ignore").decode()
    
    # Remplacer tout ce qui n’est pas dans SAFE_CHARS
    cleaned = "".join(c if c in SAFE_CHARS else "-" for c in ascii_only.lower())
    cleaned = re.sub(r"-{2,}", "-", cleaned).strip("-")  # compact
    if not cleaned:
        cleaned = uuid.uuid4().hex[:8]  # fallback

    return f"{cleaned}{ext}"

