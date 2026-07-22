export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const bot = new TelegramBot(env.TELEGRAM_TOKEN, env.WALLETS_KV);

    if (url.pathname === "/" || url.pathname === "") {
      return new Response("✅ ArcSplit Bot is Online!");
    }

    if (url.pathname === "/registerWebhook") {
      const webhookUrl = `https://${url.hostname}/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2));
    }

    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const update = await request.json();
        await bot.processUpdate(update);
      } catch (e) { 
        console.error("Webhook Error:", e); 
      }
      return new Response("OK");
    }

    if (url.pathname === "/save-connection") {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

      if (request.method === "POST") {
        try {
          const { chatId, walletAddress } = await request.json();
          if (chatId && walletAddress) {
            await env.WALLETS_KV.put(`wallet:${chatId}`, walletAddress.toLowerCase(), { expirationTtl: 2592000 });
            await bot.sendWelcomeWithButton(chatId);
            return new Response("Saved", { headers: corsHeaders });
          }
        } catch (e) {}
        return new Response("Bad Request", { status: 400, headers: corsHeaders });
      }
    }

    if (url.pathname === "/send-tx") {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      if (request.method === "POST") {
        try {
          const data = await request.json();
          const { chatId, txHash, amount = "?", token = "", recipientsCount = "?" } = data;
          
          if (txHash && chatId) {
            await bot.saveTransaction(chatId, txHash, amount, token, recipientsCount);
            
            const message = `✅ Transaction Successful!\n\nAmount: ${amount} ${token}\nRecipients: ${recipientsCount}\n\nHash: ${txHash}\n\n🔗 https://testnet.arcscan.app/tx/${txHash}`;
            
            await bot.sendMessage(chatId, message);
            console.log(`Notification sent to ${chatId}`);
          }
        } catch (e) {
          console.error("Send-tx error:", e);
        }
      }
      return new Response("OK", { headers: corsHeaders });
    }

    return new Response("Not Found", { status: 404 });
  }
};

class TelegramBot {
  constructor(token, kv) {
    this.token = token;
    this.apiUrl = `https://api.telegram.org/bot${token}`;
    this.kv = kv || { get: async () => null, put: async () => {} };
    this.rpcUrl = "https://rpc.testnet.arc.network";
  }

  async sendMessage(chatId, text, replyMarkup = null) {
    const payload = { chat_id: chatId, text: text, parse_mode: 'HTML' };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    
    try {
      await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) { console.error(e); }
  }

  async saveTransaction(chatId, txHash, amount, token, recipientsCount) {
    try {
      let history = await this.kv.get(`history:${chatId}`);
      history = history ? JSON.parse(history) : [];
      history.unshift({ txHash, amount, token, recipientsCount, time: new Date().toLocaleString() });
      if (history.length > 5) history = history.slice(0, 5);
      await this.kv.put(`history:${chatId}`, JSON.stringify(history), { expirationTtl: 2592000 });
    } catch (e) {}
  }

  async sendWelcomeWithButton(chatId, username = "") {
    const keyboard = {
      inline_keyboard: [[
        { 
          text: "🔗 Connect My Wallet", 
          url: `https://arcsplit.kamkazi-1297.workers.dev/?telegram_connect=true&chatId=${chatId}&username=${encodeURIComponent(username)}` 
        }
      ]]
    };

    await this.sendMessage(chatId, 
`👋 <b>Welcome to ArcSplit Pro Bot!</b>

This is the official Telegram bot for <b>ArcSplit Pro</b> — Professional Token Splitter on Arc Testnet.

🔹 Split your tokens easily between multiple addresses.

📌 <b>Available Commands:</b>
• /wallet — Show connected wallet
• /balance — Check your balances
• /history — Recent transactions
• send [amount] [token] [addresses...] — Quick split  

🌐 Main Website: https://arcsplit.kamkazi-1297.workers.dev

Click the button below to connect your wallet and start splitting!`, keyboard);
  }

  async getTokenBalance(wallet, tokenAddress, symbol) {
    try {
      const data = {
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{
          to: tokenAddress,
          data: "0x70a08231" + wallet.replace("0x", "").padStart(64, "0")
        }, "latest"],
        id: 1
      };

      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.result && result.result !== "0x") {
        const rawBalance = parseInt(result.result, 16);
        const balance = rawBalance / 1e6;
        return `${symbol}: ${balance.toFixed(4)}`;
      }
      return `${symbol}: 0.0000`;
    } catch (e) {
      return `${symbol}: Error`;
    }
  }

  async processUpdate(update) {
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === '/start' || text.startsWith('/start ')) {
      await this.sendWelcomeWithButton(chatId, msg.from.username || "");
      return;
    }

    if (text === '/wallet' || text === '/address') {
      const wallet = await this.kv.get(`wallet:${chatId}`);
      if (wallet) {
        await this.sendMessage(chatId, `🔑 <b>Connected Wallet:</b>\n<code>${wallet}</code>`);
      } else {
        await this.sendMessage(chatId, "❌ No wallet connected.");
      }
      return;
    }

    if (text === '/balance') {
      const wallet = await this.kv.get(`wallet:${chatId}`);
      if (!wallet) return this.sendMessage(chatId, "❌ No wallet connected.");

      await this.sendMessage(chatId, `⏳ Fetching balances for:\n<code>${wallet}</code>...`);

      const balances = await Promise.all([
        this.getTokenBalance(wallet, "0x3600000000000000000000000000000000000000", "USDC"),
        this.getTokenBalance(wallet, "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", "EURC"),
        this.getTokenBalance(wallet, "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF", "cirBTC")
      ]);

      await this.sendMessage(chatId, `💰 <b>Your Balances:</b>\n\n${balances.join('\n')}`);
      return;
    }

    if (text === '/history') {
      const wallet = await this.kv.get(`wallet:${chatId}`);
      if (!wallet) return this.sendMessage(chatId, "❌ No wallet connected.");

      let history = await this.kv.get(`history:${chatId}`);
      history = history ? JSON.parse(history) : [];

      if (history.length === 0) {
        await this.sendMessage(chatId, `📜 No transactions yet for:\n<code>${wallet}</code>`);
        return;
      }

      let responseText = `📜 <b>Recent Transactions</b> for:\n<code>${wallet}</code>\n\n`;
      history.forEach((tx, i) => {
        responseText += `${i+1}. ${tx.amount} ${tx.token} → ${tx.recipientsCount} recipients\n`;
        responseText += `   <code>${tx.txHash.slice(0,12)}...</code> (${tx.time})\n\n`;
      });

      await this.sendMessage(chatId, responseText);
      return;
    }

    if (text.toLowerCase().startsWith('send ')) {
      const parts = text.split(/\s+/);
      if (parts.length < 4) {
        await this.sendMessage(chatId, "❌ Usage: send [amount] [token] [address1] [address2] ...");
        return;
      }

      const amount = parts[1];
      const token = parts[2].toUpperCase();
      const addresses = parts.slice(3);

      if (!amount || addresses.length === 0) {
        await this.sendMessage(chatId, "❌ Please check the format.");
        return;
      }

      const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=send&amount=${amount}&token=${token}&addresses=${addresses.join(',')}&chatId=${chatId}&source=bot`;

      const keyboard = {
        inline_keyboard: [[
          { text: "✅ Open & Confirm Split", url: siteUrl }
        ]]
      };

      await this.sendMessage(chatId, 
`📤 <b>New Split Request</b>

Amount: ${amount} ${token}
Recipients: ${addresses.length}`, keyboard);
      return;
    }
  }
}
