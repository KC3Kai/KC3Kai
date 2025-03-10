@echo off
py --version 2>NUL
if errorlevel 1 goto trypython
py update-kc3kai.py
goto startchrome
:trypython
python update-kc3kai.py
:startchrome
if errorlevel 1 pause
start "" chrome-win\chrome.exe --user-data-dir="../Profile" --load-extension="../KC3Kai/src"
