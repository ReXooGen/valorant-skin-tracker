@echo off
echo 🚀 Valorant Skin Tracker - Advanced Setup
echo ======================================
echo.

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🗄️ Initializing database...
call node scripts/initDatabase.js
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize database
    pause
    exit /b 1
)

echo.
echo ✅ Setup completed successfully!
echo.
echo 🎮 To start the bot:
echo    node index.js
echo.
echo 🌐 Web Dashboard will be available at:
echo    http://localhost:3000
echo.
echo 📚 For more information, check:
echo    - README.md
echo    - ADVANCED_FEATURES_GUIDE.md
echo.
pause
