/**
 * Pushover notifier — sends plain-text alerts via Pushover API.
 * Docs: https://pushover.net/api
 */

import { PUSHOVER_USER_KEY, PUSHOVER_APP_TOKEN } from '../config.js';

const API = 'https://api.pushover.net/1/messages.json';

export async function sendPushover(payload) {
  if (!PUSHOVER_USER_KEY || !PUSHOVER_APP_TOKEN) {
    return { ok: false, error: 'Pushover not configured' };
  }

  const start = Date.now();
  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: PUSHOVER_APP_TOKEN,
        user: PUSHOVER_USER_KEY,
        message: payload.plain,
        title: payload.subject,
        priority: 0,  // normal priority
      }),
    });

    const json = await resp.json();
    const ms = Date.now() - start;

    if (!resp.ok || json.status !== 1) {
      const msg = json.errors?.join(', ') || `HTTP ${resp.status}`;
      console.error(`[pushover] API error (${ms}ms): ${msg}`);
      return { ok: false, error: msg };
    }

    console.log(`[pushover] Alert sent (${ms}ms)`);
    return { ok: true, ms };
  } catch (err) {
    console.error(`[pushover] Network error: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
