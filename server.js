require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

const users = {};

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const username = msg.from.username ? `@${msg.from.username}` : "NoUsername";

  if (text.startsWith('/start wallet_')) {
    const wallet = text.replace('/start wallet_', '');
    users[chatId] = { wallet, username };

    const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=connect&username=${encodeURIComponent(username)}`;
    
    bot.sendMessage(chatId, `✅ Connected successfully!\nTelegram: ${username}`);
    bot.sendMessage(chatId, siteUrl);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot running on port ${PORT}`);
});
