# 🚀 Valorant Token CLI Tool Guide

The **CLI Token Tool** is the **recommended method** for setting up tokens for the Valorant Skin Tracker bot. It automatically fetches fresh tokens and saves them directly to the bot.

## ✨ Why Use the CLI Tool?

- ✅ **Automatic token fetching** - No manual copy-paste
- ✅ **Direct save to bot** - Tokens saved in correct format
- ✅ **Built-in error handling** - Clear troubleshooting steps
- ✅ **Fresh tokens every time** - Always gets the latest tokens
- ✅ **User-friendly** - Step-by-step guidance

## 📋 Requirements

1. **Discord User ID** - Get this from Discord settings
2. **Riot Games login** - Be logged into Riot in your browser
3. **Browser cookies** - Copy `ssid` and `clid` cookies

## 🔧 How to Use

### Step 1: Get Your Discord User ID
1. Open Discord
2. Go to Settings (gear icon)
3. Go to **Advanced** tab
4. Enable **Developer Mode**
5. Right-click your profile/username
6. Click **Copy User ID**

### Step 2: Run the CLI Tool
1. Open terminal/command prompt
2. Navigate to the bot folder: `cd c:\GAME\valorant-skin-peek-bot`
3. Run: `node get-tokens-cli.js`
4. Follow the prompts

### Step 3: Get Browser Cookies
1. Make sure you're logged into Riot Games in your browser
2. Go to `https://auth.riotgames.com`
3. Press F12 to open developer tools
4. Go to **Application** tab > **Storage** > **Cookies**
5. Find `auth.riotgames.com` cookies
6. Copy the values for:
   - `ssid` cookie
   - `clid` cookie

### Step 4: Complete Setup
1. Paste the cookies when prompted
2. Choose your region (usually `ap` for Asia/Indonesia)
3. Wait for the tool to fetch and save your tokens
4. Done! Your tokens are now ready for the bot

## 🎯 Using Your Tokens

After successful setup, you can use these Discord commands:

- `/store` - Check your Valorant store
- `/addwishlist <skin_name>` - Add skins to wishlist
- `/wishlist` - View your wishlist
- `/checktoken` - Verify tokens are working

## 🔄 When Tokens Expire

Tokens typically expire after a few hours. When they do:

1. The bot will notify you that tokens are invalid
2. Simply re-run: `node get-tokens-cli.js`
3. Follow the same steps to get fresh tokens

## ❓ Troubleshooting

### "Authentication failed" Error
- Your cookies may be expired
- Log out of Riot Games and log back in
- Get fresh cookies from the browser

### "Invalid Discord User ID" Error
- Make sure you copied the complete User ID
- User ID should be around 17-19 digits long
- Enable Developer Mode in Discord settings

### "No access token found" Error
- Make sure you're logged into Riot Games
- Ensure cookies are from `auth.riotgames.com`
- Try using incognito/private browser mode

### "Response status 403" Error
- Your Riot account may need verification
- Make sure Valorant is linked to your Riot account
- Try logging into Valorant game client first

## 🛡️ Security Notes

- Your tokens are stored locally in the bot's data folder
- Tokens are never shared or transmitted elsewhere
- The CLI tool only communicates with official Riot APIs
- Cookies are only used once during token generation

## 🆕 Migration from Manual Methods

If you were previously using `/settoken` or other manual methods:

1. Your existing tokens will continue to work until they expire
2. When they expire, use the CLI tool instead
3. The CLI tool will update your existing user entry
4. No need to reconfigure wishlist or other settings

---

**Note**: The CLI tool is now the **only supported method** for token setup. Manual token commands have been removed for better security and user experience.
