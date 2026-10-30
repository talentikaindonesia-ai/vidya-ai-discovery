/**
 * Talentika hanya punya dua paket: Free dan Plus (keputusan produk 2026-10-12).
 * Tidak ada Pro atau Premium. Kelas premium dijual per kelas, di luar langganan.
 *
 * Matriks ini satu sumber untuk halaman langganan web (/subscription) dan
 * aplikasi (/app/pro). Batas angkanya ditegakkan di database — RLS
 * learning_progress, buka_peluang(), trigger batasi_proyek_free, dan
 * kuota_saya() — jadi ubah keduanya bersamaan.
 */
export const BATAS_FREE = { materiAktif: 3, peluangPerBulan: 5, proyek: 3 } as const;

export interface BarisPaket { fitur: string; fiturEn: string; free: string; freeEn: string; plus: string; plusEn: string }

export const MATRIKS_PAKET: BarisPaket[] = [
  { fitur: "Home Dashboard", fiturEn: "Home Dashboard", free: "Ringkasan dasar", freeEn: "Basic summary", plus: "Dashboard personal lengkap", plusEn: "Full personal dashboard" },
  { fitur: "Talent Discovery", fiturEn: "Talent Discovery", free: "Asesmen dasar, 1 profil hasil", freeEn: "Basic assessment, 1 result profile", plus: "Asesmen lengkap & eksplorasi lanjutan", plusEn: "Full assessment & deeper exploration" },
  { fitur: "My Talent Profile", fiturEn: "My Talent Profile", free: "Ringkasan kekuatan", freeEn: "Strengths summary", plus: "Profil lengkap & rekomendasi pengembangan", plusEn: "Full profile & growth recommendations" },
  { fitur: "Learn / Learning Hub", fiturEn: "Learn / Learning Hub", free: `Maks. ${BATAS_FREE.materiAktif} materi atau kursus aktif`, freeEn: `Up to ${BATAS_FREE.materiAktif} active courses`, plus: "Seluruh katalog yang termasuk langganan", plusEn: "The full catalog included in the plan" },
  { fitur: "Kelas premium", fiturEn: "Premium classes", free: "Dibeli per kelas", freeEn: "Bought per class", plus: "Dibeli per kelas — tidak termasuk langganan", plusEn: "Bought per class — not included in the plan" },
  { fitur: "Career Pathways", fiturEn: "Career Pathways", free: "Eksplorasi bidang dasar", freeEn: "Basic field exploration", plus: "Jalur studi & karier personal", plusEn: "Personal study & career paths" },
  { fitur: "Opportunities", fiturEn: "Opportunities", free: `Maks. ${BATAS_FREE.peluangPerBulan} peluang dibuka per bulan`, freeEn: `Up to ${BATAS_FREE.peluangPerBulan} opportunities opened per month`, plus: "Katalog penuh & rekomendasi yang relevan", plusEn: "Full catalog & relevant picks" },
  { fitur: "Opportunity Matching", fiturEn: "Opportunity Matching", free: "Pencarian & filter dasar", freeEn: "Basic search & filters", plus: "Rekomendasi peluang berdasarkan profil", plusEn: "Opportunity picks based on your profile" },
  { fitur: "AI Talent Coach", fiturEn: "AI Talent Coach", free: "Kuota harian terbatas", freeEn: "Limited daily quota", plus: "AI Coach penuh", plusEn: "Full AI Coach" },
  { fitur: "Talent Passport", fiturEn: "Talent Passport", free: `Portofolio dasar, maks. ${BATAS_FREE.proyek} proyek`, freeEn: `Basic portfolio, up to ${BATAS_FREE.proyek} projects`, plus: "Portofolio lengkap & bukti keterampilan", plusEn: "Full portfolio & skill evidence" },
  { fitur: "Progress Tracking", fiturEn: "Progress Tracking", free: "Progres dasar (7 hari terakhir)", freeEn: "Basic progress (last 7 days)", plus: "Riwayat & progres lebih terperinci", plusEn: "Detailed history & progress" },
  { fitur: "Achievements", fiturEn: "Achievements", free: "Pencapaian dasar", freeEn: "Basic achievements", plus: "Riwayat pencapaian & sertifikat yang memenuhi syarat", plusEn: "Achievement history & eligible certificates" },
  { fitur: "Community", fiturEn: "Community", free: "Akses komunitas dasar (membaca)", freeEn: "Basic community access (reading)", plus: "Membuat postingan & fitur tambahan", plusEn: "Posting & extra features" },
  { fitur: "Mentoring", fiturEn: "Mentoring", free: "Tidak termasuk", freeEn: "Not included", plus: "Tidak termasuk — program terpisah", plusEn: "Not included — separate program" },
  { fitur: "Global Immersion", fiturEn: "Global Immersion", free: "Melihat informasi program", freeEn: "View program info", plus: "Informasi & rekomendasi; biaya program terpisah", plusEn: "Info & picks; program fee is separate" },
  { fitur: "Parent View", fiturEn: "Parent View", free: "Ringkasan terbatas", freeEn: "Limited summary", plus: "Ringkasan perkembangan lebih lengkap, dengan izin", plusEn: "Fuller progress summary, with permission" },
];

/** Tidak dijanjikan dalam langganan mana pun. */
export const DI_LUAR_PAKET = [
  ["Kelas premium (dibeli per kelas)", "Premium classes (bought per class)"],
  ["Mentoring langsung", "Live mentoring"],
  ["Sertifikasi berbayar pihak ketiga", "Paid third-party certification"],
  ["Program Global Immersion", "Global Immersion programs"],
  ["Biaya pendaftaran peluang", "Opportunity application fees"],
] as const;
