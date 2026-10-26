/**
 * Kecocokan peluang — satu sumber untuk web (/opportunities) dan aplikasi.
 *
 * Skor & alasan dihitung server oleh peluang_untukku() (RIASEC siswa × kode
 * RIASEC peluang, jenjang, tujuan, wilayah peserta, tenggat). File ini hanya
 * mengubah kode alasan dari server menjadi kalimat, supaya web & app
 * menampilkan teks yang sama.
 */
import { LABEL_RIASEC, LABEL_RIASEC_EN, type TipeRiasec } from "./riasec";

export interface SkorPeluang { id: string; skor: number; alasan: string[]; cocok_tipe: boolean }

const JENJANG: Record<string, [string, string]> = {
  smp: ["SMP", "junior high"], sma_smk: ["SMA/SMK", "senior high"], kuliah: ["kuliah", "university"], lulusan: ["lulusan", "graduates"],
};
const TUJUAN: Record<string, [string, string]> = {
  kuliah: ["Sesuai rencana kuliahmu", "Fits your university plan"],
  kerja: ["Sesuai rencana kerjamu", "Fits your career plan"],
  wirausaha: ["Sesuai rencana usahamu", "Fits your business plan"],
};

/** "tipe:social" → "Cocok dengan tipe Sosial-mu", dst. */
export function teksAlasan(kode: string, lang: "id" | "en" = "id"): string {
  const [k, v = ""] = kode.split(":");
  const en = lang === "en";
  switch (k) {
    case "tipe": {
      const label = (en ? LABEL_RIASEC_EN : LABEL_RIASEC)[v as TipeRiasec] ?? v;
      return en ? `Fits your ${label} type` : `Cocok dengan tipe ${label}-mu`;
    }
    case "jenjang": return en ? `For ${JENJANG[v]?.[1] ?? v} students` : `Untuk jenjang ${JENJANG[v]?.[0] ?? v}`;
    case "tujuan": return TUJUAN[v]?.[en ? 1 : 0] ?? (en ? "Fits your goal" : "Sesuai tujuanmu");
    case "wilayah": return en ? "Program in Indonesia" : "Program di Indonesia";
    case "tenggat": return v === "0" ? (en ? "Closes today" : "Tutup hari ini") : en ? `Closes in ${v} days` : `Tutup ${v} hari lagi`;
    default: return kode;
  }
}

export function petaSkor(rows: SkorPeluang[] | null | undefined): Map<string, SkorPeluang> {
  return new Map((rows ?? []).map(r => [r.id, r]));
}

/** Alasan roadmap: sama dengan peluang + "karier:<nama>" (target karier siswa). */
export function teksAlasanRoadmap(kode: string, lang: "id" | "en" = "id"): string {
  if (kode.startsWith("karier:")) { const k = kode.slice(7); return lang === "en" ? `For your ${k} target` : `Untuk target ${k}-mu`; }
  return teksAlasan(kode, lang);
}
