# 🎮 Valorant Skin Peek Bot

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Educational-yellow.svg)](#license)

A sophisticated Discord bot for tracking Valorant skins with intelligent store monitoring, automated alerts, and comprehensive wishlist management. Built for educational purposes to demonstrate Discord bot development and API integration.

## ✨ Features

### 🛍️ Store Management
- **Real-time Store Checking** - Fetch current Valorant store instantly
- **High-Quality Images** - Display skins with full render and thumbnails
- **VP & IDR Pricing** - Automatic currency conversion to Indonesian Rupiah
- **Store Reset Timer** - Know exactly when the store refreshes

### 📝 Smart Wishlist System
- **Fuzzy Search** - Add skins by partial names (e.g., "Prime Phantom")
- **Auto-complete** - Intelligent skin name suggestions
- **Wishlist Detection** - Instantly spot wishlist skins in store
- **Easy Management** - Add/remove skins with simple commands

### 🔔 Intelligent Alerts
- **Manual Alerts** - Immediate notifications when checking store
- **Automated Daily Checks** - Auto-check at 7:05 PM WIB (after store reset)
- **Direct Messages** - Private notifications for wishlist matches
- **Anti-Spam Protection** - Maximum one alert per skin per day

### 🔧 Advanced Features
- **Token Management** - Health monitoring and auto-expiry detection
- **OAuth Integration** - Discord Connections support for seamless auth
- **Error Handling** - Comprehensive error messages and troubleshooting
- **Multi-Region Support** - AP, NA, EU regions supported

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Discord account with Developer Mode enabled
- Valorant account with store access

### Installation

1. **Clone or Download** the bot files
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   ```

4. **Configure the bot:**
   Use one of these setup methods:
   - **Quick Setup** (Recommended): Use `/quicksetup` command in Discord
   - **CLI Tool**: Run `node get-tokens-cli.js` for guided setup

5. **Start the bot:**
   ```bash
   node index.js
   ```

## 🎯 Commands Overview

### 🔧 Setup Commands
| Command | Description |
|---------|-------------|
| `/quicksetup` | Quick token setup directly in Discord |
| `/autotokens` | CLI tool guide and instructions |
| `/checktoken` | Verify if your tokens are still valid |

### 📝 Wishlist Commands
| Command | Description |
|---------|-------------|
| `/addwishlist <skin_name>` | Add a skin to your wishlist |
| `/wishlist` | View your current wishlist |
| `/removewishlist <skin_name>` | Remove a skin from wishlist |

### 🛍️ Store Commands
| Command | Description |
|---------|-------------|
| `/store` | Check your Valorant store for skins |

### ⚙️ Advanced Commands
| Command | Description |
|---------|-------------|
| `/autocheck status` | View automatic checker status |
| `/autocheck test` | Test the automatic checker |
| `/help` | Comprehensive help with interactive buttons |

## 🔐 Setup Guide

### Method 1: Quick Setup (Easiest)
1. Run `/quicksetup` in Discord
2. Enter your Discord User ID
3. Provide your `ssid` and `clid` cookies from browser
4. Select your region (ap/na/eu)
5. Done! ✅

### Method 2: CLI Tool
1. Run `node get-tokens-cli.js` in terminal
2. Follow the step-by-step guidance
3. Enter required information when prompted
4. Tokens will be automatically saved

### Getting Required Information

#### Discord User ID
1. Discord Settings → Advanced → Enable Developer Mode
2. Right-click your profile → Copy User ID

#### Browser Cookies (ssid & clid)
1. Go to [auth.riotgames.com](https://auth.riotgames.com) (make sure you're logged in)
2. Press F12 → Application/Storage → Cookies → auth.riotgames.com
3. Copy the values for `ssid` and `clid` cookies

## 🏗️ Project Structure

```
valorant-skin-peek-bot/
├── 📁 data/                    # Data storage
│   ├── alert-history.json      # Alert tracking
│   ├── tokens.json            # User tokens
│   └── wishlist.json          # User wishlists
├── 📁 scheduler/              # Automated tasks
│   ├── dailyCheck.js          # Daily store checker
│   └── dailyChecker.js        # Scheduler implementation
├── 📁 utils/                  # Utility functions
│   └── valorantApi.js         # Valorant API integration
├── 📁 web/                    # Web interface
│   └── dashboard.js           # OAuth dashboard
├── 📄 index.js                # Main bot file
├── 📄 get-tokens-cli.js       # CLI token tool
├── 📄 setup-wizard.js         # Setup utilities
├── 📄 oauth-server.js         # OAuth server
└── 📄 package.json            # Dependencies
```

## 🛡️ Discord Bot Setup

### Creating a Discord Application

1. **Go to Discord Developer Portal**
   - Visit [discord.com/developers/applications](https://discord.com/developers/applications)
   - Click "New Application"
   - Name your application (e.g., "Valorant Skin Tracker")

2. **Configure Bot Settings**
   - Go to "Bot" section in left sidebar
   - Click "Add Bot"
   - Copy the Bot Token (keep this secret!)
   - Enable "Message Content Intent" if needed

3. **Set Bot Permissions**
   - Go to "OAuth2" → "URL Generator"
   - Select "bot" and "applications.commands" scopes
   - Select required permissions:
     - Send Messages
     - Use Slash Commands
     - Embed Links
     - Attach Files
     - Send Messages in Threads

4. **Invite Bot to Server**
   - Copy the generated URL
   - Open it in browser
   - Select your server and authorize

### Environment Configuration

Create a `.env` file:
```env
# Discord Bot Token (Required)
DISCORD_TOKEN=your_bot_token_here

# Optional: For advanced features
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/callback
```

## 🔧 Configuration

### Supported Regions
- **AP** (Asia Pacific) - Recommended for Indonesian users
- **NA** (North America)
- **EU** (Europe)

### Currency Conversion
The bot automatically converts VP prices to Indonesian Rupiah based on official Riot pricing:
- Accurate VP-to-IDR conversion
- Real-time pricing from Valorant store
- Total wishlist cost calculation

## 🎨 Screenshots

### Store Display
![Store display with skin images and pricing](https://via.placeholder.com/800x400/ff4655/ffffff?text=Store+Display+Screenshot)

### Wishlist Management
![Wishlist interface showing added skins](https://via.placeholder.com/800x400/00ff88/ffffff?text=Wishlist+Management+Screenshot)

### Alert System
![Alert notification for wishlist matches](https://via.placeholder.com/800x400/0099ff/ffffff?text=Alert+System+Screenshot)

## 🐛 Troubleshooting

### Common Issues

#### Token Expired (BAD_CLAIMS)
- **Solution**: Use `/quicksetup` or `/autotokens` to get fresh tokens
- **Prevention**: Enable DM notifications for auto-expiry alerts

#### Unauthorized Access (UNAUTHORIZED)
- **Solution**: Verify cookies are correct and from correct Riot account
- **Check**: Ensure you're logged into Valorant/Riot Games

#### Missing Store Access (MISSING_ENTITLEMENT)
- **Solution**: Use tokens from account that owns Valorant
- **Check**: Ensure region matches your account region

#### OAuth Redirect Issues
- **Solution**: Some accounts may need manual token setup
- **Alternative**: Use `/quicksetup` instead of OAuth method

### Getting Help

1. **Check `/help`** command for comprehensive guidance
2. **Verify setup** with `/checktoken` command
3. **Test features** with `/autocheck test`
4. **Contact developer**: `rexoo_` on Discord for bug reports

## 🔄 Daily Automation

The bot automatically:
- **Checks stores** at 7:05 PM WIB daily
- **Sends DM alerts** when wishlist skins are available
- **Monitors token health** and notifies about expiration
- **Prevents spam** with intelligent alert limiting

## ⚠️ Important Notes

### Educational Purpose
This bot is created for **educational purposes only** to demonstrate:
- Discord bot development with Discord.js
- API integration and data handling
- Automated scheduling and notifications
- User authentication and security

### Respect Terms of Service
- Always respect Riot Games' Terms of Service
- Use responsibly and ethically
- This tool is for learning and personal use

### Privacy & Security
- Tokens are stored locally in JSON files
- No data is transmitted to external servers
- Users control their own authentication data

## 📋 Dependencies

```json
{
  "discord.js": "^14.21.0",
  "axios": "^1.10.0",
  "dotenv": "^17.0.1",
  "express": "^5.1.0",
  "node-cron": "^4.2.0",
  "cors": "^2.8.5"
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Fork the repository
2. Install dependencies: `npm install`
3. Create feature branch: `git checkout -b feature-name`
4. Make changes and test thoroughly
5. Submit pull request with detailed description

## 📄 License

This project is licensed for **Educational Use Only**. Created to demonstrate Discord bot development, API integration, and automated notification systems.

## 🎯 Roadmap

- [ ] Web dashboard for easier token management
- [ ] Multi-language support (Indonesian, English)
- [ ] Advanced statistics and analytics
- [ ] Skin price history tracking
- [ ] Bundle and collection monitoring
- [ ] Mobile-friendly web interface

## 🙏 Acknowledgments

- **Riot Games** for the Valorant API
- **Discord.js** community for excellent documentation
- **Node.js** ecosystem for powerful tools
- **Educational purpose** - Built for learning and development

---

**Made with ❤️ for the Valorant community**

For questions, suggestions, or bug reports, contact: `rexoo_` on Discord
