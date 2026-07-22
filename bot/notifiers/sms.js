/**
 * SMS notifier.
 * Sends alerts via Twilio.
 */

import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_PHONE,
  TWILIO_TO_PHONE,
} from '../config.js';

export async function sendSms(payload) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_PHONE || !TWILIO_TO_PHONE) {
    return { ok: false, error: 'SMS/Twilio not configured' };
  }

  let twilio;
  try {
    twilio = await import('twilio');
  } catch {
    return { ok: false, error: 'twilio package not installed' };
  }

  const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const start = Date.now();

  try {
    const msg = await client.messages.create({
      body: payload.plain,
      from: TWILIO_FROM_PHONE,
      to: TWILIO_TO_PHONE,
    });

    const ms = Date.now() - start;
    console.log(`[sms] Alert sent to ${TWILIO_TO_PHONE} - SID ${msg.sid} (${ms}ms)`);
    return { ok: true, ms, sid: msg.sid };
  } catch (err) {
    console.error(`[sms] Twilio error: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
