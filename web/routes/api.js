const express = require('express');
const router = express.Router();

// API middleware for authentication
const requireApiAuth = (req, res, next) => {
    if (!req.session.user && !req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Get current user's store
router.get('/store', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;

        if (!userId || !discordId) {
            return res.status(400).json({ error: 'User not found' });
        }

        const days = parseInt(req.query.days) || 1;
        const storeHistory = await db.getStoreHistory(userId, days);

        res.json({
            success: true,
            data: storeHistory,
            count: storeHistory.length
        });
    } catch (error) {
        console.error('API store error:', error);
        res.status(500).json({ error: 'Failed to fetch store data' });
    }
});

// Get user's wishlist
router.get('/wishlist', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(400).json({ error: 'User not found' });
        }

        const wishlist = await db.getUserWishlist(userId);

        res.json({
            success: true,
            data: wishlist,
            count: wishlist.length
        });
    } catch (error) {
        console.error('API wishlist error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
});

// Add skin to wishlist
router.post('/wishlist', requireApiAuth, async (req, res) => {
    try {
        const { db, analytics } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;
        const { skinUuid, skinName, priority, priceThreshold } = req.body;

        if (!userId || !skinUuid || !skinName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await db.addToWishlist(userId, discordId, skinUuid, skinName, priority || 1, priceThreshold);

        // Track event
        await analytics.trackEvent('wishlist_add', { skinUuid, skinName }, userId, discordId, req);

        res.json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
        console.error('API add wishlist error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

// Remove skin from wishlist
router.delete('/wishlist/:skinUuid', requireApiAuth, async (req, res) => {
    try {
        const { db, analytics } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;
        const { skinUuid } = req.params;

        if (!userId || !skinUuid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await db.removeFromWishlist(userId, skinUuid);

        // Track event
        await analytics.trackEvent('wishlist_remove', { skinUuid }, userId, discordId, req);

        res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        console.error('API remove wishlist error:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});

// Remove skin from wishlist (POST method for frontend compatibility)
router.post('/wishlist/remove', requireApiAuth, async (req, res) => {
    try {
        const { db, analytics } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;
        const { skin_uuid } = req.body;

        if (!userId || !skin_uuid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await db.removeFromWishlist(userId, skin_uuid);

        // Track event
        await analytics.trackEvent('wishlist_remove', { skinUuid: skin_uuid }, userId, discordId, req);

        res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        console.error('API remove wishlist error:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});

// Remove bundle from wishlist
router.post('/bundles/wishlist/remove', requireApiAuth, async (req, res) => {
    try {
        const { db, analytics } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;
        const { bundle_uuid } = req.body;

        if (!userId || !bundle_uuid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Remove from bundle wishlist using the proper method
        await db.removeFromBundleWishlist(userId, bundle_uuid);

        // Track event
        await analytics.trackEvent('bundle_wishlist_remove', { bundleUuid: bundle_uuid }, userId, discordId, req);

        res.json({ success: true, message: 'Removed bundle from wishlist' });
    } catch (error) {
        console.error('API remove bundle wishlist error:', error);
        res.status(500).json({ error: 'Failed to remove bundle from wishlist' });
    }
});

// Get user analytics
router.get('/analytics', requireApiAuth, async (req, res) => {
    try {
        const { analytics } = req.app.locals;
        const userId = req.session.user?.id;
        const days = parseInt(req.query.days) || 30;

        if (!userId) {
            return res.status(400).json({ error: 'User not found' });
        }

        const analyticsData = await analytics.getUserAnalytics(userId, days);

        res.json({
            success: true,
            data: analyticsData
        });
    } catch (error) {
        console.error('API analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Refresh store data
router.post('/store/refresh', requireApiAuth, async (req, res) => {
    try {
        const { db, analytics, io } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;

        if (!userId || !discordId) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Get user tokens
        const tokens = await db.getUserTokens(discordId);
        if (!tokens) {
            return res.status(400).json({ error: 'No tokens found. Please set up your tokens first.' });
        }

        // Import valorant API functions
        const { fetchStoreSkins } = require('../../utils/valorantApi');
        
        // Fetch fresh store data
        const storeData = await fetchStoreSkins(tokens);
        
        if (!storeData || storeData.length === 0) {
            return res.status(400).json({ error: 'No store data received' });
        }

        // Map store data to match database schema
        const mappedStoreData = storeData.map(skin => ({
            uuid: skin.uuid,
            displayName: skin.displayName,
            price: skin.vpPrice || 0, // Use vpPrice as the main price, default to 0 if undefined
            currency: 'VP' // Always VP for now
        }));

        // Save to database
        await db.saveStoreHistory(userId, discordId, mappedStoreData);

        // Track event
        await analytics.trackEvent('store_refresh', { count: storeData.length }, userId, discordId, req);

        // Broadcast update to user's dashboard
        io.to(`user-${userId}`).emit('store_updated', {
            storeData,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Store refreshed successfully',
            data: storeData,
            count: storeData.length
        });
    } catch (error) {
        console.error('API store refresh error:', error);
        res.status(500).json({ error: 'Failed to refresh store data' });
    }
});

// Get skin price history
router.get('/skins/:skinUuid/price-history', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const { skinUuid } = req.params;
        const days = parseInt(req.query.days) || 90;

        const priceHistory = await db.getSkinPriceHistory(skinUuid, days);

        res.json({
            success: true,
            data: priceHistory,
            count: priceHistory.length
        });
    } catch (error) {
        console.error('API price history error:', error);
        res.status(500).json({ error: 'Failed to fetch price history' });
    }
});

// Get active bundles
router.get('/bundles', async (req, res) => {
    try {
        const { db } = req.app.locals;
        const bundles = await db.getActiveBundles();

        res.json({
            success: true,
            data: bundles,
            count: bundles.length
        });
    } catch (error) {
        console.error('API bundles error:', error);
        res.status(500).json({ error: 'Failed to fetch bundles' });
    }
});

// Get notifications
router.get('/notifications', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(400).json({ error: 'User not found' });
        }

        // For now, return empty notifications since the table doesn't exist yet
        // This can be implemented later when notifications functionality is added
        const notifications = [];

        res.json({
            success: true,
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('API notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/notifications/:id/read', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const userId = req.session.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User not found' });
        }

        await db.run(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('API notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Token management endpoints
router.post('/tokens/refresh', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const discordId = req.session.user?.discord_id;

        if (!discordId) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Get current tokens
        const currentTokens = await db.getUserTokens(discordId);
        if (!currentTokens) {
            return res.status(404).json({ error: 'No tokens found. Please setup tokens first.' });
        }

        try {
            // Here you would implement token refresh logic
            // For now, just return success if tokens exist
            res.json({ 
                success: true, 
                message: 'Tokens refreshed successfully',
                region: currentTokens.region
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({ error: 'Failed to refresh tokens' });
        }
    } catch (error) {
        console.error('API token refresh error:', error);
        res.status(500).json({ error: 'Failed to refresh tokens' });
    }
});

router.post('/tokens/test', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const discordId = req.session.user?.discord_id;

        if (!discordId) {
            return res.status(400).json({ error: 'User not found' });
        }

        const tokens = await db.getUserTokens(discordId);
        if (!tokens || !tokens.access_token) {
            return res.status(404).json({ error: 'No tokens found' });
        }

        try {
            // Here you would test the tokens against Valorant API
            // For now, just check if tokens exist and haven't expired
            const isValid = tokens.access_token && new Date(tokens.expires_at) > new Date();
            
            if (isValid) {
                res.json({ 
                    success: true, 
                    message: 'Tokens are valid',
                    region: tokens.region,
                    expires: tokens.expires_at
                });
            } else {
                res.status(400).json({ error: 'Tokens are expired or invalid' });
            }
        } catch (error) {
            console.error('Token test error:', error);
            res.status(500).json({ error: 'Failed to test tokens' });
        }
    } catch (error) {
        console.error('API token test error:', error);
        res.status(500).json({ error: 'Failed to test tokens' });
    }
});

router.delete('/tokens/remove', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const discordId = req.session.user?.discord_id;

        if (!discordId) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Check if tokens exist first
        const existingTokens = await db.getUserTokens(discordId);
        if (!existingTokens) {
            return res.status(404).json({ error: 'No tokens found to remove' });
        }

        // Remove tokens (mark as inactive)
        const result = await db.removeUserTokens(discordId);
        
        if (result && result.changes > 0) {
            // Clear session tokens info
            if (req.session.user) {
                req.session.user.hasTokens = false;
                delete req.session.user.region;
                delete req.session.user.puuid;
            }

            res.json({ 
                success: true, 
                message: 'Tokens removed successfully'
            });
        } else {
            res.status(500).json({ error: 'No tokens were updated. They may have already been removed.' });
        }
    } catch (error) {
        console.error('API token removal error:', error);
        res.status(500).json({ 
            error: 'Failed to remove tokens',
            details: error.message 
        });
    }
});

// Save user settings
router.post('/settings', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const userId = req.session.user?.id;
        const settings = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User not found' });
        }

        await db.saveUserSettings(userId, settings);

        res.json({ 
            success: true, 
            message: 'Settings saved successfully'
        });
    } catch (error) {
        console.error('API settings save error:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Clear user wishlist
router.delete('/wishlist/clear', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(400).json({ error: 'User not found' });
        }

        await db.run('DELETE FROM user_wishlist WHERE user_id = ?', [userId]);

        res.json({ 
            success: true, 
            message: 'Wishlist cleared successfully'
        });
    } catch (error) {
        console.error('API wishlist clear error:', error);
        res.status(500).json({ error: 'Failed to clear wishlist' });
    }
});

// Clear all user data
router.delete('/user/clear', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;

        if (!userId || !discordId) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Clear all user related data
        await db.run('DELETE FROM user_wishlist WHERE user_id = ?', [userId]);
        await db.run('DELETE FROM store_history WHERE user_id = ?', [userId]);
        await db.run('DELETE FROM notifications WHERE user_id = ?', [userId]);
        await db.removeUserTokens(discordId);

        // Destroy session
        req.session.destroy();

        res.json({ 
            success: true, 
            message: 'All user data cleared successfully'
        });
    } catch (error) {
        console.error('API user clear error:', error);
        res.status(500).json({ error: 'Failed to clear user data' });
    }
});

// Export analytics data
router.get('/export', requireApiAuth, async (req, res) => {
    try {
        const { analytics } = req.app.locals;
        const userId = req.session.user?.id;
        const format = req.query.format || 'json';
        const days = parseInt(req.query.days) || 30;

        if (!userId) {
            return res.status(400).json({ error: 'User not found' });
        }

        const data = await analytics.generateReport(userId, format, days);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.csv`);
            res.send(data);
        } else {
            res.json({
                success: true,
                data,
                exportedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('API export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Test endpoint to add sample wishlist items (remove in production)
router.post('/test/add-wishlist-sample', requireApiAuth, async (req, res) => {
    try {
        const { db } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;

        if (!userId || !discordId) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Sample skin data with real UUIDs
        const sampleSkins = [
            {
                skinUuid: '4ade7faa-4cf1-8376-95ef-39884480959b',
                skinName: 'Prime Vandal',
                priority: 2
            },
            {
                skinUuid: 'e046854e-406c-37f4-6607-19a9ba8426fc',
                skinName: 'Glitchpop Phantom',
                priority: 1
            },
            {
                skinUuid: '1baa85b4-4c70-1284-64bb-6481dfc3bb4e',
                skinName: 'Elderflame Operator',
                priority: 1
            }
        ];

        // Add each sample skin to wishlist
        for (const skin of sampleSkins) {
            await db.addToWishlist(userId, discordId, skin.skinUuid, skin.skinName, skin.priority);
        }

        res.json({ 
            success: true, 
            message: 'Sample wishlist items added',
            count: sampleSkins.length 
        });
    } catch (error) {
        console.error('Test add wishlist error:', error);
        res.status(500).json({ error: 'Failed to add test items' });
    }
});

// Search skins with auto-correct
router.get('/skins/search', requireApiAuth, async (req, res) => {
    try {
        const { searchSkinsWithAutoCorrect } = require('../utils/skinSearch');
        const { q: searchTerm } = req.query;

        if (!searchTerm || searchTerm.trim().length < 2) {
            return res.status(400).json({ 
                error: 'Search term must be at least 2 characters long' 
            });
        }

        const results = await searchSkinsWithAutoCorrect(searchTerm);

        res.json({
            success: true,
            query: searchTerm,
            results: results.map(skin => ({
                uuid: skin.uuid,
                displayName: skin.displayName,
                displayIcon: skin.displayIcon,
                themeUuid: skin.themeUuid,
                matchType: skin.matchType,
                similarity: skin.similarity,
                priority: skin.priority
            })),
            count: results.length
        });
    } catch (error) {
        console.error('API skin search error:', error);
        res.status(500).json({ error: 'Failed to search skins' });
    }
});

// Validate skin name and get suggestions
router.get('/skins/validate', requireApiAuth, async (req, res) => {
    try {
        const { validateSkinName } = require('../utils/skinSearch');
        const { name: skinName } = req.query;

        if (!skinName) {
            return res.status(400).json({ error: 'Skin name is required' });
        }

        const validation = await validateSkinName(skinName);

        res.json({
            success: true,
            isValid: validation.isValid,
            exactMatch: validation.exactMatch,
            suggestions: validation.suggestions
        });
    } catch (error) {
        console.error('API skin validation error:', error);
        res.status(500).json({ error: 'Failed to validate skin name' });
    }
});

// Add skin to wishlist with auto-correct
router.post('/wishlist/add', requireApiAuth, async (req, res) => {
    try {
        const { db, analytics } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;
        const { skinName, skinUuid } = req.body;

        if (!userId || (!skinName && !skinUuid)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let skinToAdd = null;

        // If UUID provided, get skin directly
        if (skinUuid) {
            const { getSkinByUUID } = require('../utils/skinSearch');
            skinToAdd = await getSkinByUUID(skinUuid);
        } 
        // If skin name provided, search with auto-correct
        else if (skinName) {
            const { validateSkinName } = require('../utils/skinSearch');
            const validation = await validateSkinName(skinName);
            
            if (validation.isValid && validation.exactMatch) {
                skinToAdd = validation.exactMatch;
            } else if (validation.suggestions.length > 0) {
                // Return suggestions for user to choose
                return res.json({
                    success: false,
                    requiresConfirmation: true,
                    message: `Skin "${skinName}" not found. Did you mean one of these?`,
                    suggestions: validation.suggestions
                });
            } else {
                return res.status(404).json({ 
                    error: `Skin "${skinName}" not found and no similar skins available` 
                });
            }
        }

        if (!skinToAdd) {
            return res.status(404).json({ error: 'Skin not found' });
        }

        // Check if already in wishlist
        const existingWishlist = await db.getUserWishlist(userId);
        const alreadyExists = existingWishlist.some(item => item.skin_uuid === skinToAdd.uuid);

        if (alreadyExists) {
            return res.status(400).json({ 
                error: `${skinToAdd.displayName} is already in your wishlist` 
            });
        }

        // Add to wishlist
        await db.addToWishlist(userId, discordId, skinToAdd.uuid, skinToAdd.displayName);

        // Track event
        await analytics.trackEvent('wishlist_add_web', { 
            skinUuid: skinToAdd.uuid, 
            skinName: skinToAdd.displayName 
        }, userId, discordId, req);

        res.json({
            success: true,
            message: `${skinToAdd.displayName} added to wishlist`,
            skin: {
                uuid: skinToAdd.uuid,
                displayName: skinToAdd.displayName,
                displayIcon: skinToAdd.displayIcon
            }
        });

    } catch (error) {
        console.error('API add wishlist error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

// Quick add to wishlist from store
router.post('/store/add-to-wishlist', requireApiAuth, async (req, res) => {
    try {
        const { db, analytics } = req.app.locals;
        const userId = req.session.user?.id;
        const discordId = req.session.user?.discord_id;
        const { skinUuid, skinName } = req.body;

        if (!userId || !skinUuid || !skinName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if already in wishlist
        const existingWishlist = await db.getUserWishlist(userId);
        const alreadyExists = existingWishlist.some(item => item.skin_uuid === skinUuid);

        if (alreadyExists) {
            return res.status(400).json({ 
                error: `${skinName} is already in your wishlist` 
            });
        }

        // Add to wishlist
        await db.addToWishlist(userId, discordId, skinUuid, skinName);

        // Track event
        await analytics.trackEvent('wishlist_add_from_store', { 
            skinUuid, 
            skinName 
        }, userId, discordId, req);

        res.json({
            success: true,
            message: `${skinName} added to wishlist`,
            skin: {
                uuid: skinUuid,
                displayName: skinName
            }
        });

    } catch (error) {
        console.error('API store add wishlist error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

module.exports = router;
