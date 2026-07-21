export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const bot = new TelegramBot(env.TELEGRAM_TOKEN);

    if (url.pathname === "/" || url.pathname === "") {
      return new Response("✅ ArcSplit Bot is Online!");
    }

    // Register Webhook
    if (url.pathname === "/registerWebhook") {
      const webhookUrl = `https://${url.hostname}/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] })
      });
      const data = await res.json();
      return new Response(`Webhook: ${data.ok ? "✅ Success" : "❌ Failed"}`);
    }

    // Telegram Webhook
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const update = await request.json();
        await bot.processUpdate(update);
      } catch (e) { 
        console.error(e); 
      }
      return new Response("OK");
    }

    // Send Transaction Notification
    if (url.pathname === "/send-tx") {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

      if (request.method === "POST") {
        try {
          const data = await request.json();
          const { chatId, txHash, amount = "?", token = "", recipientsCount = "?" } = data;
          if (txHash && chatId) {
            const message = `✅ Transaction Successful!\n\nAmount: ${amount} ${token}\nRecipients: ${recipientsCount}\n\nHash: ${txHash}\n\n🔗 https://testnet.arcscan.app/tx/${txHash}`;
            await bot.sendMessage(chatId, message);
          }
        } catch (e) { console.error(e); }
      }
      return new Response("OK", { headers: corsHeaders });
    }

    return new Response("Not Found", { status: 404 });
  }
};

class TelegramBot {
  constructor(token) {
    this.token = token;
    this.apiUrl = `https://api.telegram.org/bot${token}`;
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

  async processUpdate(update) {
    const msg = update.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const username = msg.from?.username ? `@${msg.from.username}` : msg.from?.first_name || "User";

    // ==================== /start ====================
    if (text === '/start' || text.startsWith('/start ')) {
      await this.sendMessage(chatId, 
`👋 <b>Welcome to ArcSplit Pro Bot</b>

This is the official bot for <b>ArcSplit Pro</b> — Professional Token Splitter on Arc Testnet.

🔹 Features:
• Split tokens between multiple addresses
• Connect wallet & receive notifications

📌 Commands:
• /start — Show this message
• /connect — Connect your wallet

Main Website: https://arcsplit.kamkazi-1297.workers.dev`);
      return;
    }

    // ==================== /connect ====================
    if (text === '/connect') {
      const keyboard = {
        inline_keyboard: [[
          { 
            text: "🔗 Connect My Wallet", 
            url: `https://arcsplit.kamkazi-1297.workers.dev/?telegram_connect=true&username=${encodeURIComponent(username)}` 
          }
        ]]
      };

      await this.sendMessage(chatId, "Click the button below to connect your wallet:", keyboard);
      return;
    }

    // ==================== Handle Connection from Site ====================
    if (text.startsWith('/start connect_')) {
      const parts = text.split('_');
      if (parts.length >= 3) {
        const walletAddress = parts[2];
        await this.sendMessage(chatId, 
`✅ <b>Connection Successful!</b>

Telegram: <b>${username}</b>
Wallet:
<code>${walletAddress}</code>

This wallet has been successfully linked to your Telegram account.`);
      }
    }

    // ==================== Send Command ====================
    if (text.toLowerCase().startsWith('send ')) {
      const parts = text.split(/\s+/);
      const amount = parts[1];
      const tokenSym = parts[2] ? parts[2].toUpperCase() : '';
      const addresses = parts.slice(3);

      if (amount && tokenSym && addresses.length > 0) {
        const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=send&amount=${amount}&token=${tokenSym}&addresses=${addresses.join(',')}&chatId=${chatId}`;
        
        const keyboard = {
          inline_keyboard: [[
            { text: "✅ Open & Confirm Transaction", url: siteUrl }
          ]]
        };

        await this.sendMessage(chatId, 
`📤 <b>New Split Request</b>

Amount: ${amount} ${tokenSym}
Recipients: ${addresses.length}`, keyboard);
      }
    }
  }
}
