/**
 * send-opportunity-digest
 *
 * Weekly personalized opportunity digest — sent every Sunday 09:00 WIB.
 * Matches scraped_content to each user's RIASEC type from assessment_results.
 * Sends top 5 new opportunities from the past 7 days per user.
 *
 * Env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FROM_EMAIL     = "Talentika <halo@talentika.id>";
const APP_URL        = "https://talentika.id";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// RIASEC → opportunity category mapping
const RIASEC_CATEGORIES: Record<string, string[]> = {
  realistic:     ["magang", "program", "lowongan_kerja"],
  investigative: ["kompetisi", "konferensi", "program"],
  artistic:      ["kompetisi", "program", "konferensi"],
  social:        ["beasiswa", "volunteer", "program"],
  enterprising:  ["lowongan_kerja", "kompetisi", "program"],
  conventional:  ["beasiswa", "lowongan_kerja", "magang"],
};

const CAT_LABEL: Record<string, string> = {
  beasiswa: "🎓 Beasiswa", magang: "💼 Magang",
  lowongan_kerja: "🏢 Lowongan", kompetisi: "🏆 Kompetisi",
  konferensi: "📅 Konferensi", volunteer: "🤝 Volunteer", program: "📋 Program",
};

function buildHtml(name: string, riasecType: string, opportunities: any[]) {
  const firstName = (name ?? "").split(" ")[0] || "Kamu";
  const typeLabel = riasecType.charAt(0).toUpperCase() + riasecType.slice(1);

  const oppRows = opportunities.map(o => `
    <div style="border:1px solid #E2E8F0;border-radius:12px;padding:16px 18px;margin-bottom:10px;">
      <div style="font-size:11px;font-weight:700;color:#2563EB;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">
        ${CAT_LABEL[o.category] ?? o.category}
      </div>
      <div style="font-size:15px;font-weight:700;color:#0F172A;margin-bottom:6px;line-height:1.4;">${o.title}</div>
      ${o.organizer ? `<div style="font-size:12px;color:#64748B;margin-bottom:6px;">📌 ${o.organizer}</div>` : ""}
      ${o.location  ? `<div style="font-size:12px;color:#64748B;margin-bottom:8px;">📍 ${o.location}</div>`  : ""}
      ${o.deadline  ? `<div style="font-size:11px;color:#EF4444;font-weight:600;margin-bottom:8px;">⏰ Deadline: ${new Date(o.deadline).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</div>` : ""}
      ${o.url       ? `<a href="${o.url}" style="display:inline-block;padding:7px 16px;border-radius:8px;background:#2563EB;color:white;text-decoration:none;font-size:12px;font-weight:700;">Lihat Detail →</a>` : ""}
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body{margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;}
  .wrap{max-width:580px;margin:28px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);}
  .hero{background:linear-gradient(135deg,#1D4ED8 0%,#2563EB 60%,#7C3AED 100%);padding:36px 32px;color:#fff;text-align:center;}
  .hero h1{margin:0 0 8px;font-size:22px;font-weight:800;}
  .hero p{margin:0;font-size:14px;opacity:.9;}
  .body{padding:24px 28px;}
  .footer{background:#F8FAFC;padding:16px 28px;text-align:center;font-size:11.5px;color:#94A3B8;}
  .footer a{color:#94A3B8;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div style="font-size:40px;margin-bottom:10px;">🎯</div>
    <h1>Peluang Minggu Ini, ${firstName}!</h1>
    <p>Dipilih khusus untuk tipe <strong>${typeLabel}</strong> sepertimu</p>
  </div>
  <div class="body">
    <p style="font-size:14.5px;color:#475569;line-height:1.7;margin:0 0 20px;">
      Hai ${firstName}! Ini ${opportunities.length} peluang terbaru yang cocok dengan profil
      <strong style="color:#1D4ED8">${typeLabel}</strong> kamu minggu ini:
    </p>
    ${oppRows}
    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}/opportunities"
        style="display:inline-block;padding:13px 32px;border-radius:14px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:white;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(37,99,235,.35);">
        Lihat Semua Peluang →
      </a>
    </div>
    <p style="font-size:12px;color:#94A3B8;text-align:center;margin-top:16px;">
      Dikirim setiap Minggu · <a href="${APP_URL}/settings" style="color:#94A3B8;">Kelola preferensi email</a>
    </p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Talentika · <a href="${APP_URL}">talentika.id</a></div>
</div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

    // Get all users with assessment results
    const { data: assessments } = await supabase
      .from("assessment_results")
      .select("user_id, personality_type, created_at")
      .order("created_at", { ascending: false });

    if (!assessments?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No assessed users" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Deduplicate — latest assessment per user
    const userTypes = new Map<string, string>();
    for (const a of assessments) {
      if (!userTypes.has(a.user_id)) userTypes.set(a.user_id, a.personality_type);
    }

    // Get profiles for these users
    const userIds = [...userTypes.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", userIds)
      .not("email", "is", null);

    let sent = 0;
    const errors: string[] = [];

    for (const profile of profiles ?? []) {
      if (!profile.email) continue;
      const riasecType = userTypes.get(profile.user_id) ?? "social";
      const categories = RIASEC_CATEGORIES[riasecType] ?? ["beasiswa","kompetisi","program"];

      // Fetch top 5 new opportunities matching this user's categories
      const { data: opps } = await supabase
        .from("scraped_content")
        .select("id, title, organizer, location, category, deadline, url")
        .eq("is_active", true)
        .in("category", categories)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!opps?.length) continue; // No new opps this week for this type

      const html = buildHtml(profile.full_name ?? "", riasecType, opps);
      const typeLabel = riasecType.charAt(0).toUpperCase() + riasecType.slice(1);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [profile.email],
          subject: `🎯 ${opps.length} peluang ${typeLabel} baru minggu ini untukmu!`,
          html,
        }),
      });

      if (res.ok) sent++;
      else errors.push(`${profile.email}: ${await res.text()}`);

      await new Promise(r => setTimeout(r, 100));
    }

    return new Response(JSON.stringify({ sent, total_users: profiles?.length ?? 0, errors }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
