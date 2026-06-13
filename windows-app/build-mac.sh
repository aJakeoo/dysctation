#!/bin/bash
# Build a standalone Dysctation.app and package it into a .dmg.
#
# Requires PyInstaller (installed below) and create-dmg
# (`brew install create-dmg`).
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate

pip install -r requirements-mac.txt
pip install pyinstaller

pyinstaller --noconfirm --clean --windowed --name Dysctation \
    --osx-bundle-identifier com.dysctation.app \
    --collect-all groq \
    main.py

# Hide the app from the Dock and Cmd+Tab -- it only lives in the menu bar.
/usr/libexec/PlistBuddy -c "Add :LSUIElement bool true" \
    "dist/Dysctation.app/Contents/Info.plist" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :LSUIElement true" \
    "dist/Dysctation.app/Contents/Info.plist"

if [ -f ".env" ]; then
    cp ".env" "dist/Dysctation.app/Contents/MacOS/.env"
fi

echo
echo "App bundle built: dist/Dysctation.app"

if ! command -v create-dmg >/dev/null 2>&1; then
    echo "create-dmg not found -- skipping .dmg packaging."
    echo "Install it with: brew install create-dmg"
    exit 0
fi

rm -f "dist/Dysctation.dmg"

create-dmg \
    --volname "Dysctation" \
    --window-size 480 300 \
    --icon-size 100 \
    --icon "Dysctation.app" 130 120 \
    --app-drop-link 350 120 \
    "dist/Dysctation.dmg" \
    "dist/Dysctation.app"

echo
echo "Build complete: dist/Dysctation.dmg"
echo "If dist/.env doesn't contain a real GROQ_API_KEY, the app will prompt for one"
echo "on first run and save it next to the executable inside the app bundle."
echo
echo "On first launch, macOS will ask you to grant Dysctation Accessibility"
echo "access (System Settings > Privacy & Security > Accessibility) so it can"
echo "use the global hotkey and paste transcribed text."
