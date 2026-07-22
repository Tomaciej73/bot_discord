# Discord Watchdog Alerts

Bot Discord, ktory wysyla szybki alert, gdy wskazany uzytkownik napisze wiadomosc w wskazanym kanale albo watku.

Bot nie czyta i nie zapisuje tresci wiadomosci. Filtruje tylko po `author.id` oraz `channelId`/`parentId`.

## Wymagania

- Node.js 20+ do uruchomienia lokalnego.
- Docker + Docker Compose do uruchomienia na VPS.
- Bot dodany do Twojego serwera Discord.
- Uprawnienia bota do widzenia monitorowanego kanalu/watku.

## Discord

1. Wejdz w Discord Developer Portal.
2. Utworz aplikacje i bota.
3. Skopiuj token bota do `DISCORD_BOT_TOKEN`.
4. W zakladce OAuth2 wygeneruj invite URL ze scope `bot`.
5. Dla bota wystarcza zwykle uprawnienia:
   - View Channels
   - Read Message History
6. Zapros bota na serwer.

`Message Content Intent` nie jest potrzebny, bo bot nie czyta tresci wiadomosci.

## ID uzytkownika i kanalu

1. W Discord wlacz Developer Mode.
2. Kliknij prawym na uzytkownika i wybierz `Copy User ID`.
3. Kliknij prawym na kanal albo watek `picks` i wybierz `Copy Channel ID`.
4. Wklej te wartosci do `.env`.

Najlepiej monitorowac dokladny ID kanalu/watku przez `WATCHED_CHANNEL_IDS`.

Jesli `picks` jest watkiem/forum postem i chcesz monitorowac wszystkie watki pod danym parent channel, uzyj opcjonalnie `WATCHED_PARENT_CHANNEL_IDS`.

## Konfiguracja

```bash
cp .env.example .env
```

Minimalna konfiguracja dla Telegrama:

```env
DISCORD_BOT_TOKEN=...
WATCHED_USER_IDS=123456789012345678
WATCHED_CHANNEL_IDS=111111111111111111
WATCHED_PARENT_CHANNEL_IDS=
NOTIFIER=telegram
FALLBACK_NOTIFIERS=
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

## Uruchomienie lokalne

```bash
cd bot
npm install
npm run check
npm start
```

## Uruchomienie przez Docker Compose

Z katalogu glownego projektu:

```bash
docker compose up -d --build
docker compose logs -f discord-watchdog
```

Zatrzymanie:

```bash
docker compose down
```

## Alerty

Dostepne wartosci `NOTIFIER`:

- `telegram`
- `pushover`
- `sms`
- `email`

SMS uzywa Twilio. Email uzywa SMTP przez Nodemailer.

Telegram albo Pushover sa zwykle najlepsze do szybkiej reakcji. SMS i email moga miec wieksze opoznienie po stronie operatora/dostawcy.
