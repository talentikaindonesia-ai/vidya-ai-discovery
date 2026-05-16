/**
 * send-welcome-email
 * Called by a Supabase Database Webhook on INSERT to auth.users
 * (or manually via POST from client after sign-up).
 *
 * Env vars required:
 *   RESEND_API_KEY  — your Resend API key
 *   SUPABASE_URL    — injected automatically by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — injected automatically
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Talentika <halo@talentika.id>";
const APP_URL = "https://talentika.id";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: string;
    email: string;
    raw_user_meta_data?: { full_name?: string };
    created_at: string;
  };
  schema: string;
}

// ── HTML template ──────────────────────────────────────────────────────────────
function buildWelcomeHtml(name: string, email: string) {
  const firstName = name.split(" ")[0] || "Talentika";
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
    <p>
      Halo ${firstName}, akun Talentika Anda sudah aktif! Kami sangat senang
      memiliki Anda bergabung bersama ribuan pengguna yang sedang menemukan
      potensi terbaik mereka.
    </p>

    <div class="features">
      <div class="feat">
        <div class="feat-icon">🧠</div>
        <div class="feat-title">Assessment RIASEC</div>
        <div class="feat-desc">Temukan tipe kepribadian & karier terbaik Anda</div>
      </div>
      <div class="feat">
        <div class="feat-icon">📚</div>
        <div class="feat-title">Learning Hub</div>
        <div class="feat-desc">Kursus & modul belajar yang dikurasi khusus</div>
      </div>
      <div class="feat">
        <div class="feat-icon">🤝</div>
        <div class="feat-title">Komunitas</div>
        <div class="feat-desc">Terhubung dengan talenta muda Indonesia</div>
      </div>
    </div>

    <p style="font-weight:600;color:#0F172A;margin-bottom:12px">Mulai dalam 3 langkah mudah:</p>
    <ul class="steps">
      <li>
        <div class="step-num">1</div>
        <div class="step-text">
          <strong>Selesaikan Tes Assessment</strong>
          <span>Ikuti tes minat & bakat RIASEC — hanya 10 menit</span>
        </div>
      </li>
      <li>
        <div class="step-num">2</div>
        <div class="step-text">
          <strong>Lihat Rekomendasi Karier</strong>
          <span>Dapatkan jalur karier yang sesuai kepribadian Anda</span>
        </div>
      </li>
      <li>
        <div class="step-num">3</div>
        <div class="step-text">
          <strong>Mulai Belajar</strong>
          <span>Akses kursus yang dipersonalisasi dari Learning Hub</span>
        </div>
      </li>
    </ul>

    <a class="cta" href="${APP_URL}/dashboard">Buka Dashboard Saya →</a>

    <p style="font-size:13px;color:#94A3B8;margin:0">
      Email ini dikirim ke <strong>${email}</strong>. Jika Anda tidak mendaftar di Talentika,
      abaikan email ini.
    </p>
  </div>

  <div class="footer">
    <p>© 2025 <a href="${APP_URL}">Talentika Indonesia</a> · <a href="${APP_URL}/privacy">Kebijakan Privasi</a></p>
    <p>Jl. Inovasi Digital, Indonesia · <a href="${APP_URL}/unsubscribe">Berhenti berlangganan</a></p>
  </div>
</div>
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Allow CORS for manual test calls
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1 — Parse payload (webhook or manual POST)
    let email = "";
    let name = "";
    let userId = "";

    const body = await req.json().catch(() => null);

    if (body?.type === "INSERT" && body?.table === "users") {
      // Database webhook from auth.users
      const record = (body as WebhookPayload).record;
      email = record.email;
      name = record.raw_user_meta_data?.full_name ?? "";
      userId = record.id;
    } else if (body?.email) {
      // Manual POST: { email, name, user_id }
      email = body.email;
      name = body.name ?? "";
      userId = body.user_id ?? "";
    } else {
      return new Response(JSON.stringify({ error: "Missing email in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2 — Look up full name from profiles if not in payload
    if (!name && userId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();
      name = data?.full_name ?? "";
    }

    // 3 — Send via Resend
    const html = buildWelcomeHtml(name || email.split("@")[0], email);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: "Selamat datang di Talentika! 🎯 Mulai temukan potensi Anda",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: "Failed to send email", detail: err }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
