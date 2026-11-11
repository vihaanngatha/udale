# Uda le — install guide

Everything below works from a phone browser. A laptop makes steps 2 and 3 quicker.

## 1. What's in the folder
| File | What it is |
|---|---|
| `index.html` | The whole app |
| `sw.js` | Makes it work offline + shows reminders |
| `manifest.webmanifest`, `icon-*.png` | Home Screen install + icon |
| `worker.js` | Free reminder server (Cloudflare) |
| `REQUIREMENTS.md` | Every agreed requirement and where it lives |

## 2. Put the app online (free, GitHub Pages) — about 5 minutes
1. Make a free account at github.com.
2. New repository → name it `uda-le` → **Public** → Create.
3. "uploading an existing file" → upload `index.html`, `sw.js`, `manifest.webmanifest`, the three `icon-*.png` files and all the `splash-*.png` files (launch screens) → Commit.
4. Repo **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
5. After a minute your app is at `https://<your-username>.github.io/uda-le/`.

## 3. Install on iPhone
1. Open that link in **Safari** (not Chrome).
2. Share button → **Add to Home Screen** → Add.
3. Open **Uda le** from the Home Screen and do the 60-second setup.

Your data lives only on your phone. Use **Rules → Backup → Export** weekly and save to Files/iCloud.

## 4. Reminders (free Cloudflare Worker) — about 10 minutes
Needs iOS 16.4 or newer, and the app opened from the Home Screen.

1. Make a free account at dash.cloudflare.com.
2. **Storage & Databases → KV → Create** a namespace called `udale-subs`.
3. **Workers & Pages → Create → Worker** → name it `uda-le` → Deploy.
4. **Edit code** → delete everything → paste all of `worker.js` → Deploy.
5. Worker **Settings → Bindings → Add → KV namespace**: variable name `SUBS`, namespace `udale-subs` → Save.
6. Worker **Settings → Trigger events → Add → Cron**: `*/15 * * * *` → Save.
7. Copy the worker URL (like `https://uda-le.yourname.workers.dev`).
8. In the app: **Rules → Reminders** → paste the URL → **Turn reminders on** → Allow → **Send test**.

You'll get a "log it" nudge daily at your chosen time and the weekly review reminder Sunday at 20:00 (each within ~15 minutes). The server only stores your push address, reminder time and timezone.

## Updating the app later
Upload the new `index.html` (and `sw.js` if it changed) to the same repo. The app picks it up the next time it's opened online.
