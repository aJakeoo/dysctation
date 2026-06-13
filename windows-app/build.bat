@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv" (
    python -m venv .venv
)

call .venv\Scripts\activate.bat

pip install -r requirements.txt
pip install pyinstaller

pyinstaller --noconfirm --clean --onefile --windowed --name Dysctation ^
    --hidden-import pystray._win32 ^
    --hidden-import PIL._tkinter_finder ^
    --collect-all groq ^
    main.py

if exist ".env" (
    copy /Y ".env" "dist\.env"
)

echo.
echo Build complete: dist\Dysctation.exe
echo This exe is self-contained -- no Python install is needed on the target machine.
echo If dist\.env doesn't contain a real GROQ_API_KEY, the app will prompt for one
echo on first run and save it there automatically.

endlocal
