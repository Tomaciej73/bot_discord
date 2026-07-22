/**
 * Email notifier — sends HTML emails via SMTP using Nodemailer.
 * Works with any SMTP provider (SendGrid, Mailgun, Gmail SMTP, etc.).
 */

import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  SMTP_TO,
} from '../config.js';

export async function sendEmail(payload) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !SMTP_TO) {
    return { ok: false, error: 'Email/SMTP not configured' };
  }

  let nodemailer;
  try {
    nodemailer = await import('nodemailer');
  } catch {
    return { ok: false, error: 'nodemailer package not installed (optional dependency)' };
  }

  const transporter = nodemailer.default.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const start = Date.now();

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: SMTP_TO,
      subject: payload.subject,
      html: payload.html,
    });

    const ms = Date.now() - start;
    console.log(`[email] Alert sent to ${SMTP_TO} — msgId ${info.messageId} (${ms}ms)`);
    return { ok: true, ms, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] SMTP error: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
