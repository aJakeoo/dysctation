"""macOS Accessibility permission check and prompt.

The global hotkey listener and the simulated Cmd+V paste (both in
mac_input.py) only work if Dysctation -- or, when running from source,
the terminal app launching `python main.py` -- has been granted
Accessibility access in System Settings.
"""

import subprocess

from ApplicationServices import AXIsProcessTrusted
from AppKit import NSAlert, NSAlertFirstButtonReturn

from mac_icon import mic_icon

ACCESSIBILITY_SETTINGS_URL = (
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
)


def has_accessibility_permission() -> bool:
    try:
        return bool(AXIsProcessTrusted())
    except Exception:
        return True


def show_accessibility_alert() -> None:
    """Show an alert explaining how to grant Accessibility access.

    The app keeps launching either way -- the hotkey and paste just
    won't work until access is granted.
    """
    alert = NSAlert.alloc().init()
    alert.setIcon_(mic_icon())
    alert.setMessageText_("Accessibility Access Required")
    alert.setInformativeText_(
        "Dysctation needs Accessibility access to listen for the "
        "global hotkey (Ctrl+Shift+Space) and to paste transcribed "
        "text into other apps.\n\n"
        "Open System Settings → Privacy & Security → "
        "Accessibility, then enable Dysctation. Quit and reopen "
        "Dysctation afterwards.\n\n"
        "Running from source with \"python main.py\"? Enable your "
        "terminal app (e.g. Terminal or iTerm) in that same list "
        "instead -- it's the process actually receiving key events.\n\n"
        "You can continue without this for now."
    )
    alert.addButtonWithTitle_("Open System Settings")
    alert.addButtonWithTitle_("Continue")

    response = alert.runModal()
    if response == NSAlertFirstButtonReturn:
        subprocess.run(["open", ACCESSIBILITY_SETTINGS_URL])
