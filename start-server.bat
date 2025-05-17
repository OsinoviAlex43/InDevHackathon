@echo off
echo Starting Hotel Management Server...

rem Kill any existing process on port 8080
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8080') do (
  echo Killing process %%p on port 8080
  taskkill /pid %%p /f >nul 2>&1
)

rem Copy dotenv to .env if needed
if not exist backend\node\.env (
  if exist backend\node\dotenv (
    echo Creating .env file from dotenv template
    copy backend\node\dotenv backend\node\.env >nul
  )
)

rem Start the server
cd backend\node
echo Starting server from %cd%\server.js
node server.js

pause 