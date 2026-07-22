/**
 * Dispatcher — picks the primary notifier and tries fallbacks on failure.
 */

import { sendTelegram }  from './telegram.js';
import { sendPushover }  from './pushover.js';
import { sendSms }       from './sms.js';
import { sendEmail }     from './email.js';
import {
  NOTIFIER,
  FALLBACK_NOTIFIERS,
} from '../config.js';

const NOTIFIERS = { telegram: sendTelegram, pushover: sendPushover, sms: sendSms, email: sendEmail };

/**
 * Build the alert payload object (no message content).
 * @param {object} params
 * @param {string} params.authorTag    e.g. "User#1234"
 * @param {string} params.authorId     Discord snowflake
 * @param {string} params.channelName  e.g. "picks"
 * @param {string} params.channelId    Discord snowflake
 * @param {string} params.messageId    Discord snowflake
 * @param {string} params.guildId      Discord snowflake
 * @param {Date}   params.timestamp    JS Date
 */
function buildPayload({ authorTag, authorId, channelName, channelId, guildId, messageId, timestamp }) {
  const iso = timestamp.toISOString();
  const link = `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;

  /* plain-text fallback for SMS / Pushover */
  return {
    plain: `🔔 ${authorTag} posted in #${channelName}\nTime: ${iso}\nLink: ${link}`,
    telegram: `<b>🔔 ${authorTag}</b> posted in <b>#${channelName}</b>\n<code>${iso}</code>\n<a href="${link}">Jump to message</a>`,
    subject: `Discord Alert — ${authorTag} in #${channelName}`,
    html: `<p><strong>🔔 ${authorTag}</strong> posted in <strong>#${channelName}</strong></p>
<p>Time: <code>${iso}</code></p>
<p><a href="${link}">Jump to message on Discord</a></p>`,
  };
}

/**
 * Send alert through primary notifier; fall back to the listed options on failure.
 */
export async function sendAlert(eventData) {
  const payload = buildPayload(eventData);

  const primary = NOTIFIERS[NOTIFIER];
  if (!primary) {
    console.error(`[notifier] Unknown primary notifier: ${NOTIFIER}`);
    return { ok: false, error: `Unknown notifier: ${NOTIFIER}` };
  }

  try {
    const result = await primary(payload);
    if (result.ok) return result;
    console.warn(`[notifier] Primary (${NOTIFIER}) failed: ${result.error}. Trying fallbacks…`);
  } catch (err) {
    console.warn(`[notifier] Primary (${NOTIFIER}) threw: ${err.message}. Trying fallbacks…`);
  }

  /* fallback chain */
  for (const name of FALLBACK_NOTIFIERS) {
    const fn = NOTIFIERS[name];
    if (!fn) continue;
    try {
      console.log(`[notifier] Trying fallback: ${name}`);
      const result = await fn(payload);
      if (result.ok) return result;
    } catch (err) {
      console.warn(`[notifier] Fallback ${name} failed: ${err.message}`);
    }
  }

  console.error('[notifier] All notifiers exhausted.');
  return { ok: false, error: 'All notifiers failed' };
}
