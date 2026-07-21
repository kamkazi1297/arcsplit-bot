require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ ArcSplit Telegram Bot is Online!');
});

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// جدید: دریافت هش تراکنش از سایت
app.post('/send-tx', (req, res) => {
  const { telegramUsername, txHash, amount, token, recipientsCount } = req.body;
  
  if (!txHash) return res.sendStatus(200);

  const message = `✅ Transaction Successful!\n\n` +
                  `Amount: ${amount} ${token}\n` +
                  `Recipients: ${recipientsCount}\n` +
                  `Hash: ${txHash}\n\n` +
                  `https://testnet.arcscan.app/tx/${txHash}`;

  // ارسال به کاربر (برای سادگی، پیام عمومی)
  bot.sendMessage(telegramUsername.replace('@', ''), message, { parse_mode: 'HTML' })
    .catch(() => {});

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
    // ... (کد قبلی send)
    bot.sendMessage(chatId, "📤 Command received. Opening website...");
  } 
  else if (text === '/start') {
    bot.sendMessage(chatId, `✅ Bot Online!\nHello ${username}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Bot running'));
