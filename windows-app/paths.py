"""Shared filesystem path helpers."""

import os
import sys


def resource_path(filename: str) -> str:
    """Resolve a path next to the script, or next to the frozen exe."""
    if getattr(sys, "frozen", False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, filename)
