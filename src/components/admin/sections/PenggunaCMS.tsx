import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Edit2, Loader2, Save } from "lucide-react";
import { inputStyle, selectStyle, Pill, Modal, Field } from "../adminShared";

interface UserProfile {
  id: string; user_id: string; full_name: string | null; email: string | null;
  subscription_type: string | null; subscription_status: string | null;
  subscription_end_date: string | null; created_at: string;
  role?: string;
}

const SUB_TYPE_CFG: Record<string, { label: string; bg: string; color: string }> = {
  free:       { label: "Free",       bg: "#F1F5F9", color: "#475569" },
  premium:    { label: "Premium",    bg: "#FEF3C7", color: "#92400E" },
  school:     { label: "School",     bg: "#DBEAFE", color: "#1D4ED8" },
  enterprise: { label: "Enterprise", bg: "#EDE9FE", color: "#5B21B6" },
};
const SUB_STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  active:    { label: "Aktif",    bg: "#D1FAE5", color: "#065F46" },
  inactive:  { label: "Inaktif", bg: "#F1F5F9", color: "#64748B" },
  expired:   { label: "Expired", bg: "#FEE2E2", color: "#991B1B" },
  cancelled: { label: "Batal",   bg: "#FEF3C7", color: "#92400E" },
};

export default function PenggunaCMS() {
  const [items, setItems]           = useState<UserProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterSub, setFilterSub]   = useState("all");
  const [modal, setModal]           = useState(false);
  const [editItem, setEditItem]     = useState<UserProfile | null>(null);
  const [saving, setSaving]         = useState(false);
  const [page, setPage]             = useState(0);
  const PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, email, subscription_type, subscription_status, subscription_end_date, created_at")
      .order("created_at", { ascending: false });

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap: Record<string, string> = {};
    (roles ?? []).forEach(r => { roleMap[r.user_id] = r.role; });

    setItems((profiles ?? []).map(p => ({ ...p, role: roleMap[p.user_id] ?? "individual" })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(u => {
    const q = search.toLowerCase();
    if (q && !(u.full_name ?? "").toLowerCase().includes(q) && !(u.email ?? "").toLowerCase().includes(q)) return false;
    if (filterSub !== "all" && u.subscription_type !== filterSub) return false;
    return true;
  });
  const paginated = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  function openEdit(u: UserProfile) { setEditItem({ ...u }); setModal(true); }
  function close() { setModal(false); setEditItem(null); }

  async function save() {
    if (!editItem) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      subscription_type: editItem.subscription_type,
      subscription_status: editItem.subscription_status,
      subscription_end_date: editItem.subscription_end_date || null,
    }).eq("user_id", editItem.user_id);
    if (error) { toast.error("Gagal menyimpan: " + error.message); }
    else { toast.success("Data pengguna diperbarui"); close(); load(); }
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Cari nama atau email…" style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <select value={filterSub} onChange={e => { setFilterSub(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 150 }}>
          <option value="all">Semua Paket</option>
          {Object.entries(SUB_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ fontSize: 13, color: "#64748B", padding: "9px 14px", background: "white", borderRadius: 9, border: "1px solid #E2E8F0" }}>
          <strong style={{ color: "#0F172A" }}>{filtered.length}</strong> pengguna
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 110px 130px 80px", padding: "10px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", gap: 12 }}>
          <span>Pengguna</span><span>Email</span><span>Paket</span><span>Status</span><span>Bergabung</span><span>Aksi</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Tidak ada pengguna ditemukan</div>
        ) : paginated.map((u, i) => {
          const subType = SUB_TYPE_CFG[u.subscription_type ?? "free"] ?? { label: u.subscription_type ?? "free", bg: "#F1F5F9", color: "#475569" };
          const subStat = SUB_STATUS_CFG[u.subscription_status ?? "inactive"] ?? { label: u.subscription_status, bg: "#F1F5F9", color: "#64748B" };
          const joined = new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
          const initials = (u.full_name ?? u.email ?? "?").slice(0, 2).toUpperCase();
          const isAdmin = u.role === "admin";
          return (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 110px 130px 80px", padding: "13px 20px", borderBottom: i < paginated.length - 1 ? "1px solid #F1F5F9" : "none", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: isAdmin ? "#2563EB" : "#EEF2FF", color: isAdmin ? "white" : "#4338CA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{u.full_name ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{isAdmin ? "🛡 Admin" : "👤 User"}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email ?? "—"}</div>
              <div><Pill bg={subType.bg} color={subType.color}>{subType.label}</Pill></div>
              <div><Pill bg={subStat.bg} color={subStat.color}>{subStat.label}</Pill></div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{joined}</div>
              <div>
                <button onClick={() => openEdit(u)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#475569" }}>
                  <Edit2 size={12} /> Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, alignItems: "center" }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ padding: "5px 12px", borderRadius: 7, border: page === i ? "none" : "1px solid #E2E8F0", background: page === i ? "#2563EB" : "white", color: page === i ? "white" : "#475569", fontWeight: page === i ? 700 : 400, cursor: "pointer", fontSize: 13 }}>{i + 1}</button>
          ))}
        </div>
      )}

      {modal && editItem && (
        <Modal title={`Edit Langganan — ${editItem.full_name ?? editItem.email}`} onClose={close}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", padding: "28px 28px 24px" }}>
            <div style={{ gridColumn: "span 2", background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Info Pengguna</div>
              <div style={{ fontSize: 14, color: "#0F172A", fontWeight: 600 }}>{editItem.full_name ?? "—"}</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>{editItem.email}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>ID: {editItem.user_id}</div>
            </div>
            <Field label="Paket Langganan" half>
              <select value={editItem.subscription_type ?? "free"} onChange={e => setEditItem(p => p ? ({ ...p, subscription_type: e.target.value }) : p)} style={selectStyle}>
                {Object.entries(SUB_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Status" half>
              <select value={editItem.subscription_status ?? "inactive"} onChange={e => setEditItem(p => p ? ({ ...p, subscription_status: e.target.value }) : p)} style={selectStyle}>
                {Object.entries(SUB_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Tanggal Berakhir">
              <input type="datetime-local" value={editItem.subscription_end_date ? editItem.subscription_end_date.slice(0, 16) : ""} onChange={e => setEditItem(p => p ? ({ ...p, subscription_end_date: e.target.value ? new Date(e.target.value).toISOString() : null }) : p)} style={inputStyle} />
            </Field>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
              <button onClick={close} style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Batal</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
