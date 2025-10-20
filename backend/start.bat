@echo off
echo Starting Content Topic Assistant Backend...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Start the server
echo Starting server...
npm run dev

pause