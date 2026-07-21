require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => res.send('✅ ArcSplit Bot Online'));

// دریافت هش از سایت و ارسال به تلگرام
app.post('/send-tx', (req, res) => {
  console.log("Received tx data:", req.body);
  
  const { telegramUsername, txHash, amount, token, recipientsCount } = req.body;
  
  if (txHash && telegramUsername) {
    const message = `✅ Transaction Successful!\n\n` +
                    `Amount: ${amount || '?'} ${token || ''}\n` +
                    `Recipients: ${recipientsCount || '?'}\n\n` +
                    `Hash: ${txHash}\n\n` +
                    `🔗 https://testnet.arcscan.app/tx/${txHash}`;

    bot.sendMessage(telegramUsername.replace('@', ''), message)
      .then(() => console.log("✅ Hash sent to Telegram"))
      .catch(e => console.log("Telegram Error:", e));
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Bot running'));
