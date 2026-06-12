@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv" (
    python -m venv .venv
)

call .venv\Scripts\activate.bat

pip install -r requirements.txt
pip install pyinstaller

pyinstaller --noconfirm --onefile --windowed --name Dysctation main.py

if exist ".env" (
    copy /Y ".env" "dist\.env"
)

echo.
echo Build complete: dist\Dysctation.exe
echo Make sure dist\.env contains your real GROQ_API_KEY.

endlocal
