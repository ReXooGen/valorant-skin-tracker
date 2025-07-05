
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

// Enhanced function to get tokens from cookies
async function getTokensFromCookies(ssid, clid) {
    try {
        console.log('🔐 Getting tokens from cookies...');
        
        // First, get access token
        const authResponse = await axios.post('https://auth.riotgames.com/api/v1/authorization', {
            'client_id': 'play-valorant-web-prod',
            'nonce': '1',
            'redirect_uri': 'https://playvalorant.com/opt_in',
            'response_type': 'token id_token',
            'scope': 'account openid'
        }, {
            headers: {
                'Cookie': `ssid=${ssid}; clid=${clid}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!authResponse.data.response) {
            throw new Error('No authorization response');
        }

        // Extract access token from response
        const accessTokenMatch = authResponse.data.response.parameters.uri.match(/access_token=([^&]*)/);
        if (!accessTokenMatch) {
            throw new Error('Access token not found');
        }
        const access_token = accessTokenMatch[1];

        // Get entitlement token
        const entitlementResponse = await axios.post('https://entitlements.auth.riotgames.com/api/token/v1', {}, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const entitlement_token = entitlementResponse.data.entitlements_token;

        // Get user info (PUUID)
        const userInfoResponse = await axios.post('https://auth.riotgames.com/userinfo', {}, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const puuid = userInfoResponse.data.sub;

        console.log('✅ Tokens obtained successfully');
        return {
            access_token,
            entitlement_token,
            puuid
        };
    } catch (error) {
        console.error('❌ Error getting tokens from cookies:', error.message);
        return null;
    }
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

// Enhanced bundle fetching function
async function fetchBundles(tokens) {
    try {
        if (!tokens || !tokens.access_token || !tokens.puuid) {
            console.warn('⚠️ Invalid tokens provided to fetchBundles');
            return [];
        }

        const region = tokens.region.toLowerCase() === 'id' ? 'ap' : tokens.region.toLowerCase();
        console.log(`🎁 Fetching bundles for region: ${region}`);
        
        const response = await axios.get(`https://pd.${region}.a.pvp.net/store/v2/storefront/${tokens.puuid}`, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'X-Riot-Entitlements-JWT': tokens.entitlement_token,
                'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
                'X-Riot-ClientVersion': 'release-09.10-shipping-29-2669218'
            }
        });

        const bundles = response.data.FeaturedBundle?.Bundle ? [response.data.FeaturedBundle.Bundle] : [];
        
        if (bundles.length === 0) {
            console.log('📦 No featured bundles available');
            return [];
        }
        
        // Fetch bundle details from Valorant API
        const bundleDetails = await Promise.all(bundles.map(async (bundle) => {
            try {
                const bundleInfo = await axios.get(`https://valorant-api.com/v1/bundles/${bundle.ID}`);
                return {
                    uuid: bundle.ID,
                    name: bundleInfo.data.data.displayName,
                    description: bundleInfo.data.data.description,
                    price: bundle.TotalBaseCost ? bundle.TotalBaseCost["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"] : 0, // VP price
                    items: bundle.Items || [],
                    expiresAt: bundle.DurationRemainingInSeconds ? Date.now() + (bundle.DurationRemainingInSeconds * 1000) : null,
                    displayIcon: bundleInfo.data.data.displayIcon,
                    verticalPromoImage: bundleInfo.data.data.verticalPromoImage
                };
            } catch (error) {
                console.error(`❌ Error fetching bundle details for ${bundle.ID}:`, error.response?.status, error.message);
                return null;
            }
        }));

        return bundleDetails.filter(bundle => bundle !== null);
    } catch (error) {
        console.error('❌ Error fetching bundles:', error.response?.status, error.message);
        if (error.response?.status === 404) {
            console.warn('🔍 Bundles endpoint returned 404 - this may be expected if no bundles are available');
        }
        return [];
    }
}

// Night Market fetching function
async function fetchNightMarket(tokens) {
    try {
        const region = tokens.region.toLowerCase() === 'id' ? 'ap' : tokens.region.toLowerCase();
        console.log(`🌙 Fetching Night Market for region: ${region}`);
        
        const response = await axios.get(`https://pd.${region}.a.pvp.net/store/v2/storefront/${tokens.puuid}`, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'X-Riot-Entitlements-JWT': tokens.entitlement_token,
                'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
                'X-Riot-ClientVersion': 'release-09.10-shipping-29-2669218'
            }
        });

        const nightMarket = response.data.BonusStore;
        if (!nightMarket) {
            return { active: false, items: [] };
        }

        // Process Night Market items
        const items = await Promise.all(nightMarket.BonusStoreOffers.map(async (offer) => {
            try {
                // Get skin details
                const skinData = await axios.get("https://valorant-api.com/v1/weapons/skins");
                const allSkins = skinData.data.data;
                const skin = allSkins.find(s => s.levels && s.levels.some(l => l.uuid === offer.OfferID));
                
                if (skin) {
                    const vpCurrencyId = "85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741";
                    const originalPrice = offer.OriginalCost[vpCurrencyId];
                    const discountedPrice = offer.DiscountedCost[vpCurrencyId];
                    const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

                    return {
                        skin: skin,
                        originalPrice: originalPrice,
                        discountedPrice: discountedPrice,
                        discountPercent: discountPercent,
                        remainingDuration: offer.DiscountedCostRemainingInSeconds || 0
                    };
                }
                return null;
            } catch (error) {
                console.error('Error processing Night Market item:', error.message);
                return null;
            }
        }));

        return {
            active: true,
            items: items.filter(item => item !== null),
            remainingDuration: nightMarket.BonusStoreRemainingDurationInSeconds || 0
        };
    } catch (error) {
        console.error('❌ Error fetching Night Market:', error.message);
        return { active: false, items: [] };
    }
}

// Price history tracking functions
function savePriceHistory(skinUuid, skinName, price, currency = 'VP', region = 'ap') {
    try {
        const historyFile = './data/price-history.json';
        let history = {};
        
        if (fs.existsSync(historyFile)) {
            history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        }
        
        const today = new Date().toISOString().split('T')[0];
        const key = `${skinUuid}_${region}`;
        
        if (!history[key]) {
            history[key] = {
                skinUuid,
                skinName,
                region,
                prices: []
            };
        }
        
        // Check if we already have a price for today
        const existingIndex = history[key].prices.findIndex(p => p.date === today);
        
        if (existingIndex >= 0) {
            // Update existing price
            history[key].prices[existingIndex] = { date: today, price, currency };
        } else {
            // Add new price
            history[key].prices.push({ date: today, price, currency });
        }
        
        // Keep only last 365 days
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        const cutoffDate = oneYearAgo.toISOString().split('T')[0];
        
        history[key].prices = history[key].prices.filter(p => p.date >= cutoffDate);
        
        // Sort by date
        history[key].prices.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Update skin name if it has changed
        history[key].skinName = skinName;
        
        fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
        
    } catch (error) {
        console.error('Error saving price history:', error);
    }
}

function getPriceHistory(skinUuid, region = 'ap', days = 90) {
    try {
        const historyFile = './data/price-history.json';
        
        if (!fs.existsSync(historyFile)) {
            return { skinUuid, skinName: 'Unknown', prices: [] };
        }
        
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        const key = `${skinUuid}_${region}`;
        
        if (!history[key]) {
            return { skinUuid, skinName: 'Unknown', prices: [] };
        }
        
        // Filter by date range
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
        
        const filteredPrices = history[key].prices.filter(p => p.date >= cutoffDateStr);
        
        return {
            skinUuid,
            skinName: history[key].skinName,
            region,
            prices: filteredPrices
        };
        
    } catch (error) {
        console.error('Error getting price history:', error);
        return { skinUuid, skinName: 'Unknown', prices: [] };
    }
}

function calculatePriceStats(priceHistory) {
    if (!priceHistory.prices || priceHistory.prices.length === 0) {
        return {
            average: 0,
            min: 0,
            max: 0,
            trend: 'stable',
            changePercent: 0,
            totalDays: 0
        };
    }
    
    const prices = priceHistory.prices.map(p => p.price);
    const average = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Calculate trend (comparing first and last prices)
    let trend = 'stable';
    let changePercent = 0;
    
    if (prices.length > 1) {
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        changePercent = Math.round(((lastPrice - firstPrice) / firstPrice) * 100);
        
        if (changePercent > 5) trend = 'increasing';
        else if (changePercent < -5) trend = 'decreasing';
    }
    
    return {
        average,
        min,
        max,
        trend,
        changePercent,
        totalDays: priceHistory.prices.length
    };
}

module.exports = { 
    loadUserTokens, 
    loadWishlist, 
    fetchStoreSkins, 
    searchSkinsByName, 
    getSkinDetailsByUUIDs,
    shouldSendAlert,
    loadAlertHistory,
    saveAlertHistory,
    getTokensFromCookies,
    fetchBundles,
    fetchNightMarket,
    savePriceHistory,
    getPriceHistory,
    calculatePriceStats
};
