"""Shared API-key resolver for the bundled image-gen scripts.

Generic + project-independent (this is a GLOBAL skill): env var first, then the
nearest .env files. Parses .env line-by-line (no shell sourcing) so it's safe.
"""
import os
from pathlib import Path


def resolve_key(*names: str) -> str | None:
    for n in names:
        v = os.environ.get(n)
        if v:
            return v.strip()
    candidates = [
        Path.cwd() / ".env",
        Path.cwd() / ".env.local",
        Path.home() / ".env",
    ]
    for env_path in candidates:
        if not env_path.exists():
            continue
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, val = line.split("=", 1)
            if k.strip() in names:
                return val.strip().strip('"').strip("'").strip()
    return None
