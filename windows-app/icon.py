"""Programmatic tray icon generation (no external image files needed)."""

from PIL import Image, ImageDraw, ImageTk

MIC_BLUE = (79, 127, 199, 255)
RECORD_RED = (214, 69, 69, 255)


def create_icon_image(recording: bool, size: int = 64) -> Image.Image:
    """Draw a blue circular mic icon. Adds a red dot while recording."""
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    draw.ellipse((2, 2, size - 2, size - 2), fill=MIC_BLUE)

    line_width = max(1, round(size * 0.0625))

    # Mic capsule
    draw.rounded_rectangle(
        (size * 0.40, size * 0.16, size * 0.60, size * 0.56),
        radius=size * 0.10,
        fill="white",
    )
    # Mic stand: arc + post + base
    draw.arc(
        (size * 0.27, size * 0.30, size * 0.73, size * 0.70),
        start=0,
        end=180,
        fill="white",
        width=line_width,
    )
    draw.line(
        (size * 0.5, size * 0.66, size * 0.5, size * 0.80),
        fill="white",
        width=line_width,
    )
    draw.line(
        (size * 0.38, size * 0.80, size * 0.62, size * 0.80),
        fill="white",
        width=line_width,
    )

    if recording:
        dot_r = size * 0.12
        cx, cy = size * 0.82, size * 0.18
        draw.ellipse((cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r), fill=RECORD_RED)

    return image


def set_window_icon(window, size: int = 32) -> None:
    """Set a Tk window's titlebar/taskbar icon to the app's blue mic icon.

    Keeps a reference to the PhotoImage on the window itself, since Tk
    drops the icon if the image object is garbage-collected.
    """
    photo = ImageTk.PhotoImage(create_icon_image(False, size=size))
    window.iconphoto(False, photo)
    window._icon_photo_ref = photo


def create_mic_glyph(color, size: int = 24) -> Image.Image:
    """Draw just the mic glyph (no background circle) in a solid color,
    for use in the status widget."""
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle(
        (size * 0.38, size * 0.06, size * 0.62, size * 0.56),
        radius=size * 0.12,
        fill=color,
    )
    draw.arc(
        (size * 0.20, size * 0.28, size * 0.80, size * 0.76),
        start=0,
        end=180,
        fill=color,
        width=max(2, round(size * 0.09)),
    )
    draw.line(
        (size * 0.5, size * 0.70, size * 0.5, size * 0.88),
        fill=color,
        width=max(2, round(size * 0.09)),
    )
    draw.line(
        (size * 0.34, size * 0.88, size * 0.66, size * 0.88),
        fill=color,
        width=max(2, round(size * 0.09)),
    )

    return image
