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

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.trim() : '';
  const username = msg.from && msg.from.username ? `@${msg.from.username}` : "User";

  if (text === '/start' || text.startsWith('/start ')) {
    bot.sendMessage(chatId, `✅ Bot is Online!\nHello ${username}\n\nExample:\nsend 100 USDC 0xaddr1 0xaddr2`);
  } 
  else if (text.toLowerCase().startsWith('send ')) {
    const parts = text.split(/\s+/);
    const amount = parts[1] || '';
    const token = parts[2] ? parts[2].toUpperCase() : '';
    const addresses = parts.slice(3);

    if (!amount || !token || addresses.length === 0) {
      return bot.sendMessage(chatId, "❌ Format wrong.\nUse: send <amount> <token> <address1> <address2> ...");
    }

    const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=send&amount=${amount}&token=${token}&addresses=${addresses.join(',')}`;

    bot.sendMessage(chatId, `📤 Send Request Received!\nAmount: ${amount} ${token}\nRecipients: ${addresses.length}\n\n🔗 Click to confirm:`);
    bot.sendMessage(chatId, siteUrl);
  } 
  else {
    bot.sendMessage(chatId, `You said: ${text}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot running`);
});
