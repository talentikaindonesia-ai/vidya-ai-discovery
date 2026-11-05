/**
 * Halaman peluang publik untuk mesin pencari & berbagi tautan.
 *
 *   /peluang         daftar beasiswa, kompetisi, magang (tanpa login)
 *   /peluang/:slug   ringkasan satu peluang
 *
 * Keputusan produk (2026-11-05): pengunjung tanpa login hanya melihat
 * ringkasan. Syarat lengkap, manfaat, dan tautan pendaftaran resmi dibuka
 * setelah login lewat buka_peluang() — kuota akun Free 5 peluang/bulan,
 * sama dengan /opportunities dan aplikasi.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Calendar, ExternalLink, GraduationCap, Loader2, Lock, MapPin, Sparkles, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { GAMBAR_PELUANG_DEFAULT } from "@/lib/peluang";
import {
  BIAYA_PELUANG, JENJANG_PELUANG, bolehDiindeks, fmtTanggal, idDariSlug, labelJenis, ringkasan, urlPeluang,
} from "@/lib/peluangPublik";

const db = supabase as any;
const DOMAIN = "https://talentika.id";
const KOLOM_PUBLIK = "id,title,organizer,opportunity_type,jenjang_target,deadline,tanpa_tenggat,poster_url,description,location,cost,wilayah_peserta,is_active,created_at";

interface Ringkas {
  id: string; title: string; organizer: string | null; opportunity_type: string | null; jenjang_target: string[] | null;
  deadline: string | null; tanpa_tenggat: boolean | null; poster_url: string | null; description: string | null;
  location: string | null; cost: string | null; wilayah_peserta: string | null; is_active: boolean | null; created_at: string;
}

const C = { ink: "#0F172A", muted: "#64748B", line: "#E2E8F0", blue: "#2563EB", soft: "#F8FAFC" };
const wadah: CSSProperties = { maxWidth: 1080, margin: "0 auto", padding: "0 16px" };

const teksTenggat = (p: Pick<Ringkas, "deadline" | "tanpa_tenggat">) =>
  p.deadline ? `Tenggat ${fmtTanggal(p.deadline)}` : p.tanpa_tenggat ? "Pendaftaran bergulir" : "Tenggat belum diumumkan";

const teksJenjang = (j: string[] | null) => (j ?? []).map(x => JENJANG_PELUANG[x] ?? x).join(", ");

function Lencana({ children, warna = "#EFF6FF", teks = "#1D4ED8" }: { children: ReactNode; warna?: string; teks?: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: teks, background: warna, padding: "4px 10px", borderRadius: 99 }}>{children}</span>;
}

/* ── DAFTAR ─────────────────────────────────────────────────────────── */
const FILTER_JENIS: [string, string, (t: string | null) => boolean][] = [
  ["semua", "Semua", () => true],
  ["beasiswa", "Beasiswa", t => (t ?? "").startsWith("beasiswa")],
  ["kompetisi", "Kompetisi", t => t === "kompetisi"],
  ["magang", "Magang", t => t === "magang"],
  ["lainnya", "Fellowship & lainnya", t => !!t && !t.startsWith("beasiswa") && t !== "kompetisi" && t !== "magang"],
];
const FILTER_JENJANG: [string, string][] = [["semua", "Semua jenjang"], ["smp", "SMP"], ["sma_smk", "SMA/SMK"], ["kuliah", "Mahasiswa"], ["lulusan", "Lulusan"]];

export function DaftarPeluang() {
  const [rows, setRows] = useState<Ringkas[] | null>(null);
  const [jenis, setJenis] = useState("semua");
  const [jenjang, setJenjang] = useState("semua");
  const [batas, setBatas] = useState(24);

  useEffect(() => {
    db.from("scraped_content").select(KOLOM_PUBLIK).eq("is_active", true)
      .order("deadline", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }).limit(500)
      .then(({ data }: { data: Ringkas[] | null }) => setRows(data ?? []));
  }, []);

  const tampil = useMemo(() => {
    const f = FILTER_JENIS.find(x => x[0] === jenis)![2];
    return (rows ?? []).filter(r => f(r.opportunity_type) && (jenjang === "semua" || (r.jenjang_target ?? []).includes(jenjang)));
  }, [rows, jenis, jenjang]);

  const chip = (on: boolean): CSSProperties => ({ padding: "8px 14px", borderRadius: 99, border: `1px solid ${on ? C.blue : C.line}`, background: on ? "#EFF6FF" : "#fff", color: on ? "#1D4ED8" : "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer" });

  return (
    <div style={{ minHeight: "100vh", background: C.soft, color: C.ink }}>
      <SEO
        title="Beasiswa, Kompetisi & Magang untuk Pelajar dan Mahasiswa — Talentika"
        description="Daftar beasiswa S1, S2, S3, kompetisi, dan magang untuk pelajar SMP, SMA/SMK, dan mahasiswa Indonesia — dikurasi dari situs resmi penyelenggara."
        keywords="beasiswa pelajar, beasiswa S1, beasiswa S2, beasiswa luar negeri, kompetisi pelajar, lomba SMA, magang mahasiswa"
        canonical={`${DOMAIN}/peluang`}
        structuredData={rows?.length ? {
          "@context": "https://schema.org", "@type": "CollectionPage",
          name: "Beasiswa, Kompetisi & Magang untuk Pelajar", url: `${DOMAIN}/peluang`, inLanguage: "id-ID",
          mainEntity: {
            "@type": "ItemList", numberOfItems: rows.length,
            itemListElement: rows.filter(bolehDiindeks).slice(0, 50).map((r, i) => ({ "@type": "ListItem", position: i + 1, url: DOMAIN + urlPeluang(r.title, r.id), name: r.title })),
          },
        } : undefined}
      />
      <Header />
      <section style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "104px 0 36px" }}>
        <div style={wadah}>
          <h1 style={{ fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 800, lineHeight: 1.15, margin: 0, letterSpacing: "-.5px" }}>Beasiswa, kompetisi & magang untuk pelajar</h1>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, maxWidth: 680, margin: "12px 0 0" }}>
            Dikurasi tim Talentika dari situs resmi penyelenggara. Ikuti tes minat gratis supaya Talentika bisa mengurutkan peluang yang paling cocok denganmu.
          </p>
          <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, background: C.blue, color: "#fff", fontWeight: 700, fontSize: 14.5, padding: "11px 18px", borderRadius: 12, textDecoration: "none" }}>
            <Sparkles size={16} /> Cari yang cocok untukku — gratis
          </Link>
        </div>
      </section>

      <main style={{ ...wadah, padding: "24px 16px 56px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTER_JENIS.map(([id, label]) => <button key={id} onClick={() => { setJenis(id); setBatas(24); }} style={chip(jenis === id)}>{label}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {FILTER_JENJANG.map(([id, label]) => <button key={id} onClick={() => { setJenjang(id); setBatas(24); }} style={chip(jenjang === id)}>{label}</button>)}
        </div>

        {rows === null ? (
          <div style={{ padding: 60, textAlign: "center" }}><Loader2 className="animate-spin" style={{ margin: "0 auto" }} /></div>
        ) : !tampil.length ? (
          <p style={{ padding: 40, textAlign: "center", color: C.muted }}>Belum ada peluang untuk pilihan ini.</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: C.muted, margin: "18px 0 12px" }}>{tampil.length} peluang aktif</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 14 }}>
              {tampil.slice(0, batas).map(r => (
                <Link key={r.id} to={urlPeluang(r.title, r.id)} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden", textDecoration: "none", color: C.ink, display: "flex", flexDirection: "column" }}>
                  <img src={r.poster_url || GAMBAR_PELUANG_DEFAULT} alt="" loading="lazy" width={600} height={315} style={{ width: "100%", aspectRatio: "1200 / 630", objectFit: "cover", background: "#EEF2F8" }} />
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Lencana>{labelJenis(r.opportunity_type)}</Lencana>{r.cost && BIAYA_PELUANG[r.cost] && <Lencana warna="#ECFDF5" teks="#047857">{BIAYA_PELUANG[r.cost]}</Lencana>}</div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, margin: 0 }}>{r.title}</h2>
                    {r.organizer && <div style={{ fontSize: 13, color: C.muted }}>{r.organizer}</div>}
                    <div style={{ marginTop: "auto", paddingTop: 6, fontSize: 12.5, color: r.deadline ? "#B45309" : C.muted, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} />{teksTenggat(r)}</div>
                  </div>
                </Link>
              ))}
            </div>
            {tampil.length > batas && <button onClick={() => setBatas(b => b + 24)} style={{ ...chip(false), display: "block", margin: "20px auto 0" }}>Tampilkan lebih banyak ({tampil.length - batas} lagi)</button>}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

/* ── DETAIL ─────────────────────────────────────────────────────────── */
interface Lengkap { url: string | null; eligibility: string | null; requirements: string[] | null; benefits: string[] | null; description: string | null }

export function DetailPeluang() {
  const { slug } = useParams();
  const nav = useNavigate();
  const id = idDariSlug(slug);
  const [p, setP] = useState<Ringkas | null | undefined>(undefined);
  const [masuk, setMasuk] = useState<boolean | null>(null);
  const [lengkap, setLengkap] = useState<Lengkap | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMasuk(!!data.session));
    if (!id) { setP(null); return; }
    // Tanpa filter is_active: peluang yang sudah tutup tetap tampil sebagai "sudah ditutup" (RLS menyaring yang diblokir)
    db.from("scraped_content").select(KOLOM_PUBLIK).eq("id", id).maybeSingle()
      .then(({ data }: { data: Ringkas | null }) => setP(data ?? null));
  }, [id]);

  // Alamat kanonis: judul berubah → slug ikut berubah
  useEffect(() => {
    if (p && slug && urlPeluang(p.title, p.id) !== `/peluang/${slug}`) nav(urlPeluang(p.title, p.id), { replace: true });
  }, [p, slug, nav]);

  const buka = async () => {
    if (!p) return;
    if (!masuk) { nav(`/auth?redirect=${encodeURIComponent(urlPeluang(p.title, p.id))}`); return; }
    setBusy(true);
    const { data, error } = await db.rpc("buka_peluang", { p_id: p.id });
    if (error || !data) { setBusy(false); toast.error("Gagal membuka peluang. Coba lagi."); return; }
    if (data.allowed === false) {
      setBusy(false);
      toast.info(`Kamu sudah membuka ${data.limit ?? 5} peluang bulan ini. Buka semua dengan Talentika Plus.`);
      nav(`/subscription?from=${encodeURIComponent(urlPeluang(p.title, p.id))}`);
      return;
    }
    db.rpc("log_opportunity_click", { p_id: p.id }).then(() => {}, () => {});
    const { data: d } = await db.from("scraped_content").select("url,eligibility,requirements,benefits,description").eq("id", p.id).maybeSingle();
    setBusy(false);
    setLengkap(d ?? null);
    if (!data.plus && typeof data.used === "number") toast.success(`Dibuka · kuota bulan ini ${data.used}/${data.limit ?? 5}`);
  };

  if (p === undefined) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Loader2 className="animate-spin" /></div>;

  if (!p) {
    return (
      <div style={{ minHeight: "100vh", background: C.soft }}>
        <SEO title="Peluang tidak ditemukan" description="Peluang ini tidak tersedia di Talentika." noindex />
        <Header />
        <main style={{ ...wadah, padding: "120px 16px 60px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Peluang tidak ditemukan</h1>
          <p style={{ color: C.muted }}>Mungkin sudah dihapus atau tautannya keliru.</p>
          <Link to="/peluang" style={{ color: C.blue, fontWeight: 700 }}>Lihat peluang lain</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const tutup = !p.is_active || (!!p.deadline && new Date(p.deadline).getTime() < Date.now());
  const jenis = labelJenis(p.opportunity_type);
  const jenjang = teksJenjang(p.jenjang_target);
  const sari = ringkasan(p.description);
  const kanonik = DOMAIN + urlPeluang(p.title, p.id);
  const metaDesc = [`${jenis}${p.organizer ? ` dari ${p.organizer}` : ""}`, jenjang && `untuk ${jenjang}`, teksTenggat(p)].filter(Boolean).join(" · ") + (sari ? `. ${sari}` : "");
  const syarat = (lengkap?.requirements?.length ? lengkap.requirements : (lengkap?.eligibility ?? "").split(/\n+/)).map(s => s.trim()).filter(Boolean);
  const manfaat = (lengkap?.benefits ?? []).map(s => s.trim()).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: C.soft, color: C.ink }}>
      <SEO
        title={`${p.title} · ${jenis} | Talentika`}
        description={metaDesc.slice(0, 300)}
        image={p.poster_url || undefined}
        canonical={kanonik}
        noindex={tutup || !bolehDiindeks(p)}
      />
      <Header />
      <main style={{ ...wadah, maxWidth: 820, padding: "96px 16px 56px" }}>
        <Link to="/peluang" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}><ArrowLeft size={15} /> Semua peluang</Link>

        <article style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 20, overflow: "hidden", marginTop: 12 }}>
          <img src={p.poster_url || GAMBAR_PELUANG_DEFAULT} alt={p.poster_url ? `Poster ${p.title}` : ""} width={1200} height={630} style={{ width: "100%", aspectRatio: "1200 / 630", objectFit: "cover", background: "#EEF2F8", display: "block" }} />
          <div style={{ padding: "20px 20px 24px" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Lencana>{jenis}</Lencana>
              {p.cost && BIAYA_PELUANG[p.cost] && <Lencana warna="#ECFDF5" teks="#047857">{BIAYA_PELUANG[p.cost]}</Lencana>}
              {tutup && <Lencana warna="#FEE2E2" teks="#B91C1C">Sudah ditutup</Lencana>}
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3.6vw, 32px)", fontWeight: 800, lineHeight: 1.2, margin: "12px 0 0", letterSpacing: "-.3px" }}>{p.title}</h1>
            {p.organizer && <p style={{ margin: "6px 0 0", fontSize: 15, color: C.muted }}>{p.organizer}</p>}

            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, margin: "18px 0 0" }}>
              {[
                [<Calendar size={16} key="c" />, "Tenggat", p.deadline ? fmtTanggal(p.deadline) : p.tanpa_tenggat ? "Bergulir / sepanjang tahun" : "Belum diumumkan"],
                [<GraduationCap size={16} key="g" />, "Untuk", jenjang || "Lihat syarat"],
                [<MapPin size={16} key="m" />, "Lokasi", p.location || (p.wilayah_peserta === "indonesia" ? "Indonesia" : "—")],
                [<Wallet size={16} key="w" />, "Pendanaan", (p.cost && BIAYA_PELUANG[p.cost]) || "Lihat detail"],
              ].map(([ikon, k, v]) => (
                <div key={k as string} style={{ background: C.soft, borderRadius: 12, padding: "10px 12px" }}>
                  <dt style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted, fontWeight: 600 }}>{ikon}{k}</dt>
                  <dd style={{ margin: "3px 0 0", fontSize: 14.5, fontWeight: 700 }}>{v}</dd>
                </div>
              ))}
            </dl>

            {sari && <><h2 style={{ fontSize: 17, fontWeight: 800, margin: "22px 0 6px" }}>Ringkasan</h2><p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#334155" }}>{sari}</p></>}

            {lengkap ? (
              <div style={{ marginTop: 22 }}>
                {syarat.length > 0 && <><h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>Syarat</h2><ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14.5, color: "#334155" }}>{syarat.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
                {manfaat.length > 0 && <><h2 style={{ fontSize: 17, fontWeight: 800, margin: "18px 0 6px" }}>Manfaat</h2><ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14.5, color: "#334155" }}>{manfaat.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
                {lengkap.url ? (
                  <a href={lengkap.url} target="_blank" rel="noopener noreferrer nofollow" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, background: C.blue, color: "#fff", fontWeight: 700, padding: "12px 18px", borderRadius: 12, textDecoration: "none" }}>
                    Daftar di situs resmi <ExternalLink size={16} />
                  </a>
                ) : <p style={{ marginTop: 16, color: C.muted, fontSize: 14 }}>Tautan pendaftaran resmi belum tersedia.</p>}
                <p style={{ marginTop: 10, fontSize: 12.5, color: C.muted }}>Selalu cek syarat dan tenggat terbaru di situs resmi sebelum mendaftar.</p>
              </div>
            ) : !tutup ? (
              <div style={{ marginTop: 22, background: "#F3F8FF", border: "1px solid #DBEAFE", borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}><Lock size={16} /> Syarat lengkap & tautan pendaftaran</div>
                <p style={{ margin: "6px 0 12px", fontSize: 14, color: "#334155", lineHeight: 1.6 }}>
                  {masuk ? "Buka detail lengkap peluang ini. Akun Free bisa membuka 5 peluang per bulan; Talentika Plus tanpa batas."
                         : "Masuk atau daftar gratis untuk melihat syarat lengkap, manfaat, dan tautan pendaftaran resmi — plus rekomendasi peluang yang cocok dengan minatmu."}
                </p>
                <button onClick={buka} disabled={busy || masuk === null} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.blue, color: "#fff", fontWeight: 700, fontSize: 14.5, padding: "11px 18px", borderRadius: 12, border: "none", cursor: "pointer" }}>
                  {busy && <Loader2 size={15} className="animate-spin" />}{masuk ? "Lihat syarat & daftar" : "Masuk gratis untuk melihat"}
                </button>
              </div>
            ) : (
              <p style={{ marginTop: 20, fontSize: 14.5, color: C.muted }}>Pendaftaran peluang ini sudah ditutup. <Link to="/peluang" style={{ color: C.blue, fontWeight: 700 }}>Lihat peluang yang masih buka</Link></p>
            )}
          </div>
        </article>

        <aside style={{ marginTop: 16, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ fontWeight: 800 }}>Belum yakin peluang mana yang cocok?</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>Ikuti tes minat RIASEC gratis — Talentika mengurutkan beasiswa & kompetisi sesuai minat dan jenjangmu.</div>
          </div>
          <Link to="/auth" style={{ background: "#FFD146", color: C.ink, fontWeight: 800, fontSize: 14, padding: "10px 16px", borderRadius: 12, textDecoration: "none" }}>Tes minat gratis</Link>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
