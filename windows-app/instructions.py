"""Reusable onboarding / instructions window.

Shown automatically after first-run API key setup, and reopenable at
any time via the tray menu's "View instructions..." item.
"""

import tkinter as tk

import dpi
from icon import set_window_icon

HOW_TO_USE = [
    "Press Ctrl+Shift+Space to start dictating",
    "Speak, text pastes automatically into whatever field is focused",
    "Press Ctrl+Shift+Space again to stop",
    "The status pill in the bottom right shows Idle / Listening",
]

SETTINGS_NOTE = (
    "Right-click the tray icon to adjust pause sensitivity or change your API key."
)

RETURN_NOTE = (
    "You can always come back to this screen by right-clicking the Dysctation "
    "icon in your taskbar tray and selecting View instructions."
)


def _center(win: tk.Misc, width: int, height: int) -> None:
    screen_w = win.winfo_screenwidth()
    screen_h = win.winfo_screenheight()
    x = (screen_w - width) // 2
    y = (screen_h - height) // 2
    win.geometry(f"{width}x{height}+{x}+{y}")


def _populate(win, px, width: int, pad: int, on_close) -> None:
    frame = tk.Frame(win, padx=pad, pady=pad)
    frame.pack(fill="both", expand=True)

    tk.Label(frame, text="Welcome to Dysctation", font=("Segoe UI", 12, "bold")).pack(
        anchor="w"
    )

    tk.Label(
        frame,
        text="System-wide dictation for Windows, powered by Groq Whisper.",
        font=("Segoe UI", 10),
        wraplength=width - 2 * pad,
        justify="left",
    ).pack(anchor="w", pady=(px(4), px(12)))

    tk.Label(frame, text="How to use", font=("Segoe UI", 10, "bold")).pack(anchor="w")
    for line in HOW_TO_USE:
        tk.Label(
            frame,
            text=f"•  {line}",
            font=("Segoe UI", 9),
            wraplength=width - 2 * pad,
            justify="left",
        ).pack(anchor="w", pady=(px(2), 0))

    tk.Label(frame, text="Settings", font=("Segoe UI", 10, "bold")).pack(
        anchor="w", pady=(px(12), 0)
    )
    tk.Label(
        frame,
        text=f"•  {SETTINGS_NOTE}",
        font=("Segoe UI", 9),
        wraplength=width - 2 * pad,
        justify="left",
    ).pack(anchor="w", pady=(px(2), 0))

    tk.Label(
        frame,
        text=RETURN_NOTE,
        font=("Segoe UI", 8),
        wraplength=width - 2 * pad,
        justify="left",
        fg="#888888",
    ).pack(anchor="w", pady=(px(14), px(12)))

    button_row = tk.Frame(frame)
    button_row.pack(fill="x", side="bottom")
    tk.Button(button_row, text="Got it, let's go", command=on_close).pack(side="right")


def run_instructions_standalone() -> None:
    """Show a blocking instructions window with its own Tk root.

    Used on first run, before the tray app has started.
    """
    dpi.enable()
    scale = dpi.scale()

    def px(value: float) -> int:
        return round(value * scale)

    root = tk.Tk()
    root.title("Welcome to Dysctation")
    root.resizable(False, False)
    root.attributes("-topmost", True)
    set_window_icon(root)

    width, height = px(420), px(430)
    _center(root, width, height)

    _populate(root, px, width, px(20), root.destroy)
    root.mainloop()


def open_instructions_window(parent: tk.Tk) -> tk.Toplevel:
    """Open the instructions window as a Toplevel of the running app."""
    scale = dpi.scale()

    def px(value: float) -> int:
        return round(value * scale)

    win = tk.Toplevel(parent)
    win.title("Welcome to Dysctation")
    win.resizable(False, False)
    win.attributes("-topmost", True)
    set_window_icon(win)

    width, height = px(420), px(430)
    _center(win, width, height)

    _populate(win, px, width, px(20), win.destroy)
    win.grab_set()
    return win
