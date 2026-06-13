"""Shared app icon for macOS: the same mic emoji shown in the menu bar,
rendered as an NSImage so every window (app icon, alerts) is consistent
instead of showing the default Python rocket ship.
"""

from AppKit import NSAttributedString, NSFont, NSFontAttributeName, NSImage
from Foundation import NSMakePoint, NSMakeSize

_MIC_ICON: NSImage | None = None


def mic_icon() -> NSImage:
    """Return the mic emoji rendered as a square NSImage (cached)."""
    global _MIC_ICON
    if _MIC_ICON is None:
        _MIC_ICON = _emoji_image("🎙")
    return _MIC_ICON


def _emoji_image(emoji: str, size: int = 256) -> NSImage:
    image = NSImage.alloc().initWithSize_(NSMakeSize(size, size))
    image.lockFocus()
    font = NSFont.systemFontOfSize_(size * 0.8)
    text = NSAttributedString.alloc().initWithString_attributes_(
        emoji, {NSFontAttributeName: font}
    )
    text_size = text.size()
    text.drawAtPoint_(
        NSMakePoint((size - text_size.width) / 2, (size - text_size.height) / 2)
    )
    image.unlockFocus()
    return image
