@echo off
echo ===============================================
echo    Valorant Skin Peek Bot - Quick Setup
echo ===============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Make sure to install version 16 or higher.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

echo.
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Error: Failed to install dependencies!
    echo.
    echo Try running: npm install --force
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy ".env.example" ".env"
    echo.
    echo ⚠️  IMPORTANT: Edit the .env file and add your Discord bot token!
    echo.
    echo 1. Open .env file in notepad
    echo 2. Replace 'your_discord_bot_token_here' with your actual bot token
    echo 3. Save the file
    echo.
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎯 Setup complete! Next steps:
echo.
echo 1. Make sure you've created a Discord bot and got the token
echo 2. Edit the .env file with your bot token
echo 3. Run: npm start
echo 4. Use /quicksetup command in Discord to configure user tokens
echo.
echo 📖 For detailed setup instructions, see:
echo    - README.md
echo    - DEPLOYMENT_GUIDE.md
echo.
echo ⚡ Quick start: npm start
echo.
pause
