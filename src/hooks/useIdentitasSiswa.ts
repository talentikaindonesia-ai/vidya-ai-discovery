import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * SATU sumber kebenaran untuk identitas siswa.
 *
 * Sebelum ini, identitas diturunkan ulang di 5 tempat (OpportunityBoard,
 * WelcomeDashboard, Profile, FocusAction, CoursesSection) — masing-masing
 * dengan query sendiri, dan OpportunityBoard mengurutkan pakai `completed_at`
 * sementara yang lain `created_at`. Sampai 2026-09-09 hasilnya belum pernah
 * berbeda (0 dari 98 siswa), tapi itu kebetulan, bukan jaminan.
 *
 * Semua sekarang membaca view `identitas_siswa` yang memilih satu baris
 * kanonik per siswa.
 */

export type TipeRiasec =
  | "realistic" | "investigative" | "artistic"
  | "social" | "enterprising" | "conventional";

export type Keyakinan = "kuat" | "sedang" | "seimbang";

export interface IdentitasSiswa {
  tipeUtama: TipeRiasec;
  tipeKedua: TipeRiasec | null;
  tipeKetiga: TipeRiasec | null;
  /** Kode Holland 3 huruf, mis. "SAE". */
  kode: string | null;
  /** Selisih skor peringkat 1 dan 2. <=1 berarti praktis seri. */
  margin: number | null;
  keyakinan: Keyakinan;
  skor: Record<string, number>;
  rekomendasiKarier: string[];
  bidangBakat: string[];
  kategoriMinat: string[];
  tipeMI: string | null;
  jumlahTes: number;
  diperbaruiPada: string | null;
  /** Arah yang dituju siswa — penyaring lebih kuat daripada tipe kepribadian. */
  tujuan: Tujuan | null;
  tujuanTahun: number | null;
  jenjang: Jenjang | null;
}

export type Tujuan = "kuliah" | "kerja" | "wirausaha" | "belum_yakin";
export type Jenjang = "smp" | "sma_smk" | "kuliah" | "lulusan";

export const LABEL_TUJUAN: Record<Tujuan, string> = {
  kuliah: "Lanjut kuliah",
  kerja: "Cari kerja",
  wirausaha: "Bangun usaha",
  belum_yakin: "Masih menjajaki",
};

export const LABEL_JENJANG: Record<Jenjang, string> = {
  smp: "SMP",
  sma_smk: "SMA / SMK",
  kuliah: "Kuliah",
  lulusan: "Sudah lulus",
};

/**
 * Jenis peluang yang paling relevan untuk tiap tujuan. Dipakai untuk
 * MENGURUTKAN, bukan menyembunyikan — siswa tetap boleh melihat sisanya.
 * (Cerminan dari fungsi jenis_peluang_untuk_tujuan() di database.)
 */
export const JENIS_UNTUK_TUJUAN: Record<Tujuan, string[]> = {
  kuliah:    ["beasiswa", "beasiswa_s1", "beasiswa_s2", "beasiswa_s3", "pertukaran", "konferensi"],
  kerja:     ["magang", "lowongan_kerja", "fellowship", "workshop"],
  wirausaha: ["kompetisi", "hackathon", "grant", "program"],
  belum_yakin: [],
};

export const LABEL_RIASEC: Record<TipeRiasec, string> = {
  realistic: "Realistis",
  investigative: "Investigatif",
  artistic: "Artistik",
  social: "Sosial",
  enterprising: "Enterprising",
  conventional: "Konvensional",
};

/**
 * Tiga huruf tidak berbobot sama. Huruf utama menentukan arah, huruf kedua
 * dan ketiga memperluas — bukan menggantikan. Dipakai untuk memberi skor
 * kecocokan materi & peluang.
 */
export const BOBOT_HURUF = [1, 0.6, 0.35];

/** Tipe-tipe yang relevan untuk siswa ini, terurut dari yang paling kuat. */
export function tipeRelevan(id: IdentitasSiswa | null): TipeRiasec[] {
  if (!id) return [];
  return [id.tipeUtama, id.tipeKedua, id.tipeKetiga].filter(Boolean) as TipeRiasec[];
}

/**
 * Kalimat jujur tentang seberapa tegas hasilnya. Kalau margin <=1, siswa
 * berhak tahu bahwa hasilnya nyaris imbang — bukan diberi satu label seolah
 * pasti. Ini yang dulu disembunyikan: 48 dari 181 hasil sebenarnya seri tipis.
 */
export function kalimatKeyakinan(id: IdentitasSiswa | null): string | null {
  if (!id) return null;
  const utama = LABEL_RIASEC[id.tipeUtama];
  const kedua = id.tipeKedua ? LABEL_RIASEC[id.tipeKedua] : null;
  if (id.keyakinan === "seimbang" && kedua) {
    return `Minatmu hampir seimbang antara ${utama} dan ${kedua} — wajar, dan artinya kamu punya dua arah yang sama-sama layak dicoba.`;
  }
  if (id.keyakinan === "sedang" && kedua) {
    return `${utama} sedikit lebih menonjol, tapi ${kedua} juga kuat padamu.`;
  }
  return `${utama} menonjol cukup jelas dibanding tipe lainnya.`;
}

function petakan(row: any): IdentitasSiswa | null {
  if (!row?.tipe_utama) return null;
  let skor: Record<string, number> = {};
  try {
    skor = typeof row.score_breakdown === "string"
      ? JSON.parse(row.score_breakdown)
      : (row.score_breakdown ?? {});
  } catch { skor = {}; }
  return {
    tipeUtama: row.tipe_utama as TipeRiasec,
    tipeKedua: (row.tipe_kedua ?? null) as TipeRiasec | null,
    tipeKetiga: (row.tipe_ketiga ?? null) as TipeRiasec | null,
    kode: row.holland_code ?? null,
    margin: row.margin === null || row.margin === undefined ? null : Number(row.margin),
    keyakinan: (row.keyakinan ?? "kuat") as Keyakinan,
    skor,
    rekomendasiKarier: row.career_recommendations ?? [],
    bidangBakat: row.talent_areas ?? [],
    kategoriMinat: row.interest_categories ?? [],
    tipeMI: row.tipe_mi ?? null,
    jumlahTes: Number(row.jumlah_tes ?? 1),
    diperbaruiPada: row.diperbarui_pada ?? null,
    tujuan: (row.tujuan ?? null) as Tujuan | null,
    tujuanTahun: row.tujuan_tahun ?? null,
    jenjang: (row.jenjang ?? null) as Jenjang | null,
  };
}

/** Ambil identitas satu siswa (dipakai di luar React, mis. di dalam loader lain). */
export async function ambilIdentitas(userId: string): Promise<IdentitasSiswa | null> {
  const { data } = await (supabase.from("identitas_siswa" as any) as any)
    .select("*").eq("user_id", userId).maybeSingle();
  return petakan(data);
}

export function useIdentitasSiswa(userId?: string | null) {
  const [identitas, setIdentitas] = useState<IdentitasSiswa | null>(null);
  const [loading, setLoading] = useState(true);

  const muat = useCallback(async () => {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data?.user?.id;
    }
    if (!uid) { setIdentitas(null); setLoading(false); return; }
    setIdentitas(await ambilIdentitas(uid));
    setLoading(false);
  }, [userId]);

  useEffect(() => { muat(); }, [muat]);

  return { identitas, loading, muatUlang: muat };
}
