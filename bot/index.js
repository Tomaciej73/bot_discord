/**
 * Discord Watchdog Alerts — main entry point.
 *
 * Connects to Discord Gateway, listens for MESSAGE_CREATE events,
 * filters by watched users × channels, and dispatches alerts.
 *
 * Intents used: Guilds + GuildMessages only (NO MessageContent).
 * Message content is never read, stored, or logged.
 */

import { Client, GatewayIntentBits, Events } from 'discord.js';
import {
  DISCORD_TOKEN,
  WATCHED_USERS,
  WATCHED_CHANNELS,
} from './config.js';
import { sendAlert } from './notifiers/dispatcher.js';

/* ── Watched IDs as Sets for O(1) lookup ── */
const watchedUsers    = new Set(WATCHED_USERS);
const watchedChannels = new Set(WATCHED_CHANNELS);

/* ── Validate config ── */
if (watchedUsers.size === 0) {
  console.error('[bot] WATCHED_USER_IDS is empty — nothing to monitor. Exiting.');
  process.exit(1);
}
if (watchedChannels.size === 0) {
  console.error('[bot] WATCHED_CHANNEL_IDS is empty — no channels to watch. Exiting.');
  process.exit(1);
}

console.log(`[bot] Watching ${watchedUsers.size} user(s) across ${watchedChannels.size} channel(s).`);

/* ── Discord client (no MessageContent intent) ── */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // explicitly omit MessageContent — we don't read or store content
  ],
});

/* ── Ready ── */
client.once(Events.ClientReady, (readyClient) => {
  console.log(`[bot] ✅ Logged in as ${readyClient.user.tag} (${readyClient.user.id})`);
  console.log(`[bot] Gateway connected. Monitoring active.`);
});

/* ── Auto-reconnect ── */
client.on(Events.ShardReconnecting, () => {
  console.warn('[bot] ⚠️  Gateway reconnecting…');
});
client.on(Events.ShardResume, (id, replayed) => {
  console.log(`[bot] ♻️  Gateway resumed (shard ${id}, ${replayed} events replayed)`);
});

/* ── Core event: messageCreate ── */
client.on(Events.MessageCreate, async (message) => {
  /* filter — O(1) Set lookups */
  if (!watchedUsers.has(message.author.id)) return;
  if (!watchedChannels.has(message.channelId)) return;

  const now = new Date();

  /* resolve channel name (best-effort; partial channel object available without MessageContent) */
  const channelName = message.channel?.name ?? message.channelId;

  console.log(
    `[bot] 🎯 MATCH — ${message.author.tag} (${message.author.id}) → #${channelName} @ ${now.toISOString()}`
  );

  /* dispatch alert — fire-and-forget to keep the Gateway event loop fast */
  sendAlert({
    authorTag:   message.author.tag,
    authorId:    message.author.id,
    channelName,
    channelId:   message.channelId,
    guildId:     message.guildId ?? 'DM',
    messageId:   message.id,
    timestamp:   now,
  }).then((result) => {
    if (result.ok) {
      console.log(`[bot] ✅ Alert delivered (${result.ms ?? '?'}ms)`);
    } else {
      console.error(`[bot] ❌ Alert failed: ${result.error}`);
    }
  }).catch((err) => {
    console.error(`[bot] ❌ Alert dispatch threw: ${err.message}`);
  });
});

/* ── Error ── */
client.on(Events.Error, (err) => {
  console.error('[bot] Discord client error:', err.message);
});

/* ── Login ── */
console.log('[bot] Logging in to Discord Gateway…');
await client.login(DISCORD_TOKEN);

/* ── Graceful shutdown ── */
const shutdown = async (signal) => {
  console.log(`[bot] Received ${signal}. Shutting down…`);
  client.destroy();
  process.exit(0);
};
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
