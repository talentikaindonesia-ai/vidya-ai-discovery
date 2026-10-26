import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Circle, Lock, Download, ArrowLeft, BadgeCheck, Map as MapIcon } from "lucide-react";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { teksAlasanRoadmap } from "@/lib/peluang";

/**
 * Roadmap dari praktisi — versi web (/roadmap, /roadmap/:slug).
 * Data & gating SAMA dengan aplikasi: roadmap_untukku(), roadmap_detail(),
 * tandai_langkah() (Free 2 langkah pertama, Plus semua + PDF).
 */
const db = supabase as any;

export interface RoadmapRingkas {
  id: string; slug: string; judul: string; ringkasan: string | null;
  penulis_nama: string | null; penulis_peran: string | null; penulis_foto: string | null; terverifikasi: boolean;
  career_nama: string | null; durasi: string | null; jumlah_langkah: number; selesai: number; alasan: string[];
}

const wrap: React.CSSProperties = { maxWidth: 760, margin: "0 auto", padding: "104px 16px 56px", color: "#0F172A" };
const kartu: React.CSSProperties = { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: 16 };

function Foto({ src, nama, size = 40 }: { src?: string | null; nama?: string | null; size?: number }) {
  return src
    ? <img src={src} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
    : <span style={{ width: size, height: size, borderRadius: "50%", background: "#EDE9FE", color: "#6D28D9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flex: "none" }}>{(nama || "?")[0]}</span>;
}

export function KartuRoadmap({ r }: { r: RoadmapRingkas }) {
  const pct = r.jumlah_langkah ? Math.round((r.selesai / r.jumlah_langkah) * 100) : 0;
  return (
    <Link to={`/roadmap/${r.slug}`} style={{ ...kartu, display: "flex", flexDirection: "column", gap: 8, textDecoration: "none", color: "inherit" }}>
      <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Foto src={r.penulis_foto} nama={r.penulis_nama} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700 }}>{r.penulis_nama}{r.terverifikasi && <BadgeCheck size={14} color="#2563EB" />}</span>
          <span style={{ display: "block", fontSize: 12, color: "#64748B" }}>{r.penulis_peran}</span>
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: "#6D28D9", background: "#EDE9FE", padding: "3px 9px", borderRadius: 99 }}>ROADMAP</span>
      </span>
      <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{r.judul}</span>
      {r.ringkasan && <span style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>{r.ringkasan}</span>}
      <span style={{ fontSize: 12.5, color: "#334155" }}>
        {r.jumlah_langkah} langkah{r.durasi ? ` · ${r.durasi}` : ""}
        {r.alasan?.[0] && <span style={{ color: "#2563EB", fontWeight: 600 }}> · {teksAlasanRoadmap(r.alasan[0])}</span>}
      </span>
      {r.selesai > 0 && (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, height: 6, borderRadius: 99, background: "#E2E8F0" }}><span style={{ display: "block", width: `${pct}%`, height: "100%", borderRadius: 99, background: "#16A34A" }} /></span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A" }}>{r.selesai}/{r.jumlah_langkah}</span>
        </span>
      )}
    </Link>
  );
}

export function useRoadmapWeb(limit = 20) {
  const [data, setData] = useState<RoadmapRingkas[] | null>(null);
  useEffect(() => { db.rpc("roadmap_untukku", { p_career: null, p_limit: limit }).then(({ data }: any) => setData(data ?? [])); }, [limit]);
  return data;
}

/** Kartu sorotan di dashboard web — tidak tampil bila belum ada roadmap terbit. */
export function RoadmapPilihanCard() {
  const data = useRoadmapWeb(1);
  if (!data?.length) return null;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>Roadmap pilihan untukmu</span>
        <Link to="/roadmap" style={{ fontSize: 13, fontWeight: 600, color: "#2563EB" }}>Lihat semua →</Link>
      </div>
      <KartuRoadmap r={data[0]} />
    </div>
  );
}

export function RoadmapDaftar() {
  const data = useRoadmapWeb(30);
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <SEO title="Roadmap dari Praktisi – Talentika" description="Jalur langkah demi langkah dari praktisi untuk karier impianmu." />
      <Header />
      <main style={wrap}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 800, margin: 0 }}>Roadmap dari praktisi</h1>
        <p style={{ color: "#64748B", fontSize: 14.5, marginTop: 6 }}>Jalur langkah demi langkah dari orang yang sudah menempuhnya — diurutkan sesuai tipe minat, jenjang, dan target kariermu.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          {data === null && <div style={{ color: "#94A3B8" }}>Memuat…</div>}
          {data?.map(r => <KartuRoadmap key={r.id} r={r} />)}
          {data && !data.length && (
            <div style={{ ...kartu, textAlign: "center", color: "#64748B" }}>
              <MapIcon size={28} style={{ margin: "0 auto 8px" }} />Roadmap dari praktisi sedang disiapkan. Cek lagi segera.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function RoadmapDetailWeb() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [r, setR] = useState<any>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [umpan, setUmpan] = useState<boolean | null>(null);

  const muat = async () => setR((await db.rpc("roadmap_detail", { p_slug: slug })).data ?? null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); muat(); }, [slug]); // eslint-disable-line
  useEffect(() => {
    if (!r?.id || !userId || r.status !== "terbit") return;
    db.rpc("catat_lihat_roadmap", { p_roadmap: r.id }).then(() => {});
    db.from("roadmap_umpan_balik").select("relevan").eq("user_id", userId).eq("roadmap_id", r.id).maybeSingle().then(({ data }: any) => setUmpan(data?.relevan ?? null));
  }, [r?.id, userId]); // eslint-disable-line

  if (r === undefined) return <div style={{ padding: 120, textAlign: "center", color: "#94A3B8" }}>Memuat…</div>;
  if (r === null) return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}><Header />
      <main style={wrap}><div style={kartu}>Roadmap tidak ditemukan. <Link to="/roadmap" style={{ color: "#2563EB" }}>Lihat roadmap lain</Link></div></main>
    </div>
  );

  const langkah = (r.langkah ?? []) as any[];
  const selesai = langkah.filter(l => l.selesai).length;
  const centang = async (l: any) => {
    if (!userId) { navigate("/auth"); return; }
    const { error } = await db.rpc("tandai_langkah", { p_langkah: l.id, p_selesai: !l.selesai });
    if (error) {
      if (String(error.message).includes("KUOTA_ROADMAP")) { toast.info("Langkah lengkap tersedia di Talentika Plus."); navigate("/subscription?from=%2Froadmap"); }
      else toast.error(error.message);
      return;
    }
    muat();
  };
  const buka = (l: any) => {
    if (l.tautan_tipe === "materi") navigate(`/learning/content/${l.tautan_id}`);
    else if (l.tautan_tipe === "peluang") navigate("/opportunities");
    else if (l.tautan_tipe === "url" && /^https?:\/\//.test(l.tautan_id)) window.open(l.tautan_id, "_blank", "noopener");
  };
  const pdf = async () => {
    const { data } = await supabase.storage.from("roadmap").createSignedUrl(r.pdf_path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener"); else toast.error("PDF belum bisa dibuka.");
  };
  const kirimUmpan = async (v: boolean) => {
    if (!userId) return;
    const { error } = await db.from("roadmap_umpan_balik").upsert({ user_id: userId, roadmap_id: r.id, relevan: v, dibuat_pada: new Date().toISOString() }, { onConflict: "user_id,roadmap_id" });
    if (error) { toast.error("Gagal menyimpan masukan"); return; }
    setUmpan(v); toast.success("Terima kasih atas masukanmu!");
  };
  const tombol: React.CSSProperties = { border: "1px solid #E2E8F0", background: "#fff", borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <SEO title={`${r.judul} – Roadmap Talentika`} description={r.ringkasan ?? "Roadmap dari praktisi di Talentika."} />
      <Header />
      <main style={wrap}>
        <Link to="/roadmap" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#2563EB", textDecoration: "none" }}><ArrowLeft size={15} /> Semua roadmap</Link>
        {r.cover_url && <img src={r.cover_url} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 18, marginTop: 14 }} />}
        <h1 style={{ fontSize: "clamp(24px, 4.5vw, 32px)", fontWeight: 800, lineHeight: 1.25, margin: "14px 0 0" }}>{r.judul}</h1>
        {r.ringkasan && <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>{r.ringkasan}</p>}
        <div style={{ ...kartu, display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
          <Foto src={r.penulis?.foto} nama={r.penulis?.nama} size={48} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>{r.penulis?.nama}{r.penulis?.terverifikasi && <span style={{ fontSize: 11, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: 99 }}>Terverifikasi</span>}</div>
            <div style={{ fontSize: 13, color: "#64748B" }}>{r.penulis?.peran}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 10 }}>{r.jumlah_langkah} langkah{r.durasi ? ` · ${r.durasi}` : ""}{r.career_nama ? ` · ${r.career_nama}` : ""}{userId ? ` · progresmu ${selesai}/${r.jumlah_langkah}` : ""}</div>

        <div style={{ ...kartu, marginTop: 16 }}>
          {langkah.map((l, i) => (
            <div key={l.id} style={{ display: "flex", gap: 12, paddingBottom: i < langkah.length - 1 ? 16 : 0, marginBottom: i < langkah.length - 1 ? 16 : 0, borderBottom: i < langkah.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <button onClick={() => centang(l)} aria-label={l.selesai ? "Tandai belum" : "Tandai selesai"} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", color: l.selesai ? "#16A34A" : "#94A3B8", flex: "none" }}>
                {l.selesai ? <CheckCircle2 size={26} /> : <Circle size={26} />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, textDecoration: l.selesai ? "line-through" : "none", color: l.selesai ? "#64748B" : "#0F172A" }}>{l.urut}. {l.judul}</span>
                  {l.perkiraan && <span style={{ fontSize: 12, color: "#64748B", flex: "none" }}>{l.perkiraan}</span>}
                </div>
                {l.isi && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-line" }}>{l.isi}</p>}
                {l.tautan_tipe && l.tautan_id && l.tautan_tipe !== "karier" && <button onClick={() => buka(l)} style={{ ...tombol, marginTop: 8, color: "#2563EB" }}>{l.tautan_tipe === "materi" ? "Buka materi" : l.tautan_tipe === "peluang" ? "Lihat peluang" : "Buka tautan"} →</button>}
              </div>
            </div>
          ))}
        </div>

        {r.terkunci > 0 && (
          <Link to="/subscription?from=%2Froadmap" style={{ ...kartu, display: "flex", gap: 12, alignItems: "center", marginTop: 12, textDecoration: "none", color: "inherit", borderStyle: "dashed", borderColor: "#BFDBFE" }}>
            <Lock size={20} color="#B45309" />
            <span style={{ flex: 1 }}><b>{r.terkunci} langkah berikutnya{r.ada_pdf ? " + panduan PDF" : ""}</b><br /><span style={{ fontSize: 13, color: "#64748B" }}>Roadmap lengkap dari praktisi tersedia di Talentika Plus.</span></span>
            <span style={{ fontSize: 11, fontWeight: 800, background: "#FFD146", color: "#7A5200", padding: "3px 9px", borderRadius: 99 }}>PLUS</span>
          </Link>
        )}
        {r.plus && r.ada_pdf && r.pdf_path && <button onClick={pdf} style={{ ...tombol, marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6 }}><Download size={15} /> Unduh panduan PDF</button>}

        {userId && r.status === "terbit" && (
          <div style={{ ...kartu, marginTop: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, flex: 1 }}>Apakah roadmap ini relevan untukmu?</span>
            {([true, false] as const).map(v => (
              <button key={String(v)} onClick={() => kirimUmpan(v)} aria-pressed={umpan === v}
                style={{ ...tombol, borderColor: umpan === v ? "#2563EB" : "#E2E8F0", background: umpan === v ? "#EFF6FF" : "#fff" }}>{v ? "👍 Relevan" : "👎 Tidak relevan"}</button>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12.5, color: "#94A3B8", textAlign: "center", marginTop: 18 }}>Roadmap ini berisi pengalaman dan pandangan pribadi penulis — gunakan sebagai panduan, bukan satu-satunya jalan.</p>
      </main>
    </div>
  );
}

export default function RoadmapWeb() {
  const { slug } = useParams();
  return slug ? <RoadmapDetailWeb /> : <RoadmapDaftar />;
}
