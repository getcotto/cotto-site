import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Telegram webhook — the ON-DEMAND half of the daily push. Telegram POSTs here the moment Kendall texts or
// taps the bot; we verify it's really Telegram (secret header) and really her (chat id), then hand the single
// update to the engine via a GitHub repository_dispatch, which runs cotto-spine/.github/workflows/tg-command
// with full git + engine access (today -> sends cadence, snooze -> day-mute, done -> ack, tap -> logs POD).
//
// We do NOT process the command here: the canonical spine lives in git and the render needs the Node engine,
// neither of which a Vercel function should touch. This endpoint is a thin, authenticated relay. It always
// returns 200 fast (a non-200 makes Telegram retry) — even on a rejected/malformed update, we 200 and ignore.
//
// ENV (Vercel): TELEGRAM_WEBHOOK_SECRET (matches the secret set when the webhook was registered),
// GH_DISPATCH_TOKEN (fine-grained PAT, Actions: write on cotto-spine), TELEGRAM_CHAT_ID (Kendall's id).

const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "8621616610";

// Minimal shapes — we only read ids off the update; the engine parses the rest.
type TgFrom = { id?: number };
type TgUpdate = {
  callback_query?: { from?: TgFrom };
  message?: { from?: TgFrom; chat?: { id?: number } };
  edited_message?: { from?: TgFrom };
};

export async function POST(req: NextRequest) {
  // 1. Only Telegram, carrying the secret we set at registration, may call this.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true }); // malformed — ignore, but 200 so Telegram doesn't retry
  }

  // 2. Sender gate (defense in depth on top of the engine's own gate): only Kendall's chat.
  const senderId = String(
    update?.callback_query?.from?.id ??
      update?.message?.from?.id ??
      update?.message?.chat?.id ??
      update?.edited_message?.from?.id ??
      "",
  );
  if (senderId !== String(CHAT_ID)) {
    return NextResponse.json({ ok: true }); // not her — silently ignore
  }

  // 3. Relay to the engine. repository_dispatch runs tg-command.yml with the update as client_payload.
  const token = process.env.GH_DISPATCH_TOKEN;
  if (token) {
    try {
      await fetch("https://api.github.com/repos/getcotto/cotto-spine/dispatches", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ event_type: "tg-command", client_payload: { update } }),
      });
    } catch {
      // swallow — we always 200 to Telegram; a missed dispatch is recoverable, a retry storm is not
    }
  }

  return NextResponse.json({ ok: true });
}
