"""Dysctation tray dictation app.

Toggle a global hotkey to continuously listen on the default
microphone. On each pause in speech, the audio chunk is sent to Groq
Whisper for transcription and pasted into the focused field.
"""

import io
import os
import sys
import threading
import time
import wave

import keyboard
import numpy as np
import pyaudio
import pyperclip
import pystray
from dotenv import load_dotenv
from groq import Groq

from icon import create_icon_image

# --- Configuration ---
RATE = 16000
CHANNELS = 1
FORMAT = pyaudio.paInt16
CHUNK = 1024

SILENCE_THRESHOLD = 500       # RMS amplitude below this counts as silence
SILENCE_DURATION = 1.5        # seconds of silence that ends a chunk
MIN_CHUNK_DURATION = 0.5      # minimum chunk length sent for transcription

HOTKEY = "ctrl+shift+space"
MODEL = "whisper-large-v3"


def resource_path(filename: str) -> str:
    """Resolve a path next to the script, or next to the frozen exe."""
    if getattr(sys, "frozen", False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, filename)


load_dotenv(resource_path(".env"))

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not set. Add it to windows-app/.env "
        "(see .env.example)."
    )

groq_client = Groq(api_key=GROQ_API_KEY)

listening = threading.Event()
listen_thread: threading.Thread | None = None
tray_icon: pystray.Icon | None = None


def rms(audio_bytes: bytes) -> float:
    samples = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float64)
    if len(samples) == 0:
        return 0.0
    return float(np.sqrt(np.mean(samples ** 2)))


def transcribe_and_paste(frames: list[bytes]) -> None:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(pyaudio.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b"".join(frames))

    try:
        result = groq_client.audio.transcriptions.create(
            file=("chunk.wav", buffer.getvalue()),
            model=MODEL,
        )
    except Exception as exc:
        print(f"Transcription failed: {exc}")
        return

    text = (result.text or "").strip()
    if not text:
        return

    pyperclip.copy(text)
    time.sleep(0.1)
    keyboard.send("ctrl+v")


def listen_loop() -> None:
    audio = pyaudio.PyAudio()
    stream = audio.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK,
    )

    silence_chunks_needed = int(SILENCE_DURATION * RATE / CHUNK)
    min_chunks = int(MIN_CHUNK_DURATION * RATE / CHUNK)

    frames: list[bytes] = []
    silence_run = 0
    has_speech = False

    try:
        while listening.is_set():
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)

            if rms(data) < SILENCE_THRESHOLD:
                silence_run += 1
            else:
                silence_run = 0
                has_speech = True

            if has_speech and silence_run >= silence_chunks_needed:
                if len(frames) >= min_chunks:
                    threading.Thread(
                        target=transcribe_and_paste, args=(frames,), daemon=True
                    ).start()
                frames = []
                silence_run = 0
                has_speech = False
            elif not has_speech and len(frames) > silence_chunks_needed:
                # Drop accumulated leading silence so the buffer doesn't
                # grow unbounded while waiting for speech to start.
                frames = []
                silence_run = 0
    finally:
        stream.stop_stream()
        stream.close()
        audio.terminate()


def set_listening(state: bool) -> None:
    global listen_thread

    if state == listening.is_set():
        return

    if state:
        listening.set()
        listen_thread = threading.Thread(target=listen_loop, daemon=True)
        listen_thread.start()
    else:
        listening.clear()

    if tray_icon is not None:
        tray_icon.icon = create_icon_image(state)
        tray_icon.title = "Dysctation (listening)" if state else "Dysctation (idle)"


def toggle_listening() -> None:
    set_listening(not listening.is_set())


def quit_app() -> None:
    set_listening(False)
    if tray_icon is not None:
        tray_icon.stop()


def main() -> None:
    global tray_icon

    keyboard.add_hotkey(HOTKEY, toggle_listening)

    tray_icon = pystray.Icon(
        "Dysctation",
        create_icon_image(False),
        "Dysctation (idle)",
        menu=pystray.Menu(
            pystray.MenuItem(
                "Toggle listening (Ctrl+Shift+Space)", lambda: toggle_listening()
            ),
            pystray.MenuItem("Quit", lambda: quit_app()),
        ),
    )

    try:
        tray_icon.run()
    finally:
        keyboard.unhook_all()


if __name__ == "__main__":
    main()
