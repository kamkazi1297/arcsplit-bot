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

app.post('/send-tx', async (req, res) => {
  console.log("📥 Received:", req.body);
  
  const { telegramUsername, txHash, amount = '?', token = '', recipientsCount = '?' } = req.body;
  
  if (!txHash || !telegramUsername) {
    console.log("❌ Missing username or hash");
    return res.sendStatus(200);
  }

  const cleanUsername = telegramUsername.replace('@', '');
  const message = `✅ Transaction Successful!\n\n` +
                  `Amount: ${amount} ${token}\n` +
                  `Recipients: ${recipientsCount}\n\n` +
                  `Hash: ${txHash}\n\n` +
                  `🔗 https://testnet.arcscan.app/tx/${txHash}`;

  try {
    await bot.sendMessage(cleanUsername, message);
    console.log(`✅ Successfully sent to @${cleanUsername}`);
  } catch (e) {
    console.log(`❌ Failed to send to @${cleanUsername}:`, e.message);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Bot running'));
