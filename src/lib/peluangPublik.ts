/**
 * Halaman peluang publik (/peluang, /peluang/:slug) — dipakai web, sitemap,
 * dan pratinjau media sosial (edge function peluang-og memakai aturan yang sama).
 *
 * Pengunjung tanpa login hanya melihat RINGKASAN. Syarat lengkap & tautan
 * pendaftaran resmi dibuka lewat buka_peluang() (kuota Free 5/bulan).
 */

export const JENIS_PELUANG: Record<string, string> = {
  beasiswa_s3: "Beasiswa S3", beasiswa_s2: "Beasiswa S2", beasiswa_s1: "Beasiswa S1", beasiswa: "Beasiswa",
  kompetisi: "Kompetisi", fellowship: "Fellowship", magang: "Magang", workshop: "Workshop",
  pertukaran: "Pertukaran Pelajar",
};
export const JENJANG_PELUANG: Record<string, string> = {
  smp: "SMP", sma_smk: "SMA/SMK", kuliah: "Mahasiswa", lulusan: "Lulusan",
};
export const BIAYA_PELUANG: Record<string, string> = {
  pendanaan_penuh: "Pendanaan penuh", pendanaan_sebagian: "Pendanaan sebagian",
};

export const labelJenis = (t: string | null | undefined) => JENIS_PELUANG[t ?? ""] ?? "Peluang";

const UUID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** "Beasiswa LPDP 2026" + id → "beasiswa-lpdp-2026--<uuid>" */
export function slugPeluang(judul: string, id: string): string {
  const s = (judul || "peluang")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 70).replace(/-+$/, "");
  return `${s || "peluang"}--${id}`;
}
export const idDariSlug = (slug: string | undefined) => (slug ?? "").match(UUID)?.[1]?.toLowerCase() ?? null;
export const urlPeluang = (judul: string, id: string) => `/peluang/${slugPeluang(judul, id)}`;

/**
 * Hanya peluang yang tenggatnya sudah dipastikan admin (diisi, atau ditandai
 * memang tanpa tenggat) yang boleh diindeks mesin pencari. Sisanya tetap bisa
 * dibuka & dibagikan, tetapi noindex sampai lolos antrean kurasi.
 */
export const bolehDiindeks = (p: { is_active?: boolean | null; deadline?: string | null; tanpa_tenggat?: boolean | null }) =>
  !!p.is_active && (!!p.deadline || !!p.tanpa_tenggat);

/** Ringkasan pendek dari deskripsi (kalimat/baris pertama yang bermakna). */
export function ringkasan(deskripsi: string | null | undefined, maks = 240): string {
  const baris = (deskripsi ?? "").split(/\n+/).map(b => b.trim())
    .filter(b => b && !/^(penyelenggara|negara\/kampus|jurusan|sumber)\s*:/i.test(b));
  let teks = baris.join(" ").replace(/\s+/g, " ").trim();
  if (teks.length <= maks) return teks;
  teks = teks.slice(0, maks);
  const titik = teks.lastIndexOf(". ");
  return (titik > maks * 0.5 ? teks.slice(0, titik + 1) : teks.replace(/\s+\S*$/, "") + "…");
}

export const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
