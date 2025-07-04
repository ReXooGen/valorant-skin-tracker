#!/bin/bash

echo "==============================================="
echo "   Valorant Skin Peek Bot - Quick Setup"
echo "==============================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Make sure to install version 16 or higher."
    echo
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "⚠️  Warning: Node.js version is less than 16"
    echo "Please update to Node.js 16 or higher for best compatibility"
    echo
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies!"
    echo
    echo "Try running: npm install --force"
    echo
    exit 1
fi

echo
echo "✅ Dependencies installed successfully!"
echo

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo
    echo "⚠️  IMPORTANT: Edit the .env file and add your Discord bot token!"
    echo
    echo "1. Open .env file in your text editor"
    echo "2. Replace 'your_discord_bot_token_here' with your actual bot token"
    echo "3. Save the file"
    echo
else
    echo "✅ .env file already exists"
fi

echo
echo "🎯 Setup complete! Next steps:"
echo
echo "1. Make sure you've created a Discord bot and got the token"
echo "2. Edit the .env file with your bot token:"
echo "   nano .env  (or use your preferred editor)"
echo "3. Run: npm start"
echo "4. Use /quicksetup command in Discord to configure user tokens"
echo
echo "📖 For detailed setup instructions, see:"
echo "   - README.md"
echo "   - DEPLOYMENT_GUIDE.md"
echo
echo "⚡ Quick start: npm start"
echo

# Make the script executable
chmod +x setup.sh

echo "✅ Setup script is now executable"
echo
