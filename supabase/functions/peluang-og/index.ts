/**
 * peluang-og — HTML pratinjau untuk perayap media sosial (WhatsApp, Facebook,
 * X, Telegram, LinkedIn) pada /peluang/:slug. Perayap itu tidak menjalankan JS,
 * jadi meta tag dari SPA tidak terbaca. vercel.json mengarahkan HANYA user-agent
 * bot sosial ke sini; manusia tetap mendapat SPA.
 *
 * Isi = RINGKASAN saja (keputusan produk 2026-11-05): tanpa syarat lengkap dan
 * tanpa tautan pendaftaran resmi — itu dibuka setelah login (kuota Free).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DOMAIN = "https://talentika.id";
const OG_DEFAULT = `${DOMAIN}/og-talentika.jpg`;
const UUID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const JENIS: Record<string, string> = {
  beasiswa_s3: "Beasiswa S3", beasiswa_s2: "Beasiswa S2", beasiswa_s1: "Beasiswa S1", beasiswa: "Beasiswa",
  kompetisi: "Kompetisi", fellowship: "Fellowship", magang: "Magang", workshop: "Workshop", pertukaran: "Pertukaran Pelajar",
};
const JENJANG: Record<string, string> = { smp: "SMP", sma_smk: "SMA/SMK", kuliah: "Mahasiswa", lulusan: "Lulusan" };

const esc = (s: string) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Harus sama dengan slugPeluang() di src/lib/peluangPublik.ts
function slugPeluang(judul: string, id: string): string {
  const s = (judul || "peluang")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 70).replace(/-+$/, "");
  return `${s || "peluang"}--${id}`;
}

function ringkasan(d: string | null, maks = 240): string {
  const t = (d ?? "").split(/\n+/).map(b => b.trim())
    .filter(b => b && !/^(penyelenggara|negara\/kampus|jurusan|sumber)\s*:/i.test(b)).join(" ").replace(/\s+/g, " ").trim();
  if (t.length <= maks) return t;
  const p = t.slice(0, maks), titik = p.lastIndexOf(". ");
  return titik > maks * 0.5 ? p.slice(0, titik + 1) : p.replace(/\s+\S*$/, "") + "…";
}

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const slug = u.searchParams.get("slug") ?? "";
  const id = slug.match(UUID)?.[1]?.toLowerCase();
  if (!id) return new Response("Not found", { status: 404 });

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const { data: p } = await supabase.from("scraped_content")
    .select("id,title,organizer,opportunity_type,jenjang_target,deadline,tanpa_tenggat,poster_url,description")
    .eq("id", id).maybeSingle();
  if (!p) return new Response("Not found", { status: 404 });

  const pageUrl = `${DOMAIN}/peluang/${slugPeluang(p.title, p.id)}`;
  const jenis = JENIS[p.opportunity_type ?? ""] ?? "Peluang";
  const jenjang = (p.jenjang_target ?? []).map((j: string) => JENJANG[j] ?? j).join(", ");
  const tenggat = p.deadline ? `Tenggat ${tanggal(p.deadline)}` : p.tanpa_tenggat ? "Pendaftaran bergulir" : "";
  const title = `${p.title} · ${jenis} | Talentika`;
  const desc = [`${jenis}${p.organizer ? ` dari ${p.organizer}` : ""}`, jenjang && `untuk ${jenjang}`, tenggat]
    .filter(Boolean).join(" · ") + (ringkasan(p.description) ? `. ${ringkasan(p.description)}` : "");
  const img = p.poster_url || OG_DEFAULT;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc.slice(0, 300))}"/>
<link rel="canonical" href="${pageUrl}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${pageUrl}"/>
<meta property="og:site_name" content="Talentika"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(desc.slice(0, 300))}"/>
<meta property="og:image" content="${esc(img)}"/>${p.poster_url ? "" : `
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>`}
<meta property="og:locale" content="id_ID"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@talentikaid"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(desc.slice(0, 200))}"/>
<meta name="twitter:image" content="${esc(img)}"/>
<script>location.replace(${JSON.stringify(pageUrl)});</script>
</head>
<body>
<h1>${esc(p.title)}</h1>
<p>${esc(desc)}</p>
<p><a href="${pageUrl}">Lihat di talentika.id →</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
