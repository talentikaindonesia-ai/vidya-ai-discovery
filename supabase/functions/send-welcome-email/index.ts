/**
 * send-welcome-email
 * Dipanggil klien setelah daftar (JWT pengguna) atau oleh server (service key / x-cron-secret).
 *
 * Keamanan (audit 2026-10-10): dulu menerima alamat email apa pun tanpa login →
 * bisa dipakai sebagai relay email atas nama Talentika. Kini:
 *  • pengguna hanya bisa mengirim ke email akunnya sendiri, sekali saja;
 *  • panggilan server wajib service key atau rahasia cron;
 *  • nama/email di-escape sebelum masuk HTML.
 *
 * Env: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Talentika <halo@talentika.id>";
const APP_URL = "https://talentika.id";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", SERVICE_KEY);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function izinServer(req: Request) {
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (SERVICE_KEY && bearer === SERVICE_KEY) return true;
  const s = req.headers.get("x-cron-secret");
  if (!s) return false;
  const { data } = await admin.rpc("cek_cron_secret", { p: s });
  return data === true;
}

function buildWelcomeHtml(rawName: string, rawEmail: string) {
  const firstName = esc(rawName.split(" ")[0] || "Talentika");
  const email = esc(rawEmail);
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Selamat Datang di Talentika!</title>
<style>
  body { margin: 0; padding: 0; background: #F8FAFC; font-family: 'Segoe UI', Arial, sans-serif; }
  .wrap { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
  .hero { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1E3A8A 100%); padding: 40px 32px; text-align: center; color: #fff; }
  .hero h1 { margin: 12px 0 4px; font-size: 26px; font-weight: 800; letter-spacing: -.02em; }
  .hero p  { margin: 0; font-size: 15px; color: rgba(255,255,255,.85); }
  .body { padding: 32px; }
  .body h2 { font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 8px; }
  .body p  { font-size: 15px; line-height: 1.7; color: #475569; margin: 0 0 20px; }
  .steps { list-style: none; padding: 0; margin: 0 0 28px; }
  .steps li { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .step-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: #EEF2FF; color: #4F46E5; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; }
  .step-text strong { display: block; color: #0F172A; font-size: 14px; }
  .step-text span { color: #64748B; font-size: 13px; }
  .cta { display: block; text-align: center; background: #2563EB; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 0 0 28px; }
  .features { display: flex; gap: 12px; margin-bottom: 28px; }
  .feat { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 12px; text-align: center; }
  .feat-icon { font-size: 24px; margin-bottom: 6px; }
  .feat-title { font-size: 12px; font-weight: 700; color: #0F172A; }
  .feat-desc { font-size: 11px; color: #64748B; margin-top: 2px; }
  .footer { background: #F8FAFC; padding: 20px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
  .footer a { color: #2563EB; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div style="font-size:48px">🎯</div>
    <h1>Selamat Datang, ${firstName}!</h1>
    <p>Talentika — Discover your full potential</p>
  </div>
  <div class="body">
    <h2>Perjalanan Anda Dimulai Sekarang 🚀</h2>
    <p>Halo ${firstName}, akun Talentika Anda sudah aktif! Kami sangat senang memiliki Anda bergabung bersama ribuan pengguna yang sedang menemukan potensi terbaik mereka.</p>
    <div class="features">
      <div class="feat"><div class="feat-icon">🧠</div><div class="feat-title">Assessment RIASEC</div><div class="feat-desc">Temukan tipe kepribadian & karier terbaik Anda</div></div>
      <div class="feat"><div class="feat-icon">📚</div><div class="feat-title">Learning Hub</div><div class="feat-desc">Kursus & modul belajar yang dikurasi khusus</div></div>
      <div class="feat"><div class="feat-icon">🤝</div><div class="feat-title">Komunitas</div><div class="feat-desc">Terhubung dengan talenta muda Indonesia</div></div>
    </div>
    <p style="font-weight:600;color:#0F172A;margin-bottom:12px">Mulai dalam 3 langkah mudah:</p>
    <ul class="steps">
      <li><div class="step-num">1</div><div class="step-text"><strong>Selesaikan Tes Assessment</strong><span>Ikuti tes minat & bakat RIASEC — hanya 10 menit</span></div></li>
      <li><div class="step-num">2</div><div class="step-text"><strong>Lihat Rekomendasi Karier</strong><span>Dapatkan jalur karier yang sesuai kepribadian Anda</span></div></li>
      <li><div class="step-num">3</div><div class="step-text"><strong>Mulai Belajar</strong><span>Akses kursus yang dipersonalisasi dari Learning Hub</span></div></li>
    </ul>
    <a class="cta" href="${APP_URL}/dashboard">Buka Dashboard Saya →</a>
    <p style="font-size:13px;color:#94A3B8;margin:0">Email ini dikirim ke <strong>${email}</strong>. Jika Anda tidak mendaftar di Talentika, abaikan email ini.</p>
  </div>
  <div class="footer">
    <p>© 2025 <a href="${APP_URL}">Talentika Indonesia</a> · <a href="${APP_URL}/privacy">Kebijakan Privasi</a></p>
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json().catch(() => null);
    let userId = "";

    if (await izinServer(req)) {
      // server / webhook: boleh menyebut user, tetapi alamat tetap diambil dari auth
      userId = body?.record?.id ?? body?.user_id ?? "";
    } else {
      // pengguna: hanya untuk dirinya sendiri
      const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
      const { data: au } = await admin.auth.getUser(jwt);
      if (!au?.user) return json({ error: "unauthorized" }, 401);
      userId = au.user.id;
    }
    if (!userId) return json({ error: "user tidak diketahui" }, 400);

    const { data: target } = await admin.auth.admin.getUserById(userId);
    const u = target?.user;
    if (!u?.email) return json({ error: "user tidak ditemukan" }, 404);
    if (u.user_metadata?.welcome_email_sent) return json({ success: true, skipped: "sudah dikirim" });

    const { data: prof } = await admin.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
    const name = prof?.full_name || u.user_metadata?.full_name || u.email.split("@")[0];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [u.email],
        subject: "Selamat datang di Talentika! 🎯 Mulai temukan potensi Anda",
        html: buildWelcomeHtml(name, u.email),
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return json({ error: "Gagal mengirim email" }, 500);
    }
    await admin.auth.admin.updateUserById(userId, { user_metadata: { ...u.user_metadata, welcome_email_sent: true } });
    const data = await res.json();
    return json({ success: true, id: data.id });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return json({ error: "Terjadi kesalahan" }, 500);
  }
});
