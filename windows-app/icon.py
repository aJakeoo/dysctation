"""Programmatic tray icon generation (no external image files needed)."""

from PIL import Image, ImageDraw

MIC_BLUE = (79, 127, 199, 255)
RECORD_RED = (214, 69, 69, 255)


def create_icon_image(recording: bool) -> Image.Image:
    """Draw a blue circular mic icon. Adds a red dot while recording."""
    size = 64
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    draw.ellipse((2, 2, size - 2, size - 2), fill=MIC_BLUE)

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
        width=4,
    )
    draw.line((size * 0.5, size * 0.66, size * 0.5, size * 0.80), fill="white", width=4)
    draw.line((size * 0.38, size * 0.80, size * 0.62, size * 0.80), fill="white", width=4)

    if recording:
        dot_r = size * 0.12
        cx, cy = size * 0.82, size * 0.18
        draw.ellipse((cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r), fill=RECORD_RED)

    return image
