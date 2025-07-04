/**
 * CLI Tool to get Riot tokens from user cookies and save to bot format
 * Required: 'ssid' and 'clid' from Riot login
 */

const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function loadExistingTokens() {
  try {
    const tokensPath = path.join(__dirname, 'data', 'tokens.json');
    return JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveTokens(tokens) {
  const tokensPath = path.join(__dirname, 'data', 'tokens.json');
  
  // Ensure data directory exists
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
}

async function main() {
  console.log("� Valorant Token CLI Fetch Tool");
  console.log("============================================");
  console.log("This tool will get fresh Valorant tokens and save them directly to the bot");
  console.log("");
  console.log("📋 Requirements:");
  console.log("1. You need to be logged into Riot Games in your browser");
  console.log("2. You need your Discord User ID");
  console.log("3. You need to copy 2 cookies from your browser");
  console.log("");

  const userId = await ask("Enter your Discord User ID: ");
  
  if (!userId || userId.trim().length < 10) {
    console.error("❌ Invalid Discord User ID. Please make sure you copied the complete User ID.");
    rl.close();
    return;
  }
  if (!userId || userId.length < 10) {
    console.error("❌ Invalid Discord User ID. Please get it from Discord Settings > Advanced > Developer Mode > Right-click profile > Copy User ID");
    rl.close();
    return;
  }

  console.log("");
  console.log("🍪 Now you need to get your Riot cookies:");
  console.log("1. Open your browser and go to https://auth.riotgames.com");
  console.log("2. Make sure you're logged in to your Riot account");
  console.log("3. Open Developer Tools (F12)");
  console.log("4. Go to Application/Storage tab > Cookies > https://auth.riotgames.com");
  console.log("5. Find and copy the values for 'ssid' and 'clid' cookies");
  console.log("");

  const ssid = await ask("Paste your ssid cookie value: ");
  const clid = await ask("Paste your clid cookie value: ");
  const region = await ask("Enter your region (ap for Asia Pacific, na for North America, eu for Europe): ");

  // Basic validation
  if (!ssid || ssid.trim().length < 20) {
    console.error("❌ Invalid ssid cookie. Please make sure you copied the complete cookie value.");
    rl.close();
    return;
  }
  
  if (!clid || clid.trim().length < 3) {
    console.error("❌ Invalid clid cookie. Please make sure you copied the complete cookie value.");
    rl.close();
    return;
  }

  console.log("");
  console.log("📝 Using configuration:");
  console.log("  - Discord User ID:", userId);
  console.log("  - ssid length:", ssid.length);
  console.log("  - clid:", clid);
  console.log("  - region:", region);
  console.log("");

  const headers = {
    "Cookie": `ssid=${ssid.trim()}; clid=${clid.trim()}`,
    "Content-Type": "application/json",
    "User-Agent": "RiotClient/58.0.0.4640.616 %s (Windows;10;;Professional;x64)"
  };

  try {
    console.log("🚀 Starting authentication flow...");
    
    const authResp = await axios.post("https://auth.riotgames.com/api/v1/authorization", {
      "client_id": "riot-client",
      "nonce": "1",
      "redirect_uri": "http://localhost/redirect",
      "response_type": "token id_token",
      "scope": "account openid"
    }, { headers });

    console.log("🔍 Checking auth response...");

    // Check if we got the expected authentication response
    if (authResp.data.type === "auth") {
      throw new Error("Authentication failed. This usually means your cookies are expired or invalid. Please get fresh cookies from your browser.");
    }

    // Check if the response has the expected structure
    if (!authResp.data || !authResp.data.response || !authResp.data.response.parameters) {
      throw new Error("Unexpected response structure from auth endpoint. Expected authorization flow but got: " + JSON.stringify(authResp.data));
    }

    const uri = authResp.data.response.parameters.uri;
    if (!uri) {
      throw new Error("No URI found in auth response. The authorization flow may have failed.");
    }

    const access_token_match = uri.match(/access_token=([^&]*)/);
    if (!access_token_match) {
      throw new Error("No access token found in URI. The authorization response may be incomplete.");
    }
    const access_token = access_token_match[1];

    console.log("✅ Access token obtained successfully");

    console.log("🎫 Getting entitlement token...");
    const entResp = await axios.post("https://entitlements.auth.riotgames.com/api/token/v1", {}, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const entitlement_token = entResp.data.entitlements_token;

    console.log("👤 Getting user info...");
    const userResp = await axios.get("https://auth.riotgames.com/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const puuid = userResp.data.sub;

    // Load existing tokens and add/update this user
    const existingTokens = loadExistingTokens();
    
    existingTokens[userId] = {
      access_token,
      entitlement_token,
      puuid,
      region: region.toLowerCase()
    };

    // Save to bot's tokens.json file
    saveTokens(existingTokens);

    console.log("");
    console.log("✅ SUCCESS! Token fetched and saved to bot");
    console.log("============================================");
    console.log("");
    console.log("📊 Token Info:");
    console.log("  - Discord User ID:", userId);
    console.log("  - PUUID:", puuid);
    console.log("  - Region:", region.toLowerCase());
    console.log("  - Access Token: ***" + access_token.slice(-10));
    console.log("  - Entitlement Token: ***" + entitlement_token.slice(-10));
    console.log("");
    console.log("🎯 Your tokens are now ready! You can:");
    console.log("  - Use /store to check your Valorant store");
    console.log("  - Use /checktoken to verify the tokens work");
    console.log("  - Use /addwishlist to add skins to your wishlist");
    console.log("");
    console.log("⚠️ Note: These tokens will expire in a few hours.");
    console.log("   Re-run this tool when they expire or when the bot says tokens are invalid.");
    console.log("");
    console.log("🔥 Happy skin hunting! 🔥");

  } catch (err) {
    console.error("");
    console.error("❌ Failed to fetch tokens:", err.message);
    
    if (err.response) {
      console.error("🔍 Response status:", err.response.status);
      console.error("🔍 Response data:", JSON.stringify(err.response.data, null, 2));
    }
    
    console.error("");
    console.error("💡 Troubleshooting tips:");
    console.error("1. Make sure you're logged into Riot Games in your browser");
    console.error("2. Try logging out of Riot and logging back in to get fresh cookies");
    console.error("3. Open browser dev tools (F12) and go to Application/Storage > Cookies");
    console.error("4. Find auth.riotgames.com cookies and copy the 'ssid' and 'clid' values");
    console.error("5. Make sure the cookies are fresh (not expired)");
    console.error("6. Ensure you're copying the complete cookie values without any truncation");
    console.error("7. Try using a different browser or incognito mode to get fresh cookies");
    console.error("8. Make sure Valorant game client is not running while doing this");
  }

  rl.close();
}

main();
