import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * kirim-push — meneruskan baris `notifications` ke HP (NOT-02, NOT-03).
 *
 * Dipanggil oleh trigger trg_teruskan_push (pg_net) untuk setiap notifikasi
 * baru, dan oleh cron push-deferred-quiet-hours pukul 06.05 WIB.
 * Idempoten: hanya memproses notifikasi dengan push_status NULL (atau
 * 'deferred' pada mode deferred) lalu menandainya, jadi panggilan ulang
 * tidak mengirim dua kali. Tidak butuh JWT — tidak ada data yang dikembalikan.
 *
 *  • Android → FCM HTTP v1   (secret FIREBASE_SERVICE_ACCOUNT = JSON service account)
 *  • iOS     → APNs token-auth (secret APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID,
 *                               APNS_BUNDLE_ID=id.talentika.app, APNS_PRODUCTION=true|false)
 *  • Preferensi kategori dari profiles.app_prefs.notif (Settings di aplikasi)
 *  • Jam tenang 21.00–06.00 WIB untuk pengguna < 18 th → ditunda (deferred)
 *  • Token yang sudah tidak valid dihapus otomatis
 */

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

function kategori(type?: string | null) {
  const t = (type || "").toLowerCase();
  if (t === "promo") return null;
  if (/opportun|deadline|peluang/.test(t)) return "opportunities";
  if (/mentor/.test(t)) return "mentorship";
  if (/achiev|challenge|badge|certificate|xp/.test(t)) return "achievement";
  if (/ai|insight|recommend/.test(t)) return "ai";
  if (/community|forum|reply|like/.test(t)) return "community";
  return "learning";
}

/** Rute di aplikasi untuk notifikasi (sama dengan deepLink() di src/mobile/logic.ts). */
function urlAplikasi(n: any): string {
  const m = n.metadata || {};
  if (m.opportunity_id) return `/app/opportunities/${m.opportunity_id}`;
  if (m.booking_id) return "/app/mentors";
  const u: string = n.action_url || "";
  if (u.startsWith("/app")) return u;
  const peta: [RegExp, string][] = [[/^\/opportunities/, "/app/opportunities"], [/^\/learning\/content\/([\w-]+)/, "/app/course/$1"], [/^\/learning/, "/app/learn"],
    [/^\/mentors/, "/app/mentors"], [/^\/community/, "/app/community"], [/^\/profile/, "/app/profile"], [/^\/subscription/, "/app/pro"], [/^\/assessment/, "/app/dna"]];
  for (const [re, to] of peta) if (re.test(u)) return u.replace(re, to).replace(/\?.*$/, "");
  return "/app/notifications";
}

function jamTenang(usia: number | null) {
  if (usia !== null && usia >= 18) return false;
  const jamWib = (new Date().getUTCHours() + 7) % 24;
  return jamWib >= 21 || jamWib < 6;
}

/* ── base64url & kunci ─────────────────────────────────────────────── */
const b64url = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
function pemKeBytes(pem: string) {
  const b = atob(pem.replace(/-----[^-]+-----/g, "").replace(/\\n/g, "").replace(/\s+/g, ""));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}

/* ── FCM HTTP v1 ───────────────────────────────────────────────────── */
let fcmCache: { token: string; exp: number; project: string } | null = null;
async function fcmAkses() {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!raw) return null;
  if (fcmCache && fcmCache.exp > Date.now() + 60_000) return fcmCache;
  const sa = JSON.parse(raw);
  const key = await crypto.subtle.importKey("pkcs8", pemKeBytes(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  const d = await r.json();
  if (!d.access_token) { console.error("FCM token gagal", d); return null; }
  fcmCache = { token: d.access_token, exp: Date.now() + (d.expires_in ?? 3600) * 1000, project: sa.project_id };
  return fcmCache;
}
async function kirimFcm(token: string, n: any, cat: string, url: string) {
  const a = await fcmAkses();
  if (!a) return { ok: false, err: "FIREBASE_SERVICE_ACCOUNT belum dipasang" };
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${a.project}/messages:send`, {
    method: "POST", headers: { Authorization: `Bearer ${a.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, notification: { title: n.title, body: n.message },
      data: { url, notification_id: n.id, category: cat },
      android: { priority: n.priority === "high" ? "HIGH" : "NORMAL", notification: { channel_id: cat, color: "#1D4ED8" } } } }),
  });
  if (r.ok) return { ok: true };
  const t = await r.text();
  return { ok: false, err: t.slice(0, 300), hapus: r.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(t) };
}

/* ── APNs ──────────────────────────────────────────────────────────── */
let apnsCache: { jwt: string; iat: number } | null = null;
async function apnsJwt() {
  const p8 = Deno.env.get("APNS_KEY_P8"), kid = Deno.env.get("APNS_KEY_ID"), team = Deno.env.get("APNS_TEAM_ID");
  if (!p8 || !kid || !team) return null;
  const now = Math.floor(Date.now() / 1000);
  if (apnsCache && now - apnsCache.iat < 3000) return apnsCache.jwt;
  const key = await crypto.subtle.importKey("pkcs8", pemKeBytes(p8), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const unsigned = `${enc({ alg: "ES256", kid })}.${enc({ iss: team, iat: now })}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned));
  apnsCache = { jwt: `${unsigned}.${b64url(sig)}`, iat: now };
  return apnsCache.jwt;
}
async function kirimApns(token: string, n: any, cat: string, url: string) {
  const jwt = await apnsJwt();
  if (!jwt) return { ok: false, err: "APNS_* belum dipasang" };
  const host = Deno.env.get("APNS_PRODUCTION") === "true" ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const r = await fetch(`https://${host}/3/device/${token}`, {
    method: "POST",
    headers: { authorization: `bearer ${jwt}`, "apns-topic": Deno.env.get("APNS_BUNDLE_ID") ?? "id.talentika.app", "apns-push-type": "alert", "apns-priority": n.priority === "high" ? "10" : "5" },
    body: JSON.stringify({ aps: { alert: { title: n.title, body: n.message }, sound: "default", "thread-id": cat }, url, notification_id: n.id }),
  });
  if (r.ok) return { ok: true };
  const t = await r.text();
  return { ok: false, err: t.slice(0, 300), hapus: r.status === 410 || /BadDeviceToken|Unregistered/.test(t) };
}

async function proses(n: any, deferredMode: boolean) {
  const cat = kategori(n.type);
  const tandai = (push_status: string, sent = false) =>
    admin.from("notifications").update({ push_status, ...(sent ? { push_sent_at: new Date().toISOString() } : {}) }).eq("id", n.id);
  if (!cat) return tandai("skipped");
  const [{ data: prof }, { data: tokens }] = await Promise.all([
    admin.from("profiles").select("usia, app_prefs").eq("user_id", n.user_id).maybeSingle(),
    admin.from("device_push_tokens").select("token, platform").eq("user_id", n.user_id),
  ]);
  if (!tokens?.length) return tandai("no_device");
  if (prof?.app_prefs?.notif?.[cat] === false) return tandai("muted");
  if (!deferredMode && jamTenang(prof?.usia ?? null)) return tandai("deferred");
  const url = urlAplikasi(n);
  let terkirim = 0;
  for (const t of tokens) {
    const res: any = t.platform === "ios" ? await kirimApns(t.token, n, cat, url) : await kirimFcm(t.token, n, cat, url);
    if (res.ok) terkirim++;
    else if (res.hapus) await admin.from("device_push_tokens").delete().eq("token", t.token);
    else await admin.from("device_push_tokens").update({ last_error: res.err }).eq("token", t.token);
  }
  return tandai(terkirim ? "sent" : "failed", terkirim > 0);
}

// ── Hanya server: pg_cron (header x-cron-secret, diverifikasi ke Vault) atau service key.
//    Audit keamanan 2026-10-10: dulu fungsi ini bisa dipicu siapa pun tanpa login.
async function izinServer(req: Request): Promise<boolean> {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (key && bearer === key) return true;
  const s = req.headers.get("x-cron-secret");
  if (!s) return false;
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/cek_cron_secret`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p: s }),
  });
  return r.ok && (await r.json()) === true;
}

Deno.serve(async (req) => {
  if (req.method !== "OPTIONS" && !(await izinServer(req))) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  let body: any = {};
  try { body = await req.json(); } catch { /* kosong */ }

  if (body.deferred) {
    const since = new Date(Date.now() - 12 * 3600_000).toISOString();
    const { data } = await admin.from("notifications").select("*").eq("push_status", "deferred").gte("created_at", since).limit(2000);
    for (const n of data ?? []) await proses(n, true);
    return json({ ok: true, sent: data?.length ?? 0 });
  }

  if (!body.notification_id) return json({ error: "notification_id wajib" }, 400);
  const { data: n } = await admin.from("notifications").select("*").eq("id", body.notification_id).maybeSingle();
  // Hanya notifikasi baru & belum diproses — mencegah pengiriman ulang
  if (!n || n.push_status || Date.now() - new Date(n.created_at).getTime() > 3600_000) return json({ ok: true, skipped: true });
  // Klaim baris secara atomik — panggilan paralel kedua tidak mendapat baris
  const { data: klaim } = await admin.from("notifications").update({ push_status: "processing" }).eq("id", n.id).is("push_status", null).select("id");
  if (!klaim?.length) return json({ ok: true, skipped: true });
  await proses(n, false);
  return json({ ok: true });
});
