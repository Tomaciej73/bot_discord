/**
 * Configuration loader — reads all settings from environment variables.
 * No values are hardcoded; secrets stay out of the repository.
 */

/* ── Discord ── */
export const DISCORD_TOKEN    = required('DISCORD_BOT_TOKEN');
export const WATCHED_USERS    = parseIdList('WATCHED_USER_IDS');     // comma-separated snowflakes
export const WATCHED_CHANNELS = parseIdList('WATCHED_CHANNEL_IDS'); // comma-separated snowflakes

/* ── Primary notifier selection ── */
export const NOTIFIER = required('NOTIFIER');  // telegram | pushover | sms | email

/* ── Telegram ── */
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || '';

/* ── Pushover ── */
export const PUSHOVER_USER_KEY  = process.env.PUSHOVER_USER_KEY  || '';
export const PUSHOVER_APP_TOKEN = process.env.PUSHOVER_APP_TOKEN || '';

/* ── SMS (Twilio) ── */
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
export const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN  || '';
export const TWILIO_FROM_PHONE  = process.env.TWILIO_FROM_PHONE  || '';
export const TWILIO_TO_PHONE    = process.env.TWILIO_TO_PHONE    || '';

/* ── Email (SMTP via Nodemailer) ── */
export const SMTP_HOST     = process.env.SMTP_HOST     || '';
export const SMTP_PORT     = parseInt(process.env.SMTP_PORT, 10) || 587;
export const SMTP_USER     = process.env.SMTP_USER     || '';
export const SMTP_PASS     = process.env.SMTP_PASS     || '';
export const SMTP_FROM     = process.env.SMTP_FROM     || '';
export const SMTP_TO       = process.env.SMTP_TO       || '';

/* ── Fallback notifiers (optional, comma-separated) ── */
export const FALLBACK_NOTIFIERS = parseCommaList('FALLBACK_NOTIFIERS'); // telegram,pushover,sms,email

/* ── Helpers ── */

function required(key) {
  const val = process.env[key];
  if (!val) {
    console.error(`[config] Missing required env var: ${key}`);
    process.exit(1);
  }
  return val;
}

function parseIdList(key) {
  const raw = process.env[key] || '';
  if (!raw) {
    console.error(`[config] Missing required env var: ${key}`);
    process.exit(1);
  }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function parseCommaList(key) {
  const raw = process.env[key] || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
