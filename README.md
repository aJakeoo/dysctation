# Dysctation

System-wide dictation powered by Groq Whisper. Built for people whose voices aren't always understood.

## Download

- **Windows** — download `Dysctation.exe` from the [latest release](https://github.com/aJakeoo/dysctation/releases)
- **Mac** — download `Dysctation.dmg` from the [latest release](https://github.com/aJakeoo/dysctation/releases)
- **Web** — visit [dysctation.vercel.app](https://dysctation.vercel.app), works in any browser

## How it works

Press `Ctrl+Shift+Space` to start dictating. Speak as you naturally would. Dysctation transcribes your voice using Groq Whisper and pastes the text directly into whatever field is focused.

You'll need a free Groq API key from [console.groq.com](https://console.groq.com) on first launch.

## A note on security warnings

Both Windows and Mac will show a security warning the first time you run Dysctation. That is completely normal for any app that isn't commercially signed -- it always freaks me out too, but it is fine.

- **Windows** — click "More info" then "Run anyway"
- **Mac** — go to System Settings, Privacy and Security, scroll down and click "Open Anyway"

Dysctation is open source. If you are ever unsure, the full source code is right here on this repo.

## Privacy and security

Dysctation is open source and always will be. Here is exactly what happens with your data:

- Audio is recorded locally on your device only while the app is actively listening
- Each audio chunk is sent directly to Groq's Whisper API for transcription and nowhere else
- Groq does not use API data to train models and does not retain it beyond processing
- Your Groq API key is stored locally on your device and never transmitted anywhere except to Groq
- No usage data, analytics, or logs are collected

The source code is fully readable on this repo. If you have concerns, please, read it yourself!

## Branches

- `master` — web app, deployed to Vercel
- `windows-app` — Windows and Mac desktop apps
