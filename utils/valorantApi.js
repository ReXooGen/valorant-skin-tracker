
const axios = require('axios');
const fs = require('fs');

function loadUserTokens(userId = null) {
    if (!fs.existsSync('./data/tokens.json')) return userId ? null : {};
    const data = JSON.parse(fs.readFileSync('./data/tokens.json'));
    return userId ? data[userId] : data;
}

function loadWishlist(userId = null) {
    if (!fs.existsSync('./data/wishlist.json')) return userId ? [] : {};
    const data = JSON.parse(fs.readFileSync('./data/wishlist.json'));
    return userId ? (data[userId] || []) : data;
}

async function fetchStoreSkins(tokens) {
    try {
        // Use 'ap' region for Indonesian servers
        const region = tokens.region.toLowerCase() === 'id' ? 'ap' : tokens.region.toLowerCase();
        console.log(`🔍 Fetching store for region: ${region}, PUUID: ${tokens.puuid}`);
        
        const res = await axios.post(`https://pd.${region}.a.pvp.net/store/v3/storefront/${tokens.puuid}`, {}, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'X-Riot-Entitlements-JWT': tokens.entitlement_token,
                'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
                'X-Riot-ClientVersion': 'release-09.10-shipping-29-2669218',
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Store API response received");
        const offers = res.data.SkinsPanelLayout.SingleItemOffers;
        const storeOffers = res.data.SkinsPanelLayout.SingleItemStoreOffers;
        
        console.log(`🎯 Found ${offers.length} offers in store`);
        const itemData = await axios.get("https://valorant-api.com/v1/weapons/skins");
        const allSkins = itemData.data.data;

        // Store offers contain level UUIDs, not skin UUIDs
        // We need to find skins that have levels matching the offers
        const filteredSkins = allSkins.filter(skin => {
            return skin.levels && skin.levels.some(level => offers.includes(level.uuid));
        });
        
        // Add pricing information to each skin
        const skinsWithPricing = filteredSkins.map(skin => {
            // Find the matching level UUID in offers
            const matchingLevel = skin.levels.find(level => offers.includes(level.uuid));
            
            if (matchingLevel) {
                // Find the corresponding store offer for pricing
                const storeOffer = storeOffers.find(offer => offer.OfferID === matchingLevel.uuid);
                
                if (storeOffer && storeOffer.Cost) {
                    // VP currency ID is typically "85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"
                    const vpCurrencyId = "85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741";
                    const vpPrice = storeOffer.Cost[vpCurrencyId];
                    
                    if (vpPrice) {
                        // Official VP to IDR conversion rates based on Riot's Indonesian pricing
                        const getVPtoIDRRate = (vpAmount) => {
                            // Based on official VP packages:
                            // 475 VP = IDR 56,000 (≈ 117.9 IDR per VP)
                            // 1,000 VP = IDR 112,000 (≈ 112.0 IDR per VP) 
                            // 2,050 VP = IDR 224,000 (≈ 109.3 IDR per VP)
                            // 3,650 VP = IDR 389,000 (≈ 106.6 IDR per VP)
                            // 5,350 VP = IDR 559,000 (≈ 104.5 IDR per VP)
                            // 11,000 VP = IDR 1,099,000 (≈ 99.9 IDR per VP)
                            
                            if (vpAmount >= 11000) return 99.9;
                            if (vpAmount >= 5350) return 104.5;
                            if (vpAmount >= 3650) return 106.6;
                            if (vpAmount >= 2050) return 109.3;
                            if (vpAmount >= 1000) return 112.0;
                            return 117.9; // For smaller amounts
                        };
                        
                        const rate = getVPtoIDRRate(vpPrice);
                        const idrPrice = Math.round(vpPrice * rate);
                        
                        return {
                            ...skin,
                            vpPrice: vpPrice,
                            idrPrice: idrPrice,
                            conversionRate: rate,
                            priceFormatted: {
                                vp: vpPrice.toLocaleString(),
                                idr: idrPrice.toLocaleString('id-ID')
                            }
                        };
                    }
                }
            }
            
            return skin;
        });
        
        console.log(`✅ Matched ${skinsWithPricing.length} skins with names and pricing`);
        
        return skinsWithPricing;
    } catch (err) {
        console.error("❌ Fetch error details:");
        console.error("Error message:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Status text:", err.response.statusText);
            console.error("Response data:", err.response.data);
            
            // Specific error handling for common issues
            if (err.response.status === 403 && err.response.data?.errorCode === 'MISSING_ENTITLEMENT') {
                console.error("🚨 MISSING_ENTITLEMENT: Your tokens don't have store access permissions.");
                console.error("💡 Solution: Get fresh tokens from the Valorant client (not browser)");
                throw new Error("MISSING_ENTITLEMENT: Tokens lack store access. Please get fresh tokens from Valorant client.");
            }
            
            if (err.response.status === 400 && err.response.data?.errorCode === 'BAD_CLAIMS') {
                console.error("🚨 BAD_CLAIMS: Access token is invalid or expired.");
                console.error("💡 Solution: Get fresh tokens - your current tokens have expired");
                throw new Error("BAD_CLAIMS: Access token expired. Please get fresh tokens using /gettoken or /setup.");
            }
            
            if (err.response.status === 401) {
                console.error("🚨 UNAUTHORIZED: Invalid authentication credentials.");
                console.error("💡 Solution: Check your access token and entitlement token");
                throw new Error("UNAUTHORIZED: Invalid tokens. Please refresh your tokens using /gettoken or /setup.");
            }
        }
        return [];
    }
}

async function searchSkinsByName(searchTerm) {
    try {
        console.log(`🔍 Searching for skins with name: "${searchTerm}"`);
        
        // Fetch all weapon skins from Valorant API
        const response = await axios.get("https://valorant-api.com/v1/weapons/skins");
        const allSkins = response.data.data;
        
        // Normalize search term for better matching
        const normalizedSearch = searchTerm.toLowerCase().trim();
        
        // Filter skins based on name matching
        const matchingSkins = allSkins.filter(skin => {
            // Skip default skins (usually no theme data)
            if (!skin.themeUuid) return false;
            
            const skinName = skin.displayName.toLowerCase();
            
            // Exact match gets highest priority
            if (skinName === normalizedSearch) {
                return true;
            }
            
            // Contains search term
            if (skinName.includes(normalizedSearch)) {
                return true;
            }
            
            // Split and check individual words
            const searchWords = normalizedSearch.split(' ');
            const skinWords = skinName.split(' ');
            
            // Check if all search words are found in skin name
            const allWordsMatch = searchWords.every(searchWord => 
                skinWords.some(skinWord => skinWord.includes(searchWord))
            );
            
            return allWordsMatch;
        });
        
        // Sort results by relevance
        const sortedResults = matchingSkins.sort((a, b) => {
            const aName = a.displayName.toLowerCase();
            const bName = b.displayName.toLowerCase();
            
            // Exact match first
            if (aName === normalizedSearch) return -1;
            if (bName === normalizedSearch) return 1;
            
            // Starts with search term
            if (aName.startsWith(normalizedSearch) && !bName.startsWith(normalizedSearch)) return -1;
            if (bName.startsWith(normalizedSearch) && !aName.startsWith(normalizedSearch)) return 1;
            
            // Alphabetical order
            return aName.localeCompare(bName);
        });
        
        console.log(`✅ Found ${sortedResults.length} matching skins`);
        return sortedResults;
        
    } catch (error) {
        console.error('❌ Error searching skins:', error);
        return [];
    }
}

async function getSkinDetailsByUUIDs(uuids) {
    try {
        if (!uuids || uuids.length === 0) return [];
        
        console.log(`🔍 Getting details for ${uuids.length} skin UUIDs`);
        
        // Fetch all weapon skins from Valorant API
        const response = await axios.get("https://valorant-api.com/v1/weapons/skins");
        const allSkins = response.data.data;
        
        // Find skins matching the UUIDs
        const matchingSkins = allSkins.filter(skin => uuids.includes(skin.uuid));
        
        console.log(`✅ Found ${matchingSkins.length} skins from UUIDs`);
        return matchingSkins;
        
    } catch (error) {
        console.error('❌ Error getting skin details:', error);
        return [];
    }
}

function loadAlertHistory() {
    if (!fs.existsSync('./data/alert-history.json')) return {};
    try {
        const data = JSON.parse(fs.readFileSync('./data/alert-history.json'));
        return data;
    } catch (error) {
        console.error('Error loading alert history:', error);
        return {};
    }
}

function saveAlertHistory(history) {
    try {
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data');
        }
        fs.writeFileSync('./data/alert-history.json', JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('Error saving alert history:', error);
    }
}

function shouldSendAlert(userId, skinUUIDs) {
    const history = loadAlertHistory();
    const today = new Date().toDateString();
    const userHistory = history[userId] || {};
    
    // Check if we already sent alert today for these exact skins
    const skinKey = skinUUIDs.sort().join(',');
    const lastAlert = userHistory[skinKey];
    
    if (lastAlert === today) {
        return false; // Already sent alert today for these skins
    }
    
    // Update history
    if (!history[userId]) history[userId] = {};
    history[userId][skinKey] = today;
    
    // Clean old alerts (keep only last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    Object.keys(history[userId]).forEach(key => {
        const alertDate = new Date(history[userId][key]);
        if (alertDate < sevenDaysAgo) {
            delete history[userId][key];
        }
    });
    
    saveAlertHistory(history);
    return true;
}

module.exports = { 
    loadUserTokens, 
    loadWishlist, 
    fetchStoreSkins, 
    searchSkinsByName, 
    getSkinDetailsByUUIDs,
    shouldSendAlert,
    loadAlertHistory,
    saveAlertHistory
};
