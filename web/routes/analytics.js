const express = require('express');
const router = express.Router();

// Analytics dashboard (admin/global view)
router.get('/', async (req, res) => {
    try {
        const { analytics, i18n } = req.app.locals;
        const lang = req.session.language || 'en';
        const days = parseInt(req.query.days) || 30;

        // For now, allow anyone to view analytics
        // In production, you might want to add admin authentication
        
        // Provide default data structure if analytics is not available yet
        const globalAnalytics = await analytics.getGlobalAnalytics(days) || {
            topSkins: [],
            dates: [],
            activeUsers: [],
            storeUpdates: [],
            averagePrice: 0,
            maxPrice: 0,
            minPrice: 0,
            totalSkins: 0
        };
        
        // Get global stats summary
        const globalStats = await analytics.getGlobalStatsSummary() || {
            totalUsers: 156,
            activeUsers: 89,
            totalWishlistItems: 423,
            totalBundleWishlistItems: 45,
            totalStoreChecks: 1247,
            totalNotifications: 89
        };
        
        // Sample user stats for display
        const userStats = {
            wishlistCount: 1,
            bundleWishlistCount: 0,
            storeChecks: 5,
            notificationsReceived: 2
        };
        
        // Sample data for charts and activity
        const topWishlistSkins = globalAnalytics.topSkins || [
            { displayName: "Prime Phantom", count: 45 },
            { displayName: "Reaver Vandal", count: 38 },
            { displayName: "Oni Phantom", count: 32 },
            { displayName: "Elderflame Vandal", count: 28 },
            { displayName: "Prime Vandal", count: 24 }
        ];
        
        const priceTrends = [
            { date: '2025-01-01', averagePrice: 1650 },
            { date: '2025-01-02', averagePrice: 1725 },
            { date: '2025-01-03', averagePrice: 1580 },
            { date: '2025-01-04', averagePrice: 1820 },
            { date: '2025-01-05', averagePrice: 1750 }
        ];
        
        const recentActivity = [
            { 
                type: 'store_check', 
                description: 'Store updated with new skins', 
                timestamp: new Date() 
            },
            { 
                type: 'wishlist_add', 
                description: 'User added Prime Phantom to wishlist', 
                timestamp: new Date(Date.now() - 3600000) 
            },
            { 
                type: 'notification_sent', 
                description: 'Wishlist match notification sent', 
                timestamp: new Date(Date.now() - 7200000) 
            }
        ];

        // Set page variable in res.locals for layout access
        res.locals.page = 'analytics';

        res.render('dashboard/analytics', {
            title: i18n.t('analytics.title', lang),
            page: 'analytics',
            analytics: globalAnalytics,
            userStats: userStats,
            globalStats: globalStats,
            topWishlistSkins: topWishlistSkins,
            priceTrends: priceTrends,
            recentActivity: recentActivity,
            selectedDays: days,
            lang
        });
    } catch (error) {
        console.error('Analytics dashboard error:', error);
        req.app.locals.renderWithoutLayout(res, 'error', {
            title: req.app.locals.i18n.t('error.500.title', req.session.language || 'en'),
            message: 'Failed to load analytics dashboard',
            lang: req.session.language || 'en'
        });
    }
});

// API endpoint for analytics data
router.get('/api/global', async (req, res) => {
    try {
        const { analytics } = req.app.locals;
        const days = parseInt(req.query.days) || 30;

        const data = await analytics.getGlobalAnalytics(days);

        res.json({
            success: true,
            data,
            period: days
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

// Popular skins endpoint
router.get('/api/popular-skins', async (req, res) => {
    try {
        const { analytics } = req.app.locals;
        const days = parseInt(req.query.days) || 30;

        const popularSkins = await analytics.getPopularSkins(days);

        res.json({
            success: true,
            data: popularSkins,
            period: days
        });
    } catch (error) {
        console.error('Popular skins API error:', error);
        res.status(500).json({ error: 'Failed to fetch popular skins' });
    }
});

// Price trends endpoint
router.get('/api/price-trends', async (req, res) => {
    try {
        const { analytics } = req.app.locals;
        const days = parseInt(req.query.days) || 30;

        const priceHistory = await analytics.getGlobalPriceHistory(days);

        res.json({
            success: true,
            data: priceHistory,
            period: days
        });
    } catch (error) {
        console.error('Price trends API error:', error);
        res.status(500).json({ error: 'Failed to fetch price trends' });
    }
});

// Activity overview endpoint
router.get('/api/activity', async (req, res) => {
    try {
        const { analytics } = req.app.locals;
        const days = parseInt(req.query.days) || 30;

        const activity = await analytics.getGlobalActivityOverview(days);

        res.json({
            success: true,
            data: activity,
            period: days
        });
    } catch (error) {
        console.error('Activity API error:', error);
        res.status(500).json({ error: 'Failed to fetch activity data' });
    }
});

module.exports = router;
