"""Read/write simple KEY=VALUE lines in the .env file."""

import os

from paths import resource_path


def write_env_value(key: str, value: str) -> None:
    """Set key=value in .env, preserving other lines. Creates the file if missing."""
    path = resource_path(".env")
    lines: list[str] = []
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            lines = f.readlines()

    new_line = f"{key}={value}\n"
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[i] = new_line
            break
    else:
        if lines and not lines[-1].endswith("\n"):
            lines[-1] += "\n"
        lines.append(new_line)

    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)
