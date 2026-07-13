"""Always-on-top status widget showing listening/idle state."""

import math
import queue
import sys
import threading
import tkinter as tk
from typing import Callable, Optional

from PIL import ImageTk

import dpi
from dialogs import open_api_key_dialog, open_pause_sensitivity_dialog
from icon import create_mic_glyph, set_window_icon
from instructions import open_instructions_window

dpi.enable()
_SCALE = dpi.scale()


def _px(value: float) -> int:
    return round(value * _SCALE)


HEIGHT = _px(36)
WIDTH = _px(136)
MARGIN_RIGHT = _px(20)
MARGIN_BOTTOM = _px(56)

PAD_LEFT = _px(14)
ICON_TEXT_GAP = _px(8)
ICON_SIZE = _px(18)

BG_COLOR = "#2b2825"
CARD_COLOR = "#3a352f"
TEXT_COLOR = "#ece6df"
ACCENT_BLUE = "#4f7fc7"
ACCENT_GREY = "#9a948c"

FONT = ("Segoe UI", 10)
POLL_MS = 150
PULSE_STEP_MS = 80


class StatusWidget:
    """A small borderless, always-on-top status pill."""

    def __init__(
        self,
        listening_event: threading.Event,
        ui_requests: Optional["queue.Queue[str]"] = None,
        settings_data: Optional[dict] = None,
        on_api_key_change: Optional[Callable[[str], None]] = None,
    ):
        self.listening = listening_event
        self.ui_requests = ui_requests
        self.settings_data = settings_data
        self.on_api_key_change = on_api_key_change
        self._open_dialogs: set[str] = set()

        self.root = tk.Tk()
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)
        self.root.attributes("-alpha", 0.92)
        self.root.attributes("-transparentcolor", BG_COLOR)
        self.root.config(bg=BG_COLOR)
        set_window_icon(self.root)

        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        x = screen_w - WIDTH - MARGIN_RIGHT
        y = screen_h - HEIGHT - MARGIN_BOTTOM
        self.root.geometry(f"{WIDTH}x{HEIGHT}+{x}+{y}")

        self._make_non_activating()

        self.canvas = tk.Canvas(
            self.root,
            width=WIDTH,
            height=HEIGHT,
            bg=BG_COLOR,
            highlightthickness=0,
            bd=0,
        )
        self.canvas.pack(fill="both", expand=True)
        self._draw_pill()

        self._icon_image = None
        icon_y = HEIGHT // 2
        self._icon_item = self.canvas.create_image(PAD_LEFT, icon_y, anchor="w")
        self._text_item = self.canvas.create_text(
            PAD_LEFT + ICON_SIZE + ICON_TEXT_GAP,
            icon_y,
            anchor="w",
            fill=TEXT_COLOR,
            font=FONT,
            text="Idle",
        )

        self._current_state = None
        self._pulse_phase = 0.0
        self._set_state(False)
        self.root.after(POLL_MS, self._poll)

    def _make_non_activating(self) -> None:
        """Prevent the widget from stealing focus or appearing in alt-tab.

        Windows-only: overrideredirect + topmost is already
        non-activating enough on macOS.
        """
        if sys.platform != "win32":
            return

        try:
            import ctypes

            gwl_exstyle = -20
            ws_ex_noactivate = 0x08000000
            ws_ex_toolwindow = 0x00000080

            hwnd = self.root.winfo_id()
            style = ctypes.windll.user32.GetWindowLongW(hwnd, gwl_exstyle)
            ctypes.windll.user32.SetWindowLongW(
                hwnd, gwl_exstyle, style | ws_ex_noactivate | ws_ex_toolwindow
            )
        except Exception as exc:
            print(f"[widget] Could not set non-activating window style: {exc}")

    def _draw_pill(self) -> None:
        """Draw a seamless, fully-rounded pill with hard (non-aliased) edges.

        Built from two end caps (ovals) plus a connecting rectangle, all in
        the same fill color, so the result reads as one solid shape with no
        seams. The canvas background stays BG_COLOR, which is set as the
        window's transparent color key -- so everything outside the pill is
        invisible and the window itself appears pill-shaped.
        """
        d = HEIGHT
        self.canvas.create_oval(0, 0, d, d, fill=CARD_COLOR, outline="")
        self.canvas.create_oval(WIDTH - d, 0, WIDTH, d, fill=CARD_COLOR, outline="")
        self.canvas.create_rectangle(
            d / 2, 0, WIDTH - d / 2, HEIGHT, fill=CARD_COLOR, outline=""
        )

    def _set_icon_color(self, color: str) -> None:
        self._icon_image = ImageTk.PhotoImage(create_mic_glyph(color, ICON_SIZE))
        self.canvas.itemconfig(self._icon_item, image=self._icon_image)

    def _set_state(self, active: bool) -> None:
        self._current_state = active
        self.canvas.itemconfig(
            self._text_item, text="Listening..." if active else "Idle"
        )
        if active:
            self._pulse_phase = 0.0
            self._pulse()
        else:
            self._set_icon_color(ACCENT_GREY)

    def _poll(self) -> None:
        active = self.listening.is_set()
        if active != self._current_state:
            self._set_state(active)
        self._drain_ui_requests()
        self.root.after(POLL_MS, self._poll)

    def _drain_ui_requests(self) -> None:
        if self.ui_requests is None:
            return
        while True:
            try:
                request = self.ui_requests.get_nowait()
            except queue.Empty:
                break

            if request in self._open_dialogs:
                continue

            if request == "pause_sensitivity":
                win = open_pause_sensitivity_dialog(self.root, self.settings_data)
            elif request == "api_key":
                win = open_api_key_dialog(
                    self.root, self.on_api_key_change or (lambda _key: None)
                )
            elif request == "instructions":
                win = open_instructions_window(self.root)
            else:
                continue

            self._open_dialogs.add(request)
            win.bind(
                "<Destroy>", lambda _e, r=request: self._open_dialogs.discard(r)
            )

    def _pulse(self) -> None:
        if not self.listening.is_set():
            return
        self._pulse_phase += 0.3
        brightness = 0.65 + 0.35 * (0.5 + 0.5 * math.sin(self._pulse_phase))
        self._set_icon_color(_scale_color(ACCENT_BLUE, brightness))
        self.root.after(PULSE_STEP_MS, self._pulse)

    def run(self) -> None:
        self.root.mainloop()

    def close(self) -> None:
        try:
            self.root.after(0, self.root.destroy)
        except Exception:
            pass


def _scale_color(hex_color: str, factor: float) -> str:
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i : i + 2], 16) for i in (0, 2, 4))
    r, g, b = (min(255, round(c * factor)) for c in (r, g, b))
    return f"#{r:02x}{g:02x}{b:02x}"
