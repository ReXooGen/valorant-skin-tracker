# 🎯 Discord Bot Upload & Setup Guide

This is your complete step-by-step guide to get your Valorant Skin Peek Bot running on Discord.

## 📚 What You'll Need

- ✅ Discord account
- ✅ Computer with Node.js installed
- ✅ Your bot files (this project)
- ✅ 15-30 minutes of time

## 🚀 Step-by-Step Instructions

### Phase 1: Create Discord Bot Application

#### 1.1 Access Discord Developer Portal
1. Open your web browser
2. Go to: https://discord.com/developers/applications
3. Login with your Discord account
4. Click **"New Application"** button

#### 1.2 Name Your Application
1. Enter name: `Valorant Skin Tracker` (or any name you prefer)
2. Click **"Create"**
3. You'll see your new application dashboard

#### 1.3 Add Application Details (Optional but Recommended)
1. **Description**: "Advanced Valorant skin tracking bot with store monitoring and wishlist alerts"
2. **Tags**: Add relevant tags like "Gaming", "Utility"
3. **Upload App Icon**: Create or find a Valorant-themed icon
4. Click **"Save Changes"**

### Phase 2: Create the Bot User

#### 2.1 Navigate to Bot Settings
1. In the left sidebar, click **"Bot"**
2. Click **"Add Bot"** button
3. Confirm by clicking **"Yes, do it!"**

#### 2.2 Configure Bot Settings
1. **Username**: Change to something like "Valorant Skin Tracker"
2. **Public Bot**: Turn **OFF** (recommended for personal use)
3. **Requires OAuth2 Code Grant**: Leave **OFF**
4. **Server Members Intent**: Leave **OFF**
5. **Presence Intent**: Leave **OFF** 
6. **Message Content Intent**: Turn **ON** (if you plan to use message commands)

#### 2.3 Get Your Bot Token
1. Click **"Reset Token"** to generate a fresh token
2. Click **"Copy"** to copy the token
3. **⚠️ IMPORTANT**: Save this token in a secure place
4. **🚫 NEVER share this token publicly!**

### Phase 3: Set Bot Permissions

#### 3.1 Go to OAuth2 URL Generator
1. Click **"OAuth2"** in left sidebar
2. Click **"URL Generator"** tab

#### 3.2 Select Scopes
Check these boxes:
- ✅ `bot`
- ✅ `applications.commands`

#### 3.3 Select Bot Permissions
Under "Bot Permissions", check:

**General Permissions:**
- ✅ View Channels

**Text Permissions:**
- ✅ Send Messages
- ✅ Send Messages in Threads
- ✅ Use Slash Commands
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Add Reactions

#### 3.4 Copy Invite URL
1. Copy the generated URL at the bottom
2. Save this URL - you'll use it to add the bot to servers

### Phase 4: Invite Bot to Your Server

#### 4.1 Choose Your Server
**Option A: Use Existing Server**
- Make sure you have "Manage Server" permissions
- The server should be one where you're comfortable testing

**Option B: Create Test Server**
1. Open Discord
2. Click the **"+"** button in server list
3. Click **"Create My Own"**
4. Choose **"For me and my friends"**
5. Name it: "Valorant Bot Test"

#### 4.2 Invite the Bot
1. Open the OAuth2 URL you copied earlier
2. Select your server from dropdown
3. Click **"Authorize"**
4. Complete captcha if prompted
5. You should see the bot appear in your server (offline)

### Phase 5: Prepare Your Computer

#### 5.1 Install Node.js (if not already installed)
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer
4. Follow installation wizard
5. Restart your computer

#### 5.2 Verify Installation
1. Open Command Prompt (Windows) or Terminal (Mac/Linux)
2. Type: `node --version`
3. You should see something like: `v18.17.0`
4. Type: `npm --version`
5. You should see something like: `9.6.7`

### Phase 6: Setup Bot Files

#### 6.1 Prepare Bot Directory
1. Create a new folder on your computer: `Valorant-Bot`
2. Extract/copy all your bot files into this folder
3. Your folder should contain:
   - `index.js`
   - `package.json`
   - `data/` folder
   - `utils/` folder
   - `scheduler/` folder
   - And other files from your project

#### 6.2 Install Dependencies
1. Open Command Prompt/Terminal
2. Navigate to your bot folder:
   ```bash
   cd path/to/your/Valorant-Bot
   ```
3. Run the installation:
   ```bash
   npm install
   ```
4. Wait for it to complete (may take a few minutes)

#### 6.3 Configure Environment
1. Find the file `.env.example` in your bot folder
2. Make a copy and rename it to `.env`
3. Open `.env` in any text editor (Notepad, VSCode, etc.)
4. Replace `your_discord_bot_token_here` with your actual bot token
5. Save the file

**Your .env file should look like:**
```
DISCORD_TOKEN=your_actual_bot_token_from_discord_developer_portal
```

### Phase 7: Start Your Bot

#### 7.1 Run the Bot
1. In Command Prompt/Terminal (in your bot folder), run:
   ```bash
   npm start
   ```
2. You should see output like:
   ```
   ✅ Logged in as Valorant Skin Tracker#1234
   🔄 Registering slash commands...
   ✅ Slash commands registered successfully
   ```

#### 7.2 Verify Bot is Online
1. Check Discord - the bot should now show as **Online**
2. The bot's status should change from offline to online

### Phase 8: Test Bot Commands

#### 8.1 Test Basic Functionality
1. In your Discord server, type: `/help`
2. If you see the help menu, congratulations! 🎉
3. If commands don't appear, wait 5-10 minutes and try again

#### 8.2 Test User Setup
1. Type: `/quicksetup`
2. Follow the setup process
3. This tests if the main functionality works

## 🎯 What to Do After Setup

### For Bot Owner (You)
1. **Test all commands** to make sure they work
2. **Set up your own account** using `/quicksetup`
3. **Add some skins to wishlist** with `/addwishlist`
4. **Test the store checker** with `/store`

### For Other Users
1. **Share the invite link** with friends who want to use the bot
2. **Help them setup** using `/quicksetup`
3. **Show them the help** command: `/help`

## 🛠️ Troubleshooting Common Issues

### Bot Not Responding
**Problem**: Bot is online but commands don't work
**Solutions**:
- Wait up to 1 hour for slash commands to register globally
- Try restarting the bot: Ctrl+C, then `npm start`
- Check console for error messages

### Token Errors
**Problem**: "Invalid Token" error in console
**Solutions**:
- Double-check your .env file
- Make sure there are no extra spaces
- Generate a new token if needed

### Permission Errors
**Problem**: Bot can't send messages or use commands
**Solutions**:
- Re-invite bot with correct permissions
- Check channel permissions
- Make sure bot role is above other roles

### Dependencies Issues
**Problem**: "Module not found" errors
**Solutions**:
- Run `npm install` again
- Delete `node_modules` folder and run `npm install`
- Update Node.js to latest LTS version

## 📊 Monitoring Your Bot

### Keep It Running
- **For testing**: Keep the Command Prompt/Terminal window open
- **For production**: Consider using PM2 or hosting services

### Check Health
- Monitor the console output for errors
- Test commands regularly
- Watch for user feedback

## 🎉 Success Checklist

- ✅ Discord application created
- ✅ Bot user configured
- ✅ Bot invited to server
- ✅ Node.js installed and working
- ✅ Bot files prepared
- ✅ Dependencies installed
- ✅ Environment configured with bot token
- ✅ Bot running and online
- ✅ Slash commands working
- ✅ Help command responds
- ✅ Basic setup tested

## 🚀 Next Steps

### Enhance Your Bot
1. **Read the full README.md** for advanced features
2. **Check DEPLOYMENT_GUIDE.md** for hosting options
3. **Use QUICK_REFERENCE.md** for daily usage

### Share with Others
1. **Create invite links** for friends
2. **Share setup instructions** (QUICK_REFERENCE.md)
3. **Help users** with `/quicksetup`

### Consider Hosting
- **Local**: Keep running on your computer
- **Cloud**: Use services like Replit, Railway, or VPS
- **24/7**: For automatic daily alerts

## 🆘 Getting Help

If you run into issues:

1. **Check console messages** - often contains helpful error info
2. **Review this guide** - make sure you followed all steps
3. **Check the logs** - look for specific error messages
4. **Ask for help** - Contact `rexoo_` on Discord

## 🎊 Congratulations!

You've successfully created and deployed your Valorant Skin Peek Bot! Your bot is now ready to help track Valorant skins and notify users about their wishlist items.

**Happy botting! 🤖✨**

---

### 📱 Quick Commands Reference

Once your bot is running, users can:
- `/quicksetup` - Set up their Valorant account
- `/store` - Check current store
- `/addwishlist` - Add skins to wishlist
- `/wishlist` - View wishlist
- `/help` - Get comprehensive help

The bot will automatically check stores daily at 7:05 PM WIB and send private messages when wishlist skins are available!
