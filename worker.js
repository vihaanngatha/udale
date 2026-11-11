// Uda le reminder server — Cloudflare Worker (free plan).
// Stores ONLY: push address, reminder time, timezone. No money data ever reaches it.
// Needs: a KV namespace bound as SUBS, and a cron trigger "*/15 * * * *".
// Sends payload-less Web Push (VAPID), so no message encryption is needed;
// the app's service worker picks the text.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", ...CORS } });
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = s => new TextEncoder().encode(s);

async function vapid(env) {
  let v = await env.SUBS.get("vapid", "json");
  if (!v) {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    v = { pub: b64u(await crypto.subtle.exportKey("raw", kp.publicKey)), priv: await crypto.subtle.exportKey("jwk", kp.privateKey) };
    await env.SUBS.put("vapid", JSON.stringify(v));
  }
  return v;
}
async function keyId(endpoint) {
  const h = await crypto.subtle.digest("SHA-256", enc(endpoint));
  return "sub:" + [...new Uint8Array(h)].slice(0, 16).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function sendPush(env, rec) {
  const v = await vapid(env);
  const ep = rec.sub.endpoint, aud = new URL(ep).origin;
  const head = b64u(enc(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: rec.subject || "mailto:reminders@uda-le.invalid" })));
  const key = await crypto.subtle.importKey("jwk", v.priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc(`${head}.${body}`));
  const jwt = `${head}.${body}.${b64u(sig)}`;
  const r = await fetch(ep, { method: "POST", headers: { Authorization: `vapid t=${jwt}, k=${v.pub}`, TTL: "43200", Urgency: "high", "Content-Length": "0" } });
  return r.status;
}
function localNow(tz) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz || "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
    .formatToParts(new Date()).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, mins: Number(parts.hour) * 60 + Number(parts.minute), sunday: parts.weekday === "Sun" };
}
async function tick(env) {
  let cursor;
  do {
    const page = await env.SUBS.list({ prefix: "sub:", cursor });
    for (const k of page.keys) {
      const rec = await env.SUBS.get(k.name, "json");
      if (!rec) continue;
      const n = localNow(rec.tz), [h, m] = (rec.at || "21:00").split(":").map(Number), target = h * 60 + m;
      rec.last = rec.last || {};
      let changed = false, gone = false;
      const due = (t, kind) => n.mins >= t && n.mins - t < 120 && rec.last[kind] !== n.date;
      for (const [kind, t, ok] of [["daily", target, true], ["weekly", 20 * 60, n.sunday]]) {
        if (!ok || !due(t, kind)) continue;
        const s = await sendPush(env, rec);
        if (s === 404 || s === 410) { gone = true; break; }
        rec.last[kind] = n.date; changed = true;
      }
      if (gone) await env.SUBS.delete(k.name);
      else if (changed) await env.SUBS.put(k.name, JSON.stringify(rec));
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (!env.SUBS) return json({ error: "KV namespace SUBS is not bound" }, 500);
    const url = new URL(req.url);
    try {
      if (req.method === "GET" && url.pathname === "/vapid") return json({ key: (await vapid(env)).pub });
      if (req.method === "POST") {
        const b = await req.json();
        if (!b.sub || !b.sub.endpoint || !/^https:\/\//.test(b.sub.endpoint)) return json({ error: "bad subscription" }, 400);
        const id = await keyId(b.sub.endpoint);
        if (url.pathname === "/subscribe") {
          const old = (await env.SUBS.get(id, "json")) || {};
          const at = /^\d\d:\d\d$/.test(b.at) ? b.at : "21:00";
          await env.SUBS.put(id, JSON.stringify({ sub: { endpoint: b.sub.endpoint }, at, tz: String(b.tz || "Asia/Kolkata").slice(0, 64), subject: `https://${url.host}`, last: old.last || {} }));
          return json({ ok: true });
        }
        if (url.pathname === "/unsubscribe") { await env.SUBS.delete(id); return json({ ok: true }); }
        if (url.pathname === "/test") {
          const rec = await env.SUBS.get(id, "json");
          if (!rec) return json({ error: "not subscribed" }, 404);
          const s = await sendPush(env, rec);
          return json({ ok: s < 300, status: s }, s < 300 ? 200 : 502);
        }
      }
      return new Response("Uda le reminder server is running.", { headers: CORS });
    } catch (e) { return json({ error: String(e && e.message || e) }, 500); }
  },
  async scheduled(evt, env, ctx) { ctx.waitUntil(tick(env)); },
};
