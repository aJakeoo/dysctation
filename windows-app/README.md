# Dysctation Windows Tray App

A lightweight Windows system tray dictation tool. Toggle a global
hotkey to start listening, speak, and your words are transcribed by
Groq's Whisper `large-v3` model and pasted directly into whatever text
field is currently focused.

## How it works

- Sits in the system tray as a blue mic icon, drawn programmatically
  with Pillow (no image files needed). A small red dot appears on the
  icon while listening.
- A small always-on-top status widget sits in the bottom-right corner
  of the screen: a semi-transparent, rounded, borderless panel showing
  a grey mic + "Idle" when off, or a pulsing blue mic + "Listening..."
  while active. It won't steal focus or take keyboard activation
  (`WS_EX_NOACTIVATE` / `WS_EX_TOOLWINDOW`), so it stays out of the way
  of whatever you're typing into.
- **Ctrl+Shift+Space** toggles listening on/off — press once to start,
  press again to stop (toggle mode, not hold-to-talk).
- While listening, the app continuously records from your default
  microphone.
- When it detects ~1.5 seconds of silence after speech (and the chunk
  is at least 0.5 seconds long), that chunk is sent to Groq Whisper
  `large-v3` for transcription.
- The transcribed text is copied to the clipboard and pasted into the
  focused field via a simulated Ctrl+V.
- Listening continues, repeating this for each pause, until you press
  the hotkey again.

## First-run setup

If `windows-app/.env` doesn't contain a `GROQ_API_KEY`, a small setup
window appears on launch asking you to paste one, with a link to
https://console.groq.com to get a free key. Saving it writes
`GROQ_API_KEY=...` to `.env` and the app continues starting up
normally — no manual file editing required.

## Tray menu

Right-click the tray icon for:

- **Toggle listening (Ctrl+Shift+Space)** — same as the hotkey.
- **Adjust pause sensitivity...** — opens a small window with a
  "Pause before send" slider (0.5–5 seconds, default 1.5s) controlling
  how long you can pause before a chunk is sent for transcription.
  Saved to `settings.json` so it persists between sessions.
- **Change API key...** — opens a small window to paste a new Groq API
  key. Saves it to `.env` and re-initializes the Groq client
  immediately, no restart needed.
- **Quit**.

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

You can either edit `.env` (or copy `.env.example` to `.env`) and set:

```
GROQ_API_KEY=your_groq_api_key_here
```

...or just leave it unset and use the first-run setup window described
above. Get a key from https://console.groq.com. `.env` and
`settings.json` are both gitignored, so your key and preferences stay
local.

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
and PyInstaller, and produces a fully self-contained `dist\Dysctation.exe`
(no separate Python install needed on the target machine). If `.env`
exists, it's copied alongside the exe; otherwise the exe will show the
first-run setup window on launch and create `.env` itself.

To run the built app, double-click `dist\Dysctation.exe`, or add a
shortcut to it in your Windows Startup folder
(`shell:startup`) to launch it on login.

## Configuration

- **Pause before send** (how long to wait in silence before sending a
  chunk) is adjustable from the tray menu ("Adjust pause sensitivity...")
  and persisted in `settings.json` (default `1.5` seconds).
- The Groq API key is adjustable from the tray menu ("Change API
  key...") and stored in `.env`.

Remaining tunable constants are at the top of `main.py`:

- `SILENCE_THRESHOLD` — RMS amplitude below which audio is considered
  silence. Raise this if background noise triggers false
  transcriptions; lower it if quiet speech isn't being detected.
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
