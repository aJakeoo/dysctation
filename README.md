# Dysctation

System-wide dictation for Windows powered by Groq Whisper. Built for people whose voices aren't always understood.

## Web app

Visit [dysctation.vercel.app](https://dysctation.vercel.app) -- works in any browser, no install needed.

## Windows app

Download `Dysctation.exe` from the latest release. No Python required.

First launch: you'll be prompted for a free Groq API key. Get one at [console.groq.com](https://console.groq.com), takes 30 seconds, no credit card.

You'll see a Windows security warning when you first run it. That's normal for any unsigned app. Click "More info" then "Run anyway" to proceed.

### How to use

- Press `Ctrl+Shift+Space` to start dictating
- Speak, text pastes automatically into whatever field is focused
- Press `Ctrl+Shift+Space` again to stop
- The status pill in the bottom right shows Idle / Listening

### Settings (right-click the tray icon)

- **Adjust pause sensitivity** -- control how long a silence triggers a paste
- **Change API key** -- swap your Groq key anytime
