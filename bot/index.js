/**
 * Discord Watchdog Alerts.
 *
 * Connects to Discord Gateway, listens for MESSAGE_CREATE events, filters by
 * watched users and channels, then dispatches alerts.
 *
 * Intents used: Guilds + GuildMessages only. Message content is not read,
 * stored, or logged.
 */

import { Client, Events, GatewayIntentBits } from 'discord.js';
import {
  DISCORD_TOKEN,
  WATCHED_CHANNELS,
  WATCHED_PARENT_CHANNELS,
  WATCHED_USERS,
} from './config.js';
import { sendAlert } from './notifiers/dispatcher.js';

const watchedUsers = new Set(WATCHED_USERS);
const watchedChannels = new Set(WATCHED_CHANNELS);
const watchedParentChannels = new Set(WATCHED_PARENT_CHANNELS);

console.log(
  `[bot] Watching ${watchedUsers.size} user(s), ${watchedChannels.size} channel/thread ID(s), ` +
    `${watchedParentChannels.size} parent channel ID(s).`,
);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`[bot] Logged in as ${readyClient.user.tag} (${readyClient.user.id})`);
  console.log('[bot] Gateway connected. Monitoring active.');
});

client.on(Events.ShardReconnecting, () => {
  console.warn('[bot] Gateway reconnecting.');
});

client.on(Events.ShardResume, (id, replayed) => {
  console.log(`[bot] Gateway resumed (shard ${id}, ${replayed} events replayed).`);
});

client.on(Events.MessageCreate, (message) => {
  if (message.author?.bot) return;
  if (!watchedUsers.has(message.author.id)) return;
  if (!isWatchedMessageLocation(message)) return;

  const timestamp = new Date();
  const channelName = message.channel?.name ?? message.channelId;
  const authorTag = message.author.tag ?? message.author.username ?? message.author.id;

  console.log(
    `[bot] MATCH ${authorTag} (${message.author.id}) -> #${channelName} @ ${timestamp.toISOString()}`,
  );

  void sendAlert({
    authorTag,
    authorId: message.author.id,
    channelName,
    channelId: message.channelId,
    guildId: message.guildId,
    messageId: message.id,
    timestamp,
  })
    .then((result) => {
      if (result.ok) {
        console.log(`[bot] Alert delivered (${result.ms ?? '?'}ms).`);
      } else {
        console.error(`[bot] Alert failed: ${result.error}`);
      }
    })
    .catch((err) => {
      console.error(`[bot] Alert dispatch threw: ${err.message}`);
    });
});

client.on(Events.Error, (err) => {
  console.error('[bot] Discord client error:', err.message);
});

console.log('[bot] Logging in to Discord Gateway.');
await client.login(DISCORD_TOKEN);

async function shutdown(signal) {
  console.log(`[bot] Received ${signal}. Shutting down.`);
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

function isWatchedMessageLocation(message) {
  if (watchedChannels.has(message.channelId)) return true;

  const parentId = message.channel?.parentId;
  if (parentId && watchedParentChannels.has(parentId)) return true;

  return false;
}
