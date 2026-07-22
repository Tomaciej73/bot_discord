/**
 * Notification dispatcher.
 *
 * Sends through the primary notifier first, then tries configured fallbacks on
 * failure. The payload never contains message content.
 */

import { FALLBACK_NOTIFIERS, NOTIFIER } from '../config.js';
import { sendEmail } from './email.js';
import { sendPushover } from './pushover.js';
import { sendSms } from './sms.js';
import { sendTelegram } from './telegram.js';

const NOTIFIERS = {
  telegram: sendTelegram,
  pushover: sendPushover,
  sms: sendSms,
  email: sendEmail,
};

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

    console.warn(`[notifier] Primary (${NOTIFIER}) failed: ${result.error}. Trying fallbacks.`);
  } catch (err) {
    console.warn(`[notifier] Primary (${NOTIFIER}) threw: ${err.message}. Trying fallbacks.`);
  }

  for (const name of FALLBACK_NOTIFIERS) {
    const fallback = NOTIFIERS[name];
    if (!fallback) {
      console.warn(`[notifier] Unknown fallback notifier ignored: ${name}`);
      continue;
    }

    if (name === NOTIFIER) continue;

    try {
      console.log(`[notifier] Trying fallback: ${name}`);
      const result = await fallback(payload);
      if (result.ok) return result;

      console.warn(`[notifier] Fallback (${name}) failed: ${result.error}.`);
    } catch (err) {
      console.warn(`[notifier] Fallback (${name}) threw: ${err.message}.`);
    }
  }

  console.error('[notifier] All notifiers failed.');
  return { ok: false, error: 'All notifiers failed' };
}

function buildPayload({ authorTag, authorId, channelName, channelId, guildId, messageId, timestamp }) {
  const iso = timestamp.toISOString();
  const link = guildId
    ? `https://discord.com/channels/${guildId}/${channelId}/${messageId}`
    : '';

  const plainLines = [
    `Discord alert: ${authorTag} posted in #${channelName}`,
    `User ID: ${authorId}`,
    `Channel ID: ${channelId}`,
    `Time: ${iso}`,
  ];

  if (link) plainLines.push(`Link: ${link}`);

  const safeAuthorTag = escapeHtml(authorTag);
  const safeChannelName = escapeHtml(channelName);
  const safeIso = escapeHtml(iso);
  const safeLink = escapeHtml(link);

  return {
    plain: plainLines.join('\n'),
    telegram: [
      `<b>Discord alert</b>`,
      `<b>${safeAuthorTag}</b> posted in <b>#${safeChannelName}</b>`,
      `<code>${safeIso}</code>`,
      safeLink ? `<a href="${safeLink}">Jump to message</a>` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    subject: `Discord alert: ${authorTag} in #${channelName}`,
    html: [
      `<p><strong>Discord alert</strong></p>`,
      `<p><strong>${safeAuthorTag}</strong> posted in <strong>#${safeChannelName}</strong></p>`,
      `<p>User ID: <code>${escapeHtml(authorId)}</code></p>`,
      `<p>Channel ID: <code>${escapeHtml(channelId)}</code></p>`,
      `<p>Time: <code>${safeIso}</code></p>`,
      safeLink ? `<p><a href="${safeLink}">Jump to message on Discord</a></p>` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
