/**
 * riasecFocusPlan — rencana aksi mingguan & rencana belajar 4 minggu per tipe
 * RIASEC. Sebelumnya hidup sebagai halaman terpisah "/focus"; sekarang
 * dipakai bersama oleh halaman Belajar (tertanam di seksi "Alur Belajar")
 * dan halaman /focus lama (masih ada, hanya sudah tak ada di menu).
 *
 * Kunci localStorage (focus_actions_*, focus_weeks_*) HARUS tetap sama di
 * kedua tempat supaya progres yang sudah dicentang pengguna tidak hilang.
 */

// Semua tipe RIASEC memakai palet biru Talentika yang sama — konsisten
// dengan branding di seluruh platform, bukan warna per-tipe.
const TK_PRIMARY = { color: "var(--tk-blue-600)", bg: "var(--tk-blue-50)", grad: "135deg, var(--tk-blue-50), var(--tk-blue-100)" };

export interface RiasecFocusConfig {
  label: string; emoji: string; color: string; bg: string; grad: string;
  tagline: string;
  careerPaths: string[];
  skills: string[];
  learningKeywords: string[];
  oppCategories: string[];
  weeklyActions: string[];
  gradient: string;
  fourWeekPlan: { week: number; theme: string; goals: string[] }[];
  courses: { title: string; platform: string; url: string; level: string; free: boolean; emoji: string }[];
  communities: { name: string; type: string; desc: string; url: string; emoji: string }[];
}

export const RIASEC_FOCUS_PLAN: Record<string, RiasecFocusConfig> = {
  realistic: {
    label: "Realistic", emoji: "🔧", ...TK_PRIMARY,
    gradient: TK_PRIMARY.grad,
    tagline: "Kamu suka pekerjaan nyata, teknis, dan berorientasi hasil",
    careerPaths: ["Software Engineer", "Arsitek", "Insinyur Mesin", "Teknisi IT", "Chef Profesional"],
    skills: ["Programming", "CAD/3D Design", "Elektronika", "Mekanikal", "Fabrication"],
    learningKeywords: ["teknik", "coding", "programming", "hardware", "praktis"],
    oppCategories: ["magang", "program", "lowongan_kerja"],
    weeklyActions: [
      "Selesaikan 1 modul coding atau teknik di Learning Hub",
      "Daftar ke 1 program magang yang sesuai minatmu",
      "Ikuti tantangan proyek komunitas minggu ini",
      "Tonton 1 tutorial praktis (YouTube/Coursera) di bidang teknikmu",
      "Update portfolio dengan proyek terbarumu",
    ],
    fourWeekPlan: [
      { week: 1, theme: "🏗️ Fondasi Teknis", goals: ["Pelajari sintaks dasar bahasa pemrograman pilihanmu", "Setup development environment (VS Code + Git)", "Buat proyek 'Hello World' pertamamu"] },
      { week: 2, theme: "⚙️ Praktik Langsung", goals: ["Build 1 proyek mini (kalkulator / to-do app)", "Pelajari debugging & problem solving", "Bergabung ke komunitas coding online"] },
      { week: 3, theme: "🔩 Aplikasi Nyata", goals: ["Daftar ke 1 program magang teknis", "Ikuti hackathon atau coding challenge", "Dokumentasikan proyekmu di GitHub"] },
      { week: 4, theme: "🚀 Tingkatkan Level", goals: ["Mulai belajar framework lanjutan (React / Laravel / Flutter)", "Buat 1 portfolio project yang bisa ditampilkan", "Reach out ke profesional untuk informational interview"] },
    ],
    courses: [
      { title: "Belajar Dasar Pemrograman Web", platform: "Dicoding", url: "https://www.dicoding.com/academies/", level: "Pemula", free: true, emoji: "💻" },
      { title: "CS50: Introduction to Computer Science", platform: "edX (Harvard)", url: "https://www.edx.org/cs50", level: "Pemula", free: true, emoji: "🎓" },
      { title: "The Complete Web Developer Course", platform: "Udemy", url: "https://www.udemy.com/topic/web-development/", level: "Pemula", free: false, emoji: "🌐" },
      { title: "Python for Everybody", platform: "Coursera", url: "https://www.coursera.org/specializations/python", level: "Pemula", free: false, emoji: "🐍" },
      { title: "FreeCodeCamp — Full Stack", platform: "freeCodeCamp", url: "https://www.freecodecamp.org", level: "Semua Level", free: true, emoji: "🔓" },
      { title: "Belajar Android Development", platform: "Dicoding", url: "https://www.dicoding.com/academies/", level: "Menengah", free: true, emoji: "📱" },
    ],
    communities: [
      { name: "Dicoding Community", type: "Forum Online", desc: "Komunitas developer Indonesia terbesar", url: "https://community.dicoding.com", emoji: "🇮🇩" },
      { name: "Stack Overflow ID", type: "Forum Tanya Jawab", desc: "Tanya jawab masalah coding dengan developer dunia", url: "https://stackoverflow.com", emoji: "💬" },
      { name: "Dev.to Indonesia", type: "Blog & Komunitas", desc: "Tulis & baca artikel teknis, bagikan proyek", url: "https://dev.to/t/indonesia", emoji: "✍️" },
      { name: "GitHub Indonesia", type: "Open Source", desc: "Kontribusi open source & build portofolio", url: "https://github.com", emoji: "🐙" },
    ],
  },
  investigative: {
    label: "Investigative", emoji: "🔬", ...TK_PRIMARY,
    gradient: TK_PRIMARY.grad,
    tagline: "Kamu analitis, suka riset, dan memecahkan masalah kompleks",
    careerPaths: ["Data Scientist", "Peneliti", "Dokter", "Psikolog", "Ahli Forensik"],
    skills: ["Data Analysis", "Python/R", "Metodologi Riset", "Statistika", "Machine Learning"],
    learningKeywords: ["data", "riset", "analisis", "sains", "research"],
    oppCategories: ["kompetisi", "konferensi", "beasiswa"],
    weeklyActions: [
      "Baca 1 jurnal atau artikel ilmiah di bidangmu",
      "Selesaikan 1 analisis data kecil menggunakan Excel/Python",
      "Daftar ke kompetisi riset atau olimpiade sains",
      "Ikuti Data Science Quiz Battle untuk uji kemampuanmu",
      "Catat 3 pertanyaan riset yang ingin kamu jawab bulan ini",
    ],
    fourWeekPlan: [
      { week: 1, theme: "📊 Fondasi Analisis Data", goals: ["Install Python + Jupyter Notebook + pandas", "Belajar statistika deskriptif dasar", "Analisis 1 dataset publik (Kaggle/BPS)"] },
      { week: 2, theme: "🔬 Metodologi Riset", goals: ["Baca 3 jurnal ilmiah di bidang minatmu", "Buat outline proposal riset sederhana", "Pelajari cara membuat visualisasi data"] },
      { week: 3, theme: "🧪 Proyek Riset Mini", goals: ["Jalankan analisis data end-to-end", "Daftar ke Kaggle Competition untuk pemula", "Submit ke konferensi atau olympiade sains"] },
      { week: 4, theme: "🏆 Publikasi & Networking", goals: ["Tulis ringkasan temuan risetmu di Medium/blog", "Reach out ke dosen atau peneliti untuk mentorship", "Daftar beasiswa riset / program studi lanjut"] },
    ],
    courses: [
      { title: "IBM Data Science Professional", platform: "Coursera", url: "https://www.coursera.org/professional-certificates/ibm-data-science", level: "Pemula", free: false, emoji: "📊" },
      { title: "Data Science: R Basics", platform: "edX (Harvard)", url: "https://www.edx.org/course/data-science-r-basics", level: "Pemula", free: true, emoji: "📈" },
      { title: "Kaggle Learn — Python", platform: "Kaggle", url: "https://www.kaggle.com/learn/python", level: "Pemula", free: true, emoji: "🐍" },
      { title: "Statistics for Data Science", platform: "Coursera", url: "https://www.coursera.org/learn/statistics-for-data-science-python", level: "Menengah", free: false, emoji: "📉" },
      { title: "Machine Learning Specialization", platform: "Coursera (Andrew Ng)", url: "https://www.coursera.org/specializations/machine-learning-introduction", level: "Menengah", free: false, emoji: "🤖" },
      { title: "Belajar Machine Learning Pemula", platform: "Dicoding", url: "https://www.dicoding.com/academies/", level: "Pemula", free: true, emoji: "🇮🇩" },
    ],
    communities: [
      { name: "Kaggle Community", type: "Platform Kompetisi", desc: "Kompetisi data science & notebook publik", url: "https://www.kaggle.com/discussions", emoji: "🏆" },
      { name: "Data Science Indonesia", type: "Komunitas Lokal", desc: "Forum diskusi data science berbahasa Indonesia", url: "https://datascience.or.id", emoji: "🇮🇩" },
      { name: "ResearchGate", type: "Jaringan Akademik", desc: "Terhubung dengan peneliti dari seluruh dunia", url: "https://www.researchgate.net", emoji: "🔬" },
      { name: "Google Scholar Alerts", type: "Notifikasi Riset", desc: "Set alert untuk topik riset terkini", url: "https://scholar.google.com/intl/en/scholar/about.html", emoji: "📚" },
    ],
  },
  artistic: {
    label: "Artistic", emoji: "🎨", ...TK_PRIMARY,
    gradient: TK_PRIMARY.grad,
    tagline: "Kamu kreatif, imajinatif, dan suka mengekspresikan diri",
    careerPaths: ["UI/UX Designer", "Content Creator", "Fotografer", "Animator", "Art Director"],
    skills: ["Figma/Adobe", "Copywriting", "Branding", "Video Editing", "Ilustrasi"],
    learningKeywords: ["desain", "kreatif", "visual", "content", "seni"],
    oppCategories: ["kompetisi", "program", "magang"],
    weeklyActions: [
      "Selesaikan 1 proyek desain (poster, UI mockup, atau ilustrasi)",
      "Ikuti Design Sprint atau kompetisi kreatif minggu ini",
      "Upload 1 karya baru ke portfolio atau media sosialmu",
      "Pelajari 1 fitur baru di Figma, Canva, atau Adobe",
      "Buat konten (artikel, video, atau thread) tentang passion-mu",
    ],
    fourWeekPlan: [
      { week: 1, theme: "🎨 Fondasi Visual", goals: ["Setup Figma gratis & pelajari komponen dasar", "Buat style guide warna + tipografi untuk brand-mu", "Analisis 5 desain yang kamu kagumi (breakdown kenapa bagus)"] },
      { week: 2, theme: "✏️ Eksperimen Kreatif", goals: ["Desain ulang 1 UI yang menurutmu bisa lebih baik", "Pelajari prinsip: grid, whitespace, contrast, hierarchy", "Buat 3 variasi poster untuk 1 tema"] },
      { week: 3, theme: "🏗️ Portfolio Building", goals: ["Selesaikan 1 case study UI/UX end-to-end", "Daftar ke Behance/Dribbble & upload karya", "Ikuti 1 design challenge (Daily UI / #36DaysOfType)"] },
      { week: 4, theme: "🚀 Launch & Network", goals: ["Submit karya ke 1 kompetisi desain", "Hubungi 1 UX designer senior untuk feedback", "Daftar magang desain grafis atau UI/UX"] },
    ],
    courses: [
      { title: "Google UX Design Certificate", platform: "Coursera", url: "https://www.coursera.org/professional-certificates/google-ux-design", level: "Pemula", free: false, emoji: "🎨" },
      { title: "Figma Essential Training", platform: "LinkedIn Learning", url: "https://www.linkedin.com/learning/topics/figma", level: "Pemula", free: false, emoji: "🖌️" },
      { title: "Graphic Design Fundamentals", platform: "Canva Design School", url: "https://www.canva.com/learn/design/", level: "Pemula", free: true, emoji: "🖼️" },
      { title: "Motion Design with After Effects", platform: "YouTube (School of Motion)", url: "https://www.youtube.com/@SchoolofMotion", level: "Menengah", free: true, emoji: "🎬" },
      { title: "Belajar Desain Grafis", platform: "Skill Academy (Ruangguru)", url: "https://skillacademy.com", level: "Pemula", free: false, emoji: "🇮🇩" },
      { title: "The Futur — Design Business", platform: "YouTube", url: "https://www.youtube.com/@thefutur", level: "Semua Level", free: true, emoji: "💡" },
    ],
    communities: [
      { name: "Dribbble", type: "Portfolio & Inspirasi", desc: "Showcase karya desain & dapat feedback kreator dunia", url: "https://dribbble.com", emoji: "🏀" },
      { name: "Behance", type: "Portfolio Profesional", desc: "Platform Adobe untuk portofolio kreatif profesional", url: "https://www.behance.net", emoji: "✨" },
      { name: "DesignTalks ID", type: "Komunitas Lokal", desc: "Komunitas designer Indonesia di berbagai kota", url: "https://www.instagram.com/designtalks.id/", emoji: "🇮🇩" },
      { name: "ADPList", type: "Mentorship Gratis", desc: "Connect dengan 1000+ mentor desain & tech secara gratis", url: "https://adplist.org", emoji: "🤝" },
    ],
  },
  social: {
    label: "Social", emoji: "🤝", ...TK_PRIMARY,
    gradient: TK_PRIMARY.grad,
    tagline: "Kamu empatis, komunikatif, dan suka membantu sesama",
    careerPaths: ["Guru / Dosen", "Konselor / Psikolog", "HR Manager", "Perawat", "Pekerja Sosial"],
    skills: ["Public Speaking", "Konseling", "Manajemen Konflik", "Empati Aktif", "Fasilitasi"],
    learningKeywords: ["komunikasi", "sosial", "kepemimpinan", "konseling", "pendidikan"],
    oppCategories: ["beasiswa", "volunteer", "program"],
    weeklyActions: [
      "Ikuti 1 sesi volunteer atau program sosial minggu ini",
      "Latih public speaking dengan presentasi 3 menit di depan cermin",
      "Daftar ke beasiswa yang mendukung pengembangan sosialmu",
      "Bergabung dengan komunitas diskusi atau forum online di bidangmu",
      "Hubungi 1 orang yang bisa kamu bantu atau mentori",
    ],
    fourWeekPlan: [
      { week: 1, theme: "🗣️ Fondasi Komunikasi", goals: ["Ikuti kelas public speaking gratis (TED-Ed / Toastmasters)", "Baca buku 'How to Win Friends' (Dale Carnegie)", "Rekam dirimu berbicara 3 menit, analisis kelemahan"] },
      { week: 2, theme: "🤝 Membangun Koneksi", goals: ["Ikut 1 kegiatan volunteer lokal", "Bergabung ke organisasi kemahasiswaan baru", "Latih active listening dalam 3 percakapan nyata"] },
      { week: 3, theme: "👨‍🏫 Kepemimpinan & Fasilitasi", goals: ["Fasilitasi 1 diskusi kelompok atau workshop kecil", "Pelajari teknik coaching dasar", "Daftar program beasiswa sosial / pendidikan"] },
      { week: 4, theme: "🌍 Impact & Karir", goals: ["Buat CV yang highlight pengalaman sosial & volunteer-mu", "Apply ke program NGO, Kemendikbud, atau Teach For Indonesia", "Hubungi konselor karir atau profesional di bidang sosial"] },
    ],
    courses: [
      { title: "Psychology of Persuasion", platform: "Coursera", url: "https://www.coursera.org/learn/science-of-success", level: "Pemula", free: false, emoji: "🧠" },
      { title: "Berbicara di Depan Umum", platform: "Skill Academy", url: "https://skillacademy.com", level: "Pemula", free: false, emoji: "🎤" },
      { title: "Social Work: Practice & Theory", platform: "edX", url: "https://www.edx.org/learn/social-work", level: "Pemula", free: true, emoji: "🤝" },
      { title: "Emotional Intelligence", platform: "Coursera (Yale)", url: "https://www.coursera.org/learn/the-science-of-well-being", level: "Semua Level", free: false, emoji: "💚" },
      { title: "Psikologi Dasar & Konseling", platform: "Udemy", url: "https://www.udemy.com/topic/psychology/", level: "Pemula", free: false, emoji: "🔵" },
      { title: "TED-Ed — Communication Skills", platform: "YouTube (TED-Ed)", url: "https://www.youtube.com/@TEDEd", level: "Semua Level", free: true, emoji: "🎬" },
    ],
    communities: [
      { name: "Teach For Indonesia", type: "Program Sosial", desc: "Program fellowship untuk pemimpin muda di bidang pendidikan", url: "https://teachforindonesia.org", emoji: "📚" },
      { name: "Youth Collab", type: "Komunitas Pemuda", desc: "Jaringan pemuda Indonesia untuk proyek sosial", url: "https://youthcollab.id", emoji: "🌟" },
      { name: "ADPList — Mentors", type: "Mentorship Gratis", desc: "Mentor di bidang HR, education, coaching — gratis", url: "https://adplist.org", emoji: "🎓" },
      { name: "Volunteer World", type: "Volunteer Global", desc: "Cari program volunteer lokal & internasional", url: "https://www.volunteerworld.com", emoji: "🌍" },
    ],
  },
  enterprising: {
    label: "Enterprising", emoji: "💼", ...TK_PRIMARY,
    gradient: TK_PRIMARY.grad,
    tagline: "Kamu persuasif, ambisius, dan punya jiwa kepemimpinan",
    careerPaths: ["Entrepreneur", "Marketing Director", "Sales Manager", "Business Consultant", "CEO"],
    skills: ["Negosiasi", "Digital Marketing", "Pitching", "Leadership", "Business Development"],
    learningKeywords: ["bisnis", "marketing", "leadership", "entrepreneurship", "sales"],
    oppCategories: ["kompetisi", "lowongan_kerja", "program"],
    weeklyActions: [
      "Buat satu pitch deck sederhana untuk ide bisnismu",
      "Ikuti kompetisi startup atau bisnis plan minggu ini",
      "Baca 1 bab buku bisnis atau autobiografi pemimpin sukses",
      "Reach out ke 1 profesional di bidangmu untuk networking",
      "Analisis 1 brand atau kampanye marketing yang kamu kagumi",
    ],
    fourWeekPlan: [
      { week: 1, theme: "💡 Validasi Ide Bisnis", goals: ["Identifikasi 1 masalah yang bisa kamu selesaikan", "Lakukan 5 wawancara singkat dengan calon pengguna", "Buat Business Model Canvas sederhana"] },
      { week: 2, theme: "📣 Marketing & Pitching", goals: ["Buat pitch deck 10 slide untuk ide bisnismu", "Pelajari digital marketing dasar (Google/Meta Ads)", "Analisis 3 kompetitor langsung di pasarmu"] },
      { week: 3, theme: "🤝 Negosiasi & Networking", goals: ["Hadiri 1 event startup atau business networking", "Pelajari teknik BATNA dalam negosiasi", "Apply ke 1 program akselerator startup"] },
      { week: 4, theme: "🚀 Launch & Scale", goals: ["Buat MVP (Minimum Viable Product) atau prototype", "Ikuti kompetisi business plan untuk validasi eksternal", "Cari mentor / investor dengan deck yang kuat"] },
    ],
    courses: [
      { title: "Entrepreneurship: Launching Business", platform: "Coursera (Wharton)", url: "https://www.coursera.org/specializations/wharton-entrepreneurship", level: "Menengah", free: false, emoji: "🚀" },
      { title: "Digital Marketing Google Certificate", platform: "Google (Coursera)", url: "https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce", level: "Pemula", free: false, emoji: "📱" },
      { title: "Leadership Principles", platform: "edX (Harvard)", url: "https://www.edx.org/course/leadership-principles", level: "Menengah", free: true, emoji: "👑" },
      { title: "MBA Essentials", platform: "Coursera", url: "https://www.coursera.org/browse/business", level: "Menengah", free: false, emoji: "💼" },
      { title: "Belajar Digital Marketing", platform: "Skill Academy", url: "https://skillacademy.com", level: "Pemula", free: false, emoji: "🇮🇩" },
      { title: "Y Combinator Startup School", platform: "YC (Gratis)", url: "https://www.startupschool.org", level: "Semua Level", free: true, emoji: "🏅" },
    ],
    communities: [
      { name: "Startup Jakarta / ID", type: "Ekosistem Startup", desc: "Jaringan founder, investor & mentor startup Indonesia", url: "https://startupjakarta.id", emoji: "🌆" },
      { name: "Young On Top", type: "Komunitas Pemuda", desc: "Networking pelajar & mahasiswa ambisus Indonesia", url: "https://youngontop.com", emoji: "⬆️" },
      { name: "Founders & Funders ID", type: "LinkedIn Group", desc: "Grup LinkedIn ekosistem startup Indonesia", url: "https://www.linkedin.com/groups/", emoji: "💰" },
      { name: "ADPList — Business Mentors", type: "Mentorship Gratis", desc: "Mentor di bidang bisnis, marketing, founder", url: "https://adplist.org", emoji: "🎯" },
    ],
  },
  conventional: {
    label: "Conventional", emoji: "📊", ...TK_PRIMARY,
    gradient: TK_PRIMARY.grad,
    tagline: "Kamu terorganisir, detail-oriented, dan suka sistem yang terstruktur",
    careerPaths: ["Akuntan", "Analis Keuangan", "Auditor", "Quality Control", "Data Administrator"],
    skills: ["Excel / SQL", "Akuntansi", "Manajemen Risiko", "Analisis Laporan", "SOP Writing"],
    learningKeywords: ["keuangan", "akuntansi", "administrasi", "excel", "data"],
    oppCategories: ["magang", "beasiswa", "lowongan_kerja"],
    weeklyActions: [
      "Buat atau rapikan satu sistem organisasi (spreadsheet, Notion, dll.)",
      "Pelajari 1 fungsi baru di Excel atau SQL",
      "Daftar ke magang di bidang keuangan, audit, atau administrasi",
      "Ikuti tantangan 'Kuasai Excel & Data' di komunitas",
      "Review dan catat pengeluaranmu bulan ini dalam anggaran terstruktur",
    ],
    fourWeekPlan: [
      { week: 1, theme: "📋 Fondasi Keuangan & Data", goals: ["Kuasai 10 fungsi Excel paling penting (VLOOKUP, IF, SUMIF)", "Belajar dasar-dasar akuntansi (debit/kredit, laporan keuangan)", "Buat template anggaran personal yang rapi"] },
      { week: 2, theme: "🗂️ Sistem & Proses", goals: ["Buat SOP untuk 1 proses kerja yang kamu lakukan", "Pelajari SQL dasar untuk query database", "Ikuti pelatihan sertifikasi Excel atau akuntansi"] },
      { week: 3, theme: "📊 Analisis & Reporting", goals: ["Buat laporan keuangan sederhana dari data dummy", "Pelajari Power BI atau Tableau dasar", "Analisis laporan keuangan perusahaan publik (IDX)"] },
      { week: 4, theme: "🏢 Karir & Sertifikasi", goals: ["Daftar magang di perusahaan audit atau keuangan", "Mulai studi untuk sertifikasi ACCA / CPA / Brevet Pajak", "Buat CV yang menonjolkan kemampuan analitis dan sistematis"] },
    ],
    courses: [
      { title: "Excel Skills for Business", platform: "Coursera (Macquarie)", url: "https://www.coursera.org/specializations/excel", level: "Pemula", free: false, emoji: "📊" },
      { title: "Financial Accounting Fundamentals", platform: "Coursera", url: "https://www.coursera.org/learn/uva-darden-financial-accounting", level: "Pemula", free: false, emoji: "📒" },
      { title: "SQL for Data Analysis", platform: "Udacity (Gratis)", url: "https://www.udacity.com/course/sql-for-data-analysis--ud198", level: "Pemula", free: true, emoji: "🗄️" },
      { title: "Financial Markets (Yale)", platform: "Coursera", url: "https://www.coursera.org/learn/financial-markets-global", level: "Menengah", free: false, emoji: "📈" },
      { title: "Brevet Pajak Online", platform: "Skillana / Prakerja", url: "https://www.prakerja.go.id", level: "Menengah", free: false, emoji: "🇮🇩" },
      { title: "Google Data Analytics Certificate", platform: "Coursera", url: "https://www.coursera.org/professional-certificates/google-data-analytics", level: "Pemula", free: false, emoji: "🔍" },
    ],
    communities: [
      { name: "Ikatan Akuntan Indonesia", type: "Asosiasi Profesi", desc: "Asosiasi resmi akuntan Indonesia, sertifikasi & networking", url: "https://www.iaiglobal.or.id", emoji: "🏛️" },
      { name: "Finance Club Indonesia", type: "Komunitas LinkedIn", desc: "Diskusi keuangan, investasi & karir finance di LinkedIn", url: "https://www.linkedin.com/groups/", emoji: "💹" },
      { name: "Excel Campus Community", type: "Forum Excel", desc: "Tips, tutorial & troubleshoot Excel dari expert", url: "https://www.excelcampus.com/community", emoji: "📗" },
      { name: "ADPList — Finance Mentors", type: "Mentorship Gratis", desc: "Mentor di bidang keuangan, akuntansi & consulting", url: "https://adplist.org", emoji: "🎓" },
    ],
  },
};

/** Kunci localStorage — sama persis di halaman Belajar dan /focus lama. */
export const kunciAksi = (userId: string, tipe: string) => `focus_actions_${userId}_${tipe}`;
export const kunciMinggu = (userId: string, tipe: string) => `focus_weeks_${userId}_${tipe}`;
