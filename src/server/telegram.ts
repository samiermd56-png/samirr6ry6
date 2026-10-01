import { db, dbManager } from '../db/database.ts';
import { TelegramBot } from '../types/index.ts';

export async function sendTelegramMessage(botToken: string, chatId: string, text: string, replyMarkup?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: any = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as any;
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'Telegram API returned error' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network request failed' };
  }
}

export async function configureTelegramMenuButton(botToken: string, appUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: '🛍️ Open Web Store',
          web_app: {
            url: cleanUrl,
          },
        },
      }),
    });
    const data = await res.json() as any;
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'Failed to set Menu Button' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function setTelegramWebhook(botToken: string, webhookUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    });
    const data = await res.json() as any;
    return { success: !!data.ok, error: data.description };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTelegramWebhook(botToken: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    // Ignore error
  }
}

export async function getBotProfile(botToken: string): Promise<{ success: boolean; username?: string; name?: string; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json() as any;
    if (data.ok && data.result) {
      return {
        success: true,
        username: data.result.username,
        name: data.result.first_name,
      };
    }
    return { success: false, error: data.description || 'Invalid token' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function broadcastAlertToAllBots(message: string, appUrl?: string): Promise<void> {
  const bots = db.telegramBots.filter(b => b.isActive && b.botToken && b.chatId);
  const cleanAppUrl = (appUrl || process.env.APP_URL || 'https://digivault.io').replace(/\/$/, '');

  for (const bot of bots) {
    try {
      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '⚡ Open Store Inside Telegram',
              web_app: { url: cleanAppUrl },
            },
          ],
        ],
      };
      await sendTelegramMessage(bot.botToken, bot.chatId, message, replyMarkup);
      bot.lastAlertSent = new Date().toISOString();
    } catch (e) {
      console.error(`Failed to dispatch alert to bot ${bot.name}:`, e);
    }
  }
  dbManager.persist();
}
