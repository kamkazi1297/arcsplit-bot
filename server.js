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

  if (text.startsWith('/start wallet_')) {
    const parts = text.split('_');
    const wallet = parts[2] || '';
    
    const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=connect&username=${username}`;

    bot.sendMessage(chatId, `✅ Connected successfully!\nTelegram: ${username}`);
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
      bot.sendMessage(chatId, siteUrl);
    }
  } 
  else if (text === '/start') {
    bot.sendMessage(chatId, `✅ Bot is Online!\nHello ${username}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Bot running'));
