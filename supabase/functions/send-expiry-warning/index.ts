/**
 * send-expiry-warning
 *
 * Sends tiered pre-expiry emails to active subscribers:
 *   - 7 days before  → "Perpanjang sekarang, hemat 10%"
 *   - 3 days before  → Urgency nudge
 *   - 1 day before   → Last-chance + auto-voucher
 *
 * Trigger: cron daily at 08:00 WIB (01:00 UTC)
 * Env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FROM_EMAIL     = "Talentika <halo@talentika.id>";
const APP_URL        = "https://talentika.id";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function dayRange(daysFromNow: number) {
  const start = new Date(Date.now() + (daysFromNow - 0.5) * 86_400_000).toISOString();
  const end   = new Date(Date.now() + (daysFromNow + 0.5) * 86_400_000).toISOString();
  return { start, end };
}

function buildHtml(name: string, days: number, planName: string, voucherCode?: string) {
  const firstName = (name ?? "").split(" ")[0] || "Kamu";
  const urgent    = days === 1;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;}
  .wrap{max-width:580px;margin:28px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);}
  .hero{background:${urgent ? "linear-gradient(135deg,#DC2626,#EF4444)" : "linear-gradient(135deg,#1D4ED8,#2563EB)"};padding:36px 32px;text-align:center;color:#fff;}
  .hero .ico{font-size:48px;display:block;margin-bottom:12px;}
  .hero h1{margin:0 0 8px;font-size:24px;font-weight:800;}
  .hero p{margin:0;font-size:14px;opacity:.9;}
  .body{padding:28px 32px;}
  .countdown{background:${urgent ? "#FEF2F2" : "#EFF6FF"};border:1px solid ${urgent ? "#FECACA" : "#BFDBFE"};border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:20px;}
  .countdown .num{font-size:48px;font-weight:900;color:${urgent ? "#DC2626" : "#1D4ED8"};line-height:1;}
  .countdown .lbl{font-size:13px;color:#64748B;margin-top:4px;}
  .voucher{background:#FFFBEB;border:2px dashed #F59E0B;border-radius:12px;padding:14px 20px;text-align:center;margin:16px 0;}
  .voucher .code{font-size:22px;font-weight:900;letter-spacing:.1em;color:#92400E;font-family:monospace;}
  .voucher .lbl{font-size:12px;color:#78350F;margin-top:4px;}
  .cta{display:block;margin:20px 0 10px;padding:15px 0;border-radius:14px;background:${urgent ? "#DC2626" : "#2563EB"};color:#fff!important;text-decoration:none;font-weight:700;font-size:15px;text-align:center;}
  .features{list-style:none;padding:0;margin:0 0 20px;}
  .features li{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:13.5px;color:#475569;border-bottom:1px solid #F1F5F9;}
  .features li:last-child{border-bottom:none;}
  .footer{background:#F8FAFC;padding:16px 32px;text-align:center;font-size:11.5px;color:#94A3B8;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <span class="ico">${urgent ? "⚠️" : "⏰"}</span>
    <h1>${urgent ? "Besok akses premium kamu berakhir!" : `${days} hari lagi akses premium berakhir`}</h1>
    <p>${planName} · talentika.id</p>
  </div>
  <div class="body">
    <div class="countdown">
      <div class="num">${days}</div>
      <div class="lbl">hari tersisa</div>
    </div>

    <p style="font-size:15px;color:#0F172A;margin:0 0 12px;font-weight:600">Hei ${firstName},</p>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 16px;">
      ${urgent
        ? "Setelah besok, kamu akan kehilangan akses ke semua fitur premium. Perpanjang sekarang untuk menjaga progress belajarmu tetap terjaga."
        : `Paket ${planName} kamu akan berakhir dalam ${days} hari. Perpanjang sekarang dan nikmati terus manfaat berikut:`
      }
    </p>

    <ul class="features">
      <li>🎯 Akses assessment RIASEC + laporan karir lengkap</li>
      <li>📚 500+ konten pembelajaran eksklusif</li>
      <li>🏆 Tantangan komunitas + XP rewards</li>
      <li>🔔 Notifikasi peluang beasiswa & magang terbaru</li>
      <li>📄 Portfolio builder profesional</li>
    </ul>

    ${voucherCode ? `
    <div class="voucher">
      <div class="lbl">Voucher khusus untuk kamu — diskon 15%</div>
      <div class="code">${voucherCode}</div>
      <div class="lbl">Berlaku hanya 48 jam</div>
    </div>` : ""}

    <a href="${APP_URL}/subscription" class="cta">
      🔄 Perpanjang Sekarang ${voucherCode ? "(Hemat 15%)" : "→"}
    </a>
    <p style="font-size:12px;color:#94A3B8;text-align:center;">
      🛡 Garansi uang kembali 30 hari · Batalkan kapan saja
    </p>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} Talentika ·
    <a href="${APP_URL}" style="color:#94A3B8">talentika.id</a>
  </div>
</div>
</body>
</html>`;
}

async function getOrCreateExpiryVoucher(userId: string): Promise<string | null> {
  const code = `PERPANJANG${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const validUntil = new Date(Date.now() + 48 * 3_600_000).toISOString();

  const { error } = await supabase.from("voucher_codes").insert({
    code,
    name: `Perpanjangan — user ${userId.slice(0, 6)}`,
    discount_type: "percentage",
    discount_value: 15,
    max_uses: 1,
    valid_from: new Date().toISOString(),
    valid_until: validUntil,
    is_active: true,
    description: `Auto-generated 1-day expiry voucher for user ${userId}`,
  });
  return error ? null : code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });

  try {
    const now = new Date();
    let totalSent = 0;
    const errors: string[] = [];

    // ── Process each tier ───────────────────────────────────────────────────
    for (const tier of [
      { days: 7, field: "expiry_warning_7d_sent_at" as const },
      { days: 3, field: "expiry_warning_3d_sent_at" as const },
      { days: 1, field: "expiry_warning_1d_sent_at" as const },
    ]) {
      const { start, end } = dayRange(tier.days);

      // Find active subs expiring in this window
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("user_id, subscription_packages(name)")
        .eq("status", "active")
        .gte("expires_at", start)
        .lte("expires_at", end);

      if (!subs?.length) continue;

      const userIds = subs.map(s => s.user_id);

      // Get profiles that haven't received this tier yet
      const { data: profiles } = await supabase
        .from("profiles")
        .select(`user_id, full_name, email, ${tier.field}`)
        .in("user_id", userIds)
        .is(tier.field, null); // not yet sent

      if (!profiles?.length) continue;

      for (const profile of profiles) {
        if (!profile.email) continue;

        const sub = subs.find(s => s.user_id === profile.user_id);
        const planName = (sub?.subscription_packages as any)?.name ?? "Premium";

        // Generate voucher for 1-day warning only
        const voucherCode = tier.days === 1
          ? await getOrCreateExpiryVoucher(profile.user_id)
          : undefined;

        const html = buildHtml(profile.full_name ?? "", tier.days, planName, voucherCode ?? undefined);

        const subject = tier.days === 1
          ? "⚠️ Besok akses premium kamu berakhir — perpanjang sekarang"
          : tier.days === 3
          ? `⏰ ${tier.days} hari lagi akses ${planName} kamu berakhir`
          : `📅 Ingatkan: langganan ${planName} berakhir dalam ${tier.days} hari`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [profile.email],
            subject,
            html,
          }),
        });

        if (res.ok) {
          totalSent++;
          // Mark as sent
          await supabase.from("profiles")
            .update({ [tier.field]: now.toISOString() })
            .eq("user_id", profile.user_id);
        } else {
          errors.push(`${tier.days}d / ${profile.email}: ${await res.text()}`);
        }

        await new Promise(r => setTimeout(r, 100));
      }
    }

    return new Response(JSON.stringify({ sent: totalSent, errors }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
