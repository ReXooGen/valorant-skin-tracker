# 🎮 Valorant Skin Tracker Bot

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![Web Dashboard](https://img.shields.io/badge/Web-Dashboard-brightgreen.svg)](#web-dashboard)
[![License](https://img.shields.io/badge/License-Educational-yellow.svg)](#license)

A comprehensive Valorant skin tracking solution featuring a Discord bot with intelligent store monitoring, automated alerts, advanced wishlist management, and a full-featured web dashboard. Built for educational purposes to demonstrate modern bot development, web interfaces, and API integration.

## ✨ Features

### 🌐 Web Dashboard
- **Modern Web Interface** - Beautiful, responsive dashboard accessible via browser
- **Multi-language Support** - Full English and Indonesian localization
- **Real-time Updates** - Live store and wishlist synchronization
- **Mobile-Friendly** - Optimized for phone, tablet, and desktop
- **Advanced Analytics** - Detailed charts, statistics, and insights
- **Token Management** - Easy setup and monitoring through web interface

### 🛍️ Store Management
- **Real-time Store Checking** - Fetch current Valorant store instantly
- **Grid Layout Design** - Modern card-based store display
- **High-Quality Images** - Display skins with full render and thumbnails
- **Smart Image Fallbacks** - Multiple image sources for reliability
- **VP & IDR Pricing** - Automatic currency conversion to Indonesian Rupiah
- **Store Statistics** - Total skins, average prices, and analytics
- **Filter System** - Filter by All/Wishlist/Premium/Budget categories

### 📝 Smart Wishlist System
- **Advanced Search** - Fuzzy search with auto-correct suggestions
- **Auto-complete** - Intelligent skin name suggestions with thumbnails
- **Modern Card Design** - Beautiful wishlist cards with animations
- **Wishlist Detection** - Instantly spot wishlist skins in store with badges
- **Easy Management** - Add/remove skins with intuitive interface
- **Priority System** - Organize skins by importance levels
- **Backup & Restore** - Import/export wishlist functionality

### 🔔 Intelligent Alerts
- **Manual Alerts** - Immediate notifications when checking store
- **Automated Daily Checks** - Auto-check at 7:05 PM WIB (after store reset)
- **Direct Messages** - Private notifications for wishlist matches
- **Anti-Spam Protection** - Maximum one alert per skin per day
- **Email Notifications** - Optional email alerts for wishlist matches

### � Analytics & Insights
- **Personal Analytics** - Track your store activity and wishlist performance
- **Price History** - Monitor skin price trends over time
- **Activity Timeline** - View your interaction history
- **Statistics Dashboard** - Comprehensive data visualization
- **Usage Metrics** - Understand your skin tracking patterns
- **Export Data** - Download your analytics for external use

### �🔧 Advanced Features
- **Token Management** - Health monitoring and auto-expiry detection
- **Database Integration** - SQLite database for reliable data storage
- **OAuth Integration** - Discord Connections support for seamless auth
- **Error Handling** - Comprehensive error messages and troubleshooting
- **Multi-Region Support** - AP, NA, EU regions supported
- **Scheduled Tasks** - Automated background processes
- **API Rate Limiting** - Intelligent request management

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
   - **Web Dashboard**: Access the web interface for easy setup

5. **Start the bot:**
   ```bash
   node index.js
   ```

6. **Access Web Dashboard:**
   - Open browser to `http://localhost:3000`
   - Enter your Discord User ID
   - Complete setup through web interface
   - Enjoy enhanced features!

## 🎯 Commands Overview

### 🔧 Setup Commands
| Command | Description |
|---------|-------------|
| `/quicksetup` | Quick token setup directly in Discord |
| `/autotokens` | CLI tool guide and instructions |
| `/checktoken` | Verify if your tokens are still valid |
| `/webdashboard` | Get web dashboard access link |

### 📝 Wishlist Commands
| Command | Description |
|---------|-------------|
| `/addwishlist <skin_name>` | Add a skin to your wishlist with auto-suggestions |
| `/wishlist` | View your current wishlist |
| `/removewishlist <skin_name>` | Remove a skin from wishlist |

### 🛍️ Store Commands
| Command | Description |
|---------|-------------|
| `/store` | Check your Valorant store for skins |
| `/bundles` | Check current featured bundles |
| `/nightmarket` | Check Night Market discounts (if active) |

### 📊 Analytics Commands
| Command | Description |
|---------|-------------|
| `/analytics [period]` | View personal analytics and statistics |
| `/pricehistory <skin_name> [days]` | View price history for specific skin |

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

### Method 3: Web Dashboard (Modern)
1. Start the bot: `node index.js`
2. Open browser to `http://localhost:3000`
3. Enter your Discord User ID
4. Follow the web-based setup wizard
5. Manage everything through the beautiful dashboard! 🌐

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
├── 📁 analytics/              # Analytics service
│   └── service.js             # Analytics data processing
├── 📁 data/                   # Data storage
│   ├── alert-history.json     # Alert tracking
│   ├── tokens.json           # User tokens
│   ├── wishlist.json         # User wishlists
│   └── valorant_tracker.db   # SQLite database
├── 📁 database/              # Database services
│   └── service.js            # Database operations
├── 📁 locales/               # Internationalization
│   ├── en.json               # English translations
│   └── id.json               # Indonesian translations
├── 📁 scheduler/             # Automated tasks
│   └── dailyChecker.js       # Daily store checker
├── 📁 utils/                 # Utility functions
│   ├── valorantApi.js        # Valorant API integration
│   └── i18n.js               # Internationalization helper
├── 📁 web/                   # Web dashboard
│   ├── 📁 public/            # Static files
│   │   ├── css/              # Stylesheets
│   │   └── js/               # Client-side JavaScript
│   ├── 📁 routes/            # Web routes
│   │   ├── api.js            # API endpoints
│   │   ├── auth.js           # Authentication
│   │   ├── dashboard.js      # Dashboard routes
│   │   └── analytics.js      # Analytics routes
│   ├── 📁 views/             # EJS templates
│   │   ├── dashboard/        # Dashboard pages
│   │   └── auth/             # Authentication pages
│   ├── � utils/             # Web utilities
│   └── server.js             # Express server
├── �📄 index.js               # Main bot file
├── 📄 get-tokens-cli.js      # CLI token tool
├── 📄 setup-advanced.bat     # Windows setup script
└── 📄 package.json           # Dependencies
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

# Web Dashboard Configuration
WEB_URL=http://localhost:3000
PORT=3000
ENABLE_WEB_DASHBOARD=true

# Optional: For advanced features
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/callback

# Database Configuration
DATABASE_PATH=./data/valorant_tracker.db

# Internationalization
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,id
```

## 🌐 Web Dashboard

### Features
The web dashboard provides an enhanced experience beyond Discord commands:

#### 🎨 **Beautiful Interface**
- Modern, responsive design that works on all devices
- Dark theme optimized for extended use
- Smooth animations and micro-interactions
- Intuitive navigation and user experience

#### 🛍️ **Enhanced Store View**
- Grid-based store layout with card designs
- Real-time store updates and refresh functionality
- Advanced filtering (All/Wishlist/Premium/Budget)
- Store statistics and analytics
- High-quality skin images with fallbacks

#### 📝 **Advanced Wishlist Management**
- Add skins with intelligent search and auto-suggestions
- Beautiful wishlist cards with animations
- Batch operations and wishlist organization
- Import/export functionality
- Priority system for skin organization

#### 📊 **Comprehensive Analytics**
- Personal usage statistics and insights
- Price history charts and trends
- Activity timeline and tracking
- Visual data representation with charts
- Export capabilities for data analysis

#### ⚙️ **Easy Configuration**
- Web-based token setup and management
- Settings management with real-time validation
- Multi-language support (English/Indonesian)
- Token health monitoring and alerts

### Accessing the Dashboard
1. Start the bot: `node index.js`
2. Open browser to `http://localhost:3000`
3. Enter your Discord User ID
4. Complete any required setup
5. Enjoy the enhanced experience!

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

### Web Dashboard
![Modern web dashboard with dark theme](https:https://github.com/ReXooGen/valorant-skin-tracker/blob/main/image/Dashboard.png)

### Store Display
![Grid-based store display with filtering](https://https://github.com/ReXooGen/valorant-skin-tracker/blob/main/image/Store.png)

### Wishlist Management
![Enhanced wishlist interface with card design](https://https://github.com/ReXooGen/valorant-skin-tracker/blob/main/image/Wishlist.png)


### Analytics Dashboard
![Comprehensive analytics with charts](https:https://github.com/ReXooGen/valorant-skin-tracker/blob/main/image/Analytics.png)

### Settings Display
![Comprehensive analytics with charts](https:https://github.com/ReXooGen/valorant-skin-tracker/blob/main/image/Settings.png)


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

#### Web Dashboard Not Loading
- **Solution**: Check if port 3000 is available, try different port
- **Check**: Ensure `ENABLE_WEB_DASHBOARD=true` in .env file
- **Alternative**: Use Discord commands if web interface is unavailable

#### Database Connection Issues
- **Solution**: Ensure data directory exists and is writable
- **Check**: Verify SQLite database file permissions
- **Reset**: Delete `valorant_tracker.db` to recreate database

### Getting Help

1. **Check `/help`** command for comprehensive guidance
2. **Verify setup** with `/checktoken` command
3. **Test features** with `/autocheck test`
4. **Web Dashboard**: Use `/webdashboard` for web interface access
5. **Contact developer**: `rexoo_` on Discord for bug reports

## 🔄 Daily Automation

The bot automatically:
- **Checks stores** at 7:05 PM WIB daily
- **Sends DM alerts** when wishlist skins are available
- **Monitors token health** and notifies about expiration
- **Prevents spam** with intelligent alert limiting

## ⚠️ Important Notes

### Educational Purpose
This bot is created for **educational purposes only** to demonstrate:
- Modern Discord bot development with Discord.js v14
- Full-stack web development with Express.js and EJS
- RESTful API design and implementation
- Database integration with SQLite
- Real-time web interfaces and responsive design
- Internationalization and multi-language support
- Automated scheduling and background tasks
- User authentication and security best practices

### Respect Terms of Service
- Always respect Riot Games' Terms of Service
- Use responsibly and ethically
- This tool is for learning and personal use only
- Educational demonstration of modern web technologies

### Privacy & Security
- Tokens are stored locally in encrypted JSON files
- Database uses SQLite for local data storage
- No data is transmitted to external servers
- Users control their own authentication data
- Web dashboard runs locally on your machine

## 📋 Dependencies

```json
{
  "discord.js": "^14.21.0",
  "axios": "^1.10.0", 
  "dotenv": "^17.0.1",
  "express": "^5.1.0",
  "ejs": "^3.1.10",
  "sqlite3": "^5.1.7",
  "node-cron": "^4.2.0",
  "cors": "^2.8.5",
  "multer": "^1.4.5-lts.1",
  "helmet": "^8.0.0",
  "compression": "^1.7.5"
}
```

### Key Technologies
- **Backend**: Node.js with Express.js framework
- **Database**: SQLite3 for reliable local storage
- **Frontend**: EJS templating with modern CSS/JavaScript
- **Discord**: Discord.js v14 for bot functionality
- **Security**: Helmet.js for security headers
- **Performance**: Compression middleware for optimization

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

### ✅ Completed Features
- [x] Discord bot with slash commands
- [x] Real-time store checking and wishlist management
- [x] Automated daily alerts and notifications
- [x] Comprehensive web dashboard
- [x] Multi-language support (English/Indonesian)
- [x] Advanced analytics and statistics
- [x] Database integration with SQLite
- [x] Mobile-responsive web interface
- [x] Price history tracking
- [x] Modern UI with animations and themes

### 🚧 In Development
- [ ] Enhanced price prediction algorithms
- [ ] Advanced wishlist organization features
- [ ] Social features and user interactions
- [ ] Extended skin metadata and information
- [ ] Performance optimizations and caching

### 🔮 Future Plans
- [ ] Mobile app development (React Native)
- [ ] Cloud deployment options
- [ ] Advanced machine learning for price predictions
- [ ] Community features and sharing
- [ ] Extended API integrations
- [ ] Plugin system for extensibility

## 🙏 Acknowledgments

- **Riot Games** for the Valorant API and game content
- **Discord.js** community for excellent documentation and support
- **Node.js** ecosystem for powerful development tools
- **Express.js** for robust web framework capabilities
- **SQLite** for reliable local database solutions
- **Open Source Community** for inspiration and best practices
- **Educational Community** - Built for learning modern web development

## 🌟 Star History

If this project helped you learn or build something amazing, please consider giving it a star! ⭐

---

**Made with ❤️ for the Valorant community and educational purposes**

**🎓 Educational Focus**: This project demonstrates modern full-stack development, API integration, real-time web interfaces, and Discord bot development.

For questions, suggestions, or bug reports, contact: `rexoo_` on Discord
