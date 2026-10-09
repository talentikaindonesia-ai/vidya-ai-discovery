import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePaketLangganan } from "@/hooks/usePaketLangganan";
import { invalidateSubscriptionCache } from "@/hooks/useSubscription";
import { canPurchase, db, openExternal, useApp } from "../store";
import { Btn, Confetti, Header, Input, Label, Loading, Radio } from "../ui";
import { C, F, SH, rp, rpShort } from "../theme";
import { fmtDate } from "../logic";

export default function Pro({ screen }: { screen: "pro" | "checkout" | "paid" }) {
  // Di app native tidak ada pembelian (kebijakan App Store / Google Play) — lihat canPurchase()
  if (!canPurchase() && screen !== "paid") return <NativeProInfo />;
  if (screen === "checkout") return <Checkout />;
  if (screen === "paid") return <Paid />;
  return <ProScreen />;
}

/** Opsi paket = (paket berbayar dari subscription_packages) × (bulanan, tahunan). Harga HANYA dari tabel. */
function usePlans() {
  const { paket, loading } = usePaketLangganan();
  const plans = useMemo(() => paket.filter(p => p.price_monthly > 0).flatMap(p => {
    const yearlySave = p.price_monthly > 0 ? Math.round((1 - p.price_yearly / (p.price_monthly * 12)) * 100) : 0;
    return [
      { key: `${p.id}:monthly`, id: p.id, cycle: "monthly" as const, name: `${p.name} · Bulanan`, nameEn: `${p.name} · Monthly`, sub: "Fleksibel, bisa stop kapan aja", subEn: "Flexible, cancel anytime", price: p.price_monthly, per: "/bulan", perEn: "/month", popular: false, months: 1 },
      { key: `${p.id}:yearly`, id: p.id, cycle: "yearly" as const, name: `${p.name} · Tahunan`, nameEn: `${p.name} · Annual`, sub: yearlySave > 0 ? `Hemat ${yearlySave}% dibanding bulanan` : "Satu tahun penuh", subEn: yearlySave > 0 ? `Save ${yearlySave}% vs monthly` : "A full year", price: p.price_yearly, per: "/tahun", perEn: "/year", popular: !!p.is_popular, months: 12 },
    ];
  }).filter(p => p.price > 0).sort((a, b) => a.price / a.months - b.price / b.months), [paket]);
  return { plans, loading };
}

const FEATURES: [string, string, string, string, string][] = [
  ["🧬", C.tintBlue, "Full Talent DNA", "8 modul assessment lengkap + laporan PDF untuk orang tua & aplikasi", "All 8 assessment modules + PDF report for parents & applications"],
  ["🤝", C.tintGreen, "Booking mentor", "Pilih mentor terverifikasi, sesi 1-on-1 30 menit", "Book verified mentors, 30-minute 1-on-1 sessions"],
  ["✦", C.tintYellow, "AI Copilot & Application Assistant", "CV, motivation letter, esai beasiswa, latihan interview — tanpa batas harian", "CV, motivation letter, scholarship essays, interview practice — no daily cap"],
  ["📚", C.tintOrange, "Semua learning track + sertifikat", "Materi tanpa batas & sertifikat terverifikasi", "Unlimited courses & verified certificates"],
  ["🌐", C.tintPurple, "Community & Public Talent Profile", "Posting di komunitas & profil publik untuk aplikasi", "Post in the community & a public profile for applications"],
];

/* Versi native: informasi fitur Pro tanpa harga, tombol beli, atau tautan ke pembayaran luar
   (App Store Review Guideline 3.1.1/3.1.3 & kebijakan Google Play Payments). */
function NativeProInfo() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, isPro, toast } = useApp();
  if (window.location.pathname.endsWith("/checkout")) return <Navigate to="/app/pro" replace />;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "auto", background: C.bg, paddingBottom: 40 }}>
      <div style={{ background: C.navy, padding: "calc(env(safe-area-inset-top, 0px) + 20px) 22px 26px", borderRadius: "0 0 28px 28px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <button onClick={() => nav(-1)} aria-label={t("Tutup", "Close")} style={{ width: 38, height: 38, border: "none", borderRadius: 12, background: "rgba(255,255,255,.12)", cursor: "pointer", fontSize: 15, color: "#fff", fontFamily: "inherit", position: "relative" }}>✕</button>
        <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,193,7,.18)", padding: "6px 12px", borderRadius: 99, position: "relative" }}><span>👑</span><span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: F.display, color: C.yellow, letterSpacing: ".5px" }}>TALENTIKA PRO</span></div>
        <h1 style={{ margin: "12px 0 0", fontSize: 25, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.4px", lineHeight: 1.25, position: "relative" }}>{isPro ? t("Talentika Pro aktif", "Talentika Pro is active") : t("Fitur Talentika Pro", "Talentika Pro features")}</h1>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,.8)", maxWidth: 290, position: "relative" }}>
          {isPro ? t("Semua fitur di bawah sudah terbuka untukmu.", "All features below are unlocked for you.") : t("Fitur ini tersedia untuk akun Talentika Pro, termasuk akun dari sekolah mitra.", "These features are available to Talentika Pro accounts, including partner-school accounts.")}
        </p>
      </div>
      <div style={{ padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 9 }}>
        {FEATURES.map(([ic, bg, ti, d, de]) => (
          <div key={ti} style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 15, padding: "13px 14px", boxShadow: SH.cardSm }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flex: "none", color: C.gold }}>{ic}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{ti} {isPro && <span style={{ color: C.green }}>✓</span>}</div><div style={{ marginTop: 2, fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{lang === "en" ? de : d}</div></div>
          </div>
        ))}
        <Btn kind="outline" h={48} onClick={async () => { invalidateSubscriptionCache(); await qc.invalidateQueries({ queryKey: ["m-access"] }); toast(t("Status akun diperbarui", "Account status refreshed")); }} style={{ marginTop: 8 }}>{t("Muat ulang status akun", "Refresh account status")}</Btn>
        {isPro && <Btn h={48} onClick={() => nav("/app/mentors")}>{t("Booking mentor", "Book a mentor")}</Btn>}
      </div>
    </div>
  );
}

/* TALENTIKA PRO (PAY-01) */
function ProScreen() {
  const nav = useNavigate();
  const { t, lang, isPro, track } = useApp();
  const { plans, loading } = usePlans();
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { track("paywall_viewed", { entry_point: "pro_screen", plan: null, platform: (window as any).Capacitor?.getPlatform?.() ?? "web" }); }, []); // eslint-disable-line
  const chosen = plans.find(p => p.key === sel) ?? plans.find(p => p.popular) ?? plans[0];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "auto", background: C.bg, paddingBottom: 40 }}>
      <div style={{ background: C.navy, padding: "calc(env(safe-area-inset-top, 0px) + 20px) 22px 26px", borderRadius: "0 0 28px 28px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <button onClick={() => nav(-1)} aria-label={t("Tutup", "Close")} style={{ width: 38, height: 38, border: "none", borderRadius: 12, background: "rgba(255,255,255,.12)", cursor: "pointer", fontSize: 15, color: "#fff", fontFamily: "inherit", position: "relative" }}>✕</button>
        <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,193,7,.18)", padding: "6px 12px", borderRadius: 99, position: "relative" }}><span>👑</span><span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: F.display, color: C.yellow, letterSpacing: ".5px" }}>TALENTIKA PRO</span></div>
        <h1 style={{ margin: "12px 0 0", fontSize: 25, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.4px", lineHeight: 1.25, position: "relative" }}>{t("Buka potensi penuhmu", "Unlock your full potential")}</h1>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,.8)", maxWidth: 290, position: "relative" }}>{t("Full Talent DNA, mentoring, dan AI Application Assistant dalam satu langganan.", "Full Talent DNA, mentoring and the AI Application Assistant in one subscription.")}</p>
      </div>
      <div style={{ padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 9 }}>
        {isPro && <div style={{ background: C.tintGreen, borderRadius: 15, padding: "13px 14px", fontSize: 13.5, fontWeight: 700, color: C.greenDark }}>✓ {t("Kamu sudah Talentika Pro", "You're already on Talentika Pro")}</div>}
        {FEATURES.map(([ic, bg, ti, d, de]) => (
          <div key={ti} style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 15, padding: "13px 14px", boxShadow: SH.cardSm }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flex: "none", color: C.gold }}>{ic}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{ti}</div><div style={{ marginTop: 2, fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{lang === "en" ? de : d}</div></div>
          </div>
        ))}
        <div style={{ marginTop: 10, fontSize: 15, fontWeight: 800 }}>{t("Pilih paket", "Choose a plan")}</div>
        {loading && <Loading />}
        {plans.map(p => { const on = chosen?.key === p.key; return (
          <button key={p.key} onClick={() => setSel(p.key)} style={{ textAlign: "left", border: `2px solid ${on ? C.blue : C.track}`, borderRadius: 18, background: on ? C.tintBlue : "#fff", padding: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 13 }}>
            <Radio on={on} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 15, fontWeight: 700, fontFamily: F.display, color: C.text }}>{lang === "en" ? p.nameEn : p.name}</span>{p.popular && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: F.display, color: "#7A5200", background: C.yellow, padding: "3px 8px", borderRadius: 99 }}>{t("Terpopuler", "Popular")}</span>}</div>
              <div style={{ marginTop: 2, fontSize: 12, color: C.muted }}>{lang === "en" ? p.subEn : p.sub}</div>
            </div>
            <div style={{ textAlign: "right", flex: "none" }}><div style={{ fontSize: 15, fontWeight: 700, fontFamily: F.display, color: C.blue }}>{rpShort(p.price)}</div><div style={{ fontSize: 11, color: C.faint, fontWeight: 600 }}>{lang === "en" ? p.perEn : p.per}</div></div>
          </button>); })}
        <Btn kind="orange" h={54} disabled={!chosen} onClick={() => { track("paywall_viewed", { entry_point: "pro_continue", plan: chosen?.key }); nav(`/app/checkout?plan=${chosen!.id}&cycle=${chosen!.cycle}`); }} style={{ marginTop: 8, fontSize: 16 }}>{t("Lanjut ke Pembayaran", "Continue to payment")}</Btn>
        <p style={{ margin: "6px 0 0", textAlign: "center", fontSize: 11.5, color: C.faint }}>{t("Bisa dibatalkan kapan saja · Siswa di sekolah mitra mendapat Pro lewat sekolah", "Cancel anytime · Students at partner schools get Pro through their school")}</p>
        <button onClick={async () => { invalidateSubscriptionCache(); await (supabase as any).rpc("my_access"); window.location.reload(); }} style={{ border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t("Pulihkan pembelian", "Restore purchases")}</button>
      </div>
    </div>
  );
}

const METHODS = [
  { id: "gopay", name: "GoPay", sub: "Saldo langsung terpotong", subEn: "Charged to your balance", logo: "GP", lbg: "#00AED6", lfg: "#fff" },
  { id: "qris", name: "QRIS", sub: "Scan pakai app apa saja", subEn: "Scan with any app", logo: "QR", lbg: C.navy, lfg: "#fff" },
  { id: "bank_transfer", name: "Transfer Bank", sub: "BCA, Mandiri, BNI, BRI", subEn: "BCA, Mandiri, BNI, BRI", logo: "BK", lbg: C.tintBlue, lfg: C.blueDark },
  { id: "credit_card", name: "Kartu Kredit/Debit", sub: "Visa, Mastercard", subEn: "Visa, Mastercard", logo: "CC", lbg: C.tintYellow, lfg: C.gold },
];

/* CHECKOUT (PAY-03 via Mayar; harga & pembeli ditentukan server) */
function Checkout() {
  const [params] = useSearchParams();
  const { t, lang, profile, toast, track } = useApp();
  const { plans } = usePlans();
  const plan = plans.find(p => p.id === params.get("plan") && p.cycle === params.get("cycle"));
  const [method, setMethod] = useState("gopay");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [voucher, setVoucher] = useState("");
  const [busy, setBusy] = useState(false);
  const minor = (profile?.usia ?? 99) < 18;
  const [consent, setConsent] = useState<boolean | null>(null);
  useEffect(() => {
    if (!minor) { setConsent(true); return; }
    db.from("parent_links").select("id").eq("student_user_id", profile!.user_id).eq("status", "active").limit(1).then(({ data }: any) => setConsent(!!data?.length));
  }, [minor, profile]);
  if (!plan) return <Loading />;
  const until = new Date(); until.setMonth(until.getMonth() + plan.months);
  const pay = async () => {
    setBusy(true);
    let voucherId: string | undefined;
    if (voucher.trim()) {
      const { data: v } = await db.from("voucher_codes").select("id").eq("code", voucher.trim().toUpperCase()).eq("is_active", true).maybeSingle();
      if (!v) { setBusy(false); toast(t("Kode voucher tidak valid", "Invalid voucher code"), "error"); return; }
      voucherId = v.id;
    }
    const { data, error } = await supabase.functions.invoke("create-mayar-payment", { body: { planId: plan.id, billingCycle: plan.cycle, paymentMethod: method, phone: phone.trim(), voucherId, returnTo: "app" } });
    setBusy(false);
    if (error || !data?.invoice_url) { let m = data?.error; try { m = (await (error as any)?.context?.json?.())?.error ?? m; } catch { /* */ } toast(m ?? t("Gagal membuat pembayaran", "Couldn't create payment"), "error"); return; }
    sessionStorage.setItem("mayar_tx_id", data.transaction_id);
    track("purchase_started", { plan: `${plan.id}:${plan.cycle}`, platform: (window as any).Capacitor?.getPlatform?.() ?? "web" });
    if ((window as any).Capacitor?.isNativePlatform?.()) await openExternal(data.invoice_url); else window.location.href = data.invoice_url;
  };
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "auto", background: C.bg, paddingBottom: 40 }}>
      <Header title={t("Pembayaran", "Payment")} />
      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 17, boxShadow: SH.card }}>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>👑 Talentika {lang === "en" ? plan.nameEn : plan.name}</div>
          <div style={{ marginTop: 3, fontSize: 12, color: C.muted }}>{lang === "en" ? plan.subEn : plan.sub} · {t("sampai", "until")} ±{fmtDate(until.toISOString(), lang)}</div>
          <div style={{ marginTop: 13, paddingTop: 13, borderTop: `1px solid ${C.track}`, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.muted }}><span>Subtotal</span><span style={{ fontWeight: 700, color: C.text }}>{rp(plan.price)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 9, borderTop: `1px dashed ${C.line}` }}><span style={{ fontSize: 14, fontWeight: 800 }}>Total</span><span style={{ fontSize: 16, fontWeight: 700, fontFamily: F.display, color: C.blue }}>{rp(plan.price)}</span></div>
            <div style={{ fontSize: 11, color: C.faint }}>{t("Diskon voucher (pelajar/KIP) dihitung di server saat pembayaran dibuat.", "Voucher discounts (student/KIP) are applied server-side.")}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>{t("Metode pembayaran", "Payment method")}</div>
          {METHODS.map(m => { const on = method === m.id; return (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 13, border: `2px solid ${on ? C.blue : C.track}`, borderRadius: 15, background: on ? C.tintBlue : "#fff", padding: "13px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ width: 38, height: 30, borderRadius: 8, background: m.lbg, color: m.lfg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: F.display, flex: "none" }}>{m.logo}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{m.name}</div><div style={{ fontSize: 11.5, color: C.faint, marginTop: 1 }}>{lang === "en" ? m.subEn : m.sub}</div></div>
              <Radio on={on} />
            </button>); })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Label>{t("Nomor HP (untuk konfirmasi pembayaran)", "Phone (for payment confirmation)")}</Label>
          <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08…" />
          <Label>{t("Kode voucher (opsional)", "Voucher code (optional)")}</Label>
          <Input value={voucher} onChange={e => setVoucher(e.target.value)} placeholder="KIP2026" autoCapitalize="characters" />
        </div>
        {consent === false && <div style={{ background: C.tintYellow, borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: C.text3, lineHeight: 1.5 }}>🛡️ {t("Karena usiamu di bawah 18 tahun, pembayaran butuh persetujuan orang tua. Undang orang tuamu di Privacy & Sharing.", "Because you're under 18, payment needs parental consent. Invite your parent in Privacy & Sharing.")}</div>}
        <Btn kind="orange" h={54} disabled={busy || !consent || phone.replace(/\D/g, "").length < 9} onClick={pay} style={{ fontSize: 16 }}>{busy ? "…" : `${t("Bayar", "Pay")} ${rp(plan.price)}`}</Btn>
        <p style={{ margin: 0, textAlign: "center", fontSize: 11.5, color: C.faint }}>🔒 {t("Pembayaran aman via Mayar", "Secure payment via Mayar")}</p>
      </div>
    </div>
  );
}

/* PAYMENT SUCCESS — menunggu konfirmasi server (webhook memverifikasi ke Mayar) */
function Paid() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, track } = useApp();
  const [state, setState] = useState<"wait" | "ok" | "timeout">("wait");
  const [exp, setExp] = useState<string | null>(null);
  useEffect(() => {
    let n = 0, stop = false;
    const tick = async () => {
      invalidateSubscriptionCache();
      const { data } = await db.rpc("my_access");
      if (stop) return;
      if (data?.is_premium) { setExp(data.expires_at); setState("ok"); qc.invalidateQueries({ queryKey: ["m-access"] }); track("purchase_completed", { plan: null, platform: (window as any).Capacitor?.getPlatform?.() ?? "web" }); return; }
      if (++n > 20) { setState("timeout"); return; }
      setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
  }, []); // eslint-disable-line
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top, 0px) + 20px) 24px calc(env(safe-area-inset-bottom, 0px) + 36px)", textAlign: "center", overflow: "hidden" }}>
      {state === "ok" && <Confetti />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, animation: "tkPop .5s ease both" }}>{state === "ok" ? "👑" : "⏳"}</div>
        <h1 style={{ margin: "22px 0 0", fontSize: 25, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.4px" }}>{state === "ok" ? t("Kamu sekarang Pro! 🎉", "You're Pro now! 🎉") : t("Mengonfirmasi pembayaran…", "Confirming payment…")}</h1>
        <p style={{ margin: "10px auto 0", fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 280 }}>
          {state === "ok" ? t(`Aktif sampai ${fmtDate(exp, lang)}. Mulai dari modul Talent DNA lengkap atau booking mentor pertamamu.`, `Active until ${fmtDate(exp, lang)}. Start with the full Talent DNA or book your first mentor.`)
            : state === "wait" ? t("Biasanya kurang dari satu menit setelah pembayaran berhasil.", "Usually under a minute after a successful payment.")
            : t("Pembayaran belum terkonfirmasi. Jika saldo sudah terpotong, akses aktif otomatis begitu Mayar mengirim konfirmasi — atau hubungi support dengan nomor referensi.", "Payment isn't confirmed yet. If you were charged, access activates as soon as Mayar confirms — or contact support with your reference.")}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {state === "ok" && <Btn h={52} onClick={() => nav("/app/mentors", { replace: true })}>{t("Booking Mentor", "Book a Mentor")}</Btn>}
        {state === "ok" && <Btn kind="outline" h={52} onClick={() => nav("/app/dna", { replace: true })}>{t("Lanjutkan Talent DNA", "Continue Talent DNA")}</Btn>}
        <Btn kind={state === "ok" ? "ghost" : "outline"} h={52} onClick={() => nav("/app/home", { replace: true })}>{t("Ke Home", "Go Home")}</Btn>
      </div>
    </div>
  );
}
