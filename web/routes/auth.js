const express = require('express');
const router = express.Router();

// Simple authentication for web dashboard
router.get('/login', (req, res) => {
    const lang = req.session.language || 'en';
    const { i18n } = req.app.locals;
    
    res.render('auth/login', {
        title: i18n.t('auth.login', lang),
        error: req.query.error,
        redirect: req.query.redirect,
        lang
    });
});

router.post('/login', async (req, res) => {
    try {
        const { discordId } = req.body;
        const { db } = req.app.locals;

        if (!discordId) {
            return res.redirect('/auth/login?error=missing_discord_id');
        }

        // Check if user exists
        let user = await db.getUserByDiscordId(discordId);
        
        if (!user) {
            // Create new user
            const result = await db.createUser(discordId, `User_${discordId}`, null);
            user = {
                id: result.id,
                discord_id: discordId,
                username: `User_${discordId}`,
                email: null
            };
        }

        // Update last login
        await db.updateUserLogin(discordId);

        // Set session
        req.session.user = user;

        // Track login event
        const { analytics } = req.app.locals;
        await analytics.trackEvent('web_login', { discordId }, user.id, discordId, req);

        // Redirect to intended page or dashboard
        const redirectTo = req.query.redirect || req.body.redirect || '/dashboard';
        res.redirect(redirectTo);
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/auth/login?error=login_failed');
    }
});

router.get('/logout', (req, res) => {
    const { analytics } = req.app.locals;
    
    // Track logout event
    if (req.session.user) {
        analytics.trackEvent('web_logout', {}, req.session.user.id, req.session.user.discord_id, req);
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

// Token setup page
router.get('/setup', (req, res) => {
    const lang = req.session.language || 'en';
    const { i18n } = req.app.locals;
    
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    res.render('auth/setup', {
        title: i18n.t('settings.tokenManagement', lang),
        user: req.session.user,
        success: req.query.success,
        error: req.query.error,
        lang
    });
});

router.post('/setup', async (req, res) => {
    try {
        const { ssid, clid, region } = req.body;
        const { db } = req.app.locals;

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        if (!ssid || !clid || !region) {
            return res.redirect('/auth/setup?error=missing_fields');
        }

        // Import token functions
        const { getTokensFromCookies } = require('../../utils/valorantApi');
        
        // Get tokens using the provided cookies
        const tokens = await getTokensFromCookies(ssid, clid);
        
        if (!tokens) {
            return res.redirect('/auth/setup?error=invalid_tokens');
        }

        // Add region to tokens
        tokens.region = region;
        tokens.ssid = ssid;
        tokens.clid = clid;

        // Save tokens to database
        await db.saveUserTokens(
            req.session.user.id,
            req.session.user.discord_id,
            tokens
        );

        // Update session to indicate user has tokens
        req.session.user.hasTokens = true;
        req.session.user.region = tokens.region;
        req.session.user.puuid = tokens.puuid;

        // Track token setup event
        const { analytics } = req.app.locals;
        await analytics.trackEvent('token_setup', { 
            region: tokens.region,
            method: 'manual' 
        }, req.session.user.id, req.session.user.discord_id, req);

        // Auto-fetch store data after successful token setup
        try {
            console.log('🔄 Auto-fetching store data after manual token setup...');
            const { fetchStoreSkins } = require('../../utils/valorantApi');
            
            const storeData = await fetchStoreSkins(tokens);
            
            if (storeData && storeData.length > 0) {
                // Map store data to match database schema
                const mappedStoreData = storeData.map(skin => ({
                    uuid: skin.uuid,
                    displayName: skin.displayName,
                    price: skin.vpPrice || 0,
                    currency: 'VP'
                }));

                // Save to database
                await db.saveStoreHistory(req.session.user.id, req.session.user.discord_id, mappedStoreData);
                
                console.log(`✅ Auto-fetched ${storeData.length} items for user ${req.session.user.discord_id}`);
                
                // Track store fetch event
                await analytics.trackEvent('auto_store_fetch_after_setup', { 
                    count: storeData.length 
                }, req.session.user.id, req.session.user.discord_id, req);
            }
        } catch (storeError) {
            console.warn('⚠️ Auto store fetch failed after manual token setup:', storeError.message);
            // Don't fail the token setup if store fetch fails
        }

        res.redirect('/dashboard?setup=success&method=manual');
    } catch (error) {
        console.error('Token setup error:', error);
        res.redirect('/auth/setup?error=setup_failed');
    }
});

// Token CLI page (alternative to manual setup)
router.get('/token-cli', (req, res) => {
    const lang = req.session.language || 'en';
    const { i18n } = req.app.locals;
    
    if (!req.session.user) {
        return res.redirect('/auth/login?redirect=' + encodeURIComponent('/auth/token-cli'));
    }

    let errorMessage = null;
    if (req.query.error) {
        switch (req.query.error) {
            case 'no_tokens':
                errorMessage = i18n.t('error.tokenCli.noTokens', lang);
                break;
            case 'token_check_failed':
                errorMessage = i18n.t('error.tokenCli.tokenCheckFailed', lang);
                break;
            default:
                errorMessage = req.query.error;
        }
    }

    res.render('auth/token-cli', {
        title: i18n.t('settings.autoTokenFetch', lang),
        user: req.session.user,
        success: req.query.success,
        error: errorMessage,
        lang
    });
});

// Token CLI processing
router.post('/token-cli', async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.user) {
            return res.redirect('/auth/login?error=login_required');
        }

        const { ssid, clid, region } = req.body;
        const { db } = req.app.locals;
        const userId = req.session.user.id;
        const discordId = req.session.user.discord_id;

        if (!ssid || !clid || !region) {
            return res.redirect('/auth/token-cli?error=missing_fields');
        }

        // Validate cookie lengths
        if (ssid.trim().length < 20) {
            return res.redirect('/auth/token-cli?error=invalid_ssid');
        }
        
        if (clid.trim().length < 3) {
            return res.redirect('/auth/token-cli?error=invalid_clid');
        }

        const axios = require('axios');
        
        const headers = {
            "Cookie": `ssid=${ssid.trim()}; clid=${clid.trim()}`,
            "Content-Type": "application/json",
            "User-Agent": "RiotClient/58.0.0.4640.616 %s (Windows;10;;Professional;x64)"
        };

        // Start authentication flow
        const authResp = await axios.post("https://auth.riotgames.com/api/v1/authorization", {
            "client_id": "riot-client",
            "nonce": "1",
            "redirect_uri": "http://localhost/redirect",
            "response_type": "token id_token",
            "scope": "account openid"
        }, { headers });

        // Check if we got the expected authentication response
        if (authResp.data.type === "auth") {
            return res.redirect('/auth/token-cli?error=auth_failed');
        }

        // Check response structure
        if (!authResp.data || !authResp.data.response || !authResp.data.response.parameters) {
            return res.redirect('/auth/token-cli?error=unexpected_response');
        }

        const uri = authResp.data.response.parameters.uri;
        if (!uri) {
            return res.redirect('/auth/token-cli?error=no_uri');
        }

        const access_token_match = uri.match(/access_token=([^&]*)/);
        if (!access_token_match) {
            return res.redirect('/auth/token-cli?error=no_access_token');
        }
        const access_token = access_token_match[1];

        // Get entitlement token
        const entResp = await axios.post("https://entitlements.auth.riotgames.com/api/token/v1", {}, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const entitlement_token = entResp.data.entitlements_token;

        // Get user info from Riot
        const userResp = await axios.get("https://auth.riotgames.com/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const puuid = userResp.data.sub;

        // Ensure user exists in database
        let user = await db.getUserByDiscordId(discordId);
        if (!user) {
            // Create new user if doesn't exist
            const username = req.session.user?.username || `User_${discordId.slice(-4)}`;
            await db.createUser(discordId, username);
            user = await db.getUserByDiscordId(discordId);
        }

        // Update user login time
        await db.updateUserLogin(discordId);

        // Save tokens to database
        await db.saveUserTokens(user.id, discordId, {
            puuid,
            access_token,
            entitlement_token,
            region: region.toLowerCase(),
            ssid: ssid.trim(),
            clid: clid.trim()
        });

        // Update session with complete user info including tokens
        req.session.user = {
            id: user.id,
            discord_id: discordId,
            username: user.username,
            hasTokens: true,
            region: region.toLowerCase(),
            puuid: puuid
        };

        // Track successful token setup
        const { analytics } = req.app.locals;
        await analytics.trackEvent('auto_token_setup_success', { 
            region: region.toLowerCase(),
            method: 'auto_fetcher' 
        }, user.id, discordId, req);

        // Auto-fetch store data after successful token setup
        try {
            console.log('🔄 Auto-fetching store data after token setup...');
            const { fetchStoreSkins } = require('../../utils/valorantApi');
            
            const tokenData = {
                puuid,
                access_token,
                entitlement_token,
                region: region.toLowerCase()
            };
            
            const storeData = await fetchStoreSkins(tokenData);
            
            if (storeData && storeData.length > 0) {
                // Map store data to match database schema
                const mappedStoreData = storeData.map(skin => ({
                    uuid: skin.uuid,
                    displayName: skin.displayName,
                    price: skin.vpPrice || 0,
                    currency: 'VP'
                }));

                // Save to database
                await db.saveStoreHistory(user.id, discordId, mappedStoreData);
                
                console.log(`✅ Auto-fetched ${storeData.length} items for user ${discordId}`);
                
                // Track store fetch event
                await analytics.trackEvent('auto_store_fetch_after_setup', { 
                    count: storeData.length 
                }, user.id, discordId, req);
            }
        } catch (storeError) {
            console.warn('⚠️ Auto store fetch failed after token setup:', storeError.message);
            // Don't fail the token setup if store fetch fails
        }

        // Redirect to dashboard with success message
        res.redirect('/dashboard?setup=success&method=auto');
    } catch (error) {
        console.error('Token CLI error:', error);
        if (error.response && error.response.status === 400) {
            res.redirect('/auth/token-cli?error=invalid_cookies');
        } else {
            res.redirect('/auth/token-cli?error=fetch_failed');
        }
    }
});

module.exports = router;
