"""Always-on-top status widget showing listening/idle state."""

import math
import threading
import tkinter as tk

from PIL import ImageTk

from icon import create_mic_glyph

WIDTH = 170
HEIGHT = 48
MARGIN_RIGHT = 20
MARGIN_BOTTOM = 60

BG_COLOR = "#2b2825"
CARD_COLOR = "#3a352f"
TEXT_COLOR = "#ece6df"
ACCENT_BLUE = "#4f7fc7"
ACCENT_GREY = "#9a948c"

ICON_SIZE = 22
POLL_MS = 150
PULSE_STEP_MS = 80


class StatusWidget:
    """A small borderless, always-on-top, click-through-ish status panel."""

    def __init__(self, listening_event: threading.Event):
        self.listening = listening_event

        self.root = tk.Tk()
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)
        self.root.attributes("-alpha", 0.88)
        self.root.config(bg=BG_COLOR)

        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        x = screen_w - WIDTH - MARGIN_RIGHT
        y = screen_h - HEIGHT - MARGIN_BOTTOM
        self.root.geometry(f"{WIDTH}x{HEIGHT}+{x}+{y}")

        self._make_non_activating()

        self.canvas = tk.Canvas(
            self.root, width=WIDTH, height=HEIGHT, bg=BG_COLOR, highlightthickness=0
        )
        self.canvas.pack(fill="both", expand=True)
        self._draw_rounded_rect(1, 1, WIDTH - 1, HEIGHT - 1, radius=14, fill=CARD_COLOR)

        self._icon_image = None
        self._icon_item = self.canvas.create_image(26, HEIGHT // 2, anchor="w")
        self._text_item = self.canvas.create_text(
            52,
            HEIGHT // 2,
            anchor="w",
            fill=TEXT_COLOR,
            font=("Segoe UI", 11, "bold"),
            text="Idle",
        )

        self._current_state = None
        self._pulse_phase = 0.0
        self._set_state(False)
        self.root.after(POLL_MS, self._poll)

    def _make_non_activating(self) -> None:
        """Prevent the widget from stealing focus or appearing in alt-tab."""
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

    def _draw_rounded_rect(self, x1, y1, x2, y2, radius, **kwargs):
        points = [
            x1 + radius, y1,
            x2 - radius, y1,
            x2, y1,
            x2, y1 + radius,
            x2, y2 - radius,
            x2, y2,
            x2 - radius, y2,
            x1 + radius, y2,
            x1, y2,
            x1, y2 - radius,
            x1, y1 + radius,
            x1, y1,
        ]
        return self.canvas.create_polygon(points, smooth=True, **kwargs)

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
        self.root.after(POLL_MS, self._poll)

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
