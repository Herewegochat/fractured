@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py -3 server.py
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        python server.py
    ) else (
        echo Python is not installed or is not on your PATH.
        echo You can still open index.html by double-clicking it.
        echo For localhost, install Python from https://www.python.org/downloads/
        pause
    )
)
