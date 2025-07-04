# 📋 Quick Reference Card

## 🚀 Essential Commands

### First Time Setup
```
/quicksetup    # Easiest way to get started
/help          # Comprehensive help guide
/checktoken    # Verify your setup works
```

### Daily Usage
```
/store         # Check your current store
/addwishlist   # Add skin to wishlist (autocomplete enabled)
/wishlist      # View your current wishlist
/removewishlist # Remove skin from wishlist
```

### Advanced Features
```
/autocheck status  # Check automation status
/autocheck test    # Test the daily checker
/autotokens       # CLI tool guide
```

## 🔧 Quick Setup Steps

1. **Get Discord User ID**
   - Settings → Advanced → Developer Mode ON
   - Right-click profile → Copy User ID

2. **Get Browser Cookies**
   - Go to auth.riotgames.com (logged in)
   - F12 → Application → Cookies → auth.riotgames.com
   - Copy `ssid` and `clid` values

3. **Run Setup**
   ```
   /quicksetup
   ```
   - Enter User ID
   - Paste ssid cookie
   - Paste clid cookie
   - Select region (ap for Indonesia)

## 🎯 Tips & Tricks

### Adding Skins to Wishlist
- **Full names work**: `Prime Phantom`
- **Partial names work**: `Prime` or `Phantom`
- **Use autocomplete**: Start typing and select from suggestions
- **Case doesn't matter**: `prime phantom` = `Prime Phantom`

### Understanding Regions
- **ap** = Asia Pacific (Indonesia, SEA)
- **na** = North America
- **eu** = Europe

### Currency Display
- **VP prices** = Official Valorant Points cost
- **IDR prices** = Approximate Indonesian Rupiah (from VP packages)

## 🔔 Alert System

### How It Works
- **Manual**: Get alerts immediately when using `/store`
- **Automatic**: Daily check at 19:05 WIB (after store reset)
- **DM Notifications**: Receive private message when wishlist skins available
- **Anti-Spam**: Maximum 1 alert per skin per day

### Enable DM Notifications
1. Right-click the bot user
2. Click "Message"
3. This enables DM permissions for alerts

## ⚠️ Common Issues & Solutions

### Token Problems
```
❌ Token Expired (BAD_CLAIMS)
✅ Solution: Use /quicksetup to get fresh tokens

❌ Unauthorized Access
✅ Solution: Check cookies are from correct Riot account

❌ Missing Store Access
✅ Solution: Use account that owns Valorant
```

### No Alerts Received
```
❌ Not getting DM alerts
✅ Solution: Enable DMs with the bot
✅ Check: Token is valid with /checktoken
✅ Verify: Wishlist has skins with /wishlist
```

### Autocomplete Not Working
```
❌ No skin suggestions appear
✅ Solution: Type at least 2 characters
✅ Wait: Autocomplete takes a moment to load
✅ Check: Internet connection and bot status
```

## 🎮 Example Workflow

### New User Setup
```
1. /quicksetup → Enter your details
2. /addwishlist Prime Phantom → Add desired skin
3. /addwishlist Reaver Vandal → Add another skin
4. /store → Check current store
5. Wait for automatic daily alerts! 🔔
```

### Daily Usage
```
1. /store → Check what's available today
2. /addwishlist → Add any new skins you want
3. Receive DM if wishlist skins appear! ✨
```

## 🆘 Getting Help

### In-Bot Help
- `/help` → Interactive help with buttons
- `/help` → Click category buttons for detailed guides

### Troubleshooting
1. **Check token**: `/checktoken`
2. **Test automation**: `/autocheck test`
3. **Verify wishlist**: `/wishlist`
4. **Get fresh tokens**: `/quicksetup`

### Contact Support
- **Discord**: `rexoo_`
- **Issues**: Check console logs and error messages

## ⏰ Daily Schedule

- **Store Reset**: ~19:00 WIB daily
- **Auto Check**: 19:05 WIB (5 minutes after reset)
- **Alert Window**: 19:05-19:10 WIB for automatic notifications

## 💡 Pro Tips

1. **Add multiple skin variations**: `Prime Phantom`, `Prime Vandal`, etc.
2. **Use broad searches first**: Search `Prime` to see all Prime skins
3. **Enable DMs early**: Set up DMs before your first wishlist match
4. **Check regularly**: Manual `/store` checks don't count against daily limits
5. **Keep tokens fresh**: Refresh tokens when you get expiry notifications

---

**Happy skin hunting! 🎯**
