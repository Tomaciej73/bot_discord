# ── Stage 1: install (caches node_modules layer) ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY bot/package.json ./

RUN npm install --omit=optional

# ── Stage 2: runtime ──
FROM node:22-alpine
WORKDIR /app

# non-root user (security best practice)
RUN addgroup -S bot && adduser -S bot -G bot
USER bot

COPY --from=deps --chown=bot:bot /app/node_modules ./node_modules
COPY --chown=bot:bot bot/ ./

ENV NODE_ENV=production
CMD ["node", "index.js"]
