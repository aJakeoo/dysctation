"""Persisted user preferences (settings.json)."""

import json
import os

from paths import resource_path

DEFAULTS = {
    "silence_duration": 1.5,
}


def load_settings() -> dict:
    path = resource_path("settings.json")
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            merged = dict(DEFAULTS)
            merged.update(data)
            return merged
        except Exception:
            pass
    return dict(DEFAULTS)


def save_settings(settings: dict) -> None:
    path = resource_path("settings.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)
