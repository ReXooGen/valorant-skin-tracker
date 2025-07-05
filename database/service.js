const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'valorant_tracker.db');
        this.db = null;
    }

    async initialize() {
        // Ensure data directory exists
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Database connection error:', err);
                    reject(err);
                } else {
                    console.log('✅ Database connected successfully');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            // Users table for web authentication
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                discord_id TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                preferences TEXT DEFAULT '{}'
            )`,

            // Enhanced tokens table
            `CREATE TABLE IF NOT EXISTS user_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                discord_id TEXT NOT NULL,
                puuid TEXT NOT NULL,
                access_token TEXT NOT NULL,
                entitlement_token TEXT NOT NULL,
                region TEXT NOT NULL,
                ssid TEXT,
                clid TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Store history for price tracking
            `CREATE TABLE IF NOT EXISTS store_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                discord_id TEXT NOT NULL,
                skin_uuid TEXT NOT NULL,
                skin_name TEXT NOT NULL,
                price INTEGER NOT NULL,
                currency TEXT NOT NULL,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Wishlist with enhanced tracking
            `CREATE TABLE IF NOT EXISTS wishlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                discord_id TEXT NOT NULL,
                skin_uuid TEXT NOT NULL,
                skin_name TEXT NOT NULL,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                priority INTEGER DEFAULT 1,
                price_alert_threshold INTEGER,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Notifications log
            `CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                discord_id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                data TEXT,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Analytics data
            `CREATE TABLE IF NOT EXISTS analytics_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                discord_id TEXT,
                event_type TEXT NOT NULL,
                event_data TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Skin price history for market analysis
            `CREATE TABLE IF NOT EXISTS global_skin_prices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                skin_uuid TEXT NOT NULL,
                skin_name TEXT NOT NULL,
                price INTEGER NOT NULL,
                currency TEXT NOT NULL,
                region TEXT NOT NULL,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(skin_uuid, date, region)
            )`,

            // Bundle tracking
            `CREATE TABLE IF NOT EXISTS bundles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bundle_uuid TEXT UNIQUE NOT NULL,
                bundle_name TEXT NOT NULL,
                price INTEGER NOT NULL,
                currency TEXT NOT NULL,
                start_date DATE,
                end_date DATE,
                items TEXT,
                region TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // User bundle wishlist
            `CREATE TABLE IF NOT EXISTS bundle_wishlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                discord_id TEXT NOT NULL,
                bundle_uuid TEXT NOT NULL,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        // Create indexes for better performance
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_store_history_user_date ON store_history(user_id, date)',
            'CREATE INDEX IF NOT EXISTS idx_wishlist_user_active ON wishlist(user_id, is_active)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_user_type ON analytics_events(user_id, event_type)',
            'CREATE INDEX IF NOT EXISTS idx_global_prices_skin_date ON global_skin_prices(skin_uuid, date)',
            'CREATE INDEX IF NOT EXISTS idx_bundles_dates ON bundles(start_date, end_date)'
        ];

        for (const index of indexes) {
            await this.run(index);
        }

        console.log('✅ Database tables and indexes created successfully');
    }

    // Promise wrapper for database operations
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // User management
    async createUser(discordId, username, email = null) {
        const sql = `INSERT INTO users (discord_id, username, email) VALUES (?, ?, ?)`;
        return await this.run(sql, [discordId, username, email]);
    }

    async getUserByDiscordId(discordId) {
        const sql = `SELECT * FROM users WHERE discord_id = ?`;
        return await this.get(sql, [discordId]);
    }

    async updateUserLogin(discordId) {
        const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE discord_id = ?`;
        return await this.run(sql, [discordId]);
    }

    // Token management
    async saveUserTokens(userId, discordId, tokens) {
        const sql = `
            INSERT OR REPLACE INTO user_tokens 
            (user_id, discord_id, puuid, access_token, entitlement_token, region, ssid, clid, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        return await this.run(sql, [
            userId, discordId, tokens.puuid, tokens.access_token,
            tokens.entitlement_token, tokens.region, tokens.ssid, tokens.clid
        ]);
    }

    async getUserTokens(discordId) {
        const sql = `SELECT * FROM user_tokens WHERE discord_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1`;
        return await this.get(sql, [discordId]);
    }

    async removeUserTokens(discordId) {
        const sql = `UPDATE user_tokens SET is_active = 0 WHERE discord_id = ?`;
        return await this.run(sql, [discordId]);
    }

    async deleteUserTokens(discordId) {
        const sql = `DELETE FROM user_tokens WHERE discord_id = ?`;
        return await this.run(sql, [discordId]);
    }

    async getUserTokenCount(discordId) {
        const sql = `SELECT COUNT(*) as count FROM user_tokens WHERE discord_id = ? AND is_active = 1`;
        const result = await this.get(sql, [discordId]);
        return result ? result.count : 0;
    }

    async isTokenValid(discordId) {
        const tokens = await this.getUserTokens(discordId);
        if (!tokens) return false;
        
        // Check if tokens exist and are not expired (if expires_at exists)
        if (tokens.expires_at) {
            const expiry = new Date(tokens.expires_at);
            const now = new Date();
            return expiry > now;
        }
        
        // If no expiry date, assume valid if access_token exists
        return !!tokens.access_token;
    }

    // Store history
    async saveStoreHistory(userId, discordId, storeData) {
        const today = new Date().toISOString().split('T')[0];
        
        // Delete existing entries for today
        await this.run(
            `DELETE FROM store_history WHERE user_id = ? AND date = ?`,
            [userId, today]
        );

        // Insert new entries
        for (const skin of storeData) {
            const sql = `
                INSERT INTO store_history (user_id, discord_id, skin_uuid, skin_name, price, currency, date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            await this.run(sql, [
                userId, discordId, skin.uuid, skin.displayName,
                skin.price, skin.currency || 'VP', today
            ]);
        }
    }

    async getStoreHistory(userId, days = 30) {
        const sql = `
            SELECT * FROM store_history 
            WHERE user_id = ? AND date >= date('now', '-${days} days')
            ORDER BY date DESC, skin_name
        `;
        return await this.all(sql, [userId]);
    }

    // Wishlist management
    async addToWishlist(userId, discordId, skinUuid, skinName, priority = 1, priceThreshold = null) {
        const sql = `
            INSERT OR REPLACE INTO wishlist (user_id, discord_id, skin_uuid, skin_name, priority, price_alert_threshold)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return await this.run(sql, [userId, discordId, skinUuid, skinName, priority, priceThreshold]);
    }

    async removeFromWishlist(userId, skinUuid) {
        const sql = `UPDATE wishlist SET is_active = 0 WHERE user_id = ? AND skin_uuid = ?`;
        return await this.run(sql, [userId, skinUuid]);
    }

    async getUserWishlist(userId) {
        const sql = `
            SELECT * FROM wishlist 
            WHERE user_id = ? AND is_active = 1
            ORDER BY priority DESC, added_at ASC
        `;
        return await this.all(sql, [userId]);
    }

    // Bundle wishlist management
    async addToBundleWishlist(userId, discordId, bundleUuid) {
        const sql = `
            INSERT OR REPLACE INTO bundle_wishlist (user_id, discord_id, bundle_uuid)
            VALUES (?, ?, ?)
        `;
        return await this.run(sql, [userId, discordId, bundleUuid]);
    }

    async removeFromBundleWishlist(userId, bundleUuid) {
        const sql = `UPDATE bundle_wishlist SET is_active = 0 WHERE user_id = ? AND bundle_uuid = ?`;
        return await this.run(sql, [userId, bundleUuid]);
    }

    async getUserBundleWishlist(userId) {
        const sql = `
            SELECT bw.*, b.bundle_name, b.price, b.currency, b.start_date, b.end_date
            FROM bundle_wishlist bw
            LEFT JOIN bundles b ON bw.bundle_uuid = b.bundle_uuid
            WHERE bw.user_id = ? AND bw.is_active = 1
            ORDER BY bw.added_at DESC
        `;
        return await this.all(sql, [userId]);
    }

    // Analytics
    async logEvent(eventType, eventData, userId = null, discordId = null, ipAddress = null, userAgent = null) {
        const sql = `
            INSERT INTO analytics_events (user_id, discord_id, event_type, event_data, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return await this.run(sql, [
            userId, discordId, eventType,
            typeof eventData === 'object' ? JSON.stringify(eventData) : eventData,
            ipAddress, userAgent
        ]);
    }

    async getAnalytics(userId = null, days = 30) {
        let sql = `
            SELECT event_type, COUNT(*) as count, DATE(created_at) as date
            FROM analytics_events 
            WHERE created_at >= datetime('now', '-${days} days')
        `;
        let params = [];

        if (userId) {
            sql += ` AND user_id = ?`;
            params.push(userId);
        }

        sql += ` GROUP BY event_type, DATE(created_at) ORDER BY date DESC`;
        return await this.all(sql, params);
    }

    // Global skin price tracking
    async saveGlobalSkinPrice(skinUuid, skinName, price, currency, region) {
        const today = new Date().toISOString().split('T')[0];
        const sql = `
            INSERT OR REPLACE INTO global_skin_prices (skin_uuid, skin_name, price, currency, region, date)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return await this.run(sql, [skinUuid, skinName, price, currency, region, today]);
    }

    async getSkinPriceHistory(skinUuid, days = 90) {
        const sql = `
            SELECT * FROM global_skin_prices 
            WHERE skin_uuid = ? AND date >= date('now', '-${days} days')
            ORDER BY date DESC
        `;
        return await this.all(sql, [skinUuid]);
    }

    // Bundle management
    async saveBundle(bundleData) {
        const sql = `
            INSERT OR REPLACE INTO bundles (bundle_uuid, bundle_name, price, currency, start_date, end_date, items, region)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        return await this.run(sql, [
            bundleData.uuid, bundleData.name, bundleData.price, bundleData.currency,
            bundleData.startDate, bundleData.endDate,
            JSON.stringify(bundleData.items), bundleData.region
        ]);
    }

    async getActiveBundles() {
        const today = new Date().toISOString().split('T')[0];
        const sql = `
            SELECT * FROM bundles 
            WHERE start_date <= ? AND (end_date IS NULL OR end_date >= ?)
            ORDER BY start_date DESC
        `;
        return await this.all(sql, [today, today]);
    }

    // Cleanup old data
    async cleanup(daysToKeep = 90) {
        const tables = [
            'store_history',
            'analytics_events',
            'global_skin_prices',
            'notifications'
        ];

        for (const table of tables) {
            const sql = `DELETE FROM ${table} WHERE created_at < datetime('now', '-${daysToKeep} days')`;
            const result = await this.run(sql);
            console.log(`🧹 Cleaned ${result.changes} old records from ${table}`);
        }
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) console.error('Database close error:', err);
                    else console.log('✅ Database connection closed');
                    resolve();
                });
            });
        }
    }

    // Get user preferences
    async getUserPreferences(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT preferences FROM users WHERE id = ?',
                [userId],
                (err, row) => {
                    if (err) {
                        console.error('Error getting user preferences:', err);
                        reject(err);
                    } else {
                        if (row && row.preferences) {
                            try {
                                const preferences = JSON.parse(row.preferences);
                                resolve(preferences);
                            } catch (e) {
                                console.error('Error parsing preferences JSON:', e);
                                resolve({});
                            }
                        } else {
                            resolve({});
                        }
                    }
                }
            );
        });
    }

    // Get user wishlist count
    async getUserWishlistCount(userId) {
        return new Promise((resolve, reject) => {
            // For now, return 0 since skin_wishlist table doesn't exist
            // This can be implemented later when wishlist functionality is added
            resolve(0);
        });
    }

    // Get user bundle wishlist count
    async getUserBundleWishlistCount(userId) {
        return new Promise((resolve, reject) => {
            // For now, return 0 since bundle_wishlist table doesn't exist
            // This can be implemented later when bundle wishlist functionality is added
            resolve(0);
        });
    }

    // Get user bundle wishlist
    async getUserBundleWishlist(userId) {
        return new Promise((resolve, reject) => {
            // For now, return empty array since bundle_wishlist table doesn't exist
            // This can be implemented later when bundle wishlist functionality is added
            resolve([]);
        });
    }
}

module.exports = DatabaseService;
