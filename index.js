export default {
  async fetch(request, env) {
    const bot = new TelegramBot(env.TELEGRAM_TOKEN);
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("✅ ArcSplit Bot is Online on Cloudflare Workers!");
    }

    if (url.pathname === "/webhook" && request.method === "POST") {
      const update = await request.json();
      await bot.processUpdate(update);
      return new Response("OK", { status: 200 });
    }

    if (url.pathname === "/send-tx" && request.method === "POST") {
      const data = await request.json();
      const { chatId, txHash, amount, token, recipientsCount } = data;

      if (txHash && chatId) {
        const message = `✅ Transaction Successful!\n\n` +
                        `Amount: ${amount} ${token}\n` +
                        `Recipients: ${recipientsCount}\n\n` +
                        `Hash: ${txHash}\n\n` +
                        `🔗 https://testnet.arcscan.app/tx/${txHash}`;

        await bot.sendMessage(chatId, message);
      }
      return new Response("OK", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }
};

class TelegramBot {
  constructor(token) {
    this.token = token;
    this.apiUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(chatId, text) {
    await fetch(`${this.apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  }

  async processUpdate(update) {
    const message = update.message;
    if (!message) return;

    const chatId = message.chat.id;
    const text = message.text ? message.text.trim() : '';
    const username = message.from && message.from.username ? `@${message.from.username}` : "User";

    if (text.startsWith('/start wallet_')) {
      const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=connect&username=${username}&chatId=${chatId}`;
      await this.sendMessage(chatId, `✅ Connected successfully!\nTelegram: ${username}`);
      await this.sendMessage(chatId, siteUrl);
    } 
    else if (text.toLowerCase().startsWith('send ')) {
      const parts = text.split(/\s+/);
      const amount = parts[1] || '';
      const tokenSym = parts[2] ? parts[2].toUpperCase() : '';
      const addresses = parts.slice(3);

      if (amount && tokenSym && addresses.length > 0) {
        const siteUrl = `https://arcsplit.kamkazi-1297.workers.dev/?action=send&amount=${amount}&token=${tokenSym}&addresses=${addresses.join(',')}&username=${username}&chatId=${chatId}`;
        
        await this.sendMessage(chatId, `📤 Send Request:\n${amount} ${tokenSym} to ${addresses.length} addresses`);
        await this.sendMessage(chatId, `🔗 Click to confirm:\n${siteUrl}`);
      } else {
        await this.sendMessage(chatId, "❌ Wrong format!\nUse: send <amount> <token> <address1> <address2> ...");
      }
    } 
    else if (text === '/start') {
      await this.sendMessage(chatId, `✅ Bot is Online!\nHello ${username}`);
    }
  }
}
