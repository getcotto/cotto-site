# Dash setup

Private to-do dashboard at `/dash`. Single-user, password gate, Upstash Redis (via Vercel Marketplace) for storage.

## One-time setup

### 1. Provision storage on Vercel

In the Vercel dashboard for cotto-site:

1. Go to **Storage** tab → **Create Database** → choose **Redis** (Serverless Redis, by Redis Inc.).
2. Pick the free tier and a region close to your users (e.g. `us-east-1`).
3. Connect it to the cotto-site project. Vercel auto-injects `REDIS_URL` (TCP connection string).

The store uses node-redis over TCP, so this requires Node runtime (not Edge). All `/api/dash/*` routes and `/dash` already declare `runtime = "nodejs"`.

### 2. Set the password / API token

In Vercel project **Settings → Environment Variables**, add:

```
DASH_SECRET = <generated secret>
```

This is both the password you type into `/dash` and the bearer token Claude/digest use for API access. Pick something long and random (a passphrase or 32+ char hex). One value, one place.

After saving, redeploy.

### 3. Local dev

Add to `.env.local` (do not commit):

```
DASH_SECRET=<same value>
REDIS_URL=<from Vercel Storage panel — `redis://default:<password>@host:port`>
```

Or run `vercel env pull .env.local` to grab everything.

## API

All routes require auth: either the `dash_session` cookie (set after login) or `Authorization: Bearer $DASH_SECRET`.

```
GET    /api/dash/todos                  → { items: TodoItem[] }
POST   /api/dash/todos                  body: { text, category, priority?, note?, source? }
PATCH  /api/dash/todos/:id              body: partial { text, category, priority, done, note }
DELETE /api/dash/todos/:id
POST   /api/dash/auth                   body: { password }   → sets cookie
DELETE /api/dash/auth                   → clears cookie
```

`category` ∈ `ops | sales | marketing | finance | admin`
`source` ∈ `kendall | claude | digest` (defaults to `kendall`)

Done items auto-archive after 24 hours.

## How to add an item from the command line

```sh
curl -X POST https://getcotto.com/api/dash/todos \
  -H "Authorization: Bearer $DASH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"text":"Send samples to Annie","category":"sales","priority":true,"source":"claude"}'
```
