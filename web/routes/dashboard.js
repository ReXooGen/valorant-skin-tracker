const express = require('express');
const router = express.Router();

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware to check if user has valid tokens for store access
const requireTokens = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    
    try {
        const { db } = req.app.locals;
        const userTokens = await db.getUserTokens(req.session.user.discord_id);
        
        if (!userTokens || !userTokens.access_token || !userTokens.region) {
            // Redirect to token setup if no valid tokens
            return res.redirect('/auth/token-cli?error=no_tokens');
        }
        
        // Add tokens to request for use in route handlers
        req.userTokens = userTokens;
        req.session.user.hasTokens = true;
        req.session.user.region = userTokens.region;
        req.session.user.puuid = userTokens.puuid;
        
        next();
    } catch (error) {
        console.error('Token check error:', error);
        res.redirect('/auth/token-cli?error=token_check_failed');
    }
};

// Dashboard home
router.get('/', requireAuth, async (req, res) => {
    try {
        const { db, analytics, i18n } = req.app.locals;
        const userId = req.session.user.id;
        const lang = req.session.language || 'en';

        // Check if user has tokens
        let hasValidTokens = false;
        try {
            const userTokens = await db.getUserTokens(req.session.user.discord_id);
            hasValidTokens = userTokens && userTokens.access_token && userTokens.region;
            if (hasValidTokens) {
                req.session.user.hasTokens = true;
                req.session.user.region = userTokens.region;
                req.session.user.puuid = userTokens.puuid;
            }
        } catch (error) {
            console.warn('Could not check user tokens:', error.message);
        }

        // Get user's latest store data with error handling
        let storeHistory = [];
        try {
            storeHistory = await db.getStoreHistory(userId, 1);
        } catch (error) {
            console.warn('Could not get store history:', error.message);
        }

        let wishlist = [];
        try {
            wishlist = await db.getUserWishlist(userId);
        } catch (error) {
            console.warn('Could not get wishlist:', error.message);
        }

        let analyticsData = null;
        try {
            analyticsData = await analytics.getUserAnalytics(userId, 7);
        } catch (error) {
            console.warn('Could not get analytics data:', error.message);
        }

        // Check for wishlist matches in current store
        const wishlistMatches = storeHistory && storeHistory.length > 0 ? storeHistory.filter(storeItem =>
            wishlist.some(wishItem => wishItem.skin_uuid === storeItem.skin_uuid)
        ) : [];

        // Check for setup success message
        const setupSuccess = req.query.setup === 'success';
        const setupMethod = req.query.method; // 'auto' or 'manual'

        // Set page variable in res.locals for layout access
        res.locals.page = 'dashboard';

        res.render('dashboard/index', {
            title: i18n.t('dashboard.title', lang),
            page: 'dashboard',
            user: req.session.user,
            hasValidTokens,
            storeHistory: storeHistory && storeHistory.length > 0 ? storeHistory.slice(0, 4) : [], // Latest 4 skins
            wishlist: wishlist.slice(0, 5), // Top 5 wishlist items
            wishlistMatches,
            analytics: analyticsData,
            setupSuccess,
            setupMethod,
            lang
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        const lang = req.session.language || 'en';
        req.app.locals.renderWithoutLayout(res, 'error', {
            title: req.app.locals.i18n.t('error.500.title', lang),
            message: 'Failed to load dashboard',
            lang: lang
        });
    }
});

// Store page
router.get('/store', requireTokens, async (req, res) => {
    try {
        const { db, i18n } = req.app.locals;
        const userId = req.session.user.id;
        const lang = req.session.language || 'en';

        // Get store history with error handling
        let storeHistory = [];
        try {
            storeHistory = await db.getStoreHistory(userId, 1);
        } catch (error) {
            console.warn('Could not get store history:', error.message);
        }
        
        // Get wishlist with error handling
        let wishlist = [];
        try {
            wishlist = await db.getUserWishlist(userId);
        } catch (error) {
            console.warn('Could not get wishlist:', error.message);
        }

        // Add wishlist status to store items
        const storeWithWishlist = storeHistory.map(item => ({
            ...item,
            inWishlist: wishlist.some(w => w.skin_uuid === item.skin_uuid)
        }));

        // Fetch current bundles with error handling
        let bundles = [];
        try {
            const { fetchBundles } = require('../../utils/valorantApi');
            const userTokens = await db.getUserTokens(req.session.user.discord_id);
            if (userTokens) {
                bundles = await fetchBundles(userTokens);
            }
        } catch (error) {
            console.warn('Could not fetch bundles:', error.message);
        }

        // Set page variable in res.locals for layout access
        res.locals.page = 'store';

        res.render('dashboard/store', {
            title: i18n.t('store.title', lang),
            page: 'store',
            store: storeWithWishlist,
            bundles: bundles,
            lastUpdate: storeHistory.length ? storeHistory[0].created_at : null,
            lang
        });
    } catch (error) {
        console.error('Store page error:', error);
        req.app.locals.renderWithoutLayout(res, 'error', {
            title: req.app.locals.i18n.t('error.500.title', req.session.language || 'en'),
            message: 'Failed to load store',
            lang: req.session.language || 'en'
        });
    }
});

// Wishlist page
router.get('/wishlist', requireAuth, async (req, res) => {
    try {
        const { db, i18n } = req.app.locals;
        const userId = req.session.user.id;
        const lang = req.session.language || 'en';

        // Get wishlist with error handling
        let wishlist = [];
        try {
            wishlist = await db.getUserWishlist(userId);
        } catch (error) {
            console.warn('Could not get wishlist:', error.message);
        }
        
        let storeHistory = [];
        try {
            storeHistory = await db.getStoreHistory(userId, 1);
        } catch (error) {
            console.warn('Could not get store history:', error.message);
        }

        // Add store availability to wishlist items
        const wishlistWithStore = wishlist.map(item => ({
            ...item,
            inStore: storeHistory.some(s => s.skin_uuid === item.skin_uuid),
            currentPrice: storeHistory.find(s => s.skin_uuid === item.skin_uuid)?.price || null
        }));

        // Get bundle wishlist if we have it
        let bundleWishlist = [];
        try {
            bundleWishlist = await db.getUserBundleWishlist(userId);
        } catch (error) {
            console.warn('Could not get bundle wishlist:', error.message);
        }

        // Set page variable in res.locals for layout access
        res.locals.page = 'wishlist';

        res.render('dashboard/wishlist', {
            title: i18n.t('wishlist.title', lang),
            page: 'wishlist',
            skinWishlist: wishlistWithStore,
            bundleWishlist: bundleWishlist,
            lang
        });
    } catch (error) {
        console.error('Wishlist page error:', error);
        req.app.locals.renderWithoutLayout(res, 'error', {
            title: req.app.locals.i18n.t('error.500.title', req.session.language || 'en'),
            message: 'Failed to load wishlist',
            lang: req.session.language || 'en'
        });
    }
});

// Analytics page
router.get('/analytics', requireAuth, async (req, res) => {
    try {
        const { analytics, i18n, db } = req.app.locals;
        const userId = req.session.user.id;
        const lang = req.session.language || 'en';
        const days = parseInt(req.query.days) || 30;

        // Try to get analytics data, but provide defaults if there's an error
        let analyticsData;
        try {
            analyticsData = await analytics.getUserAnalytics(userId, days);
        } catch (error) {
            console.warn('Could not get user analytics data:', error.message);
            analyticsData = {
                dates: [],
                activeUsers: [],
                storeUpdates: [],
                topSkins: []
            };
        }
        
        // Get user stats with default values if db operations fail
        let userStats;
        try {
            userStats = {
                wishlistCount: await db.getUserWishlistCount(userId),
                bundleWishlistCount: await db.getUserBundleWishlistCount(userId),
                storeChecks: await analytics.getUserStoreCheckCount(userId),
                notificationsReceived: await analytics.getUserNotificationCount(userId)
            };
        } catch (error) {
            console.warn('Could not get user stats:', error.message);
            userStats = {
                wishlistCount: 0,
                bundleWishlistCount: 0,
                storeChecks: 0,
                notificationsReceived: 0
            };
        }
        
        // Get global stats for comparison
        let globalStats;
        try {
            globalStats = await analytics.getGlobalAnalyticsSummary();
        } catch (error) {
            console.warn('Could not get global stats:', error.message);
            globalStats = {
                totalUsers: 0,
                totalWishlistItems: 0,
                totalStoreChecks: 0,
                totalNotifications: 0
            };
        }

        // Get recent activity with error handling (mock data for now)
        let recentActivity = [];
        try {
            // Create mock recent activity data since the method doesn't exist yet
            recentActivity = [
                {
                    type: 'store_check',
                    description: 'Store updated with new skins',
                    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                },
                {
                    type: 'wishlist_add',
                    description: 'Added skin to wishlist',
                    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
                }
            ];
        } catch (error) {
            console.warn('Could not get recent activity:', error.message);
            recentActivity = [];
        }

        // Set page variable in res.locals for layout access
        res.locals.page = 'analytics';

        res.render('dashboard/analytics', {
            title: i18n.t('analytics.title', lang),
            page: 'analytics',
            analytics: analyticsData,
            userStats: userStats,
            globalStats: globalStats,
            recentActivity: recentActivity,
            priceTrends: [], // Add empty array for price trends
            topWishlistSkins: [], // Add empty array for now since table doesn't exist
            selectedDays: days,
            lang
        });
    } catch (error) {
        console.error('Analytics page error:', error);
        req.app.locals.renderWithoutLayout(res, 'error', {
            title: req.app.locals.i18n.t('error.500.title', req.session.language || 'en'),
            message: 'Failed to load analytics',
            lang: req.session.language || 'en'
        });
    }
});

// Settings page
router.get('/settings', requireAuth, async (req, res) => {
    try {
        const { db, i18n } = req.app.locals;
        const userId = req.session.user.id;
        const lang = req.session.language || 'en';

        // Get user tokens with error handling
        let userTokens = null;
        try {
            userTokens = await db.getUserTokens(req.session.user.discord_id);
        } catch (error) {
            console.warn('Could not get user tokens:', error.message);
        }
        
        // Get user preferences with error handling
        let userPreferences = {};
        try {
            userPreferences = await db.getUserPreferences(userId) || {};
        } catch (error) {
            console.warn('Could not get user preferences:', error.message);
        }
        
        // Default user settings
        const userSettings = {
            notificationsEnabled: userPreferences?.notifications !== false,
            autoCheckEnabled: userPreferences?.autoCheck !== false,
            bundleNotifications: userPreferences?.bundleNotifications !== false,
            checkTime: userPreferences?.checkTime || '19:05'
        };

        // Set page variable in res.locals for layout access
        res.locals.page = 'settings';

        res.render('dashboard/settings', {
            title: i18n.t('settings.title', lang),
            page: 'settings',
            user: req.session.user,
            tokens: userTokens,
            userSettings: userSettings,
            availableLanguages: i18n.getAvailableLanguages(),
            currentLanguage: lang,
            lang
        });
    } catch (error) {
        console.error('Settings page error:', error);
        req.app.locals.renderWithoutLayout(res, 'error', {
            title: req.app.locals.i18n.t('error.500.title', req.session.language || 'en'),
            message: 'Failed to load settings',
            lang: req.session.language || 'en'
        });
    }
});

// Update settings
router.post('/settings', requireAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const { language, notifications } = req.body;

        // Update user preferences
        const preferences = {
            language,
            notifications: notifications === 'on'
        };

        await db.run(
            'UPDATE users SET preferences = ? WHERE id = ?',
            [JSON.stringify(preferences), req.session.user.id]
        );

        // Update session language
        if (language) {
            req.session.language = language;
        }

        res.redirect('/dashboard/settings?success=1');
    } catch (error) {
        console.error('Settings update error:', error);
        res.redirect('/dashboard/settings?error=1');
    }
});

// Refresh store data
router.post('/store/refresh', requireAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const discordId = req.session.user.discord_id;

        // Get user tokens
        const tokens = await db.getUserTokens(discordId);
        if (!tokens) {
            return res.json({ error: 'No tokens found. Please set up your tokens first.' });
        }

        // Import valorant API functions
        const { fetchStoreSkins } = require('../../utils/valorantApi');
        
        // Fetch fresh store data
        const storeData = await fetchStoreSkins(tokens);
        
        // Map store data to match database schema
        const mappedStoreData = storeData.map(skin => ({
            uuid: skin.uuid,
            displayName: skin.displayName,
            price: skin.vpPrice || 0,
            currency: 'VP'
        }));
        
        // Save to database
        await db.saveStoreHistory(req.session.user.id, discordId, mappedStoreData);

        res.json({ success: true, message: 'Store refreshed successfully' });
    } catch (error) {
        console.error('Store refresh error:', error);
        res.json({ error: 'Failed to refresh store data' });
    }
});

module.exports = router;
