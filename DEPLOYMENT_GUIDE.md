# 🚀 Discord Bot Deployment Guide

This guide will walk you through setting up and deploying your Valorant Skin Peek Bot to Discord.

## 📋 Prerequisites

Before you begin, make sure you have:
- ✅ **Node.js 16+** installed ([Download here](https://nodejs.org/))
- ✅ **Discord account** with Developer Mode enabled
- ✅ **Valorant account** (for testing purposes)
- ✅ **Basic terminal/command prompt** knowledge

## 🤖 Part 1: Creating the Discord Bot

### Step 1: Create Discord Application

1. **Go to Discord Developer Portal**
   - Visit: https://discord.com/developers/applications
   - Click **"New Application"**
   - Enter name: `Valorant Skin Tracker` (or any name you prefer)
   - Click **"Create"**

2. **Configure General Information**
   - Add a **description**: "A bot for tracking Valorant skins and store monitoring"
   - Upload a **bot icon** (optional but recommended)
   - Save changes

### Step 2: Create Bot User

1. **Navigate to Bot Section**
   - Click **"Bot"** in the left sidebar
   - Click **"Add Bot"**
   - Confirm by clicking **"Yes, do it!"**

2. **Configure Bot Settings**
   - **Username**: Choose a good name (e.g., "Valorant Skin Tracker")
   - **Public Bot**: Turn OFF (recommended for personal use)
   - **Requires OAuth2 Code Grant**: Leave OFF
   - **Bot Permissions**: We'll set these up later

3. **Copy Bot Token**
   - Click **"Reset Token"** to generate a new token
   - **IMPORTANT**: Copy this token immediately and keep it secure
   - **Never share this token publicly!**

### Step 3: Set Bot Permissions

1. **Go to OAuth2 Section**
   - Click **"OAuth2"** in left sidebar
   - Click **"URL Generator"**

2. **Select Scopes**
   - ✅ `bot`
   - ✅ `applications.commands`

3. **Select Bot Permissions**
   ```
   General Permissions:
   ✅ Read Messages/View Channels
   
   Text Permissions:
   ✅ Send Messages
   ✅ Send Messages in Threads
   ✅ Use Slash Commands
   ✅ Embed Links
   ✅ Attach Files
   ✅ Read Message History
   ✅ Add Reactions
   ```

4. **Generate Invite URL**
   - Copy the generated URL at the bottom
   - Save this URL - you'll use it to invite the bot to servers

## 🏠 Part 2: Inviting Bot to Your Server

### Option A: Invite to Existing Server (Recommended)

1. **Use the Generated URL**
   - Open the OAuth2 URL you copied earlier
   - Select your server from the dropdown
   - Click **"Authorize"**
   - Complete the captcha if prompted

### Option B: Create a Test Server

1. **Create New Server**
   - Open Discord
   - Click the **"+"** button in server list
   - Click **"Create My Own"**
   - Choose **"For me and my friends"**
   - Name: "Valorant Bot Testing"

2. **Invite Bot**
   - Use the OAuth2 URL to invite the bot
   - Select your new test server

## 💻 Part 3: Setting Up the Bot Code

### Step 1: Prepare Your Environment

1. **Download/Clone Bot Files**
   ```bash
   # If using Git
   git clone <your-repository-url>
   cd valorant-skin-peek-bot
   
   # Or download and extract ZIP file
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

### Step 2: Configure Environment

1. **Create Environment File**
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

2. **Edit .env File**
   Open `.env` in any text editor and add your bot token:
   ```env
   DISCORD_TOKEN=your_actual_bot_token_here
   ```

### Step 3: Test the Bot

1. **Start the Bot**
   ```bash
   npm start
   ```

2. **Look for Success Messages**
   ```
   ✅ Logged in as YourBotName#1234
   🔄 Registering slash commands...
   ✅ Slash commands registered successfully
   ```

3. **Test in Discord**
   - Go to your Discord server
   - Type `/help` to see if commands work
   - If commands don't appear, wait a few minutes (can take up to 1 hour for global commands)

## 🔧 Part 4: User Setup (After Bot is Running)

### For Bot Users

1. **Get Discord User ID**
   - Discord Settings → Advanced → Enable Developer Mode
   - Right-click your profile → Copy User ID

2. **Setup Tokens**
   - Use `/quicksetup` command in Discord (easiest method)
   - Or run `node get-tokens-cli.js` in terminal

3. **Add Skins to Wishlist**
   ```
   /addwishlist Prime Phantom
   /addwishlist Reaver Vandal
   ```

4. **Check Store**
   ```
   /store
   ```

## 🌐 Part 5: Hosting Options

### Option A: Local Hosting (Development)

**Pros**: Free, full control, easy debugging
**Cons**: Computer must stay on, no automatic restarts

1. Keep the terminal open with `npm start`
2. Bot runs as long as your computer is on
3. Great for testing and personal use

### Option B: Free Cloud Hosting

#### Replit (Recommended for beginners)
1. Create account at https://replit.com
2. Create new Node.js project
3. Upload your bot files
4. Add environment variables in Secrets tab
5. Install packages and run

#### Railway
1. Create account at https://railway.app
2. Connect GitHub repository
3. Deploy automatically
4. Add environment variables

#### Heroku (with limitations)
1. Create Heroku account
2. Install Heroku CLI
3. Deploy using git
4. **Note**: Free tier has limitations

### Option C: VPS/Dedicated Server

**Pros**: Full control, always online, best performance
**Cons**: Costs money, requires more technical knowledge

Popular options:
- DigitalOcean ($5/month)
- Linode ($5/month)
- Vultr ($3.50/month)
- AWS EC2 (free tier available)

## 🔧 Part 6: Advanced Configuration

### Setting Up Process Manager (For VPS)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Start Bot with PM2**
   ```bash
   pm2 start index.js --name "valorant-bot"
   pm2 save
   pm2 startup
   ```

### Setting Up Auto-Restart

1. **Create restart script** (`restart.sh`):
   ```bash
   #!/bin/bash
   cd /path/to/your/bot
   npm start
   ```

2. **Add to crontab**:
   ```bash
   crontab -e
   # Add line:
   @reboot /path/to/restart.sh
   ```

## 🛠️ Troubleshooting

### Common Issues

#### Bot Not Responding
```
❌ Problem: Bot online but commands don't work
✅ Solution: 
   - Check console for errors
   - Verify bot has correct permissions
   - Wait for slash commands to register (up to 1 hour)
```

#### Token Errors
```
❌ Problem: "Invalid Token" or "Unauthorized"
✅ Solution:
   - Double-check token in .env file
   - Regenerate token if needed
   - Ensure no extra spaces in .env
```

#### Permission Errors
```
❌ Problem: "Missing Permissions" 
✅ Solution:
   - Re-invite bot with correct permissions
   - Check server role hierarchy
   - Ensure bot has necessary channel permissions
```

#### Node.js Issues
```
❌ Problem: "Module not found" or version errors
✅ Solution:
   - Run npm install
   - Update Node.js to 16+
   - Delete node_modules and reinstall
```

### Getting Help

1. **Check Console Logs**: Always check the terminal output for error messages
2. **Discord Developer Tools**: Use F12 in Discord to check for API errors
3. **Bot Logs**: Enable debug logging in development
4. **Community**: Join Discord servers for bot development help

## 📊 Monitoring Your Bot

### Important Metrics to Watch

1. **Uptime**: How long the bot stays online
2. **Response Time**: How quickly commands execute
3. **Error Rate**: Number of failed commands
4. **Memory Usage**: Ensure no memory leaks

### Simple Monitoring Script

Create `monitor.js`:
```javascript
const { Client } = require('discord.js');

setInterval(() => {
    console.log(`Bot Status: ${client.readyAt ? 'Online' : 'Offline'}`);
    console.log(`Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Servers: ${client.guilds.cache.size}`);
    console.log('---');
}, 60000); // Every minute
```

## 🎯 Best Practices

### Security
- ✅ Never commit `.env` files to version control
- ✅ Use environment variables for all sensitive data
- ✅ Regularly rotate bot tokens
- ✅ Limit bot permissions to minimum required

### Performance
- ✅ Use connection pooling for databases
- ✅ Implement proper error handling
- ✅ Cache frequently accessed data
- ✅ Monitor memory usage

### User Experience
- ✅ Provide clear error messages
- ✅ Use ephemeral replies for personal data
- ✅ Implement rate limiting
- ✅ Add comprehensive help commands

## 🎉 Final Steps

1. **Test All Features**
   - Run through all commands
   - Test with multiple users
   - Verify automation works

2. **Monitor for Issues**
   - Check logs regularly
   - Watch for error patterns
   - Monitor user feedback

3. **Plan for Growth**
   - Consider scaling needs
   - Plan feature updates
   - Gather user feedback

**Congratulations! Your Valorant Skin Peek Bot is now live and ready to help users track their favorite skins! 🎮✨**

---

## 📞 Support

If you encounter issues:
1. Check this guide and README.md
2. Review console error messages
3. Contact the developer: `rexoo_` on Discord

**Happy Discord botting! 🚀**
