"""Dysctation tray dictation app.

Toggle a global hotkey to continuously listen on the default
microphone. On each pause in speech, the audio chunk is sent to Groq
Whisper for transcription and pasted into the focused field.
"""

import io
import os
import queue
import sys
import threading
import time
import traceback
import wave

import numpy as np
import pyaudio
import pyperclip
from dotenv import load_dotenv
from groq import Groq

import dpi
from paths import resource_path
from settings import load_settings

if sys.platform == "win32":
    import keyboard
    import pystray

    from icon import create_icon_image
    from setup_window import run_first_run_setup
    from widget import StatusWidget
else:
    from mac_app import run_first_run_setup_mac as run_first_run_setup
    from mac_app import run_mac_app, set_app_name
    from mac_input import send_paste

    set_app_name("Dysctation")

dpi.enable()

# --- Configuration ---
RATE = 16000
CHANNELS = 1
FORMAT = pyaudio.paInt16
CHUNK = 1024

SILENCE_THRESHOLD = 500       # RMS amplitude below this counts as silence
MIN_CHUNK_DURATION = 0.5      # minimum chunk length sent for transcription

HOTKEY = "ctrl+shift+space"
MODEL = "whisper-large-v3"


print(f"[startup] Loading .env from {resource_path('.env')}", flush=True)
load_dotenv(resource_path(".env"))

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("[startup] No GROQ_API_KEY found, showing first-run setup", flush=True)
    GROQ_API_KEY = run_first_run_setup()
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY
print("[startup] GROQ_API_KEY loaded", flush=True)

groq_client = Groq(api_key=GROQ_API_KEY)
print("[startup] Groq client initialized", flush=True)

SETTINGS = load_settings()
print(f"[startup] Settings loaded: {SETTINGS}", flush=True)

listening = threading.Event()
listen_thread: threading.Thread | None = None
tray_icon = None
status_widget = None
ui_requests: "queue.Queue[str]" = queue.Queue()


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
    if sys.platform == "win32":
        keyboard.send("ctrl+v")
    else:
        send_paste()


def listen_loop() -> None:
    audio = pyaudio.PyAudio()
    stream = audio.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK,
    )

    min_chunks = int(MIN_CHUNK_DURATION * RATE / CHUNK)

    frames: list[bytes] = []
    silence_run = 0
    has_speech = False

    try:
        while listening.is_set():
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)

            silence_chunks_needed = int(SETTINGS["silence_duration"] * RATE / CHUNK)

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


def request_pause_sensitivity_dialog() -> None:
    ui_requests.put("pause_sensitivity")


def request_api_key_dialog() -> None:
    ui_requests.put("api_key")


def apply_new_api_key(new_key: str) -> None:
    global groq_client, GROQ_API_KEY

    GROQ_API_KEY = new_key
    os.environ["GROQ_API_KEY"] = new_key
    groq_client = Groq(api_key=new_key)
    print("[settings] Groq client re-initialized with new API key", flush=True)


def quit_app() -> None:
    set_listening(False)
    if tray_icon is not None:
        tray_icon.stop()
    if status_widget is not None:
        status_widget.close()


def run_tray_icon() -> None:
    try:
        print("[startup] Calling tray_icon.run() - tray icon should appear now", flush=True)
        tray_icon.run()
        print("[startup] tray_icon.run() returned", flush=True)
    except Exception:
        print("[startup] tray_icon.run() raised an exception:", flush=True)
        traceback.print_exc()


def run_windows() -> None:
    global tray_icon, status_widget

    print(f"[startup] Registering global hotkey: {HOTKEY}", flush=True)
    keyboard.add_hotkey(HOTKEY, toggle_listening)
    print("[startup] Hotkey registered", flush=True)

    print("[startup] Generating tray icon image", flush=True)
    image = create_icon_image(False)
    print("[startup] Tray icon image generated", flush=True)

    print("[startup] Creating pystray.Icon", flush=True)
    tray_icon = pystray.Icon(
        "Dysctation",
        image,
        "Dysctation (idle)",
        menu=pystray.Menu(
            pystray.MenuItem(
                "Toggle listening (Ctrl+Shift+Space)", lambda: toggle_listening()
            ),
            pystray.MenuItem(
                "Adjust pause sensitivity...",
                lambda: request_pause_sensitivity_dialog(),
            ),
            pystray.MenuItem(
                "Change API key...", lambda: request_api_key_dialog()
            ),
            pystray.MenuItem("Quit", lambda: quit_app()),
        ),
    )
    print("[startup] pystray.Icon created", flush=True)

    threading.Thread(target=run_tray_icon, daemon=True).start()

    try:
        print("[startup] Creating status widget", flush=True)
        status_widget = StatusWidget(
            listening,
            ui_requests=ui_requests,
            settings_data=SETTINGS,
            on_api_key_change=apply_new_api_key,
        )
        print("[startup] Status widget created, starting Tk mainloop", flush=True)
        status_widget.run()
        print("[startup] Tk mainloop exited", flush=True)
    except Exception:
        print("[startup] status widget raised an exception:", flush=True)
        traceback.print_exc()
    finally:
        keyboard.unhook_all()
        if tray_icon is not None:
            tray_icon.stop()
        print("[startup] Hotkey unhooked, exiting", flush=True)


def run_mac() -> None:
    print("[startup] Starting macOS menu bar app", flush=True)
    try:
        run_mac_app(
            listening_event=listening,
            settings_data=SETTINGS,
            toggle_listening=toggle_listening,
            apply_new_api_key=apply_new_api_key,
            quit_app=quit_app,
        )
    except Exception:
        print("[startup] macOS app raised an exception:", flush=True)
        traceback.print_exc()
    print("[startup] macOS app exited", flush=True)


def main() -> None:
    if sys.platform == "win32":
        run_windows()
    else:
        run_mac()


if __name__ == "__main__":
    main()
