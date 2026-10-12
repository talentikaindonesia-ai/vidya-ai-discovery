/**
 * Tes minat RIASEC (Holland) — SATU sumber untuk web (/assessment) dan
 * aplikasi mobile (/app/dna/personality).
 *
 * Web adalah acuan: soal, bobot, pemutus seri, peringkat, dan baris
 * `assessment_results` yang ditulis harus identik di kedua tempat, supaya
 * siswa mendapat tipe yang sama di mana pun ia mengerjakan tesnya. Jangan
 * menyalin isi file ini ke tempat lain — impor dari sini.
 */

export type TipeRiasec =
  | "realistic" | "investigative" | "artistic"
  | "social" | "enterprising" | "conventional";

export type Keyakinan = "kuat" | "sedang" | "seimbang";

export type SkorRiasec = { [key: string]: number };

export const RIASEC_INFO = {
  realistic: {
    name: "Realistic",
    emoji: "🔧",
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
export const PERNYATAAN_PEMUTUS: Record<string, string[]> = {
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
export function susunSoalPemutus(tipeSeri: string[]): { a: string; b: string; tipeA: string; tipeB: string }[] {
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
export const riasecQuestions = [
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
export const riasecQuestionsSmp = [
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

/* ─── Peringkat & identitas ───────────────────────────────────────────────────
   Satu huruf tidak sanggup memikul beban "identitas".
   Pada 181 hasil yang sudah masuk: 42% punya selisih peringkat 1–2 hanya
   ≤2 poin, dan 26% ≤1 poin. Tie-break versi lama memakai
   `Object.entries(...).find(v === maxScore)` sehingga elemen paling awal
   array selalu menang — 14 dari 14 hasil seri persis mendarat di tipe
   terdepan, dan 'conventional' (posisi terakhir) tidak pernah bisa menang.
   Sekarang: peringkat penuh, kode Holland 3 huruf, dan keyakinan yang
   ditampilkan apa adanya ke siswa. */
export const URUTAN_RIASEC: TipeRiasec[] =
  ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"];

export const peringkatRiasec = (s: SkorRiasec) =>
  URUTAN_RIASEC
    .map(k => ({ tipe: k, skor: s[k] || 0 }))
    // seri diputus dengan urutan RIASEC baku — deterministik dan sama
    // dengan yang dipakai backfill di database, jadi kode tidak bergeser
    .sort((a, b) => b.skor - a.skor || URUTAN_RIASEC.indexOf(a.tipe) - URUTAN_RIASEC.indexOf(b.tipe));

export const hitungIdentitas = (s: SkorRiasec) => {
  const urut = peringkatRiasec(s);
  const margin = (urut[0]?.skor ?? 0) - (urut[1]?.skor ?? 0);
  return {
    utama: urut[0].tipe,
    kedua: urut[1]?.tipe ?? null,
    ketiga: urut[2]?.tipe ?? null,
    kode: urut.slice(0, 3).map(u => u.tipe[0].toUpperCase()).join(""),
    margin,
    keyakinan: (margin <= 1 ? "seimbang" : margin <= 3 ? "sedang" : "kuat") as Keyakinan,
  };
};

/** Skor 8 soal dasar: jumlah bobot opsi yang dipilih (indeks soal → indeks opsi). */
export function skorDariJawaban(
  soal: { options: { weight: Record<string, number> }[] }[],
  jawaban: { [key: number]: number },
): SkorRiasec {
  const skor: SkorRiasec = {};
  soal.forEach((q, qi) => {
    const ai = jawaban[qi];
    if (ai !== undefined) {
      Object.entries(q.options[ai].weight).forEach(([trait, w]) => {
        skor[trait] = (skor[trait] || 0) + (w as number);
      });
    }
  });
  return skor;
}

/**
 * Tipe yang berdempetan (selisih ≤2 dari teratas, maks. 3) bila hasil dasar
 * terlalu tipis — `null` kalau tidak perlu soal pemutus.
 */
export function cariTipeSeri(skor: SkorRiasec): string[] | null {
  const urut = peringkatRiasec(skor);
  const margin = (urut[0]?.skor ?? 0) - (urut[1]?.skor ?? 0);
  if (margin > 2) return null;
  // Ikutkan peringkat ke-3 kalau ia juga berdempetan dengan yang teratas
  const seri = urut.filter(u => (urut[0].skor - u.skor) <= 2).slice(0, 3).map(u => u.tipe as string);
  return seri.length >= 2 ? seri : null;
}

/** Tiap jawaban soal pemutus bernilai +3 untuk tipe yang dipilih. */
export const POIN_PEMUTUS = 3;

export const CAREER_MAPPINGS: Record<string, string[]> = {
  realistic:     ["Teknik", "Konstruksi", "Pertanian", "Teknologi"],
  investigative: ["Sains", "Penelitian", "Matematika", "Kedokteran"],
  artistic:      ["Seni", "Design", "Media", "Kreatif"],
  social:        ["Pendidikan", "Konseling", "Sosial", "Kesehatan"],
  enterprising:  ["Bisnis", "Manajemen", "Penjualan", "Kewirausahaan"],
  conventional:  ["Akuntansi", "Administrasi", "Keuangan", "Organisasi"],
};

/** Baris `assessment_results` untuk satu tes RIASEC (web & app menulis yang sama). */
export function barisHasilRiasec(
  userId: string,
  jawaban: { [key: number]: number },
  s: SkorRiasec,
  lewatPemutus = false,
) {
  const ident = hitungIdentitas(s);
  const primaryType = ident.utama;
  return {
    user_id: userId,
    assessment_type: "riasec_personality",
    personality_type: primaryType,
    questions_answers: jawaban,
    score_breakdown: s,
    // Karier diambil dari huruf utama DAN kedua — siswa dengan margin tipis
    // tidak lagi kehilangan separuh arah yang sebenarnya sama kuat.
    career_recommendations: [
      ...(CAREER_MAPPINGS[primaryType] || []),
      ...(ident.kedua ? (CAREER_MAPPINGS[ident.kedua] || []).slice(0, 2) : []),
    ],
    talent_areas: [ident.utama, ident.kedua, ident.ketiga].filter(Boolean),
    holland_code: ident.kode,
    tipe_kedua:   ident.kedua,
    tipe_ketiga:  ident.ketiga,
    margin:       ident.margin,
    keyakinan:    ident.keyakinan,
    pakai_pemutus: lewatPemutus,
  };
}

/**
 * Tiga huruf tidak berbobot sama. Huruf utama menentukan arah, huruf kedua
 * dan ketiga memperluas — bukan menggantikan. Dipakai untuk memberi skor
 * kecocokan materi, peluang, dan karier.
 */
export const BOBOT_HURUF = [1, 0.6, 0.35];

/* ─── Label & kalimat keyakinan ─────────────────────────────────────────────── */
export const LABEL_RIASEC: Record<TipeRiasec, string> = {
  realistic: "Realistis",
  investigative: "Investigatif",
  artistic: "Artistik",
  social: "Sosial",
  enterprising: "Enterprising",
  conventional: "Konvensional",
};

export const LABEL_RIASEC_EN: Record<TipeRiasec, string> = {
  realistic: "Realistic",
  investigative: "Investigative",
  artistic: "Artistic",
  social: "Social",
  enterprising: "Enterprising",
  conventional: "Conventional",
};

/**
 * Kalimat jujur tentang seberapa tegas hasilnya. Kalau margin <=1, siswa
 * berhak tahu bahwa hasilnya nyaris imbang — bukan diberi satu label seolah
 * pasti. Ini yang dulu disembunyikan: 48 dari 181 hasil sebenarnya seri tipis.
 */
export function kalimatKeyakinanRiasec(
  tipeUtama: TipeRiasec,
  tipeKedua: TipeRiasec | null | undefined,
  keyakinan: Keyakinan | null | undefined,
  lang: "id" | "en" = "id",
): string {
  const L = lang === "en" ? LABEL_RIASEC_EN : LABEL_RIASEC;
  const utama = L[tipeUtama];
  const kedua = tipeKedua ? L[tipeKedua] : null;
  if (lang === "en") {
    if (keyakinan === "seimbang" && kedua) return `Your interests are almost evenly split between ${utama} and ${kedua} — that's normal, and it means you have two directions worth trying.`;
    if (keyakinan === "sedang" && kedua) return `${utama} stands out a little more, but ${kedua} is also strong in you.`;
    return `${utama} stands out quite clearly compared to the other types.`;
  }
  if (keyakinan === "seimbang" && kedua) {
    return `Minatmu hampir seimbang antara ${utama} dan ${kedua} — wajar, dan artinya kamu punya dua arah yang sama-sama layak dicoba.`;
  }
  if (keyakinan === "sedang" && kedua) {
    return `${utama} sedikit lebih menonjol, tapi ${kedua} juga kuat padamu.`;
  }
  return `${utama} menonjol cukup jelas dibanding tipe lainnya.`;
}
