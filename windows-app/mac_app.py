"""macOS menu bar app, built directly on PyObjC/AppKit.

rumps wraps AppKit but assumes the process behaves like a real app
bundle; when run from a Terminal (`python main.py`) its status item
never receives clicks and the menu never opens. Talking to
NSStatusBar/NSMenu/NSAlert directly avoids that and gives full control
over the run loop, which we drive on the main thread via
NSApplication.run().
"""

import io
import threading
from typing import Callable

import objc
from AppKit import (
    NSAlert,
    NSAlertFirstButtonReturn,
    NSApplication,
    NSApplicationActivationPolicyAccessory,
    NSImage,
    NSMakeRect,
    NSMenu,
    NSMenuItem,
    NSSecureTextField,
    NSSlider,
    NSStatusBar,
    NSTextField,
    NSVariableStatusItemLength,
    NSView,
)
from Foundation import NSBundle, NSData, NSObject, NSProcessInfo, NSTimer

from env_store import write_env_value
from icon import create_icon_image
from mac_input import HotkeyListener
from mac_permissions import has_accessibility_permission, show_accessibility_alert
from settings import save_settings

IDLE_TITLE = "🎙 Idle"
LISTENING_TITLE = "🎙 Listening..."
POLL_INTERVAL = 0.2

INSTRUCTIONS_TEXT = (
    "Press Ctrl+Shift+Space to start listening -- the menu bar item "
    "will change to \"🎙 Listening...\".\n\n"
    "Speak normally. After each pause, Dysctation transcribes what you "
    "said with Groq Whisper and pastes it into whatever text field is "
    "currently focused.\n\n"
    "Press Ctrl+Shift+Space again to stop listening.\n\n"
    "Use \"Adjust pause sensitivity...\" to change how long a pause "
    "needs to be before a chunk is sent for transcription, and "
    "\"Change API key...\" to update your Groq API key."
)


def set_app_name(name: str) -> None:
    """Make the app's name read `name` instead of "Python" everywhere.

    When run from source (`python main.py`), AppKit reports the
    interpreter's bundle name -- "Python" -- as the app name in the
    menu bar, and Activity Monitor shows the process as "Python" too.
    Patching CFBundleName/CFBundleDisplayName fixes the menu bar, and
    NSProcessInfo.setProcessName_ fixes Activity Monitor, without
    needing a real .app bundle.
    """
    try:
        info = NSBundle.mainBundle().infoDictionary()
        info["CFBundleName"] = name
        info["CFBundleDisplayName"] = name
    except Exception:
        pass

    try:
        NSProcessInfo.processInfo().setProcessName_(name)
    except Exception:
        pass


def set_app_icon() -> None:
    """Replace the default Python rocket-ship icon (Force Quit, Dock,
    alert windows) with the blue mic icon used for the tray icon."""
    try:
        buffer = io.BytesIO()
        create_icon_image(False).save(buffer, format="PNG")
        data = NSData.dataWithBytes_length_(buffer.getvalue(), len(buffer.getvalue()))
        image = NSImage.alloc().initWithData_(data)
        NSApplication.sharedApplication().setApplicationIconImage_(image)
    except Exception:
        pass


def _text_alert(
    title: str,
    message: str,
    ok: str,
    cancel: str | None = None,
    default_text: str = "",
    secure: bool = False,
) -> str | None:
    """Show an alert with a single text field. Returns the entered text
    if `ok` was clicked, or None if dismissed/cancelled."""
    alert = NSAlert.alloc().init()
    alert.setMessageText_(title)
    alert.setInformativeText_(message)
    alert.addButtonWithTitle_(ok)
    if cancel is not None:
        alert.addButtonWithTitle_(cancel)

    field_cls = NSSecureTextField if secure else NSTextField
    field = field_cls.alloc().initWithFrame_(NSMakeRect(0, 0, 300, 24))
    field.setStringValue_(default_text)
    alert.setAccessoryView_(field)
    alert.window().setInitialFirstResponder_(field)

    response = alert.runModal()
    if response == NSAlertFirstButtonReturn:
        return str(field.stringValue()).strip()
    return None


class _SliderLabelUpdater(NSObject):
    """Target for an NSSlider that keeps a label in sync as it moves."""

    def sliderMoved_(self, sender) -> None:
        self._label.setStringValue_(f"Pause before send: {sender.doubleValue():.1f}s")


def _sensitivity_alert(current_value: float) -> float | None:
    """Show an alert with a slider for pause sensitivity (0.5-5.0s).

    Returns the new value if "Save" was clicked, or None otherwise.
    """
    alert = NSAlert.alloc().init()
    alert.setMessageText_("Adjust Pause Sensitivity")
    alert.setInformativeText_(
        "How long to wait in silence before sending what you said for "
        "transcription."
    )
    alert.addButtonWithTitle_("Save")
    alert.addButtonWithTitle_("Cancel")

    container = NSView.alloc().initWithFrame_(NSMakeRect(0, 0, 300, 50))

    label = NSTextField.alloc().initWithFrame_(NSMakeRect(0, 28, 300, 20))
    label.setStringValue_(f"Pause before send: {current_value:.1f}s")
    label.setEditable_(False)
    label.setBordered_(False)
    label.setDrawsBackground_(False)

    slider = NSSlider.alloc().initWithFrame_(NSMakeRect(0, 4, 300, 20))
    slider.setMinValue_(0.5)
    slider.setMaxValue_(5.0)
    slider.setDoubleValue_(current_value)

    updater = _SliderLabelUpdater.alloc().init()
    updater._label = label
    slider.setTarget_(updater)
    slider.setAction_("sliderMoved:")

    container.addSubview_(label)
    container.addSubview_(slider)
    alert.setAccessoryView_(container)

    response = alert.runModal()
    if response == NSAlertFirstButtonReturn:
        return round(slider.doubleValue(), 1)
    return None


def _info_alert(title: str, message: str) -> None:
    alert = NSAlert.alloc().init()
    alert.setMessageText_(title)
    alert.setInformativeText_(message)
    alert.addButtonWithTitle_("OK")
    alert.runModal()


class MenuBarController(NSObject):
    """Owns the NSStatusItem, its menu, and the hotkey listener."""

    @objc.python_method
    def configure(
        self,
        listening_event: threading.Event,
        settings_data: dict,
        toggle_listening: Callable[[], None],
        apply_new_api_key: Callable[[str], None],
        quit_app: Callable[[], None],
    ) -> "MenuBarController":
        self._listening = listening_event
        self._settings = settings_data
        self._toggle_listening = toggle_listening
        self._apply_new_api_key = apply_new_api_key
        self._quit_app = quit_app

        self._status_item = NSStatusBar.systemStatusBar().statusItemWithLength_(
            NSVariableStatusItemLength
        )
        self._status_item.button().setTitle_(IDLE_TITLE)

        menu = NSMenu.alloc().init()
        menu.addItem_(self._item("Toggle Listening (Ctrl+Shift+Space)", "toggleListening:"))
        menu.addItem_(NSMenuItem.separatorItem())
        menu.addItem_(self._item("Adjust pause sensitivity...", "adjustSensitivity:"))
        menu.addItem_(self._item("Change API key...", "changeApiKey:"))
        menu.addItem_(self._item("View instructions", "viewInstructions:"))
        menu.addItem_(NSMenuItem.separatorItem())
        menu.addItem_(self._item("Quit", "quitApp:"))
        self._status_item.setMenu_(menu)

        self._hotkey_listener = HotkeyListener(toggle_listening)
        self._hotkey_listener.start()

        self._timer = NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats_(
            POLL_INTERVAL, self, "pollState:", None, True
        )

        if not has_accessibility_permission():
            show_accessibility_alert()
            if has_accessibility_permission() and not self._hotkey_listener.is_trusted:
                self._hotkey_listener.restart()

        return self

    @objc.python_method
    def _item(self, title: str, action: str) -> NSMenuItem:
        item = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_(title, action, "")
        item.setTarget_(self)
        return item

    def pollState_(self, _timer) -> None:
        title = LISTENING_TITLE if self._listening.is_set() else IDLE_TITLE
        self._status_item.button().setTitle_(title)

        if not self._hotkey_listener.is_trusted and has_accessibility_permission():
            self._hotkey_listener.restart()

    def toggleListening_(self, _sender) -> None:
        self._toggle_listening()

    def adjustSensitivity_(self, _sender) -> None:
        value = _sensitivity_alert(self._settings["silence_duration"])
        if value is None:
            return
        self._settings["silence_duration"] = value
        save_settings(self._settings)

    def changeApiKey_(self, _sender) -> None:
        key = _text_alert(
            title="Change API Key",
            message="Paste a new Groq API key to replace the one currently in use.",
            ok="Save",
            cancel="Cancel",
            secure=True,
        )
        if not key:
            return

        write_env_value("GROQ_API_KEY", key)
        self._apply_new_api_key(key)

    def viewInstructions_(self, _sender) -> None:
        _info_alert("How to use Dysctation", INSTRUCTIONS_TEXT)

    def quitApp_(self, _sender) -> None:
        self._hotkey_listener.stop()
        self._quit_app()
        NSApplication.sharedApplication().terminate_(None)


# Holds the running MenuBarController -- NSMenuItem targets are
# unretained, so a garbage-collected controller would leave the menu
# with dangling targets.
_controller: MenuBarController | None = None


def run_first_run_setup_mac() -> str:
    """Prompt for a Groq API key via an NSAlert.

    Saves the key to .env and returns it. Exits the process if the
    alert is dismissed without entering a key.
    """
    set_app_name("Dysctation")
    NSApplication.sharedApplication()
    set_app_icon()

    key = _text_alert(
        title="Welcome to Dysctation",
        message=(
            "Paste your Groq API key below to get started.\n\n"
            "Get a free key at https://console.groq.com"
        ),
        ok="Save and Continue",
        cancel="Quit",
    )
    if not key:
        raise SystemExit(0)

    write_env_value("GROQ_API_KEY", key)
    return key


def run_mac_app(
    listening_event: threading.Event,
    settings_data: dict,
    toggle_listening: Callable[[], None],
    apply_new_api_key: Callable[[str], None],
    quit_app: Callable[[], None],
) -> None:
    app = NSApplication.sharedApplication()
    app.setActivationPolicy_(NSApplicationActivationPolicyAccessory)
    set_app_icon()

    # Keep a strong reference for the lifetime of the app -- NSMenuItem
    # targets are unretained, so a garbage-collected controller would
    # leave the menu with dangling targets.
    global _controller
    _controller = MenuBarController.alloc().init()
    _controller.configure(
        listening_event, settings_data, toggle_listening, apply_new_api_key, quit_app
    )

    app.activateIgnoringOtherApps_(True)
    app.run()
