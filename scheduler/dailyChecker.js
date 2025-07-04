const cron = require('node-cron');
const { loadUserTokens, loadWishlist, fetchStoreSkins, shouldSendAlert } = require('../utils/valorantApi');

class DailyChecker {
    constructor(client) {
        this.client = client;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('⚠️ Daily checker is already running');
            return;
        }

        // Schedule daily check at 7:05 PM WIB (19:05) when store resets
        // Cron format: second minute hour day month dayOfWeek
        const cronExpression = '0 5 19 * * *'; // 19:05 every day
        
        this.job = cron.schedule(cronExpression, async () => {
            console.log('🔄 Running daily store check for all users...');
            await this.checkAllUsersStore();
        }, {
            scheduled: true,
            timezone: "Asia/Jakarta"
        });

        this.isRunning = true;
        console.log('✅ Daily checker started - will run every day at 19:05 WIB');
    }

    stop() {
        if (this.job) {
            this.job.destroy();
            this.isRunning = false;
            console.log('🛑 Daily checker stopped');
        }
    }

    async checkAllUsersStore() {
        try {
            const allTokens = loadUserTokens();
            const userIds = Object.keys(allTokens);
            
            console.log(`📊 Checking store for ${userIds.length} users...`);
            
            for (const userId of userIds) {
                try {
                    await this.checkUserStore(userId);
                    // Add delay between users to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error(`❌ Failed to check store for user ${userId}:`, error.message);
                }
            }
            
            console.log('✅ Daily store check completed');
        } catch (error) {
            console.error('❌ Daily checker error:', error);
        }
    }

    async checkUserStore(userId) {
        const tokens = loadUserTokens(userId);
        if (!tokens) return;

        const wishlist = loadWishlist(userId);
        if (wishlist.length === 0) return; // No wishlist items

        try {
            const skins = await fetchStoreSkins(tokens);
            if (!skins || skins.length === 0) return;

            // Check if any wishlist skins are in store
            const wishlistSkins = skins.filter(skin => wishlist.includes(skin.uuid));
            
            if (wishlistSkins.length > 0) {
                const skinUUIDs = wishlistSkins.map(skin => skin.uuid);
                
                // Check if we should send alert
                if (shouldSendAlert(userId, skinUUIDs)) {
                    await this.sendWishlistAlert(userId, wishlistSkins);
                }
            }
        } catch (error) {
            console.error(`Store check failed for user ${userId}:`, error.message);
            
            // Handle specific token errors
            if (error.message.includes('BAD_CLAIMS') || error.message.includes('UNAUTHORIZED')) {
                console.log(`🔑 Token expired for user ${userId}, sending refresh notification...`);
                await this.sendTokenExpiredNotification(userId);
            }
        }
    }

    async sendWishlistAlert(userId, wishlistSkins) {
        try {
            // Find a channel where the bot can send messages
            // You might want to save user's preferred channel in the database
            const user = await this.client.users.fetch(userId);
            
            if (!user) return;

            const skinNames = wishlistSkins.map(skin => `**${skin.displayName}**`).join(', ');
            const totalVP = wishlistSkins.reduce((total, skin) => total + (skin.vpPrice || 0), 0);
            
            const message = `🎉 **WISHLIST ALERT!** 🎉\n\n` +
                          `Skin impian Anda tersedia di Valorant Store!\n\n` +
                          `✨ **Skin yang Tersedia:**\n${skinNames}\n\n` +
                          `💰 **Total Harga:** ${totalVP.toLocaleString()} VP\n\n` +
                          `⏰ Store akan reset sekitar pukul 19:00 WIB besok.\n\n` +
                          `Gunakan \`/store\` di Discord untuk melihat detail lengkap!`;

            await user.send(message);
            console.log(`📢 Sent DM wishlist alert to user ${userId}`);
            
        } catch (error) {
            console.error(`Failed to send DM alert to user ${userId}:`, error.message);
        }
    }

    async sendTokenExpiredNotification(userId) {
        try {
            // Check if already notified today to prevent spam
            const fs = require('fs');
            let notifiedUsers = {};
            try {
                notifiedUsers = JSON.parse(fs.readFileSync('./data/notified-expiry.json', 'utf8'));
            } catch (e) {
                // File doesn't exist, create new object
            }
            
            const today = new Date().toDateString();
            const lastNotified = notifiedUsers[userId] ? new Date(notifiedUsers[userId]).toDateString() : null;
            
            if (lastNotified === today) {
                console.log(`⏭️ Skipped duplicate token expired notification for user ${userId} (already sent today)`);
                return;
            }
            
            const user = await this.client.users.fetch(userId);
            if (!user) return;

            const message = `🔑 **Token Expired - Perlu Refresh!**\n\n` +
                          `Token Valorant Anda sudah expired dan perlu diperbarui.\n\n` +
                          `🔄 **Cara refresh token:**\n` +
                          `1. Buka Valorant dan login\n` +
                          `2. Gunakan \`/gettoken\` di Discord untuk panduan\n` +
                          `3. Atau gunakan \`/setup\` untuk setup ulang\n` +
                          `4. Atau buka \`/easysetup\` untuk web interface\n\n` +
                          `⚠️ **Penting:** Tanpa token yang valid, bot tidak bisa mengecek store atau mengirim alert wishlist.\n\n` +
                          `💡 Token biasanya expired setelah beberapa jam atau hari.\n\n` +
                          `🔇 **Anti-Spam:** Notifikasi ini hanya dikirim sekali per hari.`;

            await user.send(message);
            console.log(`📧 Sent token expired notification to user ${userId}`);
            
            // Mark as notified today
            notifiedUsers[userId] = Date.now();
            fs.writeFileSync('./data/notified-expiry.json', JSON.stringify(notifiedUsers, null, 2));
            
        } catch (error) {
            console.error(`Failed to send token expired notification to user ${userId}:`, error.message);
        }
    }

    // Manual trigger for testing
    async runNow() {
        console.log('🔄 Running manual store check...');
        await this.checkAllUsersStore();
    }
}

module.exports = DailyChecker;
