/**
 * send-winback-email
 *
 * Finds users who have NOT logged in for 7-30 days and sends them
 * a "Kamu ditunggu!" re-engagement email.
 *
 * Trigger: call via cron (e.g. daily at 09:00 WIB).
 * Env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FROM_EMAIL     = "Talentika <halo@talentika.id>";
const APP_URL        = "https://talentika.id";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── HTML template ──────────────────────────────────────────────────────────────
function buildHtml(name: string, daysSince: number) {
  const firstName = name?.split(" ")[0] || "Kamu";
  const urgency = daysSince >= 20
    ? "Jangan sampai hilang kesempatanmu!"
    : daysSince >= 14
    ? "Sudah dua minggu berlalu — yuk balik lagi!"
    : "Sudah seminggu nih, kamu kemana aja?";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Kamu Ditunggu di Talentika!</title>
<style>
  body{margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  .hero{background:linear-gradient(135deg,#F97316 0%,#EA580C 100%);padding:40px 32px;text-align:center;color:#fff;}
  .hero .emoji{font-size:52px;display:block;margin-bottom:10px;}
  .hero h1{margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-.02em;}
  .hero p{margin:0;font-size:15px;color:rgba(255,255,255,.9);}
  .body{padding:32px;}
  .body h2{font-size:20px;font-weight:700;color:#0F172A;margin:0 0 10px;}
  .body p{font-size:15px;line-height:1.7;color:#475569;margin:0 0 20px;}
  .cta{display:block;width:fit-content;margin:24px auto;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff!important;text-decoration:none;padding:16px 48px;border-radius:14px;font-weight:700;font-size:16px;text-align:center;box-shadow:0 6px 20px rgba(37,99,235,.35);}
  .features{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px;}
  .feat{flex:1;min-width:140px;background:#F8FAFC;border-radius:12px;padding:16px;text-align:center;}
  .feat .icon{font-size:28px;margin-bottom:6px;}
  .feat .label{font-size:13px;font-weight:600;color:#0F172A;}
  .feat .sub{font-size:12px;color:#64748B;}
  .footer{background:#F8FAFC;padding:20px 32px;text-align:center;font-size:12px;color:#94A3B8;}
  .footer a{color:#94A3B8;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <span class="emoji">👋</span>
    <h1>Hei ${firstName}, kamu ditunggu!</h1>
    <p>${urgency}</p>
  </div>
  <div class="body">
    <h2>Sudah ${daysSince} hari sejak terakhir kamu login</h2>
    <p>
      Perjalananmu menemukan potensi terbaik belum selesai, ${firstName}.
      Masih banyak hal seru yang menunggumu di Talentika — mulai dari kursus baru,
      peluang beasiswa, sampai tantangan harian yang bisa kasih kamu XP ekstra!
    </p>

    <div class="features">
      <div class="feat">
        <div class="icon">📚</div>
        <div class="label">Kursus Baru</div>
        <div class="sub">Konten terbaru sudah menunggu</div>
      </div>
      <div class="feat">
        <div class="icon">🏆</div>
        <div class="label">Tantangan Harian</div>
        <div class="sub">Kumpulkan XP & badge baru</div>
      </div>
      <div class="feat">
        <div class="icon">💼</div>
        <div class="label">Peluang Baru</div>
        <div class="sub">Beasiswa & magang terbaru</div>
      </div>
    </div>

    <a href="${APP_URL}/dashboard" class="cta">Kembali ke Talentika →</a>

    <p style="font-size:13px;color:#94A3B8;text-align:center;margin-top:16px;">
      Atau mulai dari <a href="${APP_URL}/assessment" style="color:#2563EB;">Assessment</a> untuk temukan potensimu
    </p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Talentika · <a href="${APP_URL}">talentika.id</a></p>
    <p>Email ini dikirim karena kamu terdaftar di Talentika.</p>
  </div>
</div>
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const now = new Date();
    const sevenDaysAgo   = new Date(now.getTime() - 7  * 86_400_000).toISOString();
    const thirtyDaysAgo  = new Date(now.getTime() - 30 * 86_400_000).toISOString();

    // Find users: last_sign_in between 7 and 30 days ago
    // We use auth.users via admin API via profiles table (last_login_at if tracked)
    // Fall back: created_at within range + check if they have any learning activity
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, created_at, subscription_status")
      .lt("updated_at", sevenDaysAgo)
      .gt("updated_at", thirtyDaysAgo)
      .limit(100);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No eligible users" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      if (!profile.email) continue;

      const updatedAt  = new Date(profile.updated_at ?? profile.created_at);
      const daysSince  = Math.floor((now.getTime() - updatedAt.getTime()) / 86_400_000);

      const html = buildHtml(profile.full_name ?? "", daysSince);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    FROM_EMAIL,
          to:      [profile.email],
          subject: `${profile.full_name?.split(" ")[0] || "Hei"}, kamu ditunggu di Talentika! 👋`,
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const body = await res.text();
        errors.push(`${profile.email}: ${body}`);
      }

      // Rate-limit: 10 emails/second max for Resend free tier
      await new Promise(r => setTimeout(r, 120));
    }

    return new Response(JSON.stringify({ sent, errors }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
