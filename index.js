const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { loadWishlist, checkSkins, loadUserTokens, fetchStoreSkins } = require('./utils/valorantApi');
const DailyChecker = require('./scheduler/dailyChecker');
const axios = require('axios');
require('dotenv').config();

// Helper function to validate embed field values
function validateEmbedField(name, value) {
    if (!value || typeof value !== 'string' || value.trim() === '') {
        console.error(`⚠️ Invalid embed field: ${name} - empty or invalid value`);
        return '• Information not available';
    }
    return value.trim();
}

// Helper function to safely edit replies
function safeEditReply(interaction, content) {
    return new Promise(async (resolve, reject) => {
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(content);
            } else {
                await interaction.reply(content);
            }
            resolve();
        } catch (error) {
            console.error('Failed to send response:', error);
            // If editing fails, try to send a new reply (in case the original wasn't deferred)
            try {
                if (!interaction.replied) {
                    await interaction.reply(content);
                }
            } catch (replyError) {
                console.error('Failed to send backup reply:', replyError);
            }
            reject(error);
        }
    });
}

// Use only basic intents that don't require special permissions
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds
    ] 
});

// Add the helper function to client for easy access
client.safeEditReply = safeEditReply;

// Initialize daily checker
let dailyChecker;

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    // Start daily checker
    dailyChecker = new DailyChecker(client);
    dailyChecker.start();
    
    // Register slash commands
    const commands = [
        {
            name: 'store',
            description: 'Check your Valorant store for skins'
        },
        {
            name: 'quicksetup',
            description: '🚀 Quick token setup directly in Discord (Recommended)',
            options: [
                {
                    name: 'userid',
                    description: 'Your Discord User ID',
                    type: 3, // STRING
                    required: true
                },
                {
                    name: 'ssid',
                    description: 'Your ssid cookie from browser',
                    type: 3, // STRING
                    required: true
                },
                {
                    name: 'clid',
                    description: 'Your clid cookie from browser',
                    type: 3, // STRING
                    required: true
                },
                {
                    name: 'region',
                    description: 'Your region',
                    type: 3, // STRING
                    required: true,
                    choices: [
                        {
                            name: 'Asia Pacific (ap)',
                            value: 'ap'
                        },
                        {
                            name: 'North America (na)',
                            value: 'na'
                        },
                        {
                            name: 'Europe (eu)',
                            value: 'eu'
                        }
                    ]
                }
            ]
        },

        {
            name: 'addwishlist',
            description: 'Add a skin to your wishlist',
            options: [
                {
                    name: 'skin_name',
                    description: 'The name of the skin (e.g., "Phantom", "Vandal Prime", "Reaver Vandal")',
                    type: 3, // STRING
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            name: 'wishlist',
            description: 'View your current wishlist'
        },
        {
            name: 'removewishlist',
            description: 'Remove a skin from your wishlist',
            options: [
                {
                    name: 'skin_name',
                    description: 'The name of the skin to remove',
                    type: 3, // STRING
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            name: 'autocheck',
            description: 'Manage automatic daily store checking',
            options: [
                {
                    name: 'action',
                    description: 'What to do with auto checking',
                    type: 3, // STRING
                    required: true,
                    choices: [
                        {
                            name: 'status',
                            value: 'status'
                        },
                        {
                            name: 'test',
                            value: 'test'
                        }
                    ]
                }
            ]
        },
        {
            name: 'checktoken',
            description: 'Check if your current tokens are still valid'
        },
        {
            name: 'help',
            description: 'Show all available commands and how to use the bot'
        },
        {
            name: 'autotokens',
            description: '� CLI token setup guide and instructions'
        }
    ];

    try {
        console.log('🔄 Registering slash commands...');
        console.log(`📝 Commands to register: ${commands.map(cmd => cmd.name).join(', ')}`);
        
        // Register commands globally (takes up to 1 hour to propagate)
        await client.application.commands.set(commands);
        
        // Also register in each guild for instant availability (optional)
        const guilds = client.guilds.cache;
        console.log(`🏠 Registering commands in ${guilds.size} guild(s) for instant access...`);
        
        for (const guild of guilds.values()) {
            try {
                await guild.commands.set(commands);
                console.log(`✅ Commands registered in guild: ${guild.name}`);
            } catch (guildError) {
                console.error(`❌ Failed to register commands in guild ${guild.name}:`, guildError.message);
            }
        }
        
        console.log('✅ Slash commands registered successfully');
        
        // Verify commands were registered
        const registeredCommands = await client.application.commands.fetch();
        console.log(`📋 Currently registered commands: ${registeredCommands.map(cmd => cmd.name).join(', ')}`);
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        // Handle autocomplete interactions
        if (interaction.isAutocomplete()) {
            try {
                if (interaction.commandName === 'addwishlist' || interaction.commandName === 'removewishlist') {
                    const focusedValue = interaction.options.getFocused();
                    
                    let choices = [];
                    
                    if (interaction.commandName === 'addwishlist') {
                        // Search all available skins
                        if (focusedValue.length >= 2) { // Only search if user typed at least 2 characters
                            const { searchSkinsByName } = require('./utils/valorantApi');
                            const matchingSkins = await searchSkinsByName(focusedValue);
                            
                            choices = matchingSkins.slice(0, 25).map(skin => ({
                                name: skin.displayName.length > 100 ? skin.displayName.substring(0, 97) + '...' : skin.displayName,
                                value: skin.displayName
                            }));
                        }
                    } else if (interaction.commandName === 'removewishlist') {
                        // Search only user's wishlist
                        const { loadWishlist, getSkinDetailsByUUIDs } = require('./utils/valorantApi');
                        const wishlist = loadWishlist(interaction.user.id);
                        
                        if (wishlist.length > 0) {
                            const skinDetails = await getSkinDetailsByUUIDs(wishlist);
                            const filteredSkins = skinDetails.filter(skin => 
                                skin.displayName.toLowerCase().includes(focusedValue.toLowerCase())
                            );
                            
                            choices = filteredSkins.slice(0, 25).map(skin => ({
                                name: skin.displayName.length > 100 ? skin.displayName.substring(0, 97) + '...' : skin.displayName,
                                value: skin.displayName
                            }));
                        }
                    }
                    
                    await interaction.respond(choices);
                }
            } catch (autocompleteError) {
                console.error('Autocomplete error:', autocompleteError);
                try {
                    await interaction.respond([]);
                } catch (fallbackError) {
                    console.error('Failed to send empty autocomplete response:', fallbackError);
                }
            }
            return;
        }

        // Handle slash commands
        if (interaction.isCommand()) {
            // Add timeout to prevent long-running commands
            const commandTimeout = setTimeout(() => {
                console.error(`⏰ Command timeout: ${interaction.commandName} by user ${interaction.user.id}`);
                if (!interaction.replied && !interaction.deferred) {
                    interaction.reply({ 
                        content: '⏰ Command timeout. Please try again.', 
                        flags: MessageFlags.Ephemeral 
                    }).catch(console.error);
                }
            }, 14000); // 14 seconds timeout (Discord has 15s limit)

            try {
                // Clear timeout if command completes successfully
                const clearTimeoutOnComplete = () => {
                    clearTimeout(commandTimeout);
                };

                const commandName = interaction.commandName;
                const user = interaction.user;

                if (commandName === 'quicksetup') {
                    await handleQuickSetup(interaction);
                    clearTimeoutOnComplete();
                    return;
                }

                if (commandName === 'autotokens') {
                    const embed = new EmbedBuilder()
                        .setTitle('� Automatic Token Setup (Recommended)')
                        .setDescription('Use our CLI tool to get your Valorant tokens automatically!')
                        .setColor(0x00ff00)
                        .addFields(
                            {
                                name: '� How to use:',
                                value: '**1.** Open terminal/command prompt in bot folder\n**2.** Run: `node get-tokens-cli.js`\n**3.** Follow the step-by-step guide',
                                inline: false
                            },
                            {
                                name: '📋 What you need:',
                                value: '• Your Discord User ID\n• Be logged into Riot Games in browser\n• Copy 2 cookies (ssid, clid) from browser\n• Choose your region (ap, na, eu)',
                                inline: false
                            },
                            {
                                name: '🆔 Get Discord User ID:',
                                value: 'Settings > Advanced > Enable Developer Mode\nRight-click your profile > Copy User ID',
                                inline: false
                            },
                            {
                                name: '✨ Why use the CLI tool?',
                                value: '• Automatic token fetching\n• Direct save to bot\n• No manual copy-paste\n• Built-in error handling\n• Fresh tokens every time',
                                inline: false
                            }
                        )
                        .setFooter({ text: 'Recommended: Use /quicksetup for fastest setup!' });

                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    clearTimeoutOnComplete();
                    return;
                }        if (commandName === 'store') {
                    const userId = user.id;
                    const tokens = loadUserTokens(userId);
                    if (!tokens) {
                        return interaction.reply("❌ No account found. Use `/quicksetup` or `/autotokens` to set up your account.");
                    }

                try {
                    await interaction.deferReply();
                } catch (error) {
                    console.error('Failed to defer reply:', error);
                    // If deferReply fails, try to send a regular reply instead
                    try {
                        await interaction.reply("🔍 Fetching your store...");
                    } catch (replyError) {
                        console.error('Failed to send reply:', replyError);
                        return;
                    }
                }

                try {
                    const skins = await fetchStoreSkins(tokens);
                    if (!skins || skins.length === 0) {
                        return await client.safeEditReply(interaction, "❌ Could not fetch store skins.");
                    }

                    const wishlist = loadWishlist(userId);
                    
                    // Create separate embeds for each skin with images
                    const embeds = [];
                    let matched = false;
                    
                    skins.forEach((skin, index) => {
                        const isWishlisted = wishlist.includes(skin.uuid);
                        if (isWishlisted) {
                            matched = true;
                        }
                        
                        const embed = new EmbedBuilder()
                            .setTitle(`${skin.displayName}${isWishlisted ? ' ✅ **Wishlist**' : ''}`)
                            .setColor(isWishlisted ? 0x00ff00 : 0xff4655)
                            .setFooter({ text: `${index + 1} of ${skins.length} • Valorant Store` });
                        
                        // Add pricing information if available
                        if (skin.vpPrice) {
                            embed.addFields(
                                { 
                                    name: '', 
                                    value: `**${skin.priceFormatted.vp} VP**\n≈ Rp ${skin.priceFormatted.idr}`, 
                                    inline: true 
                                }
                            );
                        }
                        
                        // Add the best available skin image
                        let imageUrl = null;
                        
                        // Priority: fullRender from chromas > displayIcon from skin > displayIcon from level
                        if (skin.chromas && skin.chromas[0] && skin.chromas[0].fullRender) {
                            imageUrl = skin.chromas[0].fullRender;
                        } else if (skin.displayIcon) {
                            imageUrl = skin.displayIcon;
                        } else if (skin.levels && skin.levels[0] && skin.levels[0].displayIcon) {
                            imageUrl = skin.levels[0].displayIcon;
                        }
                        
                        if (imageUrl) {
                            embed.setImage(imageUrl);
                        }
                        
                        // Add a thumbnail with the display icon if we used fullRender as main image
                        if (skin.chromas && skin.chromas[0] && skin.chromas[0].fullRender && skin.displayIcon) {
                            embed.setThumbnail(skin.displayIcon);
                        }
                        
                        embeds.push(embed);
                    });

                    await client.safeEditReply(interaction, { embeds: embeds });

                    if (matched) {
                        // Get the wishlist skin names and UUIDs for alert
                        const wishlistSkins = skins.filter(skin => wishlist.includes(skin.uuid));
                        const skinNames = wishlistSkins.map(skin => `**${skin.displayName}**`).join(', ');
                        const skinUUIDs = wishlistSkins.map(skin => skin.uuid);
                        
                        // Check if we should send alert (anti-spam)
                        const { shouldSendAlert } = require('./utils/valorantApi');
                        
                        if (shouldSendAlert(userId, skinUUIDs)) {
                            const alertEmbed = new EmbedBuilder()
                                .setTitle('🎉 WISHLIST ALERT! 🎉')
                                .setDescription(`<@${userId}> Skin impian Anda tersedia di store!`)
                                .addFields({
                                    name: '✨ Skin Wishlist yang Tersedia:',
                                    value: skinNames,
                                    inline: false
                                })
                                .addFields({
                                    name: '💰 Total Harga:',
                                    value: `${wishlistSkins.reduce((total, skin) => total + (skin.vpPrice || 0), 0).toLocaleString()} VP`,
                                    inline: true
                                })
                                .addFields({
                                    name: '⏰ Store Reset:',
                                    value: 'Sekitar 19:00 WIB',
                                    inline: true
                                })
                                .setColor(0x00ff88)
                                .setFooter({ text: 'Jangan sampai terlewat! Alert ini hanya dikirim sekali per hari.' });
                            
                            try {
                                await interaction.followUp({ 
                                    content: `🔔 <@${userId}>`,
                                    embeds: [alertEmbed]
                                });
                                console.log(`📢 Sent wishlist alert to user ${userId} for skins: ${skinNames}`);
                            } catch (followUpError) {
                                console.error('Failed to send wishlist alert:', followUpError);
                                // Fallback to simple message
                                try {
                                    await interaction.followUp(`🎉 <@${userId}> Skin wishlist Anda tersedia di store: ${skinNames}`);
                                } catch (fallbackError) {
                                    console.error('Failed to send fallback alert:', fallbackError);
                                }
                            }
                        } else {
                            console.log(`⏭️ Skipped duplicate alert for user ${userId} (already sent today)`);
                        }
                    }
                } catch (error) {
                    console.error('Store command error:', error);
                    
                    // Check and notify about token expiry
                    await checkAndNotifyTokenExpiry(userId, error);
                    
                    let errorMessage;
                    if (error.message.includes('MISSING_ENTITLEMENT')) {
                        errorMessage = "❌ **Token Error**: Your tokens don't have store access permissions.\n\n" +
                            "**Solution**: Please get fresh tokens using `/autotokens` CLI tool.\n" +
                            "Set region to `ap` for Indonesian servers.";
                    } else if (error.message.includes('BAD_CLAIMS')) {
                        errorMessage = "❌ **Token Expired!** 🔑\n\n" +
                            "Token Valorant Anda sudah expired dan perlu diperbarui.\n\n" +
                            "🔄 **Cara refresh token:**\n" +
                            "• `/quicksetup` - Setup langsung di Discord (recommended)\n" +
                            "• `/autotokens` - CLI tool guide\n" +
                            "• Gunakan cookies yang fresh dari browser\n\n" +
                            "💡 **Tips:** `/quicksetup` paling mudah dan cepat!\n" +
                            "📧 **Auto-Notification:** Anda akan menerima DM saat token expired.";
                    } else if (error.message.includes('UNAUTHORIZED')) {
                        errorMessage = "❌ **Token Invalid!** 🔑\n\n" +
                            "Token authentication tidak valid.\n\n" +
                            "🔄 **Solusi:**\n" +
                            "• Gunakan `/quicksetup` untuk mendapatkan token baru\n" +
                            "• Atau gunakan `/autotokens` untuk CLI tool\n" +
                            "• `/quicksetup` paling mudah dan cepat\n" +
                            "📧 **Auto-Notification:** Anda akan menerima DM saat token bermasalah.";
                    } else {
                        errorMessage = "❌ Terjadi kesalahan saat mengambil data store.\n\n" +
                            "🔧 **Troubleshooting:**\n" +
                            "• Coba lagi dalam beberapa menit\n" +
                            "• Gunakan `/quicksetup` untuk refresh token\n" +
                            "• Atau gunakan `/autotokens` jika masih bermasalah";
                    }
                    
                    await client.safeEditReply(interaction, errorMessage);
                }
                clearTimeoutOnComplete();
                return;
            }

        if (commandName === 'addwishlist') {
                const skinName = interaction.options.getString('skin_name');

                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    
                    // Load skin data to search for matching skins
                    const { searchSkinsByName } = require('./utils/valorantApi');
                    const matchingSkins = await searchSkinsByName(skinName);
                    
                    if (matchingSkins.length === 0) {
                        return await interaction.editReply(`❌ Tidak ditemukan skin dengan nama "${skinName}". Coba gunakan nama yang lebih spesifik seperti "Vandal Prime" atau "Phantom Reaver".`);
                    }
                    
                    // Find exact match first
                    const exactMatch = matchingSkins.find(skin => 
                        skin.displayName.toLowerCase() === skinName.toLowerCase()
                    );
                    
                    const skinToAdd = exactMatch || matchingSkins[0];
                    const wishlist = loadWishlist(user.id);
                    
                    if (wishlist.includes(skinToAdd.uuid)) {
                        return await interaction.editReply(`✅ **${skinToAdd.displayName}** sudah ada di wishlist Anda!`);
                    }
                    
                    wishlist.push(skinToAdd.uuid);
                    
                    const allWishlists = loadWishlist();
                    allWishlists[user.id] = wishlist;
                    require('fs').writeFileSync('./data/wishlist.json', JSON.stringify(allWishlists, null, 2));
                    
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Berhasil Ditambahkan ke Wishlist!')
                        .setDescription(`**${skinToAdd.displayName}** telah ditambahkan ke wishlist Anda.`)
                        .setColor(0x00ff88);
                    
                    if (skinToAdd.displayIcon) {
                        embed.setThumbnail(skinToAdd.displayIcon);
                    }
                    
                    return await interaction.editReply({ embeds: [embed] });
                    
                } catch (error) {
                    console.error('Add wishlist error:', error);
                    await interaction.editReply("❌ Terjadi kesalahan saat mencari skin atau memperbarui wishlist.");
                }
                return;
            }        if (commandName === 'wishlist') {
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    
                    const wishlist = loadWishlist(user.id);
                    
                    if (wishlist.length === 0) {
                        return await interaction.editReply('📝 Wishlist Anda kosong. Gunakan `/addwishlist <nama_skin>` untuk menambahkan skin!');
                    }
                    
                    // Get skin details from API
                    const { getSkinDetailsByUUIDs } = require('./utils/valorantApi');
                    const skinDetails = await getSkinDetailsByUUIDs(wishlist);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('📝 Wishlist Anda')
                        .setDescription(`Anda memiliki **${wishlist.length}** skin di wishlist:`)
                        .setColor(0x00ff88);
                    
                    let wishlistText = '';
                    skinDetails.forEach((skin, index) => {
                        wishlistText += `**${index + 1}.** ${skin.displayName || 'Unknown Skin'}\n`;
                    });
                    
                    embed.addFields({ name: 'Skin List:', value: wishlistText || 'Tidak ada skin ditemukan', inline: false });
                    embed.setFooter({ text: 'Gunakan /removewishlist untuk menghapus skin dari wishlist' });
                    
                    await interaction.editReply({ embeds: [embed] });
                    
                } catch (error) {
                    console.error('Wishlist error:', error);
                    await interaction.editReply('❌ Terjadi kesalahan saat mengambil data wishlist.');
                }
                return;
            }        if (commandName === 'removewishlist') {
                const skinName = interaction.options.getString('skin_name');

                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    
                    const wishlist = loadWishlist(user.id);
                    
                    if (wishlist.length === 0) {
                        return await interaction.editReply('📝 Wishlist Anda kosong. Tidak ada yang bisa dihapus.');
                    }
                    
                    // Get current wishlist skin details
                    const { getSkinDetailsByUUIDs } = require('./utils/valorantApi');
                    const currentSkins = await getSkinDetailsByUUIDs(wishlist);
                    
                    // Find exact match first, then partial match
                    let matchingSkin = currentSkins.find(skin => 
                        skin.displayName.toLowerCase() === skinName.toLowerCase()
                    );
                    
                    if (!matchingSkin) {
                        matchingSkin = currentSkins.find(skin => 
                            skin.displayName.toLowerCase().includes(skinName.toLowerCase())
                        );
                    }
                    
                    if (!matchingSkin) {
                        return await interaction.editReply(`❌ Skin "${skinName}" tidak ditemukan di wishlist Anda.`);
                    }
                    
                    // Remove from wishlist
                    const updatedWishlist = wishlist.filter(uuid => uuid !== matchingSkin.uuid);
                    
                    const allWishlists = loadWishlist();
                    allWishlists[user.id] = updatedWishlist;
                    require('fs').writeFileSync('./data/wishlist.json', JSON.stringify(allWishlists, null, 2));
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🗑️ Berhasil Dihapus dari Wishlist!')
                        .setDescription(`**${matchingSkin.displayName}** telah dihapus dari wishlist Anda.`)
                        .setColor(0xff4655);
                    
                    if (matchingSkin.displayIcon) {
                        embed.setThumbnail(matchingSkin.displayIcon);
                    }
                    
                    await interaction.editReply({ embeds: [embed] });
                    
                } catch (error) {
                    console.error('Remove wishlist error:', error);
                    await interaction.editReply('❌ Terjadi kesalahan saat menghapus dari wishlist.');
                }
                return;
            }

        if (commandName === 'autocheck') {
            const action = interaction.options.getString('action');
            
            if (action === 'status') {
                const embed = new EmbedBuilder()
                    .setTitle('🤖 Status Automatic Checker')
                    .setDescription('Informasi tentang pengecekan otomatis store wishlist:')
                    .addFields(
                        {
                            name: '⏰ Jadwal',
                            value: 'Setiap hari pukul 19:05 WIB (5 menit setelah store reset)',
                            inline: false
                        },
                        {
                            name: '🔔 Alert System',
                            value: 'Bot akan mengirim DM jika skin wishlist tersedia di store',
                            inline: false
                        },
                        {
                            name: '🛡️ Anti-Spam',
                            value: 'Alert hanya dikirim sekali per hari untuk skin yang sama',
                            inline: false
                        },
                        {
                            name: '✅ Status',
                            value: dailyChecker && dailyChecker.isRunning ? '🟢 Aktif' : '🔴 Tidak Aktif',
                            inline: false
                        }
                    )
                    .setColor(0x00ff88)
                    .setFooter({ text: 'Pastikan Anda memiliki wishlist dan token yang valid' });
                    
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
            
            if (action === 'test') {
                await interaction.reply({ 
                    content: '🔄 Menjalankan test checker... (akan memakan waktu beberapa detik)', 
                    flags: MessageFlags.Ephemeral 
                });
                
                try {
                    if (dailyChecker) {
                        await dailyChecker.runNow();
                        await interaction.editReply('✅ Test checker selesai! Cek console log untuk detail.');
                    } else {
                        await interaction.editReply('❌ Daily checker belum diinisialisasi.');
                    }
                } catch (error) {
                    console.error('Test checker error:', error);
                    await interaction.editReply('❌ Test checker gagal: ' + error.message);
                }
            }
            return;
        }

        if (commandName === 'checktoken') {
            const userId = user.id;
            const tokens = loadUserTokens(userId);
            
            if (!tokens) {
                return await interaction.reply({
                    content: "❌ **Tidak ada token ditemukan**\n\n" +
                            "Gunakan salah satu command berikut untuk setup:\n" +
                            "• `/quicksetup` - Setup di Discord (paling mudah)\n" + 
                            "• `/autotokens` - CLI tool guide",
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({ 
                content: "🔍 Mengecek validitas token... tunggu sebentar...", 
                flags: MessageFlags.Ephemeral 
            });

            try {
                // Test token by making a simple API call
                const { fetchStoreSkins } = require('./utils/valorantApi');
                await fetchStoreSkins(tokens);
                
                const embed = new EmbedBuilder()
                    .setTitle('✅ Token Valid!')
                    .setDescription('Token Valorant Anda masih aktif dan berfungsi dengan baik.')
                    .addFields(
                        {
                            name: '📊 Info Token',
                            value: `**Region:** ${tokens.region}\n**PUUID:** ${tokens.puuid.substring(0, 8)}...`,
                            inline: false
                        },
                        {
                            name: '🔄 Automatic Check',
                            value: 'Token akan dicek otomatis setiap hari pukul 19:05 WIB\n🔇 Anti-spam: Notifikasi maksimal 1x per hari',
                            inline: false
                        }
                    )
                    .setColor(0x00ff88)
                    .setFooter({ text: 'Token biasanya expired dalam beberapa jam/hari' });
                
                await interaction.editReply({ content: '', embeds: [embed] });
                
            } catch (error) {
                let statusMessage;
                let statusColor = 0xff4655;
                
                if (error.message.includes('BAD_CLAIMS')) {
                    statusMessage = '🔑 **Token Expired!**\n\nToken Anda sudah expired dan perlu diperbarui.';
                } else if (error.message.includes('UNAUTHORIZED')) {
                    statusMessage = '🚫 **Token Invalid!**\n\nToken authentication tidak valid.';
                } else if (error.message.includes('MISSING_ENTITLEMENT')) {
                    statusMessage = '⚠️ **Token Tidak Lengkap!**\n\nToken tidak memiliki akses store.';
                } else {
                    statusMessage = '❌ **Error Testing Token**\n\nTidak dapat mengecek token saat ini.';
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('❌ Token Bermasalah')
                    .setDescription(statusMessage)
                    .addFields(
                        {
                            name: '🔄 Solusi Cepat',
                            value: '• `/quicksetup` - Setup langsung di Discord\n• `/autotokens` - CLI tool guide',
                            inline: false
                        },
                        {
                            name: '💡 Tips',
                            value: 'Pastikan Valorant sedang berjalan saat mendapatkan token baru',
                            inline: false
                        }
                    )
                    .setColor(statusColor)
                    .setFooter({ text: 'Token perlu diperbarui secara berkala' });
                
                await interaction.editReply({ content: '', embeds: [embed] });
            }
            return;
        }

        if (commandName === 'autotokens') {
            const embed = new EmbedBuilder()
                .setTitle('🚀 Token Setup Options')
                .setDescription('Choose the best method for setting up your Valorant tokens!')
                .setColor(0x00ff88)
                .addFields(
                    {
                        name: '🎯 Option 1: Quick Setup (Easiest)',
                        value: 'Use `/quicksetup` right here in Discord!\n• Enter your Discord User ID\n• Copy 2 cookies from browser\n• Select your region\n• Done in seconds!',
                        inline: false
                    },
                    {
                        name: '💻 Option 2: CLI Tool',
                        value: 'Use the command line tool:\n```\nnode get-tokens-cli.js\n```\n• Run in bot folder\n• Step-by-step guidance\n• Same cookies needed',
                        inline: false
                    },
                    {
                        name: '📋 What you need for both methods:',
                        value: '• **Discord User ID**: Settings > Advanced > Developer Mode > Right-click profile > Copy User ID\n• **Be logged into Riot**: Make sure you\'re logged into auth.riotgames.com in your browser\n• **2 cookies**: ssid and clid from browser dev tools\n• **Region**: Know your region (ap, na, eu)',
                        inline: false
                    },
                    {
                        name: '🍪 How to get cookies:',
                        value: '1. Go to https://auth.riotgames.com (make sure you\'re logged in)\n2. Press F12 to open dev tools\n3. Go to Application/Storage > Cookies > auth.riotgames.com\n4. Copy the values for `ssid` and `clid` cookies\n5. Use them in `/quicksetup` or CLI tool',
                        inline: false
                    }
                )
                .setFooter({ text: 'Recommended: Use /quicksetup for the fastest setup!' });

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            clearTimeoutOnComplete();
            return;
        }

        if (commandName === 'help') {
            // Main help embed
            const mainEmbed = new EmbedBuilder()
                .setTitle('🎮 Valorant Skin Tracker - Help Center')
                .setDescription('**Welcome to Valorant Skin Tracker Bot!**\n\n' +
                    '🎯 **Educational Purpose Only** - This bot is designed for learning and educational purposes to help users understand Valorant\'s store system and practice Discord bot development.\n\n' +
                    '✨ Track your dream skins with intelligent store monitoring, automated alerts, and comprehensive wishlist management - all while respecting Riot Games\' terms of service.')
                .setColor(0xff4655)
                .addFields(
                    {
                        name: '✨ Fitur Utama',
                        value: 
                            '🛍️ **Store Checker** - Cek skin store real-time\n' +
                            '📝 **Smart Wishlist** - Tambah skin dengan nama\n' +
                            '🔔 **Auto Alert** - Notifikasi otomatis setiap hari\n' +
                            '💰 **Harga IDR** - Konversi VP ke Rupiah\n' +
                            '🛡️ **Anti-Spam** - Alert cerdas tanpa spam',
                        inline: false
                    },
                    {
                        name: '🚀 Quick Start',
                        value: 
                            '1️⃣ Klik **Setup** untuk konfigurasi awal\n' +
                            '2️⃣ Klik **Wishlist** untuk kelola skin impian\n' +
                            '3️⃣ Klik **Store** untuk cek skin tersedia\n' +
                            '4️⃣ Klik **Advanced** untuk fitur lanjutan',
                        inline: false
                    }
                )
                .setFooter({ text: 'Pilih kategori di bawah untuk panduan detail! | Contact: rexoo_ for suggestions & bug reports' });

            // Create buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_setup')
                        .setLabel('🔧 Setup')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('help_wishlist')
                        .setLabel('📝 Wishlist')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('help_store')
                        .setLabel('🛍️ Store')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('help_advanced')
                        .setLabel('⚙️ Advanced')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ 
                embeds: [mainEmbed], 
                components: [row], 
                flags: MessageFlags.Ephemeral
            });
            clearTimeoutOnComplete();
            return;
        }



        } catch (error) {
            console.error('Command error:', error);
            clearTimeout(commandTimeout);
            
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({ 
                        content: '❌ Terjadi kesalahan saat memproses command.', 
                        flags: MessageFlags.Ephemeral 
                    });
                } catch (replyError) {
                    console.error('Failed to send error reply:', replyError);
                }
            }
        }
        return;
    }

    // Handle button interactions
    if (interaction.isButton()) {
            if (['manual_setup', 'auto_setup', 'help_guide'].includes(interaction.customId)) {
                await handleSetupButtons(interaction);
            }
            
            // Handle help buttons
            if (interaction.customId.startsWith('help_')) {
                const helpType = interaction.customId.replace('help_', '');
                
                let embed;
                
                switch (helpType) {
                    case 'setup':
                        embed = new EmbedBuilder()
                            .setTitle('🔧 Setup Commands')
                            .setDescription('Panduan lengkap untuk setup bot pertama kali:')
                            .setColor(0x0099ff)
                            .addFields(
                                {
                                    name: '🚀 `/quicksetup` - Quick Discord Setup (Easiest)',
                                    value: validateEmbedField('Quick Setup', 'Setup langsung di Discord! Masukkan Discord User ID, cookies, dan region. Paling mudah dan cepat!'),
                                    inline: false
                                },
                                {
                                    name: '💻 `/autotokens` - CLI Tool Setup',
                                    value: validateEmbedField('CLI Tool', 'Setup menggunakan CLI tool. Jalankan `node get-tokens-cli.js` di terminal untuk mendapatkan token secara otomatis!'),
                                    inline: false
                                },
                                {
                                    name: '🔍 `/checktoken` - Verify Token',
                                    value: validateEmbedField('Check Token', 'Cek apakah token Anda masih valid atau sudah expired.'),
                                    inline: false
                                }
                            )
                            .addFields({
                                name: '💡 Tips Setup',
                                value: validateEmbedField('Tips Setup',
                                    '• **Easiest:** Gunakan `/quicksetup` untuk setup di Discord\n' +
                                    '• **Alternative:** CLI tool untuk setup di terminal\n' +
                                    '• Gunakan region `ap` untuk server Indonesia\n' +
                                    '• Token perlu di-refresh jika expired\n' +
                                    '• Enable DM untuk menerima notifikasi'),
                                inline: false
                            });
                        break;
                        
                    case 'wishlist':
                        embed = new EmbedBuilder()
                            .setTitle('📝 Wishlist Management')
                            .setDescription('Kelola daftar skin impian Anda dengan mudah:')
                            .setColor(0x00ff88)
                            .addFields(
                                {
                                    name: '➕ `/addwishlist <nama_skin>`',
                                    value: validateEmbedField('Add Wishlist',
                                        'Tambah skin ke wishlist berdasarkan nama.\n' +
                                        '**Contoh:**\n' +
                                        '• `/addwishlist Prime Phantom`\n' +
                                        '• `/addwishlist Reaver Vandal`\n' +
                                        '• `/addwishlist Dragon`'),
                                    inline: false
                                },
                                {
                                    name: '👀 `/wishlist`',
                                    value: validateEmbedField('View Wishlist', 'Lihat semua skin yang ada di wishlist Anda dengan nama lengkap.'),
                                    inline: false
                                },
                                {
                                    name: '🗑️ `/removewishlist <nama_skin>`',
                                    value: validateEmbedField('Remove Wishlist',
                                        'Hapus skin dari wishlist.\n' +
                                        '**Contoh:** `/removewishlist Prime Phantom`'),
                                    inline: false
                                }
                            )
                            .addFields({
                                name: '🎯 Smart Search Features',
                                value: validateEmbedField('Smart Search',
                                    '• **Fuzzy Search** - Bot mengerti nama yang tidak eksak\n' +
                                    '• **Auto-Complete** - Cari berdasarkan kata kunci\n' +
                                    '• **Multiple Results** - Pilihan jika ada beberapa hasil\n' +
                                    '• **No UUID Required** - Tidak perlu tahu kode teknis'),
                                inline: false
                            });
                        break;
                        
                    case 'store':
                        embed = new EmbedBuilder()
                            .setTitle('🛍️ Store Features')
                            .setDescription('Fitur lengkap untuk cek Valorant store:')
                            .setColor(0xff4655)
                            .addFields(
                                {
                                    name: '🏪 `/store` - Check Store',
                                    value: validateEmbedField('Store Check',
                                        'Lihat skin yang tersedia di store hari ini dengan:\n' +
                                        '• **Harga VP dan IDR** - Konversi otomatis ke Rupiah\n' +
                                        '• **Wishlist Detection** - Skin wishlist ditandai ✅\n' +
                                        '• **High-Quality Images** - Preview skin yang jelas\n' +
                                        '• **Auto Alert** - Notifikasi jika skin impian tersedia'),
                                    inline: false
                                },
                                {
                                    name: '🔔 Alert System',
                                    value: validateEmbedField('Alert System',
                                        '**Manual Alert:**\n' +
                                        '• Langsung saat menggunakan `/store`\n' +
                                        '• Mention + embed khusus untuk skin wishlist\n\n' +
                                        '**Auto Alert:**\n' +
                                        '• Cek otomatis setiap hari 19:05 WIB\n' +
                                        '• DM pribadi jika skin wishlist tersedia\n' +
                                        '• Anti-spam: sekali per hari per skin'),
                                    inline: false
                                }
                            )
                            .addFields({
                                name: '💰 Pricing System',
                                value: validateEmbedField('Pricing System',
                                    '• **Accurate VP Prices** - Langsung dari Riot API\n' +
                                    '• **IDR Conversion** - Rate resmi VP package Indonesia\n' +
                                    '• **Total Calculator** - Hitung total harga wishlist\n' +
                                    '• **Store Reset Timer** - Info kapan store ganti'),
                                inline: false
                            });
                        break;
                        
                    case 'advanced':
                        embed = new EmbedBuilder()
                            .setTitle('⚙️ Advanced Features')
                            .setDescription('Fitur lanjutan untuk power users:')
                            .setColor(0x9932cc)
                            .addFields(
                                {
                                    name: '🤖 `/autocheck status`',
                                    value: validateEmbedField('Auto Check Status',
                                        'Lihat status automatic daily checker:\n' +
                                        '• Jadwal pengecekan (19:05 WIB)\n' +
                                        '• Status aktif/tidak aktif\n' +
                                        '• Info anti-spam system'),
                                    inline: false
                                },
                                {
                                    name: '🧪 `/autocheck test`',
                                    value: validateEmbedField('Auto Check Test',
                                        'Test manual untuk automatic checker:\n' +
                                        '• Cek semua user yang ada\n' +
                                        '• Debug token issues\n' +
                                        '• Verify alert system'),
                                    inline: false
                                },
                                {
                                    name: '🔑 `/tokenmanager`',
                                    value: validateEmbedField('Token Manager',
                                        '**Advanced token management:**\n' +
                                        '• `/tokenmanager status` - Info detail token\n' +
                                        '• `/tokenmanager health` - Health check komprehensif\n' +
                                        '• `/tokenmanager refresh_guide` - Panduan refresh\n' +
                                        '• `/tokenmanager notifications` - Riwayat notifikasi\n' +
                                        '• `/tokenmanager clear_notifications` - Reset anti-spam'),
                                    inline: false
                                },
                                {
                                    name: '🔗 `/connectriot` (New!)',
                                    value: validateEmbedField('Discord Connections',
                                        '**Revolutionary auto-token system:**\n' +
                                        '• `/connectriot guide` - Setup panduan\n' +
                                        '• `/connectriot oauth` - Authorization\n' +
                                        '• `/connectriot check` - Verify setup\n' +
                                        '• **Auto-refresh token** - No manual refresh!'),
                                    inline: false
                                },
                                {
                                    name: '🔍 Auto Token Management',
                                    value: validateEmbedField('Auto Token Management',
                                        '• **Auto-Detection** - Deteksi token expired\n' +
                                        '• **DM Notifications** - Alert via DM saat expired\n' +
                                        '• **Health Monitoring** - Cek kesehatan token rutin\n' +
                                        '• **Anti-Spam Protection** - Max 1 notifikasi/hari\n' +
                                        '• **OAuth Integration** - Discord Connections support\n' +
                                        '• **Error Handling** - Pesan error yang jelas'),
                                    inline: false
                                }
                            )
                            .addFields({
                                name: '🔧 Troubleshooting',
                                value: validateEmbedField('Troubleshooting',
                                    '• **BAD_CLAIMS Error** - Token expired (auto-notify)\n' +
                                    '• **UNAUTHORIZED Error** - Token invalid (auto-notify)\n' +
                                    '• **MISSING_ENTITLEMENT** - Token tidak lengkap\n' +
                                    '• **Google OAuth Redirect** - Akun Google login'),
                                inline: false
                            });
                        break;
                }
                
                // Back button
                const backRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('help_back')
                            .setLabel('🔙 Back to Main')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                await interaction.update({ embeds: [embed], components: [backRow] });
            }
            
            // Handle back button
            if (interaction.customId === 'help_back') {
                // Recreate main help embed
                const mainEmbed = new EmbedBuilder()
                    .setTitle('🎮 Valorant Skin Tracker - Help Center')
                    .setDescription('**Welcome to Valorant Skin Tracker Bot!**\n\n' +
                        '🎯 **Educational Purpose Only** - This bot is designed for learning and educational purposes to help users understand Valorant\'s store system and practice Discord bot development.\n\n' +
                        '✨ Track your dream skins with intelligent store monitoring, automated alerts, and comprehensive wishlist management - all while respecting Riot Games\' terms of service.')
                    .setColor(0xff4655)
                    .addFields(
                        {
                            name: '✨ Fitur Utama',
                            value: 
                                '🛍️ **Store Checker** - Cek skin store real-time\n' +
                                '📝 **Smart Wishlist** - Tambah skin dengan nama\n' +
                                '🔔 **Auto Alert** - Notifikasi otomatis setiap hari\n' +
                                '💰 **Harga IDR** - Konversi VP ke Rupiah\n' +
                                '🛡️ **Anti-Spam** - Alert cerdas tanpa spam',
                            inline: false
                        },
                        {
                            name: '🚀 Quick Start',
                            value: 
                                '1️⃣ Klik **Setup** untuk konfigurasi awal\n' +
                                '2️⃣ Klik **Wishlist** untuk kelola skin impian\n' +
                                '3️⃣ Klik **Store** untuk cek skin tersedia\n' +
                                '4️⃣ Klik **Advanced** untuk fitur lanjutan',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Pilih kategori di bawah untuk panduan detail! | Contact: rexoo_ for suggestions & bug reports' });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('help_setup')
                            .setLabel('🔧 Setup')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('help_wishlist')
                            .setLabel('📝 Wishlist')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('help_store')
                            .setLabel('🛍️ Store')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('help_advanced')
                            .setLabel('⚙️ Advanced')
                            .setStyle(ButtonStyle.Danger)
                    );

                await interaction.update({ embeds: [mainEmbed], components: [row] });
            }
            
            return;
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'token_modal') {
                await handleTokenModal(interaction);
            }
            return;
        }
    } catch (error) {
        console.error('Interaction handling error:', error);
        try {
            await interaction.reply({ 
                content: '❌ Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.', 
                flags: MessageFlags.Ephemeral 
            });
        } catch (replyError) {
            console.error('Failed to send error reply:', replyError);
        }
    }
});

// Helper function to check if token is expired and notify user
async function checkAndNotifyTokenExpiry(userId, error) {
    if (error.message.includes('BAD_CLAIMS') || error.message.includes('UNAUTHORIZED')) {
        try {
            // Try to DM user about expired token
            const user = await client.users.fetch(userId);
            
            const expiredEmbed = new EmbedBuilder()
                .setTitle('🔑 Token Valorant Expired!')
                .setDescription('Token Valorant Anda sudah expired dan perlu diperbarui.')
                .addFields(
                    {
                        name: '🔄 Cara Refresh Token:',
                        value: '• `/setup` - Setup wizard lengkap\n• `/gettoken` - Panduan cepat\n• `/easysetup` - Web interface',
                        inline: false
                    },
                    {
                        name: '💡 Tips:',
                        value: 'Pastikan Valorant sedang berjalan saat mendapatkan token baru',
                        inline: false
                    }
                )
                .setColor(0xff4655)
                .setFooter({ text: 'Pesan otomatis - Token expired terdeteksi' });
            
            await user.send({ embeds: [expiredEmbed] });
            console.log(`📧 Sent token expiry notification to user ${userId}`);
            
            // Mark user as notified to prevent spam (check if already notified today)
            const fs = require('fs');
            let notifiedUsers = {};
            try {
                notifiedUsers = JSON.parse(fs.readFileSync('./data/notified-expiry.json', 'utf8'));
            } catch (e) {
                // File doesn't exist, create new object
            }
            
            // Only send notification once per day per user
            const today = new Date().toDateString();
            const lastNotified = notifiedUsers[userId] ? new Date(notifiedUsers[userId]).toDateString() : null;
            
            if (lastNotified !== today) {
                notifiedUsers[userId] = Date.now();
                fs.writeFileSync('./data/notified-expiry.json', JSON.stringify(notifiedUsers, null, 2));
            } else {
                console.log(`⏭️ Skipped duplicate expiry notification for user ${userId} (already sent today)`);
                return; // Don't send duplicate notification
            }
            
        } catch (dmError) {
            console.error(`❌ Failed to send expiry notification to user ${userId}:`, dmError.message);
        }
    }
}

// Helper function to handle quick setup command
async function handleQuickSetup(interaction) {
    const userId = interaction.options.getString('userid');
    const ssid = interaction.options.getString('ssid');
    const clid = interaction.options.getString('clid');
    const region = interaction.options.getString('region');

    // Validate inputs
    if (!userId || userId.trim().length < 10) {
        return await interaction.reply({
            content: '❌ Invalid Discord User ID. Please make sure you copied the complete User ID.',
            flags: MessageFlags.Ephemeral
        });
    }

    if (!ssid || ssid.trim().length < 10) {
        return await interaction.reply({
            content: '❌ Invalid ssid cookie. Please make sure you copied the complete cookie value.',
            flags: MessageFlags.Ephemeral
        });
    }

    if (!clid || clid.trim().length < 3) {
        return await interaction.reply({
            content: '❌ Invalid clid cookie. Please make sure you copied the complete cookie value.',
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        content: '🚀 Starting token fetch process... Please wait...',
        flags: MessageFlags.Ephemeral
    });

    const headers = {
        "Cookie": `ssid=${ssid.trim()}; clid=${clid.trim()}`,
        "Content-Type": "application/json"
    };

    try {
        console.log("🚀 Starting authentication flow for user:", userId);
        
        const authResp = await axios.post("https://auth.riotgames.com/api/v1/authorization", {
            "client_id": "riot-client",
            "nonce": "1",
            "redirect_uri": "http://localhost/redirect",
            "response_type": "token id_token",
            "scope": "account openid"
        }, { headers });

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

        const entResp = await axios.post("https://entitlements.auth.riotgames.com/api/token/v1", {}, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const entitlement_token = entResp.data.entitlements_token;

        const userResp = await axios.get("https://auth.riotgames.com/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const puuid = userResp.data.sub;

        // Load existing tokens and add/update this user
        let existingTokens = {};
        try {
            const fs = require('fs');
            const path = require('path');
            const tokensPath = path.join(__dirname, 'data', 'tokens.json');
            existingTokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
        } catch (e) {
            // File doesn't exist, start with empty object
        }
        
        existingTokens[userId] = {
            access_token,
            entitlement_token,
            puuid,
            region: region.toLowerCase()
        };

        // Save to bot's tokens.json file
        const fs = require('fs');
        const path = require('path');
        const tokensPath = path.join(__dirname, 'data', 'tokens.json');
        
        // Ensure data directory exists
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(tokensPath, JSON.stringify(existingTokens, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('✅ SUCCESS! Tokens Set Up Successfully')
            .setDescription('Your Valorant tokens have been fetched and saved to the bot!')
            .setColor(0x00ff88)
            .addFields(
                { name: '📊 Token Info:', value: `**Discord User ID:** ${userId}\n**PUUID:** ${puuid}\n**Region:** ${region.toLowerCase()}\n**Access Token:** ***${access_token.slice(-10)}\n**Entitlement Token:** ***${entitlement_token.slice(-10)}`, inline: false },
                { name: '🎯 Ready to use:', value: '• `/store` - Check your Valorant store\n• `/addwishlist` - Add skins to wishlist\n• `/checktoken` - Verify tokens work', inline: false },
                { name: '⚠️ Important:', value: 'These tokens will expire in a few hours. Use `/quicksetup` again or the CLI tool when they expire.', inline: false }
            )
            .setFooter({ text: '🔥 Happy skin hunting! 🔥' });

        await interaction.editReply({ embeds: [embed] });

    } catch (err) {
        console.error("❌ Failed to fetch tokens:", err.message);
        
        let errorMessage = "❌ **Failed to fetch tokens**\n\n";
        
        if (err.response) {
            errorMessage += `**Error:** ${err.message}\n**Status:** ${err.response.status}\n\n`;
        } else {
            errorMessage += `**Error:** ${err.message}\n\n`;
        }
        
        errorMessage += "💡 **Troubleshooting tips:**\n";
        errorMessage += "• Make sure you're logged into Riot Games in your browser\n";
        errorMessage += "• Try logging out of Riot and logging back in to get fresh cookies\n";
        errorMessage += "• Open browser dev tools (F12) and go to Application/Storage > Cookies\n";
        errorMessage += "• Find auth.riotgames.com cookies and copy the 'ssid' and 'clid' values\n";
        errorMessage += "• Make sure the cookies are fresh (not expired)\n";
        errorMessage += "• Try using the CLI tool: `node get-tokens-cli.js`";

        await interaction.editReply({
            content: errorMessage
        });
    }
}

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
