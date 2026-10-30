import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePaketLangganan } from "@/hooks/usePaketLangganan";
import { invalidateSubscriptionCache } from "@/hooks/useSubscription";
import { canPurchase, db, errMsg, openExternal, useApp } from "../store";
import { BackBtn, Btn, Confetti, Header, Icon, Input, Loading, Sheet, TextArea } from "../ui";
import { C, SH, rp, rpShort } from "../theme";
import { cekPembayaran, kunciCheckout } from "@/lib/pembayaran";
import { fmtDate } from "../logic";
import { SchoolCodeSheet } from "./More";
import { DI_LUAR_PAKET, MATRIKS_PAKET } from "@/lib/paket";

export default function Pro({ screen }: { screen: "pro" | "checkout" | "paid" }) {
  // Di app native tidak ada pembelian (kebijakan App Store / Google Play) — lihat canPurchase()
  if (!canPurchase() && screen !== "paid") return <NativeProInfo />;
  if (screen === "checkout") return <Checkout />;
  if (screen === "paid") return <Paid />;
  return <PlusScreen />;
}

/** Opsi paket = (paket berbayar dari subscription_packages) × (bulanan, tahunan). Harga HANYA dari tabel. */
function usePlans() {
  const { paket, loading } = usePaketLangganan();
  const plans = useMemo(() => paket.filter(p => p.price_monthly > 0).flatMap(p => {
    const yearlySave = p.price_monthly > 0 ? Math.round((1 - p.price_yearly / (p.price_monthly * 12)) * 100) : 0;
    return [
      { key: `${p.id}:monthly`, id: p.id, cycle: "monthly" as const, name: `${p.name} · Bulanan`, nameEn: `${p.name} · Monthly`, sub: "Fleksibel, bisa stop kapan saja", subEn: "Flexible, cancel anytime", price: p.price_monthly, per: "/bulan", perEn: "/month", badge: null as string | null, months: 1, popular: false },
      { key: `${p.id}:yearly`, id: p.id, cycle: "yearly" as const, name: `${p.name} · Tahunan`, nameEn: `${p.name} · Annual`, sub: `${rpShort(Math.round(p.price_yearly / 12))}/bulan`, subEn: `${rpShort(Math.round(p.price_yearly / 12))}/month`, price: p.price_yearly, per: "/tahun", perEn: "/year", badge: yearlySave > 0 ? `Hemat ${yearlySave}%` : null, months: 12, popular: !!p.is_popular },
    ];
  }).filter(p => p.price > 0).sort((a, b) => a.price / a.months - b.price / b.months), [paket]);
  return { plans, loading };
}

/** Free vs Plus — angka mengikuti batas sistem sebenarnya. */
/* Matriks Free vs Plus — satu sumber dengan halaman langganan web (src/lib/paket.ts). */
function CompareTable() {
  const { lang } = useApp();
  const en = lang === "en";
  return (
    <div style={{ background: "#fff", borderRadius: 18, boxShadow: SH.card, overflow: "hidden", marginTop: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 14px", background: C.soft, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: ".4px" }}><span>FREE</span><span style={{ color: C.blue }}>PLUS</span></div>
      {MATRIKS_PAKET.map((r, i) => (
        <div key={r.fitur} style={{ padding: "10px 14px", borderTop: i ? "1px solid #F1F5FB" : "none" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{en ? r.fiturEn : r.fitur}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 3, fontSize: 11.5, lineHeight: 1.4 }}>
            <span style={{ color: C.muted }}>{en ? r.freeEn : r.free}</span>
            <span style={{ color: C.blue, fontWeight: 600 }}>{en ? r.plusEn : r.plus}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Yang tidak termasuk paket mana pun — disebut terang supaya tidak ada janji yang keliru. */
function DiLuarPaket() {
  const { t, lang } = useApp();
  return (
    <div style={{ background: C.soft, borderRadius: 16, padding: "12px 14px", marginTop: 10, fontSize: 11.5, color: C.text2, lineHeight: 1.55 }}>
      <b>{t("Tidak termasuk langganan:", "Not included in any plan:")}</b> {DI_LUAR_PAKET.map(([id, en]) => (lang === "en" ? en : id)).join(", ")}{t(" — dijual atau dikenakan terpisah.", " — sold or charged separately.")}
    </div>
  );
}

function Hero({ title, sub, kicker = "TALENTIKA PLUS" }: { title: React.ReactNode; sub: React.ReactNode; kicker?: string }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, background: C.navy, padding: 20, color: "#fff" }}>
      <div style={{ position: "absolute", right: -70, top: -70, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,209,70,.9)" }} />
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow, background: "rgba(255,209,70,.15)", padding: "5px 11px", borderRadius: 99 }}><Icon name="star" size={13} filled />{kicker}</div>
      <div style={{ position: "relative", fontSize: 24, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-.4px", marginTop: 12 }}>{title}</div>
      <div style={{ position: "relative", fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,.8)", marginTop: 8, maxWidth: 280 }}>{sub}</div>
    </div>
  );
}


/* Versi native: informasi fitur tanpa harga, tombol beli, atau tautan ke pembayaran luar
   (App Store Review Guideline 3.1.1/3.1.3 & kebijakan Google Play Payments). */
function NativeProInfo() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, isPro, toast } = useApp();
  const [school, setSchool] = useState(false);
  if (window.location.pathname.endsWith("/checkout")) return <Navigate to="/app/pro" replace />;
  return (
    <div className="tk-screen" style={{ position: "absolute", inset: 0, overflow: "auto", background: C.bg, paddingBottom: 40 }}>
      <Header title="Talentika Plus" sub={isPro ? t("Aktif di akunmu", "Active on your account") : t("Buka potensi penuhmu", "Unlock your full potential")} />
      <div style={{ padding: "14px 20px 0" }}>
        <Hero title={isPro ? t("Semua fitur Plus terbuka", "All Plus features unlocked") : <>{t("Melangkah lebih jauh", "Go further with")}<br />{t("bersama Talentika Plus", "Talentika Plus")}</>} sub={isPro ? t("Terima kasih sudah bertumbuh bersama Talentika.", "Thanks for growing with Talentika.") : t("Tersedia untuk akun Plus, termasuk siswa di sekolah mitra.", "Available on Plus accounts, including students at partner schools.")} />
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>Free vs Plus</div>
        <CompareTable />
        <DiLuarPaket />
        {!isPro && <Btn kind="soft" h={46} onClick={() => setSchool(true)} style={{ marginTop: 14 }}><Icon name="school" size={17} />{t("Punya kode sekolah?", "Have a school code?")}</Btn>}
        <Btn kind="outline" h={46} onClick={async () => { invalidateSubscriptionCache(); await qc.invalidateQueries({ queryKey: ["m-access"] }); toast(t("Status akun diperbarui", "Account status refreshed")); }} style={{ marginTop: 10 }}>{t("Muat ulang status akun", "Refresh account status")}</Btn>
      </div>
      <SchoolCodeSheet open={school} onClose={() => setSchool(false)} onDone={() => qc.invalidateQueries({ queryKey: ["m-access"] })} />
    </div>
  );
}

/* ── TALENTIKA PLUS ─────────────────────────────────────────────────── */
function PlusScreen() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, isPro, track, toast } = useApp();
  const { plans, loading } = usePlans();
  const [sel, setSel] = useState<string | null>(null);
  const [school, setSchool] = useState(false);
  useEffect(() => { track("paywall_viewed", { entry_point: "pro_screen", plan: null, platform: (window as any).Capacitor?.getPlatform?.() ?? "web" }); }, []); // eslint-disable-line
  if (isPro) return <PlusActive />;
  const chosen = plans.find(p => p.key === sel) ?? plans.find(p => p.popular) ?? plans[0];
  const cheapest = plans.length ? Math.min(...plans.map(p => Math.round(p.price / p.months))) : null;
  const restore = async () => { invalidateSubscriptionCache(); await qc.invalidateQueries({ queryKey: ["m-access"] }); const { data } = await db.rpc("my_access"); toast(data?.is_premium ? t("Langganan ditemukan & dipulihkan", "Subscription found & restored") : t("Belum ada langganan aktif di akun ini", "No active subscription on this account")); };
  return (
    <div className="tk-screen" style={{ position: "absolute", inset: 0, overflow: "auto", background: C.bg, paddingBottom: 0 }}>
      <Header title="Talentika Plus" sub={t("Buka potensi penuhmu", "Unlock your full potential")} />
      <div style={{ padding: "14px 20px 20px" }}>
        <Hero kicker={cheapest ? t(`MULAI ${rpShort(cheapest)}/BULAN`, `FROM ${rpShort(cheapest)}/MONTH`) : "TALENTIKA PLUS"} title={<>{t("Melangkah lebih jauh", "Go further with")}<br />{t("bersama Talentika Plus", "Talentika Plus")}</>} sub={t("Asesmen lengkap, AI Talent Coach, rekomendasi peluang, dan Talent Passport lengkap.", "Full assessment, AI Talent Coach, opportunity picks and a full Talent Passport.")} />
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>Free vs Plus</div>
        <CompareTable />
        <DiLuarPaket />
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>{t("Pilih paket", "Choose a plan")}</div>
        {loading && <Loading />}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
          {plans.map(p => { const on = chosen?.key === p.key; return (
            <button key={p.key} onClick={() => setSel(p.key)} aria-pressed={on} style={{ textAlign: "left", border: `1.5px solid ${on ? C.blue : C.line}`, borderRadius: 18, background: on ? "#F3F8FF" : "#fff", padding: "13px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${on ? C.blue : "#CBD5E1"}`, background: on ? C.blue : "#fff", boxShadow: on ? "inset 0 0 0 3px #fff" : "none", flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}><span style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{lang === "en" ? p.nameEn : p.name}</span>{p.badge && <span style={{ fontSize: 10, fontWeight: 700, color: "#7A5200", background: C.yellow, padding: "2px 8px", borderRadius: 99 }}>{lang === "en" ? p.badge.replace("Hemat", "Save") : p.badge}</span>}</span>
                <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 1 }}>{lang === "en" ? p.subEn : p.sub}</span>
              </span>
              <span style={{ textAlign: "right", flex: "none" }}><span style={{ display: "block", fontSize: 15, fontWeight: 700, color: C.blue }}>{rpShort(p.price)}</span><span style={{ display: "block", fontSize: 10.5, color: C.faint }}>{lang === "en" ? p.perEn : p.per}</span></span>
            </button>); })}
        </div>
        <div style={{ background: "#fff", borderRadius: 18, padding: 14, marginTop: 12, boxShadow: SH.card, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: C.tintGreen, color: C.green, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="school" size={19} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{t("Punya kode sekolah?", "Have a school code?")}</div><div style={{ fontSize: 11.5, color: C.muted }}>{t("Sekolah mitra terverifikasi membuka Plus gratis", "Verified partner schools unlock Plus for free")}</div></div>
          <button onClick={() => setSchool(true)} style={{ height: 36, border: "none", borderRadius: 11, background: C.tintGreen, color: C.green, fontSize: 12.5, fontWeight: 600, padding: "0 13px", cursor: "pointer", flex: "none" }}>{t("Masukkan", "Enter")}</button>
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 12 }}>{t("Diskon pelajar & KIP lewat kode voucher di checkout · bisa dibatalkan kapan saja", "Student & KIP discounts via voucher code at checkout · cancel anytime")}</div>
      </div>
      <div style={{ position: "sticky", bottom: 0, padding: "12px 20px calc(env(safe-area-inset-bottom, 0px) + 16px)", borderTop: "1px solid #EEF2F8", background: "#fff", zIndex: 2 }}>
        <Btn h={54} disabled={!chosen} onClick={() => { track("paywall_viewed", { entry_point: "pro_continue", plan: chosen?.key }); nav(`/app/checkout?plan=${chosen!.id}&cycle=${chosen!.cycle}`); }}>{t("Lanjut ke Pembayaran", "Continue to payment")} <Icon name="right" size={17} /></Btn>
        <button onClick={restore} style={{ display: "block", margin: "8px auto 0", border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Pulihkan pembelian", "Restore purchases")}</button>
      </div>
      <SchoolCodeSheet open={school} onClose={() => setSchool(false)} onDone={async () => { invalidateSubscriptionCache(); await qc.invalidateQueries({ queryKey: ["m-access"] }); }} />
    </div>
  );
}

const METHODS = [
  { id: "gopay", name: "GoPay", c: "#00AED6" }, { id: "ovo", name: "OVO", c: "#4C2A86" }, { id: "dana", name: "DANA", c: "#118EEA" },
  { id: "qris", name: "QRIS", c: "#0F172A" }, { id: "bank_transfer", name: "Transfer Bank (VA)", c: "#475569" }, { id: "credit_card", name: "Kartu Kredit/Debit", c: "#334155" },
];

/* ── CHECKOUT (via Mayar; harga & pembeli ditentukan server) ────────── */
function Checkout() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { t, lang, profile, toast, track } = useApp();
  const { plans, loading } = usePlans();
  const plan = plans.find(p => p.id === params.get("plan") && p.cycle === params.get("cycle"));
  const [method, setMethod] = useState("gopay");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [code, setCode] = useState("");
  const [voucher, setVoucher] = useState<{ id: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const minor = (profile?.usia ?? 99) < 18;
  const [consent, setConsent] = useState<boolean | null>(null);
  useEffect(() => {
    if (!minor) { setConsent(true); return; }
    db.from("parent_links").select("id").eq("student_user_id", profile!.user_id).eq("status", "active").limit(1).then(({ data }: any) => setConsent(!!data?.length));
  }, [minor, profile]);
  if (!plan) return loading ? <Loading /> : <Navigate to="/app/pro" replace />;
  const until = new Date(); until.setMonth(until.getMonth() + plan.months);
  const applyCode = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const { data: v } = await db.from("voucher_codes").select("id,name,discount_type,discount_value,valid_until").eq("code", c).eq("is_active", true).maybeSingle();
    if (!v || (v.valid_until && +new Date(v.valid_until) < Date.now())) { setVoucher(null); toast(t("Kode tidak valid atau sudah berakhir", "Invalid or expired code"), "error"); return; }
    const label = /percent/.test(v.discount_type ?? "") ? `${v.discount_value}%` : rpShort(v.discount_value);
    setVoucher({ id: v.id, label: `${v.name ?? c} · ${t("diskon", "discount")} ${label}` });
  };
  const create = async () => {
    const { data, error } = await supabase.functions.invoke("create-mayar-payment", { body: { planId: plan.id, billingCycle: plan.cycle, paymentMethod: method, phone: phone.trim(), voucherId: voucher?.id, returnTo: "app", idempotencyKey: kunciCheckout(`sub:${plan.id}:${plan.cycle}:${voucher?.id ?? ""}`) } });
    if (error || !data?.invoice_url) { let m = data?.error; try { m = (await (error as any)?.context?.json?.())?.error ?? m; } catch { /* */ } toast(m ?? t("Gagal membuat pembayaran", "Couldn't create payment"), "error"); return null; }
    sessionStorage.setItem("mayar_tx_id", data.transaction_id);
    track("purchase_started", { plan: `${plan.id}:${plan.cycle}`, platform: (window as any).Capacitor?.getPlatform?.() ?? "web" });
    return data.invoice_url as string;
  };
  const pay = async () => {
    setBusy(true);
    const url = await create();
    setBusy(false);
    if (!url) return;
    if ((window as any).Capacitor?.isNativePlatform?.()) await openExternal(url); else window.location.href = url;
  };
  // Pelajar < 18 (sudah ada persetujuan): kirim tagihan ke orang tua lewat share sheet / WhatsApp
  const askParent = async () => {
    setBusy(true);
    const url = await create();
    setBusy(false);
    if (!url) return;
    const text = t(`Halo, aku ingin berlangganan Talentika ${plan.name}. Bisa bantu bayar lewat link ini?`, `Hi, I'd like to subscribe to Talentika ${plan.nameEn}. Could you help pay via this link?`);
    if (navigator.share) { try { await navigator.share({ text, url }); } catch { /* batal */ } }
    else openExternal(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`);
    toast(t("Tagihan dikirim — akses aktif otomatis setelah dibayar", "Bill sent — access activates automatically once paid"));
  };
  const card: React.CSSProperties = { background: "#fff", borderRadius: 18, boxShadow: SH.card };
  return (
    <div className="tk-screen" style={{ position: "absolute", inset: 0, overflow: "auto", background: C.bg, paddingBottom: 40 }}>
      <Header title="Checkout" sub={t("Pembayaran aman", "Secure payment")} />
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ ...card, padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 700 }}>Talentika {lang === "en" ? plan.nameEn : plan.name}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t("Aktif sampai", "Active until")} ±{fmtDate(until.toISOString(), lang)}</div></div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.blue }}>{rp(plan.price)}</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>{t("Metode pembayaran", "Payment method")}</div>
        <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
          {METHODS.map((m, i) => { const on = method === m.id; return (
            <button key={m.id} onClick={() => setMethod(m.id)} aria-pressed={on} style={{ width: "100%", border: "none", background: "none", borderBottom: i < METHODS.length - 1 ? "1px solid #F1F5FB" : "none", display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 38, height: 30, borderRadius: 8, background: m.c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flex: "none" }}>{m.name.slice(0, 2).toUpperCase()}</span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: C.text }}>{m.name}</span>
              <span style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${on ? C.blue : "#CBD5E1"}`, background: on ? C.blue : "#fff", boxShadow: on ? "inset 0 0 0 3px #fff" : "none", flex: "none" }} />
            </button>); })}
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{t("Metode akhir dikonfirmasi di halaman pembayaran Mayar.", "You confirm the final method on the Mayar payment page.")}</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>{t("Nomor HP", "Phone number")}</div>
        <div style={{ marginTop: 10 }}><Input type="tel" icon="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08…" /></div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>{t("Kode promo / pelajar", "Promo or student code")}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Input value={code} onChange={e => { setCode(e.target.value); setVoucher(null); }} placeholder="PELAJAR" autoCapitalize="characters" />
          <Btn full={false} h={50} kind="soft" onClick={applyCode} style={{ padding: "0 16px", fontSize: 13 }}>{t("Pakai", "Apply")}</Btn>
        </div>
        {voucher && <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: C.green }}><Icon name="check" size={15} />{voucher.label} · {t("dihitung server saat pembayaran dibuat", "applied server-side at payment")}</div>}
        {minor && consent === false && (
          <div style={{ marginTop: 14, background: C.tintYellow, borderRadius: 16, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: C.amber, display: "flex", flex: "none", marginTop: 2 }}><Icon name="shield" size={17} /></span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#7A5200" }}>{t("Di bawah 18 tahun? Hubungkan orang tua dulu", "Under 18? Link a parent first")}</div><div style={{ fontSize: 12, color: C.text2, marginTop: 2, lineHeight: 1.5 }}>{t("Pembayaran butuh persetujuan orang tua.", "Payment needs parental consent.")}</div>
              <button onClick={() => nav("/app/privacy")} style={{ marginTop: 8, height: 34, border: "none", borderRadius: 10, background: C.amber, color: "#fff", fontSize: 12, fontWeight: 600, padding: "0 12px", cursor: "pointer" }}>{t("Undang orang tua", "Invite a parent")}</button></div>
          </div>
        )}
        <Btn h={54} disabled={busy || !consent || phone.replace(/\D/g, "").length < 9} onClick={pay} style={{ marginTop: 16 }}>{busy ? "…" : `${t("Bayar", "Pay")} ${rp(plan.price)}`}</Btn>
        {minor && consent && (
          <div style={{ marginTop: 12, ...card, padding: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: C.tintPurple, color: C.purple, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="users" size={18} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{t("Minta orang tua yang membayar", "Ask a parent to pay")}</div><div style={{ fontSize: 11.5, color: C.muted }}>{t("Kirim link tagihan lewat WhatsApp", "Send the bill link via WhatsApp")}</div></div>
            </div>
            <Btn kind="outline" h={44} disabled={busy || phone.replace(/\D/g, "").length < 9} onClick={askParent} style={{ marginTop: 10, fontSize: 13 }}>{t("Kirim tagihan ke orang tua", "Send bill to parent")}</Btn>
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 11.5, color: C.faint, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Icon name="lock" size={12} />{t("Pembayaran terenkripsi via Mayar · bukti dikirim ke email", "Encrypted payment via Mayar · receipt sent by email")}</div>
      </div>
    </div>
  );
}

/* ── PEMBAYARAN DITERIMA — menunggu konfirmasi server (webhook verifikasi ke Mayar) ── */
function Paid() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, track } = useApp();
  const [state, setState] = useState<"wait" | "ok" | "timeout">("wait");
  const [params] = useSearchParams();
  useEffect(() => {
    let n = 0, stop = false;
    const ref = params.get("ref");
    const tick = async () => {
      // Cek ulang ke Mayar lewat server (cadangan bila webhook tidak sampai)
      if (ref && n % 2 === 0) await cekPembayaran(ref);
      invalidateSubscriptionCache();
      const { data } = await db.rpc("my_access");
      if (stop) return;
      if (data?.is_premium) { setState("ok"); qc.invalidateQueries({ queryKey: ["m-access"] }); track("purchase_completed", { plan: null, platform: (window as any).Capacitor?.getPlatform?.() ?? "web" }); return; }
      if (++n > 40) { setState("timeout"); return; }
      setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
  }, []); // eslint-disable-line
  if (state === "ok") return <PlusActive celebrate />;
  return (
    <div className="tk-screen" style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top, 0px) + 20px) 24px calc(env(safe-area-inset-bottom, 0px) + 36px)", textAlign: "center" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="clock" size={42} /></div>
        <h1 style={{ margin: "22px 0 0", fontSize: 23, fontWeight: 800, letterSpacing: "-.4px" }}>{t("Mengonfirmasi pembayaran…", "Confirming payment…")}</h1>
        <p style={{ margin: "10px auto 0", fontSize: 13.5, color: C.muted, lineHeight: 1.6, maxWidth: 290 }}>
          {state === "wait" ? t("Biasanya kurang dari satu menit setelah pembayaran berhasil.", "Usually under a minute after a successful payment.")
            : t("Pembayaran belum terkonfirmasi. Jika saldo sudah terpotong, akses aktif otomatis begitu Mayar mengirim konfirmasi — atau hubungi support dengan nomor referensi.", "Payment isn't confirmed yet. If you were charged, access activates as soon as Mayar confirms — or contact support with your reference.")}
        </p>
      </div>
      <Btn kind="outline" h={52} onClick={() => nav("/app/home", { replace: true })}>{t("Ke Beranda", "Go Home")}</Btn>
    </div>
  );
}

/* ── PLUS AKTIF + KELOLA LANGGANAN ──────────────────────────────────── */
function PlusActive({ celebrate = false }: { celebrate?: boolean }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, access, toast } = useApp();
  const [cancelOpen, setCancelOpen] = useState(false); const [why, setWhy] = useState(""); const [busy, setBusy] = useState(false);
  const { data: sub } = useQuery({
    queryKey: ["m-my-sub", user?.id], enabled: !!user,
    queryFn: async () => (await db.from("user_subscriptions").select("status,billing_cycle,expires_at,auto_renew,subscription_packages(name)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const unlocked: [string, string][] = [
    [t("Semua 8 modul Talent Discovery", "All 8 Talent Discovery modules"), "sparkle"], [t("Tika AI hingga 200 pesan/hari", "Tika AI up to 200 messages/day"), "msg"],
    [t("Katalog materi Plus & unduh offline", "Plus course catalog & offline downloads"), "download"], [t("Peluang tanpa batas & rekomendasi sesuai profil", "Unlimited opportunities & profile-based picks"), "target"],
    [t("Jalur studi & karier personal", "Personal study & career paths"), "compass"], [t("Talent Passport lengkap", "Full Talent Passport"), "folder"],
    [t("Sertifikat yang memenuhi syarat", "Eligible certificates"), "medal"], [t("Posting di komunitas", "Post in the community"), "msg"],
  ];
  const source = access?.source;
  const sourceLabel = source === "school" ? t("Lewat sekolahmu", "Through your school") : source === "trial" ? t("Masa coba", "Trial") : source === "admin" ? "Admin" : (sub as any)?.subscription_packages?.name ?? "Plus";
  const cancelled = sub?.status === "cancelled";
  const doCancel = async () => {
    setBusy(true);
    const { data, error } = await db.rpc("batalkan_langganan", { p_alasan: why.trim() || null });
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    setCancelOpen(false); qc.invalidateQueries({ queryKey: ["m-my-sub"] }); invalidateSubscriptionCache();
    toast(t(`Langganan dibatalkan · akses tetap aktif sampai ${fmtDate(data?.aktif_sampai, lang)}`, `Plan cancelled · access stays active until ${fmtDate(data?.aktif_sampai, lang)}`));
  };
  return (
    <div className="tk-screen" style={{ position: "absolute", inset: 0, overflow: "auto", background: C.bg, paddingBottom: 40 }}>
      {celebrate && <Confetti />}
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={() => (celebrate ? nav("/app/home", { replace: true }) : nav(-1))} /><div style={{ fontSize: 19, fontWeight: 700 }}>Talentika Plus</div>
      </div>
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ background: "linear-gradient(140deg,#0066FF,#00A3E0)", borderRadius: 24, padding: "22px 20px", color: "#fff", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, margin: "0 auto", borderRadius: "50%", background: C.yellow, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="star" size={30} filled /></div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 12 }}>{celebrate ? t("Selamat datang di", "Welcome to") : t("Langgananmu aktif", "Your plan is active")}<br /><span style={{ color: C.yellow }}>Talentika Plus!</span></div>
          <div style={{ fontSize: 12.5, opacity: .9, marginTop: 6 }}>{t("Semua fitur di bawah sudah terbuka.", "Everything below is now unlocked.")}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: SH.card, padding: "4px 14px", marginTop: 12 }}>
          {unlocked.map(([u, ic], i) => (
            <div key={u} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: i < unlocked.length - 1 ? "1px solid #F1F5FB" : "none" }}>
              <span style={{ color: C.blue, display: "flex" }}><Icon name={ic} size={18} /></span><span style={{ flex: 1, fontSize: 13.5 }}>{u}</span><span style={{ color: C.green, display: "flex" }}><Icon name="check" size={16} /></span>
            </div>
          ))}
        </div>
        <Btn h={52} onClick={() => nav("/app/home", { replace: celebrate })} style={{ marginTop: 14 }}>{t("Jelajahi Plus", "Explore Plus")}</Btn>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 20 }}>{t("Kelola langganan", "Manage subscription")}</div>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: SH.card, padding: "4px 14px", marginTop: 10, fontSize: 13 }}>
          {[[t("Paket", "Plan"), sourceLabel], [t("Status", "Status"), cancelled ? t("Dibatalkan · tidak diperpanjang", "Cancelled · won't renew") : t("Aktif", "Active")], [t("Berlaku sampai", "Valid until"), access?.expires_at ? fmtDate(access.expires_at, lang) : "—"]].map(([a, b], i) => (
            <div key={a} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "11px 0", borderBottom: i < 2 ? "1px solid #F1F5FB" : "none" }}><span style={{ color: C.muted }}>{a}</span><b style={{ fontWeight: 600, textAlign: "right" }}>{b}</b></div>
          ))}
        </div>
        <Btn kind="ghost" h={40} onClick={() => nav("/app/purchases")} style={{ marginTop: 8, fontSize: 13 }}>{t("Pembelian saya", "My purchases")}</Btn>
        <div style={{ display: "flex", gap: 9, marginTop: 10 }}>
          <Btn kind="outline" h={44} onClick={async () => { invalidateSubscriptionCache(); await qc.invalidateQueries({ queryKey: ["m-access"] }); qc.invalidateQueries({ queryKey: ["m-my-sub"] }); toast(t("Status diperbarui", "Status refreshed")); }} style={{ flex: 1, width: "auto", fontSize: 13 }}>{t("Pulihkan", "Restore")}</Btn>
          {source === "paid" && !cancelled && <Btn kind="ghost" h={44} onClick={() => setCancelOpen(true)} style={{ flex: 1, width: "auto", fontSize: 13, color: C.red }}>{t("Batalkan paket", "Cancel plan")}</Btn>}
        </div>
        {source === "school" && <div style={{ marginTop: 10, fontSize: 11.5, color: C.muted, textAlign: "center" }}>{t("Akses Plus diberikan sekolahmu selama kamu terdaftar di sana.", "Plus access is provided by your school while you're enrolled there.")}</div>}
      </div>
      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title={t("Batalkan langganan?", "Cancel your plan?")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text2, lineHeight: 1.6 }}>{t("Akses Plus tetap berjalan sampai masa aktif habis, lalu tidak diperpanjang.", "Plus access continues until the current period ends, then won't renew.")}</p>
        <TextArea value={why} onChange={e => setWhy(e.target.value)} placeholder={t("Alasan (opsional) — membantu kami jadi lebih baik", "Reason (optional) — helps us improve")} style={{ marginTop: 10, height: 76 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
          <Btn disabled={busy} onClick={doCancel} style={{ background: C.red, boxShadow: "none" }}>{t("Ya, batalkan", "Yes, cancel")}</Btn>
          <Btn kind="outline" onClick={() => setCancelOpen(false)}>{t("Tetap berlangganan", "Keep my plan")}</Btn>
        </div>
      </Sheet>
    </div>
  );
}
