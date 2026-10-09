/**
 * CareersCMS — katalog karier & kampus untuk aplikasi mobile (Discover:
 * Career Explorer, Career Detail, Compare, Simulator, University Explorer).
 *
 * Career Fit % di aplikasi dihitung dari "bobot sumbu" karier × Talent DNA
 * siswa, jadi bobot di sini menentukan urutan rekomendasi. Gaji & biaya kuliah
 * ditampilkan dengan label "perkiraan" — isi dari sumber yang bisa dicek.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Compass, GraduationCap } from "lucide-react";
import { inputStyle, textareaStyle, selectStyle, Toggle, Modal, Field, Confirm } from "../adminShared";

const db = supabase as any;
const AXES: [string, string][] = [["analytical", "Analitis"], ["creative", "Kreatif"], ["leadership", "Kepemimpinan"], ["technology", "Teknologi"], ["communication", "Komunikasi"]];
const PALET: [string, string][] = [["#E8F1FF", "#1E40AF"], ["#E6F7EF", "#16A34A"], ["#FFEDE2", "#C04400"], ["#F0E8FF", "#7C3AED"], ["#FFF6E0", "#A47000"], ["#E0F2FE", "#0369A1"], ["#FDECEC", "#DC2626"]];
const list = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);

interface Career {
  id: string; name: string; name_en: string | null; field: string; initial: string; bg: string; fg: string; demand: string | null; salary: string | null;
  what: string; skills: string[]; tools: string[]; edu: string[]; projects: string[]; industries: string[]; roadmap: [string, string][];
  axes: Record<string, number>; riasec: string | null; sort: number; is_active: boolean;
}
interface Uni {
  id?: string; name: string; short: string; location: string; kind: string; programs: string[]; admission_routes: string[];
  selectivity: string | null; cost: string | null; aid: string | null; website: string | null; bg: string; fg: string; is_active: boolean; sort: number;
}

export default function CareersCMS() {
  const [tab, setTab] = useState<"careers" | "unis">("careers");
  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)} style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, background: tab === id ? "#2563EB" : "transparent", color: tab === id ? "#fff" : "#64748B" }}>{label}</button>
  );
  return (
    <div>
      <div style={{ display: "inline-flex", gap: 4, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 4, marginBottom: 20 }}>
        <TabBtn id="careers" label="💼 Karier" />
        <TabBtn id="unis" label="🎓 Kampus" />
      </div>
      {tab === "careers" ? <Careers /> : <Universities />}
    </div>
  );
}

function Careers() {
  const [rows, setRows] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Career> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [txt, setTxt] = useState({ skills: "", tools: "", edu: "", projects: "", industries: "", roadmap: "" });
  const [saving, setSaving] = useState(false);
  const [hapus, setHapus] = useState<Career | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await db.from("careers").select("*").order("sort");
    if (error) toast.error(error.message);
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const open = (c?: Career) => {
    setIsNew(!c);
    setForm(c ? { ...c } : { id: "", field: "", initial: "", bg: PALET[0][0], fg: PALET[0][1], axes: { technology: 1 }, is_active: true, sort: rows.length + 1 });
    setTxt({
      skills: (c?.skills ?? []).join(", "), tools: (c?.tools ?? []).join(", "), edu: (c?.edu ?? []).join(", "),
      projects: (c?.projects ?? []).join(", "), industries: (c?.industries ?? []).join(", "),
      roadmap: (c?.roadmap ?? []).map(([w, t]) => `${w} | ${t}`).join("\n"),
    });
  };

  const save = async () => {
    if (!form) return;
    const id = (form.id ?? "").trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,20}$/.test(id)) { toast.error("ID 2–20 huruf kecil/angka, mis. 'ai' atau 'ux_res'"); return; }
    if (!form.name?.trim() || !form.field?.trim() || !form.what?.trim()) { toast.error("Nama, bidang, dan deskripsi wajib diisi"); return; }
    const axes = Object.fromEntries(Object.entries(form.axes ?? {}).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)]));
    if (!Object.keys(axes).length) { toast.error("Isi minimal satu bobot sumbu Talent DNA"); return; }
    const row = {
      id, name: form.name.trim(), name_en: form.name_en?.trim() || null, field: form.field.trim(),
      initial: (form.initial?.trim() || form.name.trim().slice(0, 2)).toUpperCase().slice(0, 3),
      bg: form.bg, fg: form.fg, demand: form.demand?.trim() || null, salary: form.salary?.trim() || null, what: form.what.trim(),
      skills: list(txt.skills), tools: list(txt.tools), edu: list(txt.edu), projects: list(txt.projects), industries: list(txt.industries),
      roadmap: txt.roadmap.split("\n").map(l => l.split("|").map(x => x.trim())).filter(([a, b]) => a && b).map(([a, b]) => [a, b]),
      axes, riasec: form.riasec?.trim().toUpperCase() || null, sort: Number(form.sort) || 0, is_active: form.is_active !== false,
      updated_at: new Date().toISOString(),
    };
    setSaving(true);
    const { error } = isNew ? await db.from("careers").insert(row) : await db.from("careers").update(row).eq("id", form.id);
    setSaving(false);
    if (error) { toast.error(/duplicate/i.test(error.message) ? "ID karier sudah dipakai" : error.message); return; }
    toast.success("Karier disimpan"); setForm(null); load();
  };

  const toggle = async (c: Career) => {
    await db.from("careers").update({ is_active: !c.is_active }).eq("id", c.id);
    setRows(rows.map(r => r.id === c.id ? { ...r, is_active: !c.is_active } : r));
  };
  const remove = async () => {
    if (!hapus) return;
    const { error } = await db.from("careers").delete().eq("id", hapus.id);
    setHapus(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Karier dihapus"); load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
        <div style={{ fontSize: 13, color: "#64748B" }}>{rows.filter(r => r.is_active).length} aktif dari {rows.length} karier · siswa yang memilih karier sebagai target akan kehilangan targetnya bila ID dihapus</div>
        <button onClick={() => open()} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer", flexShrink: 0 }}><Plus size={15} /> Tambah Karier</button>
      </div>
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
          : !rows.length ? <div style={{ padding: 50, textAlign: "center", color: "#94A3B8" }}><Compass size={32} style={{ margin: "0 auto 10px", opacity: .5 }} />Belum ada karier</div>
          : rows.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: i ? "1px solid #F1F5F9" : "none", opacity: c.is_active ? 1 : 0.55 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: c.bg, color: c.fg, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{c.initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{c.name} <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>· {c.id}</span></div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{c.field}{c.demand ? ` · ${c.demand}` : ""}{c.salary ? ` · ${c.salary}` : ""}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 3 }}>Bobot: {Object.entries(c.axes || {}).map(([k, v]) => `${AXES.find(a => a[0] === k)?.[1] ?? k} ${v}`).join(" · ")}</div>
              </div>
              <Toggle on={c.is_active} onToggle={() => toggle(c)} />
              <button onClick={() => open(c)} title="Ubah" style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", cursor: "pointer" }}><Pencil size={13} /></button>
              <button onClick={() => setHapus(c)} title="Hapus" style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #FECACA", background: "white", color: "#B91C1C", cursor: "pointer" }}><Trash2 size={13} /></button>
            </div>
          ))}
      </div>

      {form && (
        <Modal title={isNew ? "Tambah Karier" : `Ubah ${form.name}`} onClose={() => setForm(null)} wide>
          <div style={{ padding: "20px 28px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="ID (slug, tetap)" half><input value={form.id ?? ""} disabled={!isNew} onChange={e => setForm(p => ({ ...p, id: e.target.value }))} placeholder="mis. swe" style={inputStyle} /></Field>
              <Field label="Urutan" half><input type="number" value={form.sort ?? 0} onChange={e => setForm(p => ({ ...p, sort: Number(e.target.value) }))} style={inputStyle} /></Field>
              <Field label="Nama karier" half><input value={form.name ?? ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Software Engineer" style={inputStyle} /></Field>
              <Field label="Nama (English)" half><input value={form.name_en ?? ""} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))} style={inputStyle} /></Field>
              <Field label="Bidang" half><input value={form.field ?? ""} onChange={e => setForm(p => ({ ...p, field: e.target.value }))} placeholder="Technology / Sustainability / Kesehatan…" style={inputStyle} /></Field>
              <Field label="Inisial ikon (2–3 huruf)" half><input value={form.initial ?? ""} maxLength={3} onChange={e => setForm(p => ({ ...p, initial: e.target.value }))} placeholder="SE" style={inputStyle} /></Field>
              <Field label="Permintaan pasar" half><input value={form.demand ?? ""} onChange={e => setForm(p => ({ ...p, demand: e.target.value }))} placeholder="Tinggi ↗" style={inputStyle} /></Field>
              <Field label="Rentang gaji (perkiraan)" half><input value={form.salary ?? ""} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="Rp9–28 jt/bln" style={inputStyle} /></Field>
              <Field label="Apa yang mereka kerjakan"><textarea value={form.what ?? ""} onChange={e => setForm(p => ({ ...p, what: e.target.value }))} rows={3} style={textareaStyle} /></Field>
              <Field label="Skills (koma)" half><input value={txt.skills} onChange={e => setTxt({ ...txt, skills: e.target.value })} placeholder="Python, Git, Databases" style={inputStyle} /></Field>
              <Field label="Tools (koma)" half><input value={txt.tools} onChange={e => setTxt({ ...txt, tools: e.target.value })} placeholder="VS Code, Docker" style={inputStyle} /></Field>
              <Field label="Jurusan relevan (koma, dicocokkan ke program kampus)" half><input value={txt.edu} onChange={e => setTxt({ ...txt, edu: e.target.value })} placeholder="Teknik Informatika, Ilmu Komputer" style={inputStyle} /></Field>
              <Field label="Industri (koma)" half><input value={txt.industries} onChange={e => setTxt({ ...txt, industries: e.target.value })} style={inputStyle} /></Field>
              <Field label="Contoh project (koma)"><input value={txt.projects} onChange={e => setTxt({ ...txt, projects: e.target.value })} style={inputStyle} /></Field>
              <Field label="Roadmap (satu baris: waktu | langkah)"><textarea value={txt.roadmap} onChange={e => setTxt({ ...txt, roadmap: e.target.value })} rows={4} placeholder={"Sekarang | Belajar satu bahasa pemrograman\nTahun 1 | S1 + project open source"} style={textareaStyle} /></Field>
              <Field label="Bobot sumbu Talent DNA (0–1) — menentukan Career Fit %">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                  {AXES.map(([k, l]) => (
                    <label key={k} style={{ fontSize: 12, color: "#475569" }}>{l}
                      <input type="number" min={0} max={1} step={0.1} value={form.axes?.[k] ?? ""} onChange={e => setForm(p => ({ ...p, axes: { ...(p?.axes ?? {}), [k]: e.target.value === "" ? 0 : Number(e.target.value) } }))} style={{ ...inputStyle, marginTop: 4 }} />
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Kode RIASEC (opsional)" half><input value={form.riasec ?? ""} maxLength={3} onChange={e => setForm(p => ({ ...p, riasec: e.target.value }))} placeholder="IR" style={inputStyle} /></Field>
              <Field label="Warna ikon" half>
                <div style={{ display: "flex", gap: 6 }}>
                  {PALET.map(([bg, fg]) => <button key={bg} onClick={() => setForm(p => ({ ...p, bg, fg }))} style={{ width: 30, height: 30, borderRadius: 8, background: bg, border: form.bg === bg ? `2px solid ${fg}` : "1px solid #E2E8F0", color: fg, fontWeight: 800, cursor: "pointer" }}>A</button>)}
                </div>
              </Field>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => setForm(null)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>{saving ? "Menyimpan…" : "Simpan"}</button>
            </div>
          </div>
        </Modal>
      )}
      {hapus && <Confirm message={`Hapus karier "${hapus.name}"? Lebih aman dinonaktifkan bila sudah dipakai siswa sebagai target.`} onConfirm={remove} onCancel={() => setHapus(null)} />}
    </div>
  );
}

function Universities() {
  const [rows, setRows] = useState<Uni[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Uni | null>(null);
  const [txt, setTxt] = useState({ programs: "", routes: "" });
  const [saving, setSaving] = useState(false);
  const [hapus, setHapus] = useState<Uni | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await db.from("universities").select("*").order("sort");
    if (error) toast.error(error.message);
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const open = (u?: Uni) => {
    setForm(u ? { ...u } : { name: "", short: "", location: "", kind: "PTN", programs: [], admission_routes: [], selectivity: null, cost: null, aid: null, website: null, bg: PALET[0][0], fg: PALET[0][1], is_active: true, sort: rows.length + 1 });
    setTxt({ programs: (u?.programs ?? []).join(", "), routes: (u?.admission_routes ?? []).join(", ") });
  };
  const save = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.short.trim() || !form.location.trim()) { toast.error("Nama, singkatan, dan lokasi wajib diisi"); return; }
    if (form.website && !/^https?:\/\//.test(form.website)) { toast.error("Situs resmi harus diawali https://"); return; }
    const { id, ...rest } = form;
    const row = { ...rest, short: form.short.trim().slice(0, 4), programs: list(txt.programs), admission_routes: list(txt.routes) };
    setSaving(true);
    const { error } = id ? await db.from("universities").update(row).eq("id", id) : await db.from("universities").insert(row);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Kampus disimpan"); setForm(null); load();
  };
  const toggle = async (u: Uni) => { await db.from("universities").update({ is_active: !u.is_active }).eq("id", u.id); load(); };
  const remove = async () => { if (!hapus) return; await db.from("universities").delete().eq("id", hapus.id); setHapus(null); load(); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: "#64748B" }}>Biaya & jalur masuk tampil dengan catatan "cek situs resmi kampus".</div>
        <button onClick={() => open()} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}><Plus size={15} /> Tambah Kampus</button>
      </div>
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
          : !rows.length ? <div style={{ padding: 50, textAlign: "center", color: "#94A3B8" }}><GraduationCap size={32} style={{ margin: "0 auto 10px", opacity: .5 }} />Belum ada kampus</div>
          : rows.map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: i ? "1px solid #F1F5F9" : "none", opacity: u.is_active ? 1 : 0.55 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: u.bg, color: u.fg, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{u.short}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{u.location} · {u.kind} · {u.programs.length} program · {u.admission_routes.join(", ")}</div>
              </div>
              <Toggle on={u.is_active} onToggle={() => toggle(u)} />
              <button onClick={() => open(u)} style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", cursor: "pointer" }}><Pencil size={13} /></button>
              <button onClick={() => setHapus(u)} style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #FECACA", background: "white", color: "#B91C1C", cursor: "pointer" }}><Trash2 size={13} /></button>
            </div>
          ))}
      </div>
      {form && (
        <Modal title={form.id ? `Ubah ${form.name}` : "Tambah Kampus"} onClose={() => setForm(null)}>
          <div style={{ padding: "20px 28px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Nama kampus"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></Field>
              <Field label="Singkatan" half><input value={form.short} maxLength={4} onChange={e => setForm({ ...form, short: e.target.value })} placeholder="UI" style={inputStyle} /></Field>
              <Field label="Jenis" half>
                <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} style={selectStyle}>{["PTN", "Swasta", "Luar negeri"].map(k => <option key={k}>{k}</option>)}</select>
              </Field>
              <Field label="Lokasi" half><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Depok" style={inputStyle} /></Field>
              <Field label="Keketatan" half><input value={form.selectivity ?? ""} onChange={e => setForm({ ...form, selectivity: e.target.value || null })} placeholder="Sangat ketat" style={inputStyle} /></Field>
              <Field label="Program studi (koma — dicocokkan dengan jurusan karier)"><input value={txt.programs} onChange={e => setTxt({ ...txt, programs: e.target.value })} style={inputStyle} /></Field>
              <Field label="Jalur masuk (koma)"><input value={txt.routes} onChange={e => setTxt({ ...txt, routes: e.target.value })} placeholder="SNBP, SNBT, Mandiri" style={inputStyle} /></Field>
              <Field label="Biaya (perkiraan)" half><input value={form.cost ?? ""} onChange={e => setForm({ ...form, cost: e.target.value || null })} placeholder="UKT Rp500rb–17,5 jt/smt" style={inputStyle} /></Field>
              <Field label="Beasiswa" half><input value={form.aid ?? ""} onChange={e => setForm({ ...form, aid: e.target.value || null })} placeholder="KIP Kuliah" style={inputStyle} /></Field>
              <Field label="Situs resmi"><input value={form.website ?? ""} onChange={e => setForm({ ...form, website: e.target.value || null })} placeholder="https://" style={inputStyle} /></Field>
              <Field label="Warna ikon">
                <div style={{ display: "flex", gap: 6 }}>{PALET.map(([bg, fg]) => <button key={bg} onClick={() => setForm({ ...form, bg, fg })} style={{ width: 30, height: 30, borderRadius: 8, background: bg, border: form.bg === bg ? `2px solid ${fg}` : "1px solid #E2E8F0", color: fg, fontWeight: 800, cursor: "pointer" }}>A</button>)}</div>
              </Field>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => setForm(null)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>{saving ? "Menyimpan…" : "Simpan"}</button>
            </div>
          </div>
        </Modal>
      )}
      {hapus && <Confirm message={`Hapus ${hapus.name}?`} onConfirm={remove} onCancel={() => setHapus(null)} />}
    </div>
  );
}
