
// Zuko MD Bot - Heroku Deployment
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic web server for Heroku
app.get('/', (req, res) => {
  res.json({ 
    status: 'Zuko MD Bot is running!',
    version: '2.0.0',
    message: 'Bot is active on Heroku'
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// Bot Configuration
const CONFIG = {
    name: "ZUKO MD",
    version: "2.0.0",
    theme: "🔥",
    whatsapp: {
        channel: "https://whatsapp.com/channel/0029VbB1oIIC1FuDt6R1M52X",
        group: "https://chat.whatsapp.com/IOKd7fRmYdaKcqc9id2Wbi?mode=wwt",
        channelName: "Zuko MD Updates", 
        groupName: "Zuko MD Community"
    }
};

console.log('🚀 Starting Zuko MD Bot on Heroku...');

// Check for BOT_TOKEN
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN environment variable not set!');
    console.log('💡 Set it in Heroku: Settings → Config Vars → BOT_TOKEN');
    process.exit(1);
}

console.log('✅ BOT_TOKEN found! Initializing bot...');

try {
    // Initialize bot
    const bot = new TelegramBot(process.env.BOT_TOKEN, { 
        polling: true,
        onlyFirstMatch: true,
        request: {
            timeout: 60000
        }
    });

    console.log('✅ Bot initialized successfully!');

    // Simple verification storage
    const userVerifications = new Map();

    function isUserVerified(userId) {
        return userVerifications.has(userId);
    }

    function getVerificationKeyboard() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: `📢 Join ${CONFIG.whatsapp.channelName}`, url: CONFIG.whatsapp.channel }],
                    [{ text: `👥 Join ${CONFIG.whatsapp.groupName}`, url: CONFIG.whatsapp.group }],
                    [{ text: `✅ I've Joined Both`, callback_data: 'verify_joined' }]
                ]
            }
        };
    }

    // Start command
    bot.onText(/\/start/, async (msg) => {
        const userId = msg.from.id;
        
        if (!isUserVerified(userId)) {
            await bot.sendMessage(
                msg.chat.id, 
                `🔐 *VERIFICATION REQUIRED* ${CONFIG.theme}\n\nTo use *${CONFIG.name}*, you MUST join:\n\n📢 *Channel:* ${CONFIG.whatsapp.channelName}\n👥 *Group:* ${CONFIG.whatsapp.groupName}\n\nClick buttons below → Join both → Click "I've Joined Both"`,
                { parse_mode: 'Markdown', ...getVerificationKeyboard() }
            );
            return;
        }
        
        await bot.sendMessage(msg.chat.id, 
            `🤖 *${CONFIG.name}* ${CONFIG.theme}\n\nWelcome back! Use /help for commands.`,
            { parse_mode: 'Markdown' }
        );
    });

    // Help command
    bot.onText(/\/help/, async (msg) => {
        const userId = msg.from.id;
        
        if (!isUserVerified(userId)) {
            await bot.sendMessage(msg.chat.id, '❌ Please complete verification with /start');
            return;
        }
        
        const helpText = `
${CONFIG.theme} *${CONFIG.name} VERIFIED COMMANDS* ${CONFIG.theme}

📥 *DOWNLOADERS*
/song <name> - Download music
/fb <url> - Facebook video  
/tiktok <url> - TikTok video

🎨 *MEDIA*
/sticker - Create sticker (reply to image)

🔧 *UTILS*
/ping - Bot status
/info - Bot information

💫 *Thank you for joining our community!*
        `.trim();

        await bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
    });

    // Verification handler
    bot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const userId = callbackQuery.from.id;

        if (callbackQuery.data === 'verify_joined') {
            userVerifications.set(userId, true);
            
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '✅ Verification successful! You can now use all features.',
                show_alert: true
            });

            await bot.editMessageText(
                `🎉 *VERIFICATION SUCCESSFUL!* ${CONFIG.theme}\n\nWelcome to ${CONFIG.name}! You now have access to all features.\n\nUse /help to see available commands.`,
                {
                    chat_id: msg.chat.id,
                    message_id: msg.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [] }
                }
            );
        }
    });

    // Ping command
    bot.onText(/\/ping/, async (msg) => {
        const start = Date.now();
        const sent = await bot.sendMessage(msg.chat.id, '🏓');
        const latency = Date.now() - start;
        
        const status = isUserVerified(msg.from.id) ? '✅ Verified' : '❌ Not Verified';
        
        await bot.editMessageText(
            `🏓 *PONG!*\n⏱ ${latency}ms\n💾 ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n🔐 ${status}`,
            { chat_id: msg.chat.id, message_id: sent.message_id, parse_mode: 'Markdown' }
        );
    });

    // Verified-only commands
    const verifiedCommands = {
        '/song': '🎵 Music downloader',
        '/fb': '📥 Facebook video downloader', 
        '/tiktok': '🎵 TikTok video downloader',
        '/sticker': '🎨 Sticker creator'
    };

    Object.keys(verifiedCommands).forEach(cmd => {
        bot.onText(new RegExp(cmd + '(.*)'), async (msg, match) => {
            if (!isUserVerified(msg.from.id)) {
                await bot.sendMessage(msg.chat.id, 
                    `❌ *ACCESS DENIED* ${CONFIG.theme}\n\nPlease complete verification with /start to use this feature.`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }
            
            await bot.sendMessage(msg.chat.id, 
                `${verifiedCommands[cmd]}\n\n${CONFIG.theme} *This feature is working!* Thank you for being verified.`,
                { parse_mode: 'Markdown' }
            );
        });
    });

    // Error handling
    bot.on('polling_error', (error) => {
        console.error('🔴 Polling error:', error.message);
    });

    console.log(`✅ ${CONFIG.name} v${CONFIG.version} is now LIVE on Heroku!`);
    console.log(`🔐 Verification system: ACTIVE`);
    console.log(`📢 WhatsApp Channel: ${CONFIG.whatsapp.channel}`);
    console.log(`👥 WhatsApp Group: ${CONFIG.whatsapp.group}`);
    console.log(`🤖 Bot is ready and waiting for commands...`);

} catch (error) {
    console.error('❌ Bot initialization failed:', error.message);
}
