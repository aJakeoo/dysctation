"""Generate icon.ico (multi-resolution app icon) for PyInstaller.

Run before packaging so dist/Dysctation.exe gets a proper icon in
Explorer and the taskbar. build.bat runs this automatically.
"""

from icon import create_icon_image
from paths import resource_path

SIZES = (16, 32, 48, 256)


def main() -> None:
    base = create_icon_image(False, size=256)
    out_path = resource_path("icon.ico")
    base.save(out_path, format="ICO", sizes=[(s, s) for s in SIZES])
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
