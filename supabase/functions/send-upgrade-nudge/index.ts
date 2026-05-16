/**
 * send-upgrade-nudge
 *
 * Targets free users who have been active for 14+ days (profile updated_at
 * recent, but subscription_status = 'free' or null / inactive) and sends
 * a personalized upgrade offer email.
 *
 * Trigger: call via cron (e.g. every Monday 10:00 WIB).
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
function buildHtml(name: string, primaryType?: string) {
  const firstName = name?.split(" ")[0] || "Kamu";
  const typeLabel = primaryType
    ? `sebagai tipe <strong style="color:#2563EB">${primaryType}</strong>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Unlock Potensi Penuhmu di Talentika</title>
<style>
  body{margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  .hero{background:linear-gradient(135deg,#1D4ED8 0%,#2563EB 50%,#7C3AED 100%);padding:44px 32px;text-align:center;color:#fff;}
  .hero .crown{font-size:52px;display:block;margin-bottom:10px;}
  .hero h1{margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-.02em;}
  .hero p{margin:0;font-size:15px;color:rgba(255,255,255,.9);}
  .body{padding:32px;}
  .body h2{font-size:20px;font-weight:700;color:#0F172A;margin:0 0 10px;}
  .body p{font-size:15px;line-height:1.7;color:#475569;margin:0 0 20px;}
  .perks{list-style:none;padding:0;margin:0 0 28px;}
  .perks li{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #F1F5F9;}
  .perks li:last-child{border-bottom:none;}
  .perks .ico{font-size:22px;flex-shrink:0;}
  .perks .text strong{display:block;font-size:14px;color:#0F172A;font-weight:700;}
  .perks .text span{font-size:13px;color:#64748B;}
  .price-box{background:linear-gradient(135deg,#EFF6FF,#F0F9FF);border:1px solid #BFDBFE;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;}
  .price-box .old{font-size:14px;color:#94A3B8;text-decoration:line-through;margin-bottom:4px;}
  .price-box .new{font-size:32px;font-weight:800;color:#1D4ED8;letter-spacing:-.03em;}
  .price-box .per{font-size:13px;color:#64748B;margin-top:4px;}
  .price-box .badge{display:inline-block;background:#DCFCE7;color:#15803D;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;margin-top:8px;}
  .cta{display:block;width:fit-content;margin:0 auto 16px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff!important;text-decoration:none;padding:16px 52px;border-radius:14px;font-weight:700;font-size:16px;text-align:center;box-shadow:0 6px 20px rgba(37,99,235,.35);}
  .guarantee{font-size:12.5px;color:#64748B;text-align:center;}
  .footer{background:#F8FAFC;padding:20px 32px;text-align:center;font-size:12px;color:#94A3B8;}
  .footer a{color:#94A3B8;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <span class="crown">👑</span>
    <h1>${firstName}, unlock potensi penuhmu!</h1>
    <p>Kamu sudah 2 minggu bersama Talentika — saatnya naik level ${typeLabel ? typeLabel + "." : "."}</p>
  </div>
  <div class="body">
    <h2>Yang kamu dapatkan dengan Premium</h2>
    <p>Ratusan pengguna ${typeLabel || "sepertimu"} sudah merasakan manfaatnya. Ini yang akan kamu unlock:</p>

    <ul class="perks">
      <li>
        <span class="ico">🧠</span>
        <div class="text">
          <strong>Full Assessment + Analisis Mendalam</strong>
          <span>Laporan lengkap tipe kepribadian, bakat, dan rekomendasi karir personal</span>
        </div>
      </li>
      <li>
        <span class="ico">🎓</span>
        <div class="text">
          <strong>Mentorship 1-on-1</strong>
          <span>Sesi bimbingan langsung dengan mentor berpengalaman di bidangmu</span>
        </div>
      </li>
      <li>
        <span class="ico">💼</span>
        <div class="text">
          <strong>Portfolio Builder</strong>
          <span>Buat portofolio profesional yang bisa dibagikan ke rekruter</span>
        </div>
      </li>
      <li>
        <span class="ico">🌐</span>
        <div class="text">
          <strong>Networking Hub</strong>
          <span>Terhubung dengan ribuan profesional dan alumni di industri impianmu</span>
        </div>
      </li>
      <li>
        <span class="ico">🏅</span>
        <div class="text">
          <strong>Sertifikat & Badge Eksklusif</strong>
          <span>Bukti kompetensi yang diakui oleh perusahaan mitra Talentika</span>
        </div>
      </li>
    </ul>

    <div class="price-box">
      <div class="old">Rp 199.000/bulan</div>
      <div class="new">Rp 149.000</div>
      <div class="per">per bulan (hemat 25%)</div>
      <div class="badge">🎁 Khusus untuk kamu — tawaran terbatas</div>
    </div>

    <a href="${APP_URL}/subscription" class="cta">Upgrade Sekarang →</a>

    <p class="guarantee">
      🛡 Garansi uang kembali 30 hari · Batalkan kapan saja · Tidak ada biaya tersembunyi
    </p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Talentika · <a href="${APP_URL}">talentika.id</a></p>
    <p>Kamu menerima email ini karena terdaftar di Talentika sebagai pengguna gratis.</p>
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
    const now            = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();
    const ninetyDaysAgo   = new Date(now.getTime() - 90 * 86_400_000).toISOString();

    // Free users active in the last 90 days but older than 14 days
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, created_at, subscription_status, subscription_type")
      .in("subscription_status", ["free", "inactive", null as any])
      .lt("created_at", fourteenDaysAgo)   // account older than 14 days
      .gt("updated_at", ninetyDaysAgo)     // still somewhat active
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
      // Skip if already paid
      if (profile.subscription_status === "active" && profile.subscription_type !== "free") continue;

      // Fetch latest assessment type for personalization
      const { data: assessment } = await supabase
        .from("assessment_results")
        .select("primary_type")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const html = buildHtml(profile.full_name ?? "", assessment?.primary_type ?? undefined);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    FROM_EMAIL,
          to:      [profile.email],
          subject: `👑 ${profile.full_name?.split(" ")[0] || "Hei"}, unlock semua fitur premium Talentika`,
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const body = await res.text();
        errors.push(`${profile.email}: ${body}`);
      }

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
