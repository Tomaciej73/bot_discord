/**
 * Runtime configuration.
 *
 * Values are read from environment variables. During local development dotenv
 * loads a .env file from the current working directory. Docker Compose injects
 * the same values through env_file.
 */

import 'dotenv/config';

export const DISCORD_TOKEN = required('DISCORD_BOT_TOKEN');
export const WATCHED_USERS = parseRequiredList('WATCHED_USER_IDS');
export const WATCHED_CHANNELS = parseRequiredList('WATCHED_CHANNEL_IDS');
export const WATCHED_PARENT_CHANNELS = parseOptionalList('WATCHED_PARENT_CHANNEL_IDS');

export const NOTIFIER = required('NOTIFIER').toLowerCase();
export const FALLBACK_NOTIFIERS = parseOptionalList('FALLBACK_NOTIFIERS').map((name) =>
  name.toLowerCase(),
);

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY || '';
export const PUSHOVER_APP_TOKEN = process.env.PUSHOVER_APP_TOKEN || '';

export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
export const TWILIO_FROM_PHONE = process.env.TWILIO_FROM_PHONE || '';
export const TWILIO_TO_PHONE = process.env.TWILIO_TO_PHONE || '';

export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || '587', 10);
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const SMTP_FROM = process.env.SMTP_FROM || '';
export const SMTP_TO = process.env.SMTP_TO || '';

function required(key) {
  const val = process.env[key]?.trim();
  if (!val) {
    console.error(`[config] Missing required env var: ${key}`);
    process.exit(1);
  }
  return val;
}

function parseRequiredList(key) {
  const items = parseOptionalList(key);
  if (items.length === 0) {
    console.error(`[config] Missing required env var: ${key}`);
    process.exit(1);
  }
  return items;
}

function parseOptionalList(key) {
  const raw = process.env[key] || '';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
