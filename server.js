require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// CORS Fix - خیلی مهم
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.send('✅ ArcSplit Telegram Bot is Online!');
});

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ارسال هش تراکنش به تلگرام
app.post('/send-tx', (req, res) => {
  const { telegramUsername, txHash, amount, token, recipientsCount } = req.body;
  
  if (txHash && telegramUsername) {
    const message = `✅ Transaction Successful!\n\n` +
                    `Amount: ${amount} ${token}\n` +
                    `Recipients: ${recipientsCount}\n\n` +
                    `Tx Hash: ${txHash}\n\n` +
                    `🔗 https://testnet.arcscan.app/tx/${txHash}`;
    
    bot.sendMessage(telegramUsername.replace('@', ''), message)
      .then(() => console.log("✅ Hash sent to Telegram"))
      .catch(err => console.log("Telegram error:", err));
  }
  res.sendStatus(200);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.trim() : '';
  const username = msg.from && msg.from.username ? `@${msg.from.username}` : "User";

  if (text.startsWith('/start wallet_')) {
    const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=connect&username=${username}`;
    bot.sendMessage(chatId, `✅ Connected!\nTelegram: ${username}`);
    bot.sendMessage(chatId, siteUrl);
  } 
  else if (text.toLowerCase().startsWith('send ')) {
    const parts = text.split(/\s+/);
    const amount = parts[1] || '';
    const tokenSym = parts[2] ? parts[2].toUpperCase() : '';
    const addresses = parts.slice(3);

    if (amount && tokenSym && addresses.length > 0) {
      const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=send&amount=${amount}&token=${tokenSym}&addresses=${addresses.join(',')}&username=${username}`;
      
      bot.sendMessage(chatId, `📤 Send Request:\n${amount} ${tokenSym} to ${addresses.length} addresses`);
      bot.sendMessage(chatId, `🔗 Click to confirm:\n${siteUrl}`);
    }
  } 
  else if (text === '/start') {
    bot.sendMessage(chatId, `✅ Bot is Online!\nHello ${username}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Bot running'));
