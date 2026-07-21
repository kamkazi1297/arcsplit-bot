require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// صفحه اصلی
app.get('/', (req, res) => {
  res.send('✅ ArcSplit Telegram Bot is Online and Working!');
});

// Webhook
app.post('/webhook', (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(200);
  }
});

// پیام‌ها
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.trim() : '';
  const username = msg.from && msg.from.username ? `@${msg.from.username}` : "User";

  console.log(`Message from ${username}: ${text}`);

  if (text === '/start' || text.startsWith('/start ')) {
    bot.sendMessage(chatId, `✅ Bot is Online!\nHello ${username}\n\nEverything is working.`);
  } else {
    bot.sendMessage(chatId, `You said: ${text}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ArcSplit Bot is running on port ${PORT}`);
});
