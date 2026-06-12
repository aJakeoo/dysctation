# Dysctation Windows Tray App

A lightweight Windows system tray dictation tool. Toggle a global
hotkey to start listening, speak, and your words are transcribed by
Groq's Whisper `large-v3` model and pasted directly into whatever text
field is currently focused.

## How it works

- Sits in the system tray as a blue mic icon, drawn programmatically
  with Pillow (no image files needed). A small red dot appears on the
  icon while listening.
- **Ctrl+Shift+Space** toggles listening on/off.
- While listening, the app continuously records from your default
  microphone.
- When it detects ~1.5 seconds of silence after speech (and the chunk
  is at least 0.5 seconds long), that chunk is sent to Groq Whisper
  `large-v3` for transcription.
- The transcribed text is copied to the clipboard and pasted into the
  focused field via a simulated Ctrl+V.
- Listening continues, repeating this for each pause, until you press
  the hotkey again.

## Setup

### 1. Install Python

Python 3.10+ is recommended (Windows).

### 2. Install dependencies

```bat
cd windows-app
pip install -r requirements.txt
```

If `pip install PyAudio` fails with a compiler error (`Cannot open
include file: 'portaudio.h'`), it means there's no precompiled wheel
for your Python version yet — this currently happens on Python 3.13+
(e.g. 3.14). Use Python 3.11 or 3.12 for this project, or try:

```bat
pip install pipwin
pipwin install pyaudio
```

### 3. Add your Groq API key

Edit `.env` (or copy `.env.example` to `.env`) and set:

```
GROQ_API_KEY=your_groq_api_key_here
```

Get a key from https://console.groq.com. `.env` is gitignored, so your
key stays local.

## Run from source

```bat
cd windows-app
python main.py
```

A blue mic icon appears in the system tray. Press **Ctrl+Shift+Space**
to start/stop listening. Right-click the tray icon for a menu with
"Toggle listening" and "Quit".

## Build a standalone .exe

```bat
cd windows-app
build.bat
```

This creates a virtual environment (if needed), installs dependencies
and PyInstaller, and produces `dist\Dysctation.exe`. The script also
copies your `.env` into `dist\` so the exe can find your API key —
make sure `.env` contains a real `GROQ_API_KEY` before building.

To run the built app, double-click `dist\Dysctation.exe`, or add a
shortcut to it in your Windows Startup folder
(`shell:startup`) to launch it on login.

## Configuration

Tunable constants are at the top of `main.py`:

- `SILENCE_THRESHOLD` — RMS amplitude below which audio is considered
  silence. Raise this if background noise triggers false
  transcriptions; lower it if quiet speech isn't being detected.
- `SILENCE_DURATION` — seconds of silence that ends a chunk (default
  `1.5`).
- `MIN_CHUNK_DURATION` — minimum chunk length sent for transcription,
  to avoid sending pure noise (default `0.5`).
- `HOTKEY` — global hotkey to toggle listening (default
  `ctrl+shift+space`).

## Troubleshooting

- **Hotkey doesn't respond, or paste doesn't work in some apps**: the
  `keyboard` library needs to run at the same privilege level as the
  focused window. If you're dictating into an app running as
  Administrator, run Dysctation as Administrator too.
- **No transcription happens**: run `python main.py` from a terminal
  (instead of the built exe) so you can see error output — usually a
  missing/invalid `GROQ_API_KEY` or a microphone permission issue.
- **Wrong microphone is used**: PyAudio uses the system default input
  device. Change it in Windows Sound settings.
