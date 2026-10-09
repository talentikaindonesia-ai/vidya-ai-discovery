import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, Microscope, Palette, Users, Briefcase, Calculator,
  ArrowRight, ChevronLeft, ExternalLink, Sparkles, RefreshCw,
  LayoutDashboard, Award,
} from "lucide-react";
import { CertificateGenerator } from "@/components/certificate/CertificateGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { useHargaMulai } from "@/hooks/usePaketLangganan";
import { UpgradeGate } from "@/components/payment/UpgradeGate";
import SEO from "@/components/SEO";

// ─── RIASEC type definitions ─────────────────────────────────────────────────
const riasecTypes = {
  realistic: {
    name: "Realistic",
    emoji: "🔧",
    icon: Wrench,
    gradient: "135deg, #FEF3C7, #FDE68A",
    accent: "#D97706",
    description:
      "Cenderung suka pekerjaan yang berorientasi dengan penerapan dari skill yang dimiliki, keterampilan fisik & minim keterampilan sosial",
    characteristics: ["Praktis", "Teknis", "Suka bekerja dengan tangan", "Oriented pada hasil nyata"],
    careers: ["Insinyur Mesin", "Teknisi", "Arsitek", "Ahli Konstruksi", "Pilot", "Chef", "Teknisi IT"],
  },
  investigative: {
    name: "Investigative",
    emoji: "🔬",
    icon: Microscope,
    gradient: "135deg, #D1FAE5, #A7F3D0",
    accent: "#0F7A3E",
    description:
      "Lebih suka pekerjaan yang mengandalkan analisa, pemahaman cara berpikir secara kreatif dan abstrak",
    characteristics: ["Analitis", "Intelektual", "Suka riset", "Problem solver"],
    careers: ["Peneliti", "Dokter", "Scientist", "Psikolog", "Data Scientist", "Ahli Forensik", "Profesor"],
  },
  artistic: {
    name: "Artistic",
    emoji: "🎨",
    icon: Palette,
    gradient: "135deg, #EDE9FE, #DDD6FE",
    accent: "#5B21B6",
    description:
      "Tipikal orang yang suka bekerja sama dengan orang lain untuk menghasilkan suatu hal yang dianggap 'Karya Seni'",
    characteristics: ["Kreatif", "Imajinatif", "Ekspresif", "Inovatif"],
    careers: ["Desainer Grafis", "Penulis", "Musisi", "Fotografer", "Animator", "Content Creator", "Art Director"],
  },
  social: {
    name: "Social",
    emoji: "🤝",
    icon: Users,
    gradient: "135deg, #DBEAFE, #BFDBFE",
    accent: "#1D4ED8",
    description:
      "Lebih suka pekerjaan yang bersifat membantu sesama. Punya karakter yang supel dan friendly.",
    characteristics: ["Empatis", "Komunikatif", "Suka membantu", "Team oriented"],
    careers: ["Guru", "Konselor", "Perawat", "Pekerja Sosial", "HR Manager", "Terapis", "Customer Service"],
  },
  enterprising: {
    name: "Enterprising",
    emoji: "💼",
    icon: Briefcase,
    gradient: "135deg, #FFEDE2, #FFD5BB",
    accent: "#FF6A00",
    description:
      "Suka bergaul dan berbicara dengan orang banyak, jago merangkai kata dan meyakinkan orang",
    characteristics: ["Persuasif", "Ambisius", "Leadership", "Goal oriented"],
    careers: ["Entrepreneur", "Sales Manager", "Marketing Director", "CEO", "Business Consultant", "Lawyer", "Politisi"],
  },
  conventional: {
    name: "Conventional",
    emoji: "📊",
    icon: Calculator,
    gradient: "135deg, #F1F5F9, #E2E8F0",
    accent: "#475569",
    description:
      "Karakternya formal banget, sangat setia, tipikal tim player yang baik. Suka pekerjaan terstruktur dan sistematis",
    characteristics: ["Terorganisir", "Detail oriented", "Sistematis", "Reliable"],
    careers: ["Akuntan", "Administrasi", "Sekretaris", "Auditor", "Perpustakaan", "Data Entry", "Quality Control"],
  },
};

/* ─── Pernyataan pemutus seri ─────────────────────────────────────────────────
   Dipasangkan secara dinamis antara tipe-tipe yang skornya berdempetan, jadi
   soalnya selalu tepat sasaran: siswa yang seri Artistik vs Sosial ditanya
   Artistik lawan Sosial, bukan diberi 20 soal umum. Pilihan paksa — tidak ada
   opsi "netral", karena justru netral yang membuat hasilnya seri sejak awal. */
const PERNYATAAN_PEMUTUS: Record<string, string[]> = {
  realistic: [
    "Membongkar dan memperbaiki sesuatu sampai berfungsi lagi",
    "Bekerja dengan alat, mesin, atau di lapangan langsung",
    "Melihat hasil kerja yang bisa dipegang dan dipakai orang",
  ],
  investigative: [
    "Menggali kenapa sesuatu terjadi sampai ketemu jawabannya",
    "Menganalisis data dan menguji dugaan sendiri",
    "Membaca hal rumit sampai paham betul",
  ],
  artistic: [
    "Membuat sesuatu yang belum pernah ada sebelumnya",
    "Mengungkapkan ide lewat gambar, tulisan, musik, atau video",
    "Bekerja tanpa aturan baku, bebas bereksperimen",
  ],
  social: [
    "Menemani orang yang sedang kesulitan sampai dia merasa lebih baik",
    "Mengajari orang lain sampai mereka benar-benar bisa",
    "Bekerja bersama orang banyak setiap hari",
  ],
  enterprising: [
    "Meyakinkan orang untuk ikut gagasanmu",
    "Memimpin tim dan mengambil keputusan sulit",
    "Memulai sesuatu dari nol dan menanggung risikonya",
  ],
  conventional: [
    "Merapikan hal berantakan menjadi sistem yang teratur",
    "Bekerja dengan angka, catatan, dan ketelitian",
    "Mengikuti prosedur yang jelas sampai tuntas",
  ],
};

/**
 * Soal pemutus antar tipe yang berdempetan.
 *
 * Jumlahnya GANJIL (5) untuk seri 2 arah supaya jawaban tidak mungkin
 * berimbang. Diverifikasi dengan menelusuri seluruh 480 kombinasi jawaban
 * pada kasus terburuk (skor dasar identik): NOL yang berakhir margin 0 —
 * artinya tipe utama tidak pernah lagi ditentukan posisi array.
 *
 * Untuk seri 3 arah dipakai 6 soal. Di sana 25% kombinasi masih berakhir
 * margin 0; menambah soal jadi 7 atau 9 hanya menurunkannya ke 21,9% dan
 * 21,5% — tidak sepadan dengan tambahan bebannya. Kalau siswa memang
 * seimbang di tiga arah, itu kami sebut apa adanya lewat label "seimbang"
 * dan ketiga hurufnya tetap terbawa di kode Holland.
 */
function susunSoalPemutus(tipeSeri: string[]): { a: string; b: string; tipeA: string; tipeB: string }[] {
  const soal: { a: string; b: string; tipeA: string; tipeB: string }[] = [];
  const pasangan: [string, string][] = [];
  for (let i = 0; i < tipeSeri.length; i++) {
    for (let j = i + 1; j < tipeSeri.length; j++) pasangan.push([tipeSeri[i], tipeSeri[j]]);
  }
  if (pasangan.length === 0) return soal;
  const jumlah = tipeSeri.length === 2 ? 5 : 6;
  for (let n = 0; soal.length < jumlah && n < 18; n++) {
    const [x, y] = pasangan[n % pasangan.length];
    const idx = Math.floor(n / pasangan.length) % 3;
    soal.push({
      tipeA: x, tipeB: y,
      a: PERNYATAAN_PEMUTUS[x][idx],
      b: PERNYATAAN_PEMUTUS[y][idx],
    });
  }
  return soal;
}

// ─── RIASEC Questions ─────────────────────────────────────────────────────────
const riasecQuestions = [
  {
    category: "Aktivitas Kerja",
    question: "Dari aktivitas berikut, mana yang paling menarik bagimu?",
    options: [
      { text: "Memperbaiki mesin atau alat elektronik",          weight: { realistic: 3, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Melakukan eksperimen atau penelitian",             weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Mendesain atau menciptakan karya seni",            weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 0, conventional: 0 } },
      { text: "Mengajar atau membantu orang lain",                weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Memimpin tim atau memulai bisnis",                 weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengorganisir data dan dokumen",                   weight: { realistic: 0, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Lingkungan Kerja",
    question: "Lingkungan kerja seperti apa yang paling cocok denganmu?",
    options: [
      { text: "Workshop atau laboratorium dengan alat-alat praktis",          weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Ruang penelitian atau perpustakaan yang tenang",               weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Studio kreatif atau ruang terbuka yang inspiratif",            weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Ruang komunitas atau tempat berinteraksi dengan banyak orang", weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Kantor dinamis dengan banyak meeting dan presentasi",          weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Kantor terstruktur dengan sistem dan prosedur yang jelas",     weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 1, conventional: 3 } },
    ],
  },
  {
    category: "Kemampuan & Minat",
    question: "Kemampuan mana yang paling menggambarkan dirimu?",
    options: [
      { text: "Mahir menggunakan peralatan dan teknologi",       weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Analitis dan suka memecahkan masalah kompleks",   weight: { realistic: 1, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Kreatif dan imajinatif dalam berkarya",           weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 1, conventional: 0 } },
      { text: "Empati tinggi dan mudah berkomunikasi",           weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Persuasif dan berorientasi pada hasil",           weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 1 } },
      { text: "Teliti dan terorganisir dengan baik",             weight: { realistic: 1, investigative: 1, artistic: 0, social: 0, enterprising: 1, conventional: 3 } },
    ],
  },
  {
    category: "Nilai & Motivasi",
    question: "Apa yang paling memotivasimu dalam bekerja?",
    options: [
      { text: "Melihat hasil kerja yang nyata dan bermanfaat",            weight: { realistic: 3, investigative: 1, artistic: 1, social: 1, enterprising: 0, conventional: 0 } },
      { text: "Menemukan pengetahuan baru atau memecahkan misteri",        weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Mengekspresikan diri dan menciptakan sesuatu yang unik",   weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Membantu orang lain dan membuat perbedaan positif",        weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Mencapai kesuksesan finansial dan status",                  weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 3, conventional: 1 } },
      { text: "Stabilitas dan keamanan dalam pekerjaan",                   weight: { realistic: 1, investigative: 0, artistic: 0, social: 1, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Gaya Komunikasi",
    question: "Bagaimana cara kamu berkomunikasi yang paling efektif?",
    options: [
      { text: "Langsung ke pokok masalah dengan contoh praktis",       weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 1, conventional: 1 } },
      { text: "Menyampaikan dengan data dan analisis mendalam",         weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 2 } },
      { text: "Menggunakan cerita dan visualisasi kreatif",             weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 1, conventional: 0 } },
      { text: "Mendengarkan dulu, lalu memberikan dukungan",            weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Mempresentasikan dengan percaya diri dan meyakinkan",   weight: { realistic: 0, investigative: 0, artistic: 1, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengikuti prosedur komunikasi yang sudah ditetapkan",   weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Cara Belajar",
    question: "Metode belajar mana yang paling cocok untukmu?",
    options: [
      { text: "Learning by doing - praktik langsung",                   weight: { realistic: 3, investigative: 1, artistic: 1, social: 0, enterprising: 1, conventional: 0 } },
      { text: "Membaca jurnal dan melakukan riset mendalam",            weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Eksperimen kreatif dan eksplorasi bebas",                weight: { realistic: 0, investigative: 1, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Diskusi kelompok dan sharing pengalaman",                weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Studi kasus bisnis dan simulasi",                        weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 1 } },
      { text: "Mengikuti panduan step-by-step yang terstruktur",       weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Keputusan Karier",
    question: "Faktor apa yang paling penting dalam memilih karier?",
    options: [
      { text: "Bisa bekerja dengan tangan dan melihat hasil konkret",  weight: { realistic: 3, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Kesempatan untuk terus belajar dan meneliti",            weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Kebebasan berkreasi dan mengekspresikan diri",           weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Dapat membantu dan berinteraksi dengan banyak orang",   weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Peluang untuk memimpin dan mengembangkan bisnis",       weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 3, conventional: 0 } },
      { text: "Pekerjaan yang stabil dengan aturan yang jelas",        weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Tantangan Kerja",
    question: "Jenis tantangan kerja mana yang membuatmu bersemangat?",
    options: [
      { text: "Memecahkan masalah teknis atau memperbaiki sistem",          weight: { realistic: 3, investigative: 2, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Menganalisis data kompleks untuk menemukan pola",            weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Menciptakan ide baru yang belum pernah ada",                weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 1, conventional: 0 } },
      { text: "Menyelesaikan konflik dan membangun hubungan",              weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Mencapai target penjualan atau mengembangkan pasar",        weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengelola sistem dan memastikan akurasi data",              weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
];

/**
 * Varian pertanyaan untuk jenjang SMP (usia ~13–15 tahun).
 *
 * Skor RIASEC-nya TIDAK berubah sama sekali — struktur, urutan opsi, dan
 * `weight` di setiap soal persis sama dengan riasecQuestions di atas, indeks
 * demi indeks. Yang diganti hanya redaksinya: anak SMP belum punya
 * pengalaman kerja, jadi bahasa "kantor", "karier", "bisnis", "meeting"
 * diganti konteks sekolah (kelas, ekskul, tugas kelompok) yang lebih mereka
 * kenali. calculateResults() memakai array yang sama dengan yang ditampilkan
 * ke pengguna, jadi hasilnya tetap konsisten dengan pilihan yang benar-benar
 * mereka lihat.
 */
const riasecQuestionsSmp = [
  {
    category: "Kegiatan Favorit",
    question: "Dari kegiatan berikut, mana yang paling kamu suka?",
    options: [
      { text: "Membongkar & memperbaiki barang elektronik atau mainan",     weight: { realistic: 3, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Melakukan percobaan sains atau mencari tahu hal baru",       weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Menggambar, membuat video, atau berkarya seni",              weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 0, conventional: 0 } },
      { text: "Membantu teman belajar atau mengajari sesuatu",              weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Memimpin kelompok tugas atau bikin jualan kecil-kecilan",    weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Merapikan catatan, jadwal, atau barang-barang",              weight: { realistic: 0, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Suasana Belajar",
    question: "Suasana belajar seperti apa yang paling nyaman buatmu?",
    options: [
      { text: "Ruang praktik/lab dengan alat yang bisa dipakai langsung",         weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Perpustakaan atau ruang belajar yang tenang",                      weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Ruang seni atau tempat terbuka yang bebas berekspresi",            weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Ruang OSIS/ekskul, tempat berkumpul & berdiskusi rame-rame",       weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Kelas yang aktif diskusi & presentasi kelompok",                   weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Kelas dengan aturan & jadwal yang jelas dan rapi",                 weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 1, conventional: 3 } },
    ],
  },
  {
    category: "Kemampuan & Minat",
    question: "Kemampuan mana yang paling menggambarkan dirimu?",
    options: [
      { text: "Mahir memakai alat, gadget, atau perkakas",       weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Analitis dan suka memecahkan soal yang rumit",    weight: { realistic: 1, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Kreatif dan imajinatif dalam berkarya",           weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 1, conventional: 0 } },
      { text: "Empati tinggi dan mudah berteman",                weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Pandai meyakinkan teman dan suka tantangan baru", weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 1 } },
      { text: "Teliti dan suka semuanya rapi terorganisir",      weight: { realistic: 1, investigative: 1, artistic: 0, social: 0, enterprising: 1, conventional: 3 } },
    ],
  },
  {
    category: "Yang Bikin Semangat",
    question: "Apa yang paling membuatmu semangat saat mengerjakan sesuatu?",
    options: [
      { text: "Melihat hasil karya/tugas yang nyata dan berguna",         weight: { realistic: 3, investigative: 1, artistic: 1, social: 1, enterprising: 0, conventional: 0 } },
      { text: "Menemukan hal baru atau memecahkan teka-teki",             weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Mengekspresikan diri lewat sesuatu yang unik dan orisinal", weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Membantu orang lain dan bikin perubahan positif",          weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Meraih prestasi dan diakui teman-teman",                   weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 3, conventional: 1 } },
      { text: "Semuanya berjalan teratur, tidak ada yang berantakan",     weight: { realistic: 1, investigative: 0, artistic: 0, social: 1, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Gaya Komunikasi",
    question: "Bagaimana cara kamu menjelaskan sesuatu yang paling efektif?",
    options: [
      { text: "Langsung ke intinya dengan contoh yang gampang dibayangkan", weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 1, conventional: 1 } },
      { text: "Pakai data dan fakta yang jelas",                            weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 2 } },
      { text: "Pakai cerita dan gambar/visual yang kreatif",                weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 1, conventional: 0 } },
      { text: "Dengerin dulu, baru kasih dukungan",                         weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Tampil percaya diri dan meyakinkan",                         weight: { realistic: 0, investigative: 0, artistic: 1, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Ikuti cara yang sudah biasa dipakai",                        weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Cara Belajar",
    question: "Metode belajar mana yang paling cocok untukmu?",
    options: [
      { text: "Learning by doing — langsung praktik",                weight: { realistic: 3, investigative: 1, artistic: 1, social: 0, enterprising: 1, conventional: 0 } },
      { text: "Baca buku/artikel dan cari tahu lebih dalam",         weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Coba-coba bebas dan eksplorasi kreatif",              weight: { realistic: 0, investigative: 1, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Diskusi kelompok dan sharing bareng teman",           weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Main peran / simulasi situasi nyata",                 weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 1 } },
      { text: "Ikuti panduan step-by-step yang terstruktur",         weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Memilih Kegiatan",
    question: "Kalau memilih ekstrakurikuler atau kegiatan, apa yang paling kamu pertimbangkan?",
    options: [
      { text: "Bisa langsung praktik dan lihat hasilnya",                 weight: { realistic: 3, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Ada kesempatan belajar dan meneliti hal baru",             weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Bebas berkreasi dan mengekspresikan diri",                 weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Bisa membantu dan berinteraksi dengan banyak orang",       weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Ada kesempatan memimpin atau bikin proyek sendiri",        weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 3, conventional: 0 } },
      { text: "Jelas aturan dan jadwalnya, tidak bikin bingung",          weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Jenis Tantangan",
    question: "Jenis tantangan apa yang bikin kamu semangat?",
    options: [
      { text: "Memperbaiki sesuatu yang rusak atau tidak berfungsi",          weight: { realistic: 3, investigative: 2, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Mengolah data/info yang rumit untuk menemukan pola",           weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Menciptakan ide yang belum pernah ada sebelumnya",             weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 1, conventional: 0 } },
      { text: "Menyelesaikan konflik pertemanan dan menjaga hubungan baik",   weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Mencapai target lomba atau mengajak orang ikut kegiatanmu",    weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengatur sesuatu supaya rapi dan tidak ada yang salah",        weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
];

// ─── letter labels ────────────────────────────────────────────────────────────
const LETTERS = ["A", "B", "C", "D", "E", "F"];

// ─── Main Component ───────────────────────────────────────────────────────────
const Assessment = () => {
  const navigate = useNavigate();
  const hargaMulai = useHargaMulai();
  const isMobile = useIsMobile();
  // Premium gate: tes + hasil top-1 + share card GRATIS (funnel akuisisi);
  // laporan lengkap (semua karier + detail 6 skor) khusus premium
  const sub = useSubscription();
  const isFreeUser = !sub.loading && sub.isFree;
  const [phase, setPhase] = useState<"intro" | "quiz" | "pemutus" | "tujuan" | "results">("intro");
  /* Soal pemutus hanya muncul kalau hasil 8 soal dasar memang tipis (margin
     ≤2 poin — kena ~42% siswa). Tes dasarnya sengaja TIDAK diperpanjang:
     8 soal itu yang menghasilkan penyelesaian 80%, angka terbaik di produk. */
  const [pemutusPasangan, setPemutusPasangan] = useState<string[]>([]);
  const [pemutusLangkah, setPemutusLangkah] = useState(0);
  const [pemutusSkor, setPemutusSkor] = useState<{ [k: string]: number }>({});
  const [skorDasar, setSkorDasar] = useState<{ [k: string]: number }>({});
  const [jawabanDasar, setJawabanDasar] = useState<{ [key: number]: number }>({});
  const [pakaiPemutus, setPakaiPemutus] = useState(false);
  const [tujuan, setTujuan] = useState<string | null>(null);
  const [jenjang, setJenjang] = useState<string | null>(null);
  // Redaksi soal beda untuk SMP (skoring & bobotnya identik, lihat riasecQuestionsSmp).
  const questions = jenjang === "smp" ? riasecQuestionsSmp : riasecQuestions;
  const [simpanTujuan, setSimpanTujuan] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [relatedOpportunities, setRelatedOpportunities] = useState<any[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [savingRecs, setSavingRecs] = useState(false);
  const [recsSaved, setRecsSaved] = useState<number | null>(null);
  const [showCert, setShowCert] = useState(false);
  const [certUser, setCertUser] = useState<{ id: string; name: string } | null>(null);
  const [recCourses, setRecCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  /* Isi awal jenjang dari profil (mis. sudah diisi saat Onboarding), supaya
     tombol Simpan di layar "tujuan" tidak menimpanya jadi null kalau
     pengguna terburu-buru dan tidak sempat memilih chip jenjang lagi di sana.
     Sebelumnya profiles.jenjang nyaris selalu kosong (126/127) — bukan
     karena tak pernah diisi, tapi karena tertimpa null di sini. */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("jenjang").eq("user_id", user.id).maybeSingle();
      if (data?.jenjang) setJenjang(data.jenjang as string);
    });
  }, []);

  // RIASEC → course-tag map for personalized learning recommendations
  const riasecCourseTags: Record<string, string[]> = {
    realistic:     ["coding", "python", "programming", "web dev", "teknologi", "stem", "html", "css", "javascript"],
    investigative: ["riset", "penelitian", "data science", "data analytics", "statistik", "machine learning", "ai", "matematika", "critical thinking"],
    artistic:      ["desain", "ui/ux", "desain grafis", "figma", "canva", "konten", "content creation", "fotografi", "video editing", "visual"],
    social:        ["public speaking", "komunikasi", "psikologi", "kesehatan mental", "leadership", "kepemimpinan", "networking", "empati"],
    enterprising:  ["bisnis", "entrepreneurship", "wirausaha", "digital marketing", "marketing", "startup", "personal branding", "pitch deck"],
    conventional:  ["excel", "google sheets", "keuangan", "finansial", "budgeting", "investasi", "manajemen", "microsoft office", "literasi keuangan"],
  };

  // RIASEC keyword map for opportunity matching
  const riasecKeywords: Record<string, string[]> = {
    realistic:     ["teknik", "engineering", "konstruksi", "teknologi", "mekanik"],
    investigative: ["riset", "sains", "penelitian", "data", "science", "kedokteran", "ilmiah"],
    artistic:      ["desain", "kreatif", "seni", "media", "komunikasi", "content"],
    social:        ["sosial", "pendidikan", "kesehatan", "komunitas", "mengajar"],
    enterprising:  ["bisnis", "wirausaha", "leadership", "kompetisi", "manajemen", "startup"],
    conventional:  ["akuntansi", "keuangan", "administrasi", "hukum", "audit"],
  };

  // Fetch relevant opportunities once results are ready
  useEffect(() => {
    if (phase !== "results") return;
    const fetchOpportunities = async () => {
      setLoadingOpps(true);
      try {
        // Kata kunci diambil dari huruf utama DAN kedua — siswa dengan margin
        // tipis tidak lagi kehilangan separuh minatnya di rekomendasi.
        const ident = hitungIdentitas(scores);
        const keywords = [
          ...(riasecKeywords[ident.utama] || []),
          ...(ident.kedua ? riasecKeywords[ident.kedua] || [] : []),
        ];
        const orFilter = keywords.map(k => `title.ilike.%${k}%`).join(",");

        // is_active WAJIB: tanpa ini halaman hasil tes menampilkan peluang
        // yang sudah dinonaktifkan admin — persis yang terjadi setelah 468
        // peluang scraper diarsipkan pada 2026-09-07.
        let { data } = await supabase
          .from("scraped_content")
          .select("id, title, description, tags, deadline, url, poster_url")
          .eq("is_active", true)
          .or(orFilter)
          .limit(3);

        if (!data || data.length === 0) {
          const fallback = await supabase
            .from("scraped_content")
            .select("id, title, description, tags, deadline, url, poster_url")
            .eq("is_active", true)
            .limit(3);
          data = fallback.data;
        }
        setRelatedOpportunities(data || []);
      } catch (err) {
        console.error("Error fetching related opportunities:", err);
      } finally {
        setLoadingOpps(false);
      }
    };
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Fetch personalized course recommendations once results are ready
  useEffect(() => {
    if (phase !== "results") return;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        // learning_content.riasec_types terisi 36 dari 36 materi — sinyal
        // terstruktur, jauh lebih andal daripada mencocokkan tag teks bebas.
        // Dipakai dua huruf teratas supaya siswa Artistik tidak lagi terkurung
        // pada 6 dari 36 materi.
        const ident = hitungIdentitas(scores);
        const tipe = [ident.utama, ident.kedua].filter(Boolean) as string[];
        const tags = [
          ...(riasecCourseTags[ident.utama] || []),
          ...(ident.kedua ? riasecCourseTags[ident.kedua] || [] : []),
        ];
        let { data } = await supabase
          .from("learning_content")
          .select("id, title, description, duration_minutes, thumbnail_url, tags")
          .eq("is_active", true)
          .overlaps("riasec_types", tipe)
          .limit(3);

        if (!data || data.length === 0) {
          const byTag = await supabase
            .from("learning_content")
            .select("id, title, description, duration_minutes, thumbnail_url, tags")
            .eq("is_active", true)
            .overlaps("tags", tags)
            .limit(3);
          data = byTag.data;
        }

        if (!data || data.length === 0) {
          const fb = await supabase
            .from("learning_content")
            .select("id, title, description, duration_minutes, thumbnail_url, tags")
            .eq("is_active", true)
            .order("priority_score", { ascending: false, nullsFirst: false })
            .limit(3);
          data = fb.data;
        }
        setRecCourses(data || []);
      } catch (err) {
        console.error("Error fetching recommended courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  /* Satu huruf tidak sanggup memikul beban "identitas".
     Pada 181 hasil yang sudah masuk: 42% punya selisih peringkat 1–2 hanya
     ≤2 poin, dan 26% ≤1 poin. Tie-break versi lama memakai
     `Object.entries(...).find(v === maxScore)` sehingga elemen paling awal
     array selalu menang — 14 dari 14 hasil seri persis mendarat di tipe
     terdepan, dan 'conventional' (posisi terakhir) tidak pernah bisa menang.
     Sekarang: peringkat penuh, kode Holland 3 huruf, dan keyakinan yang
     ditampilkan apa adanya ke siswa. */
  const URUTAN_RIASEC: (keyof typeof riasecTypes)[] =
    ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"];

  const peringkatRiasec = (s: { [key: string]: number }) =>
    URUTAN_RIASEC
      .map(k => ({ tipe: k, skor: s[k] || 0 }))
      // seri diputus dengan urutan RIASEC baku — deterministik dan sama
      // dengan yang dipakai backfill di database, jadi kode tidak bergeser
      .sort((a, b) => b.skor - a.skor || URUTAN_RIASEC.indexOf(a.tipe) - URUTAN_RIASEC.indexOf(b.tipe));

  const hitungIdentitas = (s: { [key: string]: number }) => {
    const urut = peringkatRiasec(s);
    const margin = (urut[0]?.skor ?? 0) - (urut[1]?.skor ?? 0);
    return {
      utama: urut[0].tipe,
      kedua: urut[1]?.tipe ?? null,
      ketiga: urut[2]?.tipe ?? null,
      kode: urut.slice(0, 3).map(u => u.tipe[0].toUpperCase()).join(""),
      margin,
      keyakinan: margin <= 1 ? "seimbang" : margin <= 3 ? "sedang" : "kuat",
    };
  };

  const getPrimaryRiasecTypeFromScores = (s: { [key: string]: number }) =>
    hitungIdentitas(s).utama;

  const getPrimaryRiasecType = () => getPrimaryRiasecTypeFromScores(scores);

  const saveAssessmentResults = async (
    allAnswers: { [key: number]: number },
    s: { [key: string]: number },
    lewatPemutus = false,
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ident = hitungIdentitas(s);
      const primaryType = ident.utama;
      const careerMappings: Record<string, string[]> = {
        realistic:     ["Teknik", "Konstruksi", "Pertanian", "Teknologi"],
        investigative: ["Sains", "Penelitian", "Matematika", "Kedokteran"],
        artistic:      ["Seni", "Design", "Media", "Kreatif"],
        social:        ["Pendidikan", "Konseling", "Sosial", "Kesehatan"],
        enterprising:  ["Bisnis", "Manajemen", "Penjualan", "Kewirausahaan"],
        conventional:  ["Akuntansi", "Administrasi", "Keuangan", "Organisasi"],
      };
      const { error } = await supabase.from("assessment_results").insert({
        user_id: user.id,
        assessment_type: "riasec_personality",
        personality_type: primaryType,
        questions_answers: allAnswers,
        score_breakdown: s,
        // Karier diambil dari huruf utama DAN kedua — siswa dengan margin tipis
        // tidak lagi kehilangan separuh arah yang sebenarnya sama kuat.
        career_recommendations: [
          ...(careerMappings[primaryType] || []),
          ...(ident.kedua ? (careerMappings[ident.kedua] || []).slice(0, 2) : []),
        ],
        talent_areas: [ident.utama, ident.kedua, ident.ketiga].filter(Boolean),
        holland_code: ident.kode,
        tipe_kedua:   ident.kedua,
        tipe_ketiga:  ident.ketiga,
        margin:       ident.margin,
        keyakinan:    ident.keyakinan,
        pakai_pemutus: lewatPemutus,
      } as any);
      if (error) { console.error("Error saving assessment results:", error); return; }

      // Award XP for first-time assessment only (idempotent RPC)
      await supabase.rpc("claim_assessment_xp", { p_user_id: user.id });
    } catch (err) {
      console.error("Error in saveAssessmentResults:", err);
    }
  };

  const calculateResults = async (allAnswers: { [key: number]: number }) => {
    const newScores: { [key: string]: number } = {};
    questions.forEach((q, qi) => {
      const ai = allAnswers[qi];
      if (ai !== undefined) {
        Object.entries(q.options[ai].weight).forEach(([trait, w]) => {
          newScores[trait] = (newScores[trait] || 0) + (w as number);
        });
      }
    });

    // Hasil tipis → tanya 4 soal pemutus, jangan paksakan satu label.
    const urut = peringkatRiasec(newScores);
    const margin = (urut[0]?.skor ?? 0) - (urut[1]?.skor ?? 0);
    if (margin <= 2) {
      // Ikutkan peringkat ke-3 kalau ia juga berdempetan dengan yang teratas
      const seri = urut.filter(u => (urut[0].skor - u.skor) <= 2).slice(0, 3).map(u => u.tipe as string);
      if (seri.length >= 2) {
        setSkorDasar(newScores);
        setJawabanDasar(allAnswers);
        setPemutusPasangan(seri);
        setPemutusLangkah(0);
        setPemutusSkor({});
        setPakaiPemutus(true);
        setSelectedAnswer(null);
        setAutoAdvancing(false);
        setPhase("pemutus");
        return;
      }
    }

    setScores(newScores);
    await saveAssessmentResults(allAnswers, newScores, false);
    setPhase("tujuan");
  };

  /* Jawaban soal pemutus: +3 ke tipe yang dipilih.
     Bobotnya lebih besar dari soal biasa karena ini pilihan paksa langsung
     antar tipe yang bersaing — sinyalnya jauh lebih tajam. Dengan 5 soal
     (ganjil), selisih akhir minimum menjadi 3, jadi tipe utama tidak pernah
     lagi ditentukan oleh posisi array. Pembagian 3–2 tetap dilaporkan sebagai
     "sedang", bukan dipaksa terlihat yakin — memang belum yakin. */
  const jawabPemutus = (tipe: string) => {
    if (autoAdvancing) return;
    setAutoAdvancing(true);
    const skorBaru = { ...pemutusSkor, [tipe]: (pemutusSkor[tipe] || 0) + 3 };
    setPemutusSkor(skorBaru);
    setTimeout(async () => {
      const soal = susunSoalPemutus(pemutusPasangan);
      if (pemutusLangkah < soal.length - 1) {
        setPemutusLangkah(s => s + 1);
        setAutoAdvancing(false);
      } else {
        const gabungan = { ...skorDasar };
        Object.entries(skorBaru).forEach(([t, v]) => { gabungan[t] = (gabungan[t] || 0) + v; });
        setScores(gabungan);
        await saveAssessmentResults(jawabanDasar, gabungan, true);
        setAutoAdvancing(false);
        setPhase("tujuan");
      }
    }, 320);
  };

  /** Simpan tujuan & jenjang ke profil, lalu tampilkan hasil. */
  const simpanTujuanSiswa = async () => {
    setSimpanTujuan(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && tujuan) {
        // jenjang HANYA ditulis kalau terisi — kosong di sini tidak boleh
        // menimpa nilai yang mungkin sudah benar dari Onboarding.
        const payload: Record<string, unknown> = { tujuan, tujuan_diisi_pada: new Date().toISOString() };
        if (jenjang) payload.jenjang = jenjang;
        await supabase.from("profiles").update(payload as any).eq("user_id", user.id);
      }
    } catch (err) {
      console.error("Gagal menyimpan tujuan:", err);
    } finally {
      setSimpanTujuan(false);
      setPhase("results");
    }
  };

  // ── Quiz option click — auto-advance after short delay ────────────────────
  const handleOptionClick = (index: number) => {
    if (autoAdvancing) return;
    setSelectedAnswer(index);
    setAutoAdvancing(true);
    setTimeout(() => {
      const newAnswers = { ...answers, [currentStep]: index };
      setAnswers(newAnswers);
      if (currentStep < questions.length - 1) {
        setCurrentStep(s => s + 1);
        setSelectedAnswer(null);
        setAutoAdvancing(false);
      } else {
        calculateResults(newAnswers);
      }
    }, 380);
  };

  const handleBack = () => {
    if (currentStep > 0 && !autoAdvancing) {
      setCurrentStep(s => s - 1);
      setSelectedAnswer(answers[currentStep - 1] ?? null);
    }
  };

  const handleRetake = () => {
    setPhase("intro");
    setCurrentStep(0);
    setAnswers({});
    setScores({});
    setSelectedAnswer(null);
    setAutoAdvancing(false);
    setPemutusPasangan([]);
    setPemutusLangkah(0);
    setPemutusSkor({});
    setSkorDasar({});
    setJawabanDasar({});
    setPakaiPemutus(false);
  };

  // ── Shared page wrapper ───────────────────────────────────────────────────
  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #F1F5FB 0%, #E8F1FF 50%, #F0F7FF 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "14px 16px" : "18px 32px",
          background: "rgba(255,255,255,.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--tk-gray-200)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 800,
            fontSize: 20,
            color: "var(--tk-blue-700)",
            letterSpacing: "-.02em",
          }}
        >
          Talentika
          <span style={{ color: "var(--tk-yellow)", fontSize: 16 }}>✦</span>
        </button>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 99,
            background: "var(--tk-blue-50)",
            color: "var(--tk-blue-700)",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <Sparkles size={13} /> Talent Test RIASEC
        </span>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--tk-gray-500)",
          }}
        >
          <LayoutDashboard size={14} /> Dashboard
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 60px" }}>
        {children}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 1 — INTRO
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "intro") {
    const typeEntries = Object.entries(riasecTypes) as [keyof typeof riasecTypes, (typeof riasecTypes)[keyof typeof riasecTypes]][];
    return (
      <PageShell>
        <SEO
          title="Tes Minat Bakat RIASEC Gratis — Temukan Karir Idealmu"
          description="Ikuti tes psikometri RIASEC & Holland Test gratis untuk menemukan minat bakat dan rekomendasi karir yang cocok untukmu. Berbasis riset ilmiah, akurat untuk pelajar & mahasiswa Indonesia."
          keywords="tes minat bakat, RIASEC test, holland test, tes kepribadian karir, psikometri gratis, minat bakat pelajar, tes karir mahasiswa indonesia"
          canonical="https://talentika.id/assessment"
          structuredData={{
            "@context": "https://schema.org",
            "@type": "Quiz",
            "name": "Tes Minat Bakat RIASEC — Talentika",
            "description": "Tes psikometri berbasis teori RIASEC & Holland untuk menemukan tipe kepribadian karir dan rekomendasi jurusan kuliah yang cocok.",
            "educationalLevel": "SMA, Mahasiswa",
            "inLanguage": "id-ID",
            "url": "https://talentika.id/assessment",
            "provider": { "@type": "Organization", "name": "Talentika", "url": "https://talentika.id" },
            "hasPart": [
              { "@type": "Question", "name": "Apa tipe kepribadian RIASEC saya?", "acceptedAnswer": { "@type": "Answer", "text": "Tes RIASEC mengidentifikasi 6 tipe: Realistic, Investigative, Artistic, Social, Enterprising, Conventional. Hasil menentukan karir yang paling cocok." }}
            ],
          }}
        />
        {/* Hero */}
        <div style={{ textAlign: "center", maxWidth: 620, marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 14px",
              borderRadius: 99,
              background: "var(--tk-lilac)",
              color: "#5B21B6",
              fontFamily: "var(--tk-font-mono)",
              fontWeight: 700,
              fontSize: 11.5,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: 20,
            }}
          >
            RIASEC Personality Assessment
          </div>
          <h1
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 800,
              fontSize: 42,
              color: "var(--tk-ink)",
              letterSpacing: "-.03em",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Temukan Tipe{" "}
            <span style={{ color: "var(--tk-blue-600)" }}>Kepribadianmu</span>!
          </h1>
          <p style={{ color: "var(--tk-gray-500)", fontSize: 16, lineHeight: 1.65 }}>
            Ikuti 8 pertanyaan sederhana untuk mengetahui tipe kepribadian RIASEC-mu
            dan dapatkan rekomendasi karier yang tepat.
          </p>
        </div>

        {/* 6 personality type cards (3×2 desktop, 2×3 mobile) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
            gap: 14,
            maxWidth: 780,
            width: "100%",
            marginBottom: 40,
          }}
        >
          {typeEntries.map(([key, t]) => {
            const Icon = t.icon;
            return (
              <div
                key={key}
                className="rounded-2xl transition-shadow hover:shadow-md"
                style={{
                  background: "white",
                  border: "1px solid var(--tk-gray-200)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `linear-gradient(${t.gradient})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {t.emoji}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--tk-ink)",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--tk-font-mono)",
                        fontSize: 10.5,
                        color: t.accent,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      {key.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--tk-gray-500)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  } as React.CSSProperties}
                >
                  {t.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={() => setPhase("quiz")}
          className="inline-flex items-center gap-3 rounded-2xl transition-all"
          style={{
            padding: "16px 48px",
            background: "var(--tk-blue-600)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 17,
            color: "#fff",
            boxShadow: "0 8px 24px rgba(37,99,235,.35)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
        >
          Mulai Talent Test <ArrowRight size={18} />
        </button>

        {/* trust line */}
        <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--tk-gray-400)", fontFamily: "var(--tk-font-sans)" }}>
          ✓ Gratis &nbsp;·&nbsp; ✓ 8 Pertanyaan &nbsp;·&nbsp; ✓ Hasil Instan
        </p>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 2b — SOAL PEMUTUS (hanya bila hasil 8 soal dasar tipis)
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "pemutus") {
    const soal = susunSoalPemutus(pemutusPasangan);
    const s = soal[pemutusLangkah];
    const namaSeri = pemutusPasangan
      .map(t => riasecTypes[t as keyof typeof riasecTypes].name)
      .join(" dan ");

    return (
      <PageShell>
        <div style={{ width: "100%", maxWidth: 660 }}>
          <div
            style={{
              background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 16,
              padding: "14px 18px", marginBottom: 24, fontSize: 13.5,
              color: "#92400E", lineHeight: 1.65,
            }}
          >
            <strong>Hasilmu masih terlalu dekat untuk disimpulkan.</strong> Minatmu di{" "}
            {namaSeri} nyaris sama kuat. Empat pertanyaan lagi supaya kami tidak
            asal memilih satu untukmu.
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--tk-font-mono)", fontSize: 13, color: "var(--tk-gray-500)", fontWeight: 600 }}>
                Pemutus {pemutusLangkah + 1} / {soal.length}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: "var(--tk-gray-100)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#FBBF24,#F59E0B)", width: `${((pemutusLangkah + 1) / soal.length) * 100}%`, transition: "width .3s" }} />
            </div>
          </div>

          <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: "var(--tk-ink)", marginBottom: 20, lineHeight: 1.35 }}>
            Mana yang lebih kamu pilih?
          </h2>

          <div style={{ display: "grid", gap: 12 }}>
            {[{ teks: s.a, tipe: s.tipeA }, { teks: s.b, tipe: s.tipeB }].map(opt => (
              <button
                key={opt.tipe}
                onClick={() => jawabPemutus(opt.tipe)}
                disabled={autoAdvancing}
                style={{
                  textAlign: "left", padding: "18px 20px", borderRadius: 16,
                  border: "1.5px solid var(--tk-gray-200)", background: "white",
                  fontSize: 15, lineHeight: 1.55, color: "var(--tk-ink)",
                  cursor: autoAdvancing ? "wait" : "pointer",
                  fontFamily: "var(--tk-font-sans)",
                }}
              >
                {opt.teks}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12.5, color: "var(--tk-gray-400)", marginTop: 16, textAlign: "center" }}>
            Tidak ada pilihan netral di sini — justru jawaban netral yang membuat
            hasilmu seri sejak awal.
          </p>
        </div>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 2c — TUJUAN (arah yang dituju, bukan hanya kepribadian)
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "tujuan") {
    const OPSI_TUJUAN = [
      { v: "kuliah",      emoji: "🎓", label: "Lanjut kuliah",   sub: "Cari beasiswa & jalur masuk" },
      { v: "kerja",       emoji: "💼", label: "Cari kerja",      sub: "Magang, lowongan, pengalaman" },
      { v: "wirausaha",   emoji: "🚀", label: "Bangun usaha",    sub: "Kompetisi, pendanaan, inkubasi" },
      { v: "belum_yakin", emoji: "🧭", label: "Masih menjajaki", sub: "Belum tahu, ingin lihat semua" },
    ];
    const OPSI_JENJANG = [
      { v: "smp", label: "SMP" }, { v: "sma_smk", label: "SMA / SMK" },
      { v: "kuliah", label: "Kuliah" }, { v: "lulusan", label: "Sudah lulus" },
    ];

    return (
      <PageShell>
        <div style={{ width: "100%", maxWidth: 620 }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>🧭</div>
            <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 24, color: "var(--tk-ink)", marginBottom: 8 }}>
              Satu hal lagi sebelum hasilmu
            </h2>
            <p style={{ fontSize: 14.5, color: "var(--tk-gray-500)", lineHeight: 1.6, maxWidth: "44ch", margin: "0 auto" }}>
              Tipe kepribadian saja tidak cukup. Arah yang kamu tuju menentukan
              peluang mana yang benar-benar berguna untukmu.
            </p>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tk-gray-500)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
            Setelah ini, kamu ingin…
          </div>
          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            {OPSI_TUJUAN.map(o => (
              <button key={o.v} onClick={() => setTujuan(o.v)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                  padding: "14px 18px", borderRadius: 14, cursor: "pointer",
                  border: `1.5px solid ${tujuan === o.v ? "var(--tk-blue-600, #2563EB)" : "var(--tk-gray-200)"}`,
                  background: tujuan === o.v ? "var(--tk-blue-50, #EFF6FF)" : "white",
                }}>
                <span style={{ fontSize: 22 }}>{o.emoji}</span>
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 14.5, color: "var(--tk-ink)" }}>{o.label}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--tk-gray-500)", marginTop: 1 }}>{o.sub}</span>
                </span>
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tk-gray-500)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
            Sekarang kamu di jenjang
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {OPSI_JENJANG.map(o => (
              <button key={o.v} onClick={() => setJenjang(o.v)}
                style={{
                  padding: "9px 16px", borderRadius: 99, cursor: "pointer", fontWeight: 700, fontSize: 13.5,
                  border: `1.5px solid ${jenjang === o.v ? "var(--tk-blue-600, #2563EB)" : "var(--tk-gray-200)"}`,
                  background: jenjang === o.v ? "var(--tk-blue-50, #EFF6FF)" : "white",
                  color: jenjang === o.v ? "var(--tk-blue-700, #1D4ED8)" : "var(--tk-gray-600, #4B5563)",
                }}>
                {o.label}
              </button>
            ))}
          </div>

          <button
            onClick={simpanTujuanSiswa}
            disabled={!tujuan || simpanTujuan}
            style={{
              width: "100%", padding: "15px 22px", borderRadius: 14, border: "none",
              background: tujuan ? "var(--tk-blue-600, #2563EB)" : "var(--tk-gray-200)",
              color: tujuan ? "white" : "var(--tk-gray-400)",
              fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15.5,
              cursor: tujuan && !simpanTujuan ? "pointer" : "not-allowed",
            }}
          >
            {simpanTujuan ? "Menyimpan…" : "Lihat hasilku"}
          </button>
          <button
            onClick={() => setPhase("results")}
            style={{ width: "100%", marginTop: 10, padding: "10px", border: "none", background: "none", color: "var(--tk-gray-400)", fontSize: 13, cursor: "pointer" }}
          >
            Lewati dulu
          </button>
        </div>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 2 — QUIZ
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "quiz") {
    const q = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;

    return (
      <PageShell>
        <div style={{ width: "100%", maxWidth: 660 }}>
          {/* Progress */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--tk-font-mono)",
                  fontSize: 13,
                  color: "var(--tk-gray-500)",
                  fontWeight: 600,
                }}
              >
                {currentStep + 1} / {questions.length}
              </span>
              <span
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontSize: 13,
                  color: "var(--tk-blue-600)",
                  fontWeight: 700,
                }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 99,
                background: "var(--tk-gray-200)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg, var(--tk-blue-500), var(--tk-blue-600))",
                  width: `${progress}%`,
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>

          {/* Question card */}
          <div
            className="tk-card"
            style={{
              background: "white",
              borderRadius: 24,
              border: "1px solid var(--tk-gray-200)",
              boxShadow: "0 8px 32px rgba(0,0,0,.09)",
              padding: "36px 32px",
              marginBottom: 24,
            }}
          >
            {/* Category label */}
            <div
              style={{
                fontFamily: "var(--tk-font-mono)",
                fontWeight: 700,
                fontSize: 11,
                color: "var(--tk-gray-400)",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                marginBottom: 14,
              }}
            >
              {q.category}
            </div>

            {/* Question */}
            <h2
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--tk-ink)",
                lineHeight: 1.35,
                marginBottom: 28,
              }}
            >
              {q.question}
            </h2>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={autoAdvancing}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 16px",
                      borderRadius: 14,
                      border: isSelected
                        ? "2px solid var(--tk-blue-600)"
                        : "1.5px solid var(--tk-gray-200)",
                      background: isSelected ? "var(--tk-blue-600)" : "white",
                      cursor: autoAdvancing ? "default" : "pointer",
                      textAlign: "left",
                      transition: "all .2s ease",
                      width: "100%",
                    } as React.CSSProperties}
                    onMouseEnter={e => {
                      if (!isSelected && !autoAdvancing) {
                        (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-50)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-blue-400)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background = "white";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-gray-200)";
                      }
                    }}
                  >
                    {/* Letter badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: isSelected ? "rgba(255,255,255,.25)" : "var(--tk-blue-50)",
                        color: isSelected ? "#fff" : "var(--tk-blue-600)",
                        fontFamily: "var(--tk-font-mono)",
                        fontWeight: 800,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {LETTERS[idx]}
                    </span>

                    {/* Option text */}
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "var(--tk-font-sans)",
                        fontWeight: 500,
                        fontSize: 14,
                        color: isSelected ? "#fff" : "var(--tk-ink)",
                        lineHeight: 1.45,
                      }}
                    >
                      {opt.text}
                    </span>

                    {/* Arrow */}
                    <ArrowRight
                      size={15}
                      style={{
                        flexShrink: 0,
                        color: isSelected ? "#fff" : "var(--tk-gray-400)",
                        opacity: isSelected ? 1 : 0.5,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Back button */}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              disabled={autoAdvancing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: autoAdvancing ? "default" : "pointer",
                fontFamily: "var(--tk-font-display)",
                fontWeight: 600,
                fontSize: 13.5,
                color: "var(--tk-gray-500)",
                padding: "8px 4px",
              }}
            >
              <ChevronLeft size={16} /> Pertanyaan Sebelumnya
            </button>
          )}
        </div>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 3 — RESULTS
  // ══════════════════════════════════════════════════════════════════════════
  const primaryType = getPrimaryRiasecType();
  const personalityData = riasecTypes[primaryType];
  const identitas = hitungIdentitas(scores);
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const percentage = totalScore > 0 ? Math.round(((scores[primaryType] || 0) / totalScore) * 100) : 0;
  const TypeIcon = personalityData.icon;

  return (
    <PageShell>
      <div style={{ width: "100%", maxWidth: 720 }}>
        {/* Result hero card */}
        <div
          style={{
            background: "white",
            borderRadius: 28,
            border: "1px solid var(--tk-gray-200)",
            boxShadow: "0 16px 48px rgba(0,0,0,.1)",
            padding: isMobile ? "32px 20px" : "44px 40px",
            textAlign: "center",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Sparkle decorations */}
          <span className="tk-sparkle" style={{ position: "absolute", top: 20, left: 40, fontSize: 18, color: "var(--tk-yellow)" }}>✦</span>
          <span className="tk-sparkle" style={{ position: "absolute", top: 50, right: 50, fontSize: 13, color: "var(--tk-blue-400)" }}>✦</span>
          <span className="tk-sparkle" style={{ position: "absolute", bottom: 30, left: 80, fontSize: 10, color: "var(--tk-orange)", opacity: 0.7 }}>✦</span>

          {/* Category mono label */}
          <div
            style={{
              fontFamily: "var(--tk-font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--tk-gray-400)",
              textTransform: "uppercase",
              letterSpacing: ".12em",
              marginBottom: 20,
            }}
          >
            Hasil Talent Test
          </div>

          {/* Avatar circle */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${personalityData.gradient.split(",")[1].trim()}, ${personalityData.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 40,
              boxShadow: `0 8px 24px ${personalityData.accent}44`,
            }}
          >
            {personalityData.emoji}
          </div>

          {/* Type name */}
          <h2
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 800,
              fontSize: 30,
              color: "var(--tk-ink)",
              letterSpacing: "-.02em",
              marginBottom: 10,
            }}
          >
            Tipe {personalityData.name}
          </h2>

          {/* Kode Holland 3 huruf + keyakinan.
              Dulu siswa hanya diberi satu huruf, padahal 42% hasil selisih
              peringkat 1–2 nya ≤2 poin. Menyembunyikan itu membuat label
              terasa lebih pasti daripada datanya. Sekarang ditampilkan. */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 16px", borderRadius: 99,
                background: `${personalityData.accent}14`,
                border: `1px solid ${personalityData.accent}33`,
                fontFamily: "var(--tk-font-mono)", fontWeight: 700,
                fontSize: 15, letterSpacing: ".18em", color: personalityData.accent,
              }}
            >
              {identitas.kode}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", marginTop: 7 }}>
              Kode Holland-mu:{" "}
              {[identitas.utama, identitas.kedua, identitas.ketiga]
                .filter(Boolean)
                .map(t => riasecTypes[t as keyof typeof riasecTypes].name)
                .join(" · ")}
            </div>

            <div
              style={{
                maxWidth: "46ch", margin: "12px auto 0",
                padding: "10px 14px", borderRadius: 12,
                background: identitas.keyakinan === "seimbang" ? "#FFFBEB" : "var(--tk-gray-50, #F8FAFC)",
                border: `1px solid ${identitas.keyakinan === "seimbang" ? "#FDE68A" : "var(--tk-gray-200)"}`,
                fontSize: 13, lineHeight: 1.6,
                color: identitas.keyakinan === "seimbang" ? "#92400E" : "var(--tk-gray-600, #4B5563)",
              }}
            >
              {identitas.keyakinan === "seimbang" && identitas.kedua ? (
                <>
                  Minatmu <strong>hampir seimbang</strong> antara{" "}
                  {personalityData.name} dan {riasecTypes[identitas.kedua].name} (selisih{" "}
                  {identitas.margin} poin). Itu wajar — artinya kamu punya dua arah yang
                  sama-sama layak dicoba, bukan satu yang sudah pasti.
                </>
              ) : identitas.keyakinan === "sedang" && identitas.kedua ? (
                <>
                  {personalityData.name} sedikit lebih menonjol, tapi{" "}
                  {riasecTypes[identitas.kedua].name} juga kuat padamu — dua-duanya kami
                  pakai untuk merekomendasikan materi dan peluang.
                </>
              ) : (
                <>{personalityData.name} menonjol cukup jelas dibanding tipe lainnya.</>
              )}
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              color: "var(--tk-gray-500)",
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: "50ch",
              margin: "0 auto 24px",
            }}
          >
            {personalityData.description}
          </p>

          {/* Match percentage bar */}
          <div style={{ maxWidth: 400, margin: "0 auto 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13, color: "var(--tk-gray-500)" }}>Tingkat Kesesuaian</span>
              <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13, color: personalityData.accent }}>{percentage}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: "var(--tk-gray-100)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${personalityData.gradient.split(",")[1].trim()}, ${personalityData.accent})`,
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>

          {/* Characteristic pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            {personalityData.characteristics.map(ch => (
              <span
                key={ch}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: "var(--tk-blue-50)",
                  color: "var(--tk-blue-700)",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 12.5,
                }}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* ── SATU LANGKAH BERIKUTNYA ──────────────────────────────────────
            Momen paling bersemangat siswa adalah tepat setelah hasil keluar.
            Dulu di sini langsung disodorkan banyak pilihan sekaligus, dan
            hampir tidak ada yang lanjut belajar (98 tes → 10 mulai belajar).
            Sekarang: satu kartu, satu tombol, satu langkah. */}
        {!loadingCourses && recCourses.length > 0 && (
          <div
            style={{
              background: `linear-gradient(135deg, ${personalityData.accent}, var(--tk-blue-600))`,
              borderRadius: 24,
              padding: isMobile ? "24px 20px" : "32px 36px",
              marginBottom: 24,
              color: "white",
              boxShadow: "0 12px 32px -12px rgba(0,0,0,.35)",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: .85, marginBottom: 8 }}>
              Langkah berikutnya untukmu
            </div>
            <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: isMobile ? 20 : 24, lineHeight: 1.3, margin: "0 0 10px" }}>
              {recCourses[0].title}
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, opacity: .92, margin: "0 0 20px", maxWidth: "52ch" }}>
              {/* Durasi hanya ditampilkan bila benar-benar singkat. Nilai
                  duration_minutes saat ini masih placeholder (semua kelipatan
                  15, sampai 300 menit) — menuliskan "Cukup 90 menit" justru
                  membuat siswa mundur. Tampilkan hanya jika meyakinkan. */}
              {recCourses[0].duration_minutes && recCourses[0].duration_minutes <= 30
                ? `Cukup ${recCourses[0].duration_minutes} menit. `
                : ""}
              Materi ini dipilih khusus untuk tipe {personalityData.name}. Selesaikan satu ini dulu — sisanya bisa nanti.
            </p>
            <button
              onClick={() => navigate(`/learning/content/${recCourses[0].id}`)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                padding: isMobile ? "14px 28px" : "15px 36px",
                borderRadius: 14, border: "none", background: "white",
                color: personalityData.accent, cursor: "pointer",
                fontFamily: "var(--tk-font-display)", fontWeight: 800,
                fontSize: isMobile ? 15 : 16,
                boxShadow: "0 4px 14px rgba(0,0,0,.18)",
              }}
            >
              Mulai Sekarang →
            </button>
            <div style={{ fontSize: 12.5, opacity: .8, marginTop: 14 }}>
              Selesaikan materi pertamamu untuk mulai mengumpulkan XP menuju sertifikat 🎓
            </div>
          </div>
        )}

        {/* Career recommendations */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            border: "1px solid var(--tk-gray-200)",
            padding: isMobile ? "20px 16px" : "28px 32px",
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--tk-ink)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TypeIcon size={18} style={{ color: personalityData.accent }} />
            Rekomendasi Karier
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(isFreeUser ? personalityData.careers.slice(0, 2) : personalityData.careers).map(c => (
              <span
                key={c}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 14px",
                  borderRadius: 99,
                  background: "var(--tk-orange-soft)",
                  color: "var(--tk-orange)",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {c}
              </span>
            ))}
            {isFreeUser && personalityData.careers.length > 2 && (
              <button
                onClick={() => navigate("/subscription?from=%2Fassessment")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 14px",
                  borderRadius: 99,
                  border: "1.5px dashed var(--tk-gray-300)",
                  background: "var(--tk-gray-50)",
                  color: "var(--tk-gray-600)",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                🔒 +{personalityData.careers.length - 2} karier lagi — buka dengan Premium
              </button>
            )}
          </div>
        </div>

        {/* RIASEC score breakdown (laporan lengkap = premium) */}
        <UpgradeGate
          feature="Lihat peta lengkap 6 dimensi minatmu + detail skor tiap tipe"
          fromPath="/assessment"
        >
        <div
          style={{
            background: "white",
            borderRadius: 24,
            border: "1px solid var(--tk-gray-200)",
            padding: isMobile ? "20px 16px" : "28px 32px",
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--tk-ink)",
              marginBottom: 20,
            }}
          >
            Detail Skor RIASEC
          </h3>

          {/* Radar 6-dimensi — peta minat menyeluruh */}
          {(() => {
            const dims: (keyof typeof riasecTypes)[] = ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"];
            const maxS = Math.max(...dims.map(d => scores[d] || 0), 1);
            const cx = 170, cy = 160, R = 100;
            const ptOf = (i: number, r: number) => {
              const a = (-90 + i * 60) * Math.PI / 180;
              return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
            };
            const dataPts = dims.map((d, i) => ptOf(i, R * ((scores[d] || 0) / maxS)));
            const ring = (f: number) => dims.map((_, i) => ptOf(i, R * f).join(",")).join(" ");
            return (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <svg viewBox="0 0 340 320" style={{ width: "100%", maxWidth: 340 }}>
                  {[0.33, 0.66, 1].map(f => (
                    <polygon key={f} points={ring(f)} fill="none" stroke="var(--tk-gray-200)" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = ptOf(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--tk-gray-200)" strokeWidth="1" />;
                  })}
                  <polygon points={dataPts.map(p => p.join(",")).join(" ")}
                    fill={personalityData.accent} fillOpacity="0.18" stroke={personalityData.accent} strokeWidth="2.5" strokeLinejoin="round" />
                  {dataPts.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke={personalityData.accent} strokeWidth="2" />
                  ))}
                  {dims.map((d, i) => {
                    const [lx, ly] = ptOf(i, R + 26);
                    return (
                      <text key={d} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                        fontSize="12.5" fontWeight={d === primaryType ? 800 : 600}
                        fill={d === primaryType ? personalityData.accent : "var(--tk-gray-500)"}
                        fontFamily="var(--tk-font-display)">
                        {riasecTypes[d].name}
                      </text>
                    );
                  })}
                </svg>
              </div>
            );
          })()}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 14 }}>
            {(Object.entries(riasecTypes) as [keyof typeof riasecTypes, (typeof riasecTypes)[keyof typeof riasecTypes]][]).map(([key, t]) => {
              const sc = scores[key] || 0;
              const pct = totalScore > 0 ? (sc / totalScore) * 100 : 0;
              const Icon = t.icon;
              const isPrimary = key === primaryType;
              return (
                <div
                  key={key}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: isPrimary ? `2px solid ${t.accent}` : "1.5px solid var(--tk-gray-200)",
                    background: isPrimary ? `linear-gradient(${t.gradient})` : "var(--tk-gray-50)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: isPrimary ? "rgba(255,255,255,.6)" : `linear-gradient(${t.gradient})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={14} style={{ color: t.accent }} />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "var(--tk-ink)",
                      }}
                    >
                      {t.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>Skor: {sc}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.accent }}>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.6)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: t.accent,
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </UpgradeGate>

        {/* Personalized course recommendations */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            border: "1px solid var(--tk-gray-200)",
            padding: isMobile ? "20px 16px" : "28px 32px",
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "var(--tk-ink)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} style={{ color: personalityData.accent }} />
            Kursus untuk Kembangkan Potensimu
          </h3>
          <p style={{ color: "var(--tk-gray-500)", fontSize: 13, marginBottom: 18 }}>
            Mulai langkah nyata sesuai tipe <b style={{ color: "var(--tk-ink)" }}>{personalityData.name}</b> — dipilih khusus untukmu
          </p>
          {loadingCourses ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ height: 150, borderRadius: 14, background: "var(--tk-gray-100)" }} className="animate-pulse" />)}
            </div>
          ) : recCourses.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
              {recCourses.map(c => (
                <div key={c.id}
                  onClick={() => navigate(`/learning/content/${c.id}`)}
                  style={{ padding: 16, borderRadius: 16, border: "1.5px solid var(--tk-gray-200)", background: "var(--tk-gray-50)", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", transition: "border-color .15s, transform .15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = personalityData.accent; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--tk-gray-200)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
                  <div style={{ height: 3, borderRadius: 99, background: personalityData.accent, marginBottom: 4 }} />
                  <p style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13.5, color: "var(--tk-ink)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                    {c.title}
                  </p>
                  {c.description && (
                    <p style={{ fontSize: 12, color: "var(--tk-gray-500)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                      {c.description}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 6, color: personalityData.accent, fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 12.5 }}>
                    {c.duration_minutes ? `${c.duration_minutes} menit · ` : ""}Mulai Belajar →
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--tk-gray-400)", fontSize: 13 }}>Belum ada kursus rekomendasi saat ini.</p>
          )}
          <button
            onClick={() => navigate("/learning")}
            style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 12, background: `linear-gradient(135deg, ${personalityData.accent}, var(--tk-blue-600))`, border: "none", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Sparkles size={15} /> Jelajahi Semua Kursus
          </button>
        </div>

        {/* Personalized opportunities */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            border: "1px solid var(--tk-gray-200)",
            padding: isMobile ? "20px 16px" : "28px 32px",
            marginBottom: 32,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--tk-ink)",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Sparkles size={18} style={{ color: "var(--tk-yellow)" }} />
            Peluang untuk Tipe {personalityData.name}
          </h3>
          <p style={{ color: "var(--tk-gray-500)", fontSize: 13, marginBottom: 18 }}>
            Beasiswa, magang &amp; kompetisi yang cocok dengan kepribadianmu
          </p>
          {loadingOpps ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: 130, borderRadius: 14, background: "var(--tk-gray-100)" }} className="animate-pulse" />
              ))}
            </div>
          ) : relatedOpportunities.length > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
                {relatedOpportunities.map(opp => (
                  <div
                    key={opp.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: "1.5px solid var(--tk-gray-200)",
                      background: "var(--tk-gray-50)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        height: 3,
                        borderRadius: 99,
                        background: personalityData.accent,
                        marginBottom: 4,
                      }}
                    />
                    <p
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: "var(--tk-ink)",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      } as React.CSSProperties}
                    >
                      {opp.title}
                    </p>
                    {opp.description && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--tk-gray-500)",
                          lineHeight: 1.45,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        } as React.CSSProperties}
                      >
                        {opp.description}
                      </p>
                    )}
                    {opp.deadline && (
                      <p style={{ fontSize: 11.5, color: "var(--tk-orange)", fontWeight: 600, marginTop: "auto" }}>
                        📅 {new Date(opp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                    {opp.url && (
                      <button
                        onClick={() => window.open(opp.url, "_blank", "noopener,noreferrer")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--tk-font-display)",
                          fontWeight: 600,
                          fontSize: 12,
                          color: "var(--tk-blue-600)",
                          padding: 0,
                          marginTop: 4,
                        }}
                      >
                        <ExternalLink size={11} /> Lihat detail →
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", alignItems: "center" }}>
                {recsSaved != null ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 12, background: "var(--tk-mint,#ECFDF5)", color: "var(--tk-green-dark,#059669)", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13 }}>
                    ✓ {recsSaved} peluang tersimpan — cek di halaman Peluang
                  </span>
                ) : (
                  <button
                    onClick={async () => {
                      setSavingRecs(true);
                      const { data, error } = await (supabase.rpc as any)("save_recommended_opportunities", { p_limit: 3 });
                      setSavingRecs(false);
                      if (error) { toast.error(error.message); return; }
                      const n = (data as any)?.saved ?? 0;
                      setRecsSaved(n);
                      toast.success(n > 0 ? `🔖 ${n} peluang terbaik tersimpan untukmu!` : "Semua peluang cocok sudah tersimpan 👍");
                    }}
                    disabled={savingRecs}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 12,
                      border: "none", background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff",
                      cursor: savingRecs ? "wait" : "pointer", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13,
                      boxShadow: "0 4px 14px rgba(37,99,235,.3)",
                    }}
                  >
                    🔖 {savingRecs ? "Menyimpan…" : "Simpan 3 Peluang Teratas Untukku"}
                  </button>
                )}
                <button
                  onClick={() => navigate("/opportunities")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 22px", borderRadius: 12,
                    border: "1.5px solid var(--tk-blue-300)", background: "var(--tk-blue-50)", cursor: "pointer",
                    fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13, color: "var(--tk-blue-700)",
                  }}
                >
                  <ExternalLink size={13} /> Lihat semua →
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 14, marginBottom: 14 }}>
                Temukan beasiswa, magang, dan kompetisi yang cocok untukmu.
              </p>
              <button
                onClick={() => navigate("/opportunities")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: "var(--tk-blue-600)",
                  cursor: "pointer",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#fff",
                }}
              >
                <ExternalLink size={13} /> Jelajahi Semua Peluang
              </button>
            </div>
          )}
        </div>

        {/* ── Premium Report Upsell ────────────────────────────────────────── */}
        {(() => {
          const primaryType = getPrimaryRiasecType();
          const typeInfo = riasecTypes[primaryType];
          return (
            <div style={{
              margin: "0 0 28px",
              borderRadius: 20,
              overflow: "hidden",
              border: "1.5px solid #BFDBFE",
              background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 50%, #EDE9FE 100%)",
              position: "relative",
            }}>
              {/* Decorative */}
              <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200,
                borderRadius: "50%", background: "rgba(37,99,235,0.06)", pointerEvents: "none" }} />
              <div style={{ padding: isMobile ? "22px 20px" : "28px 32px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
                      borderRadius: 99, background: "#DBEAFE", color: "#1E40AF",
                      fontSize: 11, fontWeight: 800, letterSpacing: ".05em", marginBottom: 12 }}>
                      🔒 LAPORAN PREMIUM
                    </div>
                    <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: isMobile ? 18 : 22,
                      color: "var(--tk-ink)", margin: "0 0 8px", letterSpacing: "-.01em" }}>
                      Buka Laporan Karir Lengkap {typeInfo.emoji}
                    </h3>
                    <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", lineHeight: 1.6, margin: "0 0 16px" }}>
                      Dapatkan analisis mendalam tipe <strong style={{ color: "var(--tk-blue-700)" }}>{typeInfo.name}</strong> kamu:
                      10 rekomendasi karir spesifik, jalur pendidikan ideal, kekuatan & kelemahan tersembunyi,
                      dan roadmap pengembangan diri 6 bulan.
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                      {["10+ Rekomendasi Karir", "Analisis Kepribadian Mendalam", "Roadmap 6 Bulan", "PDF Siap Cetak"].map(f => (
                        <span key={f} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5,
                          fontWeight: 600, color: "#1E40AF", background: "rgba(255,255,255,0.7)",
                          border: "1px solid #BFDBFE", padding: "3px 10px", borderRadius: 99 }}>
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <button onClick={() => navigate("/subscription")}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px",
                          borderRadius: 12, border: "none", cursor: "pointer",
                          background: "linear-gradient(135deg, #2563EB, #7C3AED)", color: "white",
                          fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14,
                          boxShadow: "0 4px 16px rgba(37,99,235,.35)" }}>
                        <Sparkles size={16} /> Upgrade & Buka Laporan →
                      </button>
                      <div>
                        {hargaMulai && (
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF" }}>
                            Mulai {hargaMulai}/bulan
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>🛡 Garansi 30 hari · Batalkan kapan saja</div>
                      </div>
                    </div>
                  </div>
                  {!isMobile && (
                    <div style={{ flexShrink: 0, width: 140, height: 180, borderRadius: 16, overflow: "hidden",
                      background: `linear-gradient(${typeInfo.gradient})`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 8px 24px rgba(0,0,0,.1)" }}>
                      <div style={{ fontSize: 52 }}>{typeInfo.emoji}</div>
                      <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 13,
                        color: typeInfo.accent, marginTop: 8 }}>{typeInfo.name}</div>
                      <div style={{ fontSize: 10, color: typeInfo.accent, opacity: .7, marginTop: 2 }}>
                        Laporan Karir
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Recommended courses based on RIASEC type */}
        {(() => {
          const courseMap: Record<string, { emoji: string; title: string; desc: string; tag: string }[]> = {
            realistic:     [
              { emoji: "🛠️", title: "Teknik & Rekayasa Dasar", desc: "Pelajari prinsip dasar rekayasa, mekanik, dan pembuatan produk fisik.", tag: "Teknik" },
              { emoji: "💻", title: "Pemrograman untuk Pemula", desc: "Mulai coding dari nol — logika, variabel, dan membangun program pertamamu.", tag: "Teknologi" },
              { emoji: "📐", title: "Desain Produk & Prototyping", desc: "Dari ide ke prototipe: belajar merancang produk yang fungsional dan estetis.", tag: "Desain" },
            ],
            investigative: [
              { emoji: "📊", title: "Analisis Data dengan Python", desc: "Transformasi data mentah menjadi insight bermakna menggunakan Python & Pandas.", tag: "Data Science" },
              { emoji: "🔬", title: "Riset & Metodologi Ilmiah", desc: "Pelajari cara merancang penelitian yang valid dan menyajikan hasilnya.", tag: "Riset" },
              { emoji: "🧮", title: "Statistika untuk Pemula", desc: "Dasar probabilitas, distribusi, dan pengujian hipotesis secara praktis.", tag: "Matematika" },
            ],
            artistic:      [
              { emoji: "🎨", title: "UI/UX Design Fundamental", desc: "Prinsip desain antarmuka yang indah dan pengalaman pengguna yang intuitif.", tag: "Desain" },
              { emoji: "✍️", title: "Content Writing & Copywriting", desc: "Tulis konten yang menarik, persuasif, dan relevan untuk audiens digitalmu.", tag: "Konten" },
              { emoji: "🎬", title: "Video Editing & Storytelling", desc: "Buat video yang menghipnotis — teknik editing, color grading, dan narasi.", tag: "Kreatif" },
            ],
            social:        [
              { emoji: "🤝", title: "Public Speaking & Presentasi", desc: "Bicara dengan percaya diri di depan umum dan sampaikan pesan yang berkesan.", tag: "Komunikasi" },
              { emoji: "🧘", title: "Psikologi Dasar & Empati", desc: "Pahami perilaku manusia, emosi, dan cara membangun hubungan bermakna.", tag: "Psikologi" },
              { emoji: "🏫", title: "Pendidikan & Fasilitasi", desc: "Teknik mengajar efektif, merancang kurikulum, dan memfasilitasi belajar.", tag: "Pendidikan" },
            ],
            enterprising:  [
              { emoji: "🚀", title: "Kewirausahaan & Startup", desc: "Dari ide ke bisnis nyata — validasi pasar, pitch, dan scale-up.", tag: "Bisnis" },
              { emoji: "📣", title: "Digital Marketing Fundamentals", desc: "SEO, social media, dan iklan digital untuk tumbuhkan bisnis online.", tag: "Marketing" },
              { emoji: "💼", title: "Leadership & Manajemen Tim", desc: "Pelajari cara memimpin tim, membuat keputusan, dan mengelola konflik.", tag: "Leadership" },
            ],
            conventional:  [
              { emoji: "📋", title: "Manajemen Proyek dengan Agile", desc: "Kelola proyek secara terstruktur dengan metode Scrum dan Kanban.", tag: "Manajemen" },
              { emoji: "💹", title: "Akuntansi & Keuangan Dasar", desc: "Pahami laporan keuangan, arus kas, dan prinsip akuntansi untuk bisnis.", tag: "Keuangan" },
              { emoji: "🗂️", title: "Produktivitas & Manajemen Waktu", desc: "Sistem kerja efisien, prioritisasi tugas, dan kebiasaan yang menghasilkan.", tag: "Produktivitas" },
            ],
          };
          const courses = courseMap[primaryType] ?? courseMap.investigative;
          return (
            <div
              style={{
                background: "white",
                borderRadius: 24,
                border: "1px solid var(--tk-gray-200)",
                padding: isMobile ? "20px 16px" : "28px 32px",
                marginBottom: 32,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--tk-ink)",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>🎓</span>
                Kursus yang Cocok untuk Tipe {personalityData.name}
              </h3>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 13, marginBottom: 20 }}>
                Mulai belajar sekarang dengan kursus yang dirancang khusus untuk tipe kepribadianmu.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
                {courses.map((course, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "18px 16px",
                      borderRadius: 16,
                      border: "1.5px solid var(--tk-gray-200)",
                      background: "var(--tk-gray-50)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      cursor: "pointer",
                      transition: "box-shadow .2s, border-color .2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "var(--tk-shadow-lg)";
                      (e.currentTarget as HTMLElement).style.borderColor = personalityData.accent;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-gray-200)";
                    }}
                    onClick={() => navigate("/learning")}
                  >
                    <div style={{ fontSize: 30 }}>{course.emoji}</div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 99,
                        background: `${personalityData.accent}18`,
                        color: personalityData.accent,
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 11,
                        width: "fit-content",
                      }}
                    >
                      {course.tag}
                    </span>
                    <div
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: "var(--tk-ink)",
                        lineHeight: 1.35,
                      }}
                    >
                      {course.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--tk-gray-500)", lineHeight: 1.5 }}>
                      {course.desc}
                    </div>
                    <div
                      style={{
                        marginTop: "auto",
                        fontSize: 12,
                        fontWeight: 700,
                        color: personalityData.accent,
                        fontFamily: "var(--tk-font-display)",
                      }}
                    >
                      Mulai belajar →
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => navigate("/learning")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 22px",
                    borderRadius: 12,
                    border: "1.5px solid var(--tk-blue-300)",
                    background: "var(--tk-blue-50)",
                    cursor: "pointer",
                    fontFamily: "var(--tk-font-display)",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--tk-blue-700)",
                  }}
                >
                  Lihat semua kursus →
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Laporan Lengkap CTA ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 50%, #FEF3C7 100%)",
            border: "2px solid #FED7AA",
            borderRadius: 24,
            padding: isMobile ? "24px 20px" : "32px 40px",
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative blob */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,.15) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: 24, position: "relative" }}>
            {/* Left: icon + copy */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 17, color: "#92400E", letterSpacing: "-.01em" }}>
                    Laporan Asesmen Lengkap
                  </div>
                  <div style={{ fontSize: 13, color: "#B45309", fontWeight: 600 }}>
                    Rp 29.000 · bayar sekali, berlaku selamanya
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: "#92400E", lineHeight: 1.6, margin: 0 }}>
                Dapatkan analisis mendalam tentang tipe <strong>{personalityData.name}</strong>-mu, jalur karier yang paling tepat, rekomendasi kuliah & jurusan, serta roadmap pengembangan diri — dalam format PDF profesional yang bisa kamu simpan & bagikan.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {["✓ 15+ halaman analisis", "✓ Rekomendasi jurusan", "✓ Roadmap karier", "✓ Format PDF profesional"].map(item => (
                  <span key={item} style={{ fontSize: 12, fontWeight: 600, color: "#B45309", background: "rgba(251,191,36,.2)", padding: "3px 10px", borderRadius: 99 }}>{item}</span>
                ))}
              </div>
            </div>

            {/* Right: price + CTA */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "stretch" : "center", gap: 10, flexShrink: 0, minWidth: isMobile ? undefined : 160 }}>
              <div style={{ textAlign: "center", fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: "#C2410C" }}>
                Rp 29.000
              </div>
              <button
                onClick={() => navigate("/subscription")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 24px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg,#F97316,#EA580C)",
                  color: "#fff",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 8px 20px -4px rgba(234,88,12,.4)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,#EA580C,#C2410C)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,#F97316,#EA580C)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Beli Laporan
              </button>
              <div style={{ textAlign: "center", fontSize: 11, color: "#B45309", fontWeight: 500 }}>
                Tidak perlu berlangganan
              </div>
            </div>
          </div>
        </div>

        {/* Certificate section */}
        <div style={{ background: "white", borderRadius: 20, border: "1.5px solid var(--tk-blue-200)", padding: "22px 24px", marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎓</div>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 16, color: "var(--tk-ink)", marginBottom: 6 }}>Unduh Sertifikat Digital Kamu!</div>
          <p style={{ fontSize: 13, color: "var(--tk-gray-500)", marginBottom: 16, lineHeight: 1.6 }}>
            Sertifikat resmi penyelesaian Tes Minat Bakat RIASEC — bisa dibagikan di LinkedIn, CV, atau portofolio kamu.
          </p>
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
                setCertUser({ id: user.id, name: profile?.full_name || user.email?.split("@")[0] || "Talentika User" });
                setShowCert(true);
              }
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 12, border: "none", background: "var(--tk-blue-600)", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,.3)" }}
          >
            <Award size={15} /> Unduh Sertifikat Gratis
          </button>
        </div>

        {/* CTA: Lihat Dashboard + Retake */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          {/* ── Tes Kecerdasan Majemuk — DI ATAS tombol dashboard ──────────────
              Kartu ini dulu diletakkan DI BAWAH tombol "Lihat Dashboard", dan
              satu-satunya tautan ke tes MI di seluruh aplikasi. Hasilnya: dari
              98 siswa yang menyelesaikan RIASEC, hanya 4 yang pernah menemukan
              tes ini. Padahal instrumennya justru lebih tebal — 24 soal untuk
              8 kecerdasan, dibanding RIASEC yang 8 soal. Masalahnya bukan
              kualitas tesnya, tapi tidak ada yang melihatnya. */}
          <div
            onClick={() => navigate("/multiple-intelligence")}
            style={{
              display: "flex", alignItems: "center", gap: 14, cursor: "pointer", width: "100%",
              background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)",
              border: "1.5px solid #DDD6FE", borderRadius: 18,
              padding: isMobile ? "16px 18px" : "18px 24px", textAlign: "left",
            }}
          >
            <div style={{ fontSize: 34, flexShrink: 0 }}>🧠</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)", marginBottom: 2 }}>
                Langkah berikutnya: Tes Kecerdasan Majemuk
              </div>
              <div style={{ fontSize: 13, color: "var(--tk-gray-500)", lineHeight: 1.5 }}>
                RIASEC menunjukkan <b>apa yang kamu minati</b>. Tes ini menunjukkan{" "}
                <b>bagaimana kamu belajar paling baik</b> — 24 soal, ±4 menit.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7C3AED", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>
              Mulai <ArrowRight size={16} />
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 56px",
              borderRadius: 20,
              border: "none",
              background: "var(--tk-blue-600)",
              cursor: "pointer",
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 17,
              color: "#fff",
              boxShadow: "0 8px 24px rgba(37,99,235,.35)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
          >
            <LayoutDashboard size={18} /> Lihat Dashboard <ArrowRight size={18} />
          </button>

          {/* ── Share hasil ── */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {/* Shareable image card (Canvas) — viral growth */}
            <button
              onClick={async () => {
                const accent = personalityData?.accent ?? "#2563EB";
                const careers = (personalityData?.careers ?? []).slice(0, 4);
                const cv = document.createElement("canvas");
                cv.width = 1080; cv.height = 1080;
                const x = cv.getContext("2d")!;
                // bg
                x.fillStyle = "#F8FAFD"; x.fillRect(0, 0, 1080, 1080);
                // top band
                const g = x.createLinearGradient(0, 0, 1080, 360);
                g.addColorStop(0, accent); g.addColorStop(1, "#1D4ED8");
                x.fillStyle = g; x.fillRect(0, 0, 1080, 360);
                x.fillStyle = "rgba(255,255,255,.92)"; x.font = "700 34px Poppins, sans-serif";
                x.fillText("Talentika ✦", 64, 90);
                x.font = "600 26px Inter, sans-serif"; x.fillStyle = "rgba(255,255,255,.8)";
                x.fillText("Hasil Tes Minat & Bakat (RIASEC)", 64, 132);
                // emoji circle
                x.fillStyle = "#fff"; x.beginPath(); x.arc(540, 360, 130, 0, Math.PI * 2); x.fill();
                x.font = "120px sans-serif"; x.textAlign = "center";
                x.fillText(personalityData?.emoji ?? "✨", 540, 405);
                // type
                x.fillStyle = "#0B1D3A"; x.font = "800 78px Poppins, sans-serif";
                x.fillText("Tipe " + (personalityData?.name ?? primaryType), 540, 600);
                x.fillStyle = "#64748B"; x.font = "400 30px Inter, sans-serif";
                x.fillText("Kepribadian karier dominanku", 540, 650);
                // careers
                x.fillStyle = accent; x.font = "700 30px Poppins, sans-serif";
                x.fillText("KARIER YANG COCOK", 540, 740);
                x.font = "600 34px Inter, sans-serif"; x.fillStyle = "#1E293B";
                careers.forEach((c: string, i: number) => x.fillText("• " + c, 540, 800 + i * 56));
                // footer
                x.fillStyle = accent; x.fillRect(0, 1000, 1080, 80);
                x.fillStyle = "#fff"; x.font = "700 30px Poppins, sans-serif";
                x.fillText("Coba gratis di talentika.id", 540, 1050);
                x.textAlign = "left";

                const blob: Blob | null = await new Promise(r => cv.toBlob(r, "image/png"));
                if (!blob) return;
                const file = new File([blob], "hasil-talentika.png", { type: "image/png" });
                const cap = `Tipe kepribadian kariernya: ${personalityData?.name ?? primaryType}! Coba tes minat bakat gratis di talentika.id 🎯`;
                const navAny = navigator as any;
                if (navAny.canShare && navAny.canShare({ files: [file] })) {
                  try { await navAny.share({ files: [file], text: cap }); } catch { /* user cancelled */ }
                } else {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "hasil-talentika.png"; a.click();
                  URL.revokeObjectURL(url);
                  import("sonner").then(({ toast }) => toast.success("Kartu hasil tersimpan — bagikan ke media sosialmu!"));
                }
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--tk-blue-600)", border: "none", borderRadius: 12,
                padding: "11px 20px", cursor: "pointer",
                fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#fff",
                boxShadow: "0 4px 12px rgba(37,99,235,.3)",
              }}
            >
              <Sparkles size={15} /> Bagikan Kartu Hasil
            </button>
            <button
              onClick={() => {
                const msg = encodeURIComponent(
                  `Aku baru selesai tes minat & bakat di Talentika! 🎉\n\nHasilnya: *${personalityData?.label ?? primaryType}* (${percentage}%)\n\n"${personalityData?.desc ?? ""}"\n\nCoba juga yuk, gratis! 👉 ${window.location.origin}`
                );
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#25D366", border: "none", borderRadius: 12,
                padding: "11px 20px", cursor: "pointer",
                fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#fff",
                boxShadow: "0 4px 12px rgba(37,211,102,.35)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Bagikan via WhatsApp
            </button>

            <button
              onClick={() => {
                const text = `Hasil assessment Talentika-ku: ${personalityData?.label ?? primaryType} (${percentage}%)\n${window.location.origin}`;
                if (navigator.share) {
                  navigator.share({ title: "Hasil Assessment Talentika", text, url: window.location.origin });
                } else {
                  navigator.clipboard.writeText(text).then(() => {
                    import("sonner").then(({ toast }) => toast.success("Hasil disalin!"));
                  });
                }
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "none", border: "1.5px solid var(--tk-gray-200)", borderRadius: 12,
                padding: "11px 20px", cursor: "pointer",
                fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 14, color: "var(--tk-gray-600)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Bagikan Hasil
            </button>
          </div>

          <button
            onClick={handleRetake}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "1.5px solid var(--tk-gray-200)",
              borderRadius: 12,
              cursor: "pointer",
              padding: "10px 24px",
              fontFamily: "var(--tk-font-display)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--tk-gray-500)",
            }}
          >
            <RefreshCw size={14} /> Tes Ulang
          </button>
        </div>
      </div>

      {/* Certificate modal */}
      {showCert && certUser && (
        <CertificateGenerator
          userId={certUser.id}
          userName={certUser.name}
          personalityType={primaryType}
          onClose={() => setShowCert(false)}
        />
      )}
    </PageShell>
  );
};

export default Assessment;
