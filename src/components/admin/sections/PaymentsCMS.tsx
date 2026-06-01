import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, Loader2, Save, Star, Ticket,
  TrendingUp, DollarSign, Users, CreditCard, RefreshCw, Copy, BarChart2,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { inputStyle, selectStyle, textareaStyle, Pill, Toggle, StatCard, Modal, Confirm, Field, fmtIDR, fmtDate } from "../adminShared";

interface PaymentTx {
  id: string; user_id: string; amount: number; status: string;
  payment_gateway: string | null; payment_method: string | null;
  invoice_number: string | null; created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}
interface SubPackage {
  id: string; name: string; type: string;
  price_monthly: number; price_yearly: number;
  features: string[]; max_users: number; is_active: boolean;
}
interface Voucher {
  id: string; code: string; name: string | null; description: string | null;
  discount_type: string; discount_value: number;
  max_uses: number | null; current_uses: number;
  min_purchase_amount: number; valid_from: string; valid_until: string | null;
  is_active: boolean;
}

const TX_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  completed: { label: "Berhasil",  bg: "#D1FAE5", color: "#065F46" },
  pending:   { label: "Pending",   bg: "#FEF3C7", color: "#92400E" },
  failed:    { label: "Gagal",     bg: "#FEE2E2", color: "#991B1B" },
  expired:   { label: "Expired",   bg: "#F1F5F9", color: "#475569" },
};

export default function PaymentsCMS() {
  const [tab, setTab]             = useState<"transactions" | "packages" | "vouchers" | "analytics">("transactions");
  const [txs, setTxs]             = useState<PaymentTx[]>([]);
  const [packages, setPackages]   = useState<SubPackage[]>([]);
  const [vouchers, setVouchers]   = useState<Voucher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState({ total: 0, month: 0, subscribers: 0, txCount: 0 });

  const [pkgModal, setPkgModal]   = useState<null | "create" | "edit">(null);
  const [pkgEdit, setPkgEdit]     = useState<Partial<SubPackage> | null>(null);
  const [pkgSaving, setPkgSaving] = useState(false);
  const [featInput, setFeatInput] = useState("");
  const [pkgDelId, setPkgDelId]   = useState<string | null>(null);

  const [vcModal, setVcModal]     = useState<null | "create" | "edit">(null);
  const [vcEdit, setVcEdit]       = useState<Partial<Voucher> | null>(null);
  const [vcSaving, setVcSaving]   = useState(false);
  const [vcDelId, setVcDelId]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [txRes, pkgRes, vcRes, subRes] = await Promise.all([
      supabase.from("payment_transactions")
        .select("id, user_id, amount, status, payment_gateway, payment_method, invoice_number, created_at, profiles(full_name, email)")
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("subscription_packages").select("*").order("price_monthly"),
      supabase.from("voucher_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("user_subscriptions").select("id", { count: "exact" }).eq("status", "active"),
    ]);
    const txData = (txRes.data ?? []) as PaymentTx[];
    setTxs(txData);
    setPackages((pkgRes.data ?? []).map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
    setVouchers(vcRes.data ?? []);

    const completed = txData.filter(t => t.status === "completed");
    const total = completed.reduce((s, t) => s + (t.amount ?? 0), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const month = completed.filter(t => new Date(t.created_at).getTime() >= monthStart)
      .reduce((s, t) => s + (t.amount ?? 0), 0);
    setStats({ total, month, subscribers: subRes.count ?? 0, txCount: completed.length });
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function refresh() { setRefreshing(true); await loadAll(); setRefreshing(false); }

  function openCreatePkg() {
    setPkgEdit({ name: "", type: "premium", price_monthly: 0, price_yearly: 0, features: [], max_users: 1, is_active: true });
    setFeatInput(""); setPkgModal("create");
  }
  function openEditPkg(p: SubPackage) { setPkgEdit({ ...p, features: [...(p.features ?? [])] }); setFeatInput(""); setPkgModal("edit"); }
  function closePkg() { setPkgModal(null); setPkgEdit(null); }

  async function savePkg() {
    if (!pkgEdit?.name) { toast.error("Nama paket wajib diisi"); return; }
    setPkgSaving(true);
    const payload = {
      name: pkgEdit.name, type: pkgEdit.type || "premium",
      price_monthly: pkgEdit.price_monthly ?? 0, price_yearly: pkgEdit.price_yearly ?? 0,
      features: pkgEdit.features ?? [], max_users: pkgEdit.max_users ?? 1,
      is_active: pkgEdit.is_active ?? true,
    };
    const { error } = pkgModal === "create"
      ? await supabase.from("subscription_packages").insert(payload)
      : await supabase.from("subscription_packages").update(payload).eq("id", pkgEdit.id!);
    if (error) { toast.error("Gagal: " + error.message); }
    else { toast.success(pkgModal === "create" ? "Paket dibuat" : "Paket diperbarui"); closePkg(); loadAll(); }
    setPkgSaving(false);
  }

  async function deactivatePkg(id: string) {
    await supabase.from("subscription_packages").update({ is_active: false }).eq("id", id);
    toast.success("Paket dinonaktifkan"); setPkgDelId(null); loadAll();
  }

  function openCreateVc() {
    setVcEdit({ code: "", name: "", discount_type: "percentage", discount_value: 10, max_uses: null, min_purchase_amount: 0, valid_from: new Date().toISOString(), is_active: true });
    setVcModal("create");
  }
  function openEditVc(v: Voucher) { setVcEdit({ ...v }); setVcModal("edit"); }
  function closeVc() { setVcModal(null); setVcEdit(null); }

  function genCode() {
    setVcEdit(p => ({ ...p, code: "TALENTIKA" + Math.random().toString(36).slice(2, 7).toUpperCase() }));
  }

  async function saveVc() {
    if (!vcEdit?.code || !vcEdit.discount_value) { toast.error("Kode dan nilai diskon wajib diisi"); return; }
    setVcSaving(true);
    const payload = {
      code: vcEdit.code.toUpperCase().trim(),
      name: vcEdit.name || null, description: vcEdit.description || null,
      discount_type: vcEdit.discount_type || "percentage",
      discount_value: vcEdit.discount_value,
      max_uses: vcEdit.max_uses || null,
      min_purchase_amount: vcEdit.min_purchase_amount ?? 0,
      valid_from: vcEdit.valid_from || new Date().toISOString(),
      valid_until: vcEdit.valid_until || null,
      is_active: vcEdit.is_active ?? true,
    };
    const { error } = vcModal === "create"
      ? await supabase.from("voucher_codes").insert(payload)
      : await supabase.from("voucher_codes").update(payload).eq("id", vcEdit.id!);
    if (error) { toast.error("Gagal: " + error.message); }
    else { toast.success(vcModal === "create" ? "Voucher dibuat" : "Voucher diperbarui"); closeVc(); loadAll(); }
    setVcSaving(false);
  }

  async function deactivateVc(id: string) {
    await supabase.from("voucher_codes").update({ is_active: false }).eq("id", id);
    toast.success("Voucher dinonaktifkan"); setVcDelId(null); loadAll();
  }

  // ── Revenue analytics ────────────────────────────────────────────────────
  const weeklyData = (() => {
    const map: Record<string, number> = {};
    txs.filter(t => t.status === "completed").forEach(t => {
      const d = new Date(t.created_at);
      // Bucket by week (Monday)
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = d.toISOString().slice(0, 10);
      map[key] = (map[key] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, revenue]) => ({ week: week.slice(5), revenue }));
  })();

  const completedTxs = txs.filter(t => t.status === "completed");
  const now = new Date();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthRev   = completedTxs.filter(t => {
    const ts = new Date(t.created_at).getTime();
    return ts >= prevMonthStart && ts < monthStart;
  }).reduce((s, t) => s + t.amount, 0);
  const mom = prevMonthRev > 0
    ? Math.round(((stats.month - prevMonthRev) / prevMonthRev) * 100)
    : 0;
  const arpu = stats.subscribers > 0 ? Math.round(stats.month / stats.subscribers) : 0;

  const TAB_BTNS: { id: typeof tab; label: string; icon: React.ElementType }[] = [
    { id: "transactions", label: "Transaksi",       icon: TrendingUp },
    { id: "packages",     label: "Paket Langganan", icon: Star },
    { id: "vouchers",     label: "Voucher",         icon: Ticket },
    { id: "analytics",   label: "Analytics",        icon: BarChart2 },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { icon: DollarSign, value: fmtIDR(stats.total),  label: "Total Revenue",     sub: "Semua waktu",   color: "#2563EB" },
          { icon: TrendingUp, value: fmtIDR(stats.month),  label: "Revenue Bulan Ini", sub: new Date().toLocaleString("id-ID", { month: "long" }), color: "#059669" },
          { icon: Users,      value: stats.subscribers,    label: "Subscriber Aktif",  sub: "user_subscriptions", color: "#7C3AED" },
          { icon: CreditCard, value: stats.txCount,        label: "Transaksi Sukses",  sub: "status: completed",  color: "#D97706" },
        ].map(({ icon: Icon, value, label, sub, color }) => (
          <StatCard key={label} icon={Icon} value={value} label={label} sub={sub} color={color} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F1F5F9", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {TAB_BTNS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
            borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: tab === id ? 700 : 500,
            background: tab === id ? "white" : "transparent",
            color: tab === id ? "#0F172A" : "#64748B",
            boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,.08)" : "none",
            transition: "all .15s", fontFamily: "var(--tk-font-sans)",
          }}>
            <Icon size={14} /> {label}
          </button>
        ))}
        <button onClick={refresh} disabled={refreshing} style={{ marginLeft: 8, padding: "8px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: "transparent", color: "#94A3B8", display: "flex", alignItems: "center" }}>
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center" }}><Loader2 size={28} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : tab === "transactions" ? (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 110px 100px 120px", padding: "10px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", gap: 12 }}>
            <span>Invoice</span><span>Pengguna</span><span>Jumlah</span><span>Gateway</span><span>Status</span><span>Tanggal</span>
          </div>
          {txs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Belum ada transaksi</div>
          ) : txs.map((t, i) => {
            const st = TX_STATUS[t.status] ?? { label: t.status, bg: "#F1F5F9", color: "#475569" };
            return (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 110px 100px 120px", padding: "13px 20px", borderBottom: i < txs.length - 1 ? "1px solid #F1F5F9" : "none", gap: 12, alignItems: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                  {t.invoice_number ? (
                    <>{t.invoice_number.slice(0, 14)}…
                      <button onClick={() => { navigator.clipboard.writeText(t.invoice_number!); toast.success("Disalin"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94A3B8" }}>
                        <Copy size={10} />
                      </button>
                    </>
                  ) : t.id.slice(0, 8) + "…"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{(t.profiles as any)?.full_name ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{(t.profiles as any)?.email ?? t.user_id.slice(0, 8) + "…"}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0F172A" }}>{fmtIDR(t.amount)}</div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ background: "#EEF2FF", color: "#4338CA", borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>{t.payment_gateway ?? "—"}</span>
                </div>
                <div><Pill bg={st.bg} color={st.color}>{st.label}</Pill></div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{fmtDate(t.created_at)}</div>
              </div>
            );
          })}
        </div>
      ) : tab === "packages" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={openCreatePkg} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              <Plus size={15} /> Tambah Paket
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {packages.map(p => (
              <div key={p.id} style={{ background: "white", border: `1px solid ${p.is_active ? "#E2E8F0" : "#FEE2E2"}`, borderRadius: 14, padding: "20px 22px", position: "relative" }}>
                {!p.is_active && <div style={{ position: "absolute", top: 12, right: 12 }}><Pill bg="#FEE2E2" color="#991B1B">Nonaktif</Pill></div>}
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 17, color: "#0F172A", marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}><Pill bg="#EEF2FF" color="#4338CA">{p.type}</Pill></div>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Bulanan</div><div style={{ fontWeight: 700, color: "#0F172A" }}>{fmtIDR(p.price_monthly)}</div></div>
                  <div><div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Tahunan</div><div style={{ fontWeight: 700, color: "#0F172A" }}>{fmtIDR(p.price_yearly)}</div></div>
                </div>
                {(p.features ?? []).length > 0 && (
                  <ul style={{ margin: "0 0 14px", paddingLeft: 16, fontSize: 12, color: "#475569" }}>
                    {(p.features ?? []).slice(0, 4).map((f, i) => <li key={i}>{f}</li>)}
                    {(p.features ?? []).length > 4 && <li style={{ color: "#94A3B8" }}>+{(p.features ?? []).length - 4} lainnya</li>}
                  </ul>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => openEditPkg(p)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  {p.is_active && (
                    <button onClick={() => setPkgDelId(p.id)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", color: "#DC2626" }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={openCreateVc} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              <Plus size={15} /> Buat Voucher
            </button>
          </div>
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px 100px 100px 120px 80px", padding: "10px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", gap: 10 }}>
              <span>Kode</span><span>Nama</span><span>Diskon</span><span>Penggunaan</span><span>Status</span><span>Berlaku s/d</span><span>Aksi</span>
            </div>
            {vouchers.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Belum ada voucher</div>
            ) : vouchers.map((v, i) => {
              const expired = v.valid_until && new Date(v.valid_until) < new Date();
              const full = v.max_uses !== null && v.current_uses >= v.max_uses;
              return (
                <div key={v.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px 100px 100px 120px 80px", padding: "13px 20px", borderBottom: i < vouchers.length - 1 ? "1px solid #F1F5F9" : "none", gap: 10, alignItems: "center" }}>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#0F172A", display: "flex", alignItems: "center", gap: 4 }}>
                    {v.code}
                    <button onClick={() => { navigator.clipboard.writeText(v.code); toast.success("Disalin!"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0 }}><Copy size={10} /></button>
                  </div>
                  <div style={{ fontSize: 13, color: "#0F172A" }}>{v.name ?? "—"}</div>
                  <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>
                    {v.discount_type === "percentage" ? `${v.discount_value}%` : fmtIDR(v.discount_value)}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{v.current_uses}/{v.max_uses ?? "∞"}</div>
                  <div>
                    <Pill bg={v.is_active && !expired && !full ? "#D1FAE5" : "#FEE2E2"} color={v.is_active && !expired && !full ? "#065F46" : "#991B1B"}>
                      {!v.is_active ? "Nonaktif" : expired ? "Kedaluwarsa" : full ? "Habis" : "Aktif"}
                    </Pill>
                  </div>
                  <div style={{ fontSize: 12, color: expired ? "#DC2626" : "#64748B" }}>{v.valid_until ? fmtDate(v.valid_until) : "—"}</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => openEditVc(v)} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", color: "#475569" }}><Edit2 size={11} /></button>
                    {v.is_active && <button onClick={() => setVcDelId(v.id)} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", color: "#DC2626" }}><Trash2 size={11} /></button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pkgModal && pkgEdit && (
        <Modal title={pkgModal === "create" ? "Tambah Paket" : "Edit Paket"} onClose={closePkg}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", padding: "24px 28px" }}>
            <Field label="Nama Paket" half>
              <input value={pkgEdit.name ?? ""} onChange={e => setPkgEdit(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Premium Individual" />
            </Field>
            <Field label="Tipe" half>
              <select value={pkgEdit.type ?? "premium"} onChange={e => setPkgEdit(p => ({ ...p, type: e.target.value }))} style={selectStyle}>
                {["free", "premium", "school", "enterprise"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Harga Bulanan (IDR)" half>
              <input type="number" min={0} value={pkgEdit.price_monthly ?? 0} onChange={e => setPkgEdit(p => ({ ...p, price_monthly: +e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Harga Tahunan (IDR)" half>
              <input type="number" min={0} value={pkgEdit.price_yearly ?? 0} onChange={e => setPkgEdit(p => ({ ...p, price_yearly: +e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Max Pengguna" half>
              <input type="number" min={1} value={pkgEdit.max_users ?? 1} onChange={e => setPkgEdit(p => ({ ...p, max_users: +e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Fitur (tekan Enter untuk tambah)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                {(pkgEdit.features ?? []).map((f, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 3, background: "#EEF2FF", color: "#4338CA", borderRadius: 5, padding: "3px 7px", fontSize: 12 }}>
                    {f}<button onClick={() => setPkgEdit(p => ({ ...p, features: (p?.features ?? []).filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#4338CA" }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={featInput} onChange={e => setFeatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (featInput.trim()) { setPkgEdit(p => ({ ...p, features: [...(p?.features ?? []), featInput.trim()] })); setFeatInput(""); } } }} placeholder="Tambah fitur, Enter" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => { if (featInput.trim()) { setPkgEdit(p => ({ ...p, features: [...(p?.features ?? []), featInput.trim()] })); setFeatInput(""); } }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer" }}>+</button>
              </div>
            </Field>
            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle on={pkgEdit.is_active ?? true} onToggle={() => setPkgEdit(p => ({ ...p, is_active: !p?.is_active }))} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Aktif (ditampilkan ke pengguna)</span>
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
              <button onClick={closePkg} style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Batal</button>
              <button onClick={savePkg} disabled={pkgSaving} style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                {pkgSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {pkgSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {pkgDelId && <Confirm message="Nonaktifkan paket ini? Pengguna yang sudah berlangganan tidak terpengaruh." onConfirm={() => deactivatePkg(pkgDelId)} onCancel={() => setPkgDelId(null)} />}

      {vcModal && vcEdit && (
        <Modal title={vcModal === "create" ? "Buat Voucher" : "Edit Voucher"} onClose={closeVc}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", padding: "24px 28px" }}>
            <Field label="Kode Voucher" half>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={vcEdit.code ?? ""} onChange={e => setVcEdit(p => ({ ...p, code: e.target.value.toUpperCase() }))} style={{ ...inputStyle, flex: 1, fontFamily: "monospace", letterSpacing: ".05em" }} placeholder="TALENTIKA2025" />
                <button onClick={genCode} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>Auto</button>
              </div>
            </Field>
            <Field label="Nama Voucher" half>
              <input value={vcEdit.name ?? ""} onChange={e => setVcEdit(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Promo Lebaran" />
            </Field>
            <Field label="Tipe Diskon" half>
              <select value={vcEdit.discount_type ?? "percentage"} onChange={e => setVcEdit(p => ({ ...p, discount_type: e.target.value }))} style={selectStyle}>
                <option value="percentage">Persentase (%)</option>
                <option value="fixed_amount">Jumlah Tetap (IDR)</option>
              </select>
            </Field>
            <Field label={vcEdit.discount_type === "percentage" ? "Nilai Diskon (%)" : "Nilai Diskon (IDR)"} half>
              <input type="number" min={1} value={vcEdit.discount_value ?? 10} onChange={e => setVcEdit(p => ({ ...p, discount_value: +e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Maks Penggunaan (kosong = tidak terbatas)" half>
              <input type="number" min={1} value={vcEdit.max_uses ?? ""} onChange={e => setVcEdit(p => ({ ...p, max_uses: e.target.value ? +e.target.value : null }))} style={inputStyle} placeholder="∞ tanpa batas" />
            </Field>
            <Field label="Min. Pembelian (IDR)" half>
              <input type="number" min={0} value={vcEdit.min_purchase_amount ?? 0} onChange={e => setVcEdit(p => ({ ...p, min_purchase_amount: +e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Berlaku Dari" half>
              <input type="date" value={vcEdit.valid_from ? vcEdit.valid_from.slice(0, 10) : ""} onChange={e => setVcEdit(p => ({ ...p, valid_from: new Date(e.target.value).toISOString() }))} style={inputStyle} />
            </Field>
            <Field label="Berlaku Sampai (opsional)" half>
              <input type="date" value={vcEdit.valid_until ? vcEdit.valid_until.slice(0, 10) : ""} onChange={e => setVcEdit(p => ({ ...p, valid_until: e.target.value ? new Date(e.target.value).toISOString() : null }))} style={inputStyle} />
            </Field>
            <Field label="Deskripsi">
              <textarea value={vcEdit.description ?? ""} onChange={e => setVcEdit(p => ({ ...p, description: e.target.value }))} style={{ ...textareaStyle, minHeight: 60 }} placeholder="Keterangan voucher untuk internal" />
            </Field>
            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle on={vcEdit.is_active ?? true} onToggle={() => setVcEdit(p => ({ ...p, is_active: !p?.is_active }))} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Voucher aktif</span>
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
              <button onClick={closeVc} style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Batal</button>
              <button onClick={saveVc} disabled={vcSaving} style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                {vcSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {vcSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {vcDelId && <Confirm message="Nonaktifkan voucher ini?" onConfirm={() => deactivateVc(vcDelId)} onCancel={() => setVcDelId(null)} />}

      {/* ── Analytics tab ── */}
      {tab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[
              { label: "MRR",       value: fmtIDR(stats.month),  sub: `${mom >= 0 ? "+" : ""}${mom}% vs bulan lalu`, color: "#2563EB" },
              { label: "ARR (est)", value: fmtIDR(stats.month * 12), sub: "MRR × 12",            color: "#7C3AED" },
              { label: "ARPU",      value: fmtIDR(arpu),         sub: "Revenue / subscriber",     color: "#059669" },
              { label: "Subscribers",value: stats.subscribers,   sub: "Aktif saat ini",           color: "#D97706" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-.02em" }}>{value}</div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Weekly revenue chart */}
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 24px" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "#0F172A", marginBottom: 20 }}>
              Revenue Mingguan (12 minggu terakhir)
            </div>
            {weeklyData.length < 2 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                Belum cukup data untuk menampilkan grafik. Perlu minimal 2 minggu transaksi.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1_000_000).toFixed(1)}jt`} />
                  <Tooltip
                    formatter={(v: number) => [fmtIDR(v), "Revenue"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2563EB" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment method breakdown */}
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 24px" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "#0F172A", marginBottom: 16 }}>
              Breakdown Metode Pembayaran
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(() => {
                const methods: Record<string, number> = {};
                completedTxs.forEach(t => {
                  const m = t.payment_method ?? t.payment_gateway ?? "Lainnya";
                  methods[m] = (methods[m] ?? 0) + t.amount;
                });
                const total = Object.values(methods).reduce((a, b) => a + b, 0) || 1;
                return Object.entries(methods)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([method, amount]) => {
                    const pct = Math.round((amount / total) * 100);
                    return (
                      <div key={method}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#475569", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{method}</span>
                          <span>{fmtIDR(amount)} <span style={{ color: "#94A3B8" }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#2563EB", borderRadius: 99, transition: "width .5s" }} />
                        </div>
                      </div>
                    );
                  });
              })()}
              {completedTxs.length === 0 && (
                <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Belum ada transaksi berhasil</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
