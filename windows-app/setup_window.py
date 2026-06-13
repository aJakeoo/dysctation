"""First-run setup window: prompt for a Groq API key if none is configured."""

import tkinter as tk
import webbrowser

import dpi
from env_store import write_env_value

GROQ_SIGNUP_URL = "https://console.groq.com"


def run_first_run_setup() -> str:
    """Show a blocking window asking for a Groq API key.

    Saves the key to .env and returns it. Exits the process if the
    window is closed without entering a key.
    """
    dpi.enable()
    scale = dpi.scale()

    def px(value: float) -> int:
        return round(value * scale)

    result: dict[str, str] = {}

    root = tk.Tk()
    root.title("Dysctation Setup")
    root.resizable(False, False)
    root.attributes("-topmost", True)

    width, height = px(400), px(230)
    screen_w = root.winfo_screenwidth()
    screen_h = root.winfo_screenheight()
    x = (screen_w - width) // 2
    y = (screen_h - height) // 2
    root.geometry(f"{width}x{height}+{x}+{y}")

    pad = px(20)
    frame = tk.Frame(root, padx=pad, pady=pad)
    frame.pack(fill="both", expand=True)

    tk.Label(
        frame,
        text="Welcome to Dysctation",
        font=("Segoe UI", 12, "bold"),
    ).pack(anchor="w")

    tk.Label(
        frame,
        text="Paste your Groq API key below to get started.",
        font=("Segoe UI", 10),
        wraplength=width - 2 * pad,
        justify="left",
    ).pack(anchor="w", pady=(px(6), px(12)))

    entry_var = tk.StringVar()
    entry = tk.Entry(frame, textvariable=entry_var, font=("Segoe UI", 10))
    entry.pack(fill="x")
    entry.focus_set()

    link = tk.Label(
        frame,
        text="Get a free key at console.groq.com",
        font=("Segoe UI", 9, "underline"),
        fg="#4f7fc7",
        cursor="hand2",
    )
    link.pack(anchor="w", pady=(px(8), px(16)))
    link.bind("<Button-1>", lambda _e: webbrowser.open(GROQ_SIGNUP_URL))

    def on_save() -> None:
        key = entry_var.get().strip()
        if not key:
            return
        write_env_value("GROQ_API_KEY", key)
        result["key"] = key
        root.destroy()

    entry.bind("<Return>", lambda _e: on_save())

    button_row = tk.Frame(frame)
    button_row.pack(fill="x", side="bottom")
    tk.Button(button_row, text="Save and continue", command=on_save).pack(side="right")

    root.mainloop()

    if "key" not in result:
        raise SystemExit(0)

    return result["key"]
