/**
 * send-streak-reminder
 * Scheduled daily (cron) — finds users who haven't accessed learning in 2+ days
 * and sends a gentle "come back and learn" nudge via Resend.
 *
 * Env vars required:
 *   RESEND_API_KEY
 *   SUPABASE_URL          (auto-injected)
 *   SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 *
 * Schedule: every day at 08:00 WIB (01:00 UTC)
 * Add to supabase/config.toml:
 *   [functions.send-streak-reminder]
 *   schedule = "0 1 * * *"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Talentika <halo@talentika.id>";
const APP_URL = "https://talentika.id";

function buildStreakHtml(firstName: string, daysSince: number, lastCourse: string) {
  const emoji = daysSince >= 7 ? "🔥" : "📚";
  const urgency = daysSince >= 7
    ? "Streak Anda hampir putus!"
    : `${daysSince} hari tanpa belajar`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Kamu Dirindu, ${firstName}!</title>
<style>
  body { margin:0; padding:0; background:#F8FAFC; font-family:'Segoe UI',Arial,sans-serif; }
  .wrap { max-width:560px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
  .hero { background:linear-gradient(135deg,#F59E0B,#D97706); padding:40px 32px; text-align:center; color:#fff; }
  .hero h1 { margin:10px 0 4px; font-size:24px; font-weight:800; }
  .hero p  { margin:0; font-size:14px; opacity:.9; }
  .body { padding:32px; }
  .body h2 { font-size:20px; font-weight:700; color:#0F172A; margin:0 0 10px; }
  .body p  { font-size:15px; line-height:1.7; color:#475569; margin:0 0 20px; }
  .course-pill { background:#EEF2FF; border:1px solid #C7D2FE; border-radius:8px; padding:12px 16px; margin-bottom:24px; display:flex; align-items:center; gap:12px; }
  .course-pill span { font-size:20px; }
  .course-info strong { display:block; color:#0F172A; font-size:14px; }
  .course-info small  { color:#64748B; font-size:12px; }
  .cta { display:block; text-align:center; background:#2563EB; color:#fff!important; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:700; font-size:15px; margin:0 0 24px; }
  .quote { background:#FFFBEB; border-left:4px solid #F59E0B; padding:14px 16px; border-radius:0 8px 8px 0; margin-bottom:24px; font-size:14px; color:#78350F; font-style:italic; }
  .footer { background:#F8FAFC; padding:20px 32px; text-align:center; font-size:12px; color:#94A3B8; border-top:1px solid #E2E8F0; }
  .footer a { color:#2563EB; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div style="font-size:52px">${emoji}</div>
    <h1>Hai ${firstName}, kamu kangen nih!</h1>
    <p>${urgency}</p>
  </div>
  <div class="body">
    <h2>Jangan putus di sini! 💪</h2>
    <p>
      Sudah <strong>${daysSince} hari</strong> kamu tidak belajar di Talentika.
      Konsistensi adalah kunci sukses — hanya 15 menit sehari bisa membuat
      perbedaan besar dalam perjalanan belajarmu.
    </p>

    ${lastCourse ? `
    <div class="course-pill">
      <span>📖</span>
      <div class="course-info">
        <strong>Lanjutkan: ${lastCourse}</strong>
        <small>Kamu baru separuh jalan — hampir selesai!</small>
      </div>
    </div>
    ` : ""}

    <div class="quote">
      "Belajar bukan tentang seberapa cepat kamu menyerap — tapi seberapa konsisten kamu berlatih."
    </div>

    <a class="cta" href="${APP_URL}/learning">Lanjutkan Belajar Sekarang →</a>

    <p style="font-size:13px;color:#94A3B8;margin:0">
      Kamu menerima email ini karena terdaftar di Talentika.
      <a href="${APP_URL}/unsubscribe" style="color:#2563EB">Berhenti berlangganan</a>
    </p>
  </div>
  <div class="footer">
    <p>© 2025 <a href="${APP_URL}">Talentika Indonesia</a></p>
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Find users who haven't accessed learning in 2-14 days
    // Join with profiles to get email + full_name
    const twoDaysAgo   = new Date(Date.now() - 2  * 864e5).toISOString();
    const fourteenAgo  = new Date(Date.now() - 14 * 864e5).toISOString();

    // Get the most-recent learning_progress record per user in the window
    const { data: inactive, error } = await supabase
      .from("learning_progress")
      .select(`
        user_id,
        last_accessed_at,
        learning_content ( title )
      `)
      .lt("last_accessed_at", twoDaysAgo)
      .gt("last_accessed_at", fourteenAgo)
      .order("last_accessed_at", { ascending: false });

    if (error) throw error;

    // De-duplicate: keep most-recent row per user
    const byUser = new Map<string, { last: string; course: string }>();
    for (const row of inactive ?? []) {
      if (!byUser.has(row.user_id)) {
        byUser.set(row.user_id, {
          last: row.last_accessed_at,
          course: (row as any).learning_content?.title ?? "",
        });
      }
    }

    if (byUser.size === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No inactive users" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch profiles for those user IDs
    const userIds = [...byUser.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    // Fetch emails from auth admin API
    const sent: string[] = [];
    const failed: string[] = [];

    for (const profile of profiles ?? []) {
      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const info = byUser.get(profile.user_id)!;
      const daysSince = Math.floor((Date.now() - new Date(info.last).getTime()) / 864e5);
      const firstName = profile.full_name?.split(" ")[0] || email.split("@")[0];
      const html = buildStreakHtml(firstName, daysSince, info.course);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: `${daysSince >= 7 ? "🔥" : "📚"} ${firstName}, jangan putus streak belajarmu!`,
          html,
        }),
      });

      if (res.ok) {
        sent.push(email);
      } else {
        const err = await res.text();
        console.error(`Failed for ${email}:`, err);
        failed.push(email);
      }

      // Rate-limit: 2 emails/sec max
      await new Promise(r => setTimeout(r, 500));
    }

    return new Response(JSON.stringify({ sent: sent.length, failed: failed.length, users: sent }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-streak-reminder error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
