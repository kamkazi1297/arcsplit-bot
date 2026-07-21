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

  console.log(`Message: ${text}`);

  if (text === '/start' || text.startsWith('/start ')) {
    bot.sendMessage(chatId, `✅ Bot is Online!\nHello ${username}\n\nUse: send <amount> <token> <address1> <address2> ...`);
  } 
  else if (text.toLowerCase().startsWith('send ')) {
    bot.sendMessage(chatId, `📤 Send command received!\n\nOpening website to confirm...`);
    
    // اینجا می‌تونیم لینک سایت با پارامترها بفرستیم (بعداً کامل می‌کنیم)
    bot.sendMessage(chatId, `https://arcsplit.kamkazi-1297.workers.dev/`);
  } 
  else {
    bot.sendMessage(chatId, `You said: ${text}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot running`);
});
