"""Settings dialogs opened from the tray menu.

These are opened on the Tk main thread (via StatusWidget's polling
loop), as plain decorated Toplevel windows -- separate from the
borderless always-on-top status pill.
"""

import tkinter as tk
from typing import Callable

import dpi
from env_store import write_env_value
from icon import set_window_icon
from settings import save_settings


def _center(win: tk.Toplevel, width: int, height: int) -> None:
    screen_w = win.winfo_screenwidth()
    screen_h = win.winfo_screenheight()
    x = (screen_w - width) // 2
    y = (screen_h - height) // 2
    win.geometry(f"{width}x{height}+{x}+{y}")


def open_pause_sensitivity_dialog(parent: tk.Tk, settings_data: dict) -> tk.Toplevel:
    """Slider for how long to wait in silence before sending a chunk."""
    scale = dpi.scale()

    def px(value: float) -> int:
        return round(value * scale)

    win = tk.Toplevel(parent)
    win.title("Pause Sensitivity")
    win.resizable(False, False)
    win.attributes("-topmost", True)
    set_window_icon(win)

    width, height = px(340), px(190)
    _center(win, width, height)

    pad = px(18)
    frame = tk.Frame(win, padx=pad, pady=pad)
    frame.pack(fill="both", expand=True)

    tk.Label(frame, text="Pause before send", font=("Segoe UI", 11, "bold")).pack(
        anchor="w"
    )
    tk.Label(
        frame,
        text="How long to wait in silence before sending what you said.",
        font=("Segoe UI", 9),
        wraplength=width - 2 * pad,
        justify="left",
        fg="#666666",
    ).pack(anchor="w", pady=(px(4), px(12)))

    value_var = tk.DoubleVar(value=settings_data["silence_duration"])
    value_label = tk.Label(frame, font=("Segoe UI", 10))

    def update_label(*_args) -> None:
        value_label.config(text=f"{value_var.get():.1f} seconds")

    tk.Scale(
        frame,
        from_=0.5,
        to=5.0,
        resolution=0.1,
        orient="horizontal",
        variable=value_var,
        showvalue=False,
        command=update_label,
        length=px(280),
    ).pack(fill="x")
    update_label()
    value_label.pack(anchor="e", pady=(px(2), px(12)))

    def on_save() -> None:
        settings_data["silence_duration"] = round(value_var.get(), 1)
        save_settings(settings_data)
        win.destroy()

    button_row = tk.Frame(frame)
    button_row.pack(fill="x", side="bottom")
    tk.Button(button_row, text="Cancel", command=win.destroy).pack(
        side="right", padx=(px(6), 0)
    )
    tk.Button(button_row, text="Save", command=on_save).pack(side="right")

    win.grab_set()
    return win


def open_api_key_dialog(
    parent: tk.Tk, on_apply: Callable[[str], None]
) -> tk.Toplevel:
    """Entry for pasting a new Groq API key."""
    scale = dpi.scale()

    def px(value: float) -> int:
        return round(value * scale)

    win = tk.Toplevel(parent)
    win.title("Change API Key")
    win.resizable(False, False)
    win.attributes("-topmost", True)
    set_window_icon(win)

    width, height = px(380), px(180)
    _center(win, width, height)

    pad = px(18)
    frame = tk.Frame(win, padx=pad, pady=pad)
    frame.pack(fill="both", expand=True)

    tk.Label(frame, text="Groq API key", font=("Segoe UI", 11, "bold")).pack(
        anchor="w"
    )
    tk.Label(
        frame,
        text="Paste a new key to replace the one currently in use.",
        font=("Segoe UI", 9),
        wraplength=width - 2 * pad,
        justify="left",
        fg="#666666",
    ).pack(anchor="w", pady=(px(4), px(10)))

    entry_var = tk.StringVar()
    entry = tk.Entry(frame, textvariable=entry_var, font=("Segoe UI", 10), show="*")
    entry.pack(fill="x")
    entry.focus_set()

    show_var = tk.BooleanVar(value=False)

    def toggle_show() -> None:
        entry.config(show="" if show_var.get() else "*")

    tk.Checkbutton(
        frame,
        text="Show key",
        variable=show_var,
        command=toggle_show,
        font=("Segoe UI", 9),
    ).pack(anchor="w", pady=(px(4), px(10)))

    def handle_save() -> None:
        key = entry_var.get().strip()
        if not key:
            return
        write_env_value("GROQ_API_KEY", key)
        on_apply(key)
        win.destroy()

    entry.bind("<Return>", lambda _e: handle_save())

    button_row = tk.Frame(frame)
    button_row.pack(fill="x", side="bottom")
    tk.Button(button_row, text="Cancel", command=win.destroy).pack(
        side="right", padx=(px(6), 0)
    )
    tk.Button(button_row, text="Save", command=handle_save).pack(side="right")

    win.grab_set()
    return win
