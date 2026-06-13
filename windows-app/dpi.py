"""Shared DPI-awareness helpers for Tk windows.

Call enable() once, as early as possible (before any Tk window is
created), so Windows renders windows at native resolution instead of
bitmap-scaling them -- the latter is what causes blurry text/icons.

These are no-ops on macOS, which doesn't need (or have) this API --
Tk already renders at native resolution on Retina displays.
"""

import sys

_enabled = False


def enable() -> None:
    global _enabled
    if _enabled:
        return
    _enabled = True
    if sys.platform != "win32":
        return

    import ctypes

    try:
        try:
            ctypes.windll.shcore.SetProcessDpiAwareness(2)  # per-monitor
        except (AttributeError, OSError):
            ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass


def scale() -> float:
    """Return the primary monitor's display scale factor (1.0 = 100%)."""
    if sys.platform != "win32":
        return 1.0

    import ctypes

    try:
        factor = ctypes.windll.shcore.GetScaleFactorForDevice(0)
        if factor > 0:
            return factor / 100.0
    except Exception:
        pass
    return 1.0
