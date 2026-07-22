/**
 * Telegram notifier.
 * Sends alerts through Telegram Bot API using HTML formatting.
 */

import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from '../config.js';

const API_BASE = 'https://api.telegram.org';

export async function sendTelegram(payload) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { ok: false, error: 'Telegram not configured' };
  }

  const start = Date.now();

  try {
    const resp = await fetch(`${API_BASE}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: payload.telegram,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const json = await resp.json();
    const ms = Date.now() - start;

    if (!resp.ok || json.ok !== true) {
      const msg = json.description || `HTTP ${resp.status}`;
      console.error(`[telegram] API error (${ms}ms): ${msg}`);
      return { ok: false, error: msg };
    }

    console.log(`[telegram] Alert sent (${ms}ms)`);
    return { ok: true, ms };
  } catch (err) {
    console.error(`[telegram] Network error: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
