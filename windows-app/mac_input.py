"""macOS input helpers: global hotkey and clipboard paste.

The `keyboard` package used on Windows requires root on macOS and won't
reliably see global key events. `pynput` works without root as long as
the app has Accessibility permission (see mac_permissions.py).
"""

import logging

from pynput import keyboard as _pynput_keyboard

logging.basicConfig(level=logging.WARNING)

_HOTKEY_COMBO = {
    _pynput_keyboard.Key.ctrl,
    _pynput_keyboard.Key.shift,
    _pynput_keyboard.Key.space,
}

_MODIFIER_ALIASES = {
    _pynput_keyboard.Key.ctrl_l: _pynput_keyboard.Key.ctrl,
    _pynput_keyboard.Key.ctrl_r: _pynput_keyboard.Key.ctrl,
    _pynput_keyboard.Key.shift_l: _pynput_keyboard.Key.shift,
    _pynput_keyboard.Key.shift_r: _pynput_keyboard.Key.shift,
}


class HotkeyListener:
    """Calls `callback` whenever Ctrl+Shift+Space is pressed together.

    On macOS, `pynput`'s listener thread starts (and `start()` returns
    successfully, no exception raised) even when the process lacks
    Accessibility permission -- it just silently fails to create its
    event tap and exits. Use `is_trusted` to detect this and `restart()`
    to spin up a fresh listener once permission has been granted.
    """

    def __init__(self, callback):
        self._callback = callback
        self._pressed: set = set()
        self._listener: _pynput_keyboard.Listener | None = None

    def _on_press(self, key) -> None:
        key = _MODIFIER_ALIASES.get(key, key)
        self._pressed.add(key)
        if _HOTKEY_COMBO.issubset(self._pressed):
            self._callback()

    def _on_release(self, key) -> None:
        key = _MODIFIER_ALIASES.get(key, key)
        self._pressed.discard(key)

    def start(self) -> None:
        self._pressed.clear()
        self._listener = _pynput_keyboard.Listener(
            on_press=self._on_press, on_release=self._on_release
        )
        self._listener.start()
        self._listener.wait()
        print(
            f"[mac_input] Hotkey listener started, trusted={self.is_trusted}",
            flush=True,
        )

    def stop(self) -> None:
        if self._listener is not None:
            self._listener.stop()
            self._listener = None

    def restart(self) -> None:
        """Tear down and recreate the listener (e.g. after the user grants
        Accessibility access -- the old listener's event tap creation
        already failed and its thread already exited)."""
        print("[mac_input] Restarting hotkey listener", flush=True)
        self.stop()
        self.start()

    @property
    def is_trusted(self) -> bool:
        """Whether the underlying event tap was successfully created."""
        return bool(self._listener is not None and getattr(self._listener, "IS_TRUSTED", False))


_paste_controller = _pynput_keyboard.Controller()


def send_paste() -> None:
    """Simulate Cmd+V to paste the current clipboard contents."""
    with _paste_controller.pressed(_pynput_keyboard.Key.cmd):
        _paste_controller.press("v")
        _paste_controller.release("v")
