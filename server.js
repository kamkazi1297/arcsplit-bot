require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => res.send('✅ Bot Online'));

// ذخیره chat_id + username
let userData = {};

app.post('/send-tx', (req, res) => {
  const { telegramUsername, txHash, amount, token, recipientsCount } = req.body;
  
  if (txHash && telegramUsername) {
    const cleanUsername = telegramUsername.replace('@', '');
    const message = `✅ Transaction Successful!\n\nAmount: ${amount} ${token}\nRecipients: ${recipientsCount}\n\nHash: ${txHash}\n\n🔗 https://testnet.arcscan.app/tx/${txHash}`;

    bot.sendMessage(cleanUsername, message)
      .then(() => console.log("Sent to", cleanUsername))
      .catch(e => console.log("Error:", e.message));
  }
  res.sendStatus(200);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.trim() : '';
  const username = msg.from && msg.from.username ? `@${msg.from.username}` : "User";

  userData[chatId] = username;

  if (text.startsWith('/start wallet_')) {
    const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=connect&username=${username}&chatId=${chatId}`;
    bot.sendMessage(chatId, `✅ Connected!\nTelegram: ${username}`);
    bot.sendMessage(chatId, siteUrl);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Bot running'));
