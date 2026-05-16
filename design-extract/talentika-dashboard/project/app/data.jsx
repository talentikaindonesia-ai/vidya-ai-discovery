// ============ SAMPLE DATA ============
const USER = {
  name: "Muhammad Dafa",
  firstName: "Muhammad Dafa",
  initials: "MD",
  plan: "Individual",
  email: "dafa@talentika.id",
  joined: "April 2026",
  streak: 7,
};

const TAXONOMY = {
  Design: { pill: "pill-orange", bg: "cat-bg-orange", icon: "Paint" },
  Programming: { pill: "pill", bg: "cat-bg-blue", icon: "Code" },
  Marketing: { pill: "pill-lilac", bg: "cat-bg-purple", icon: "Megaphone" },
  Seni: { pill: "pill-pink", bg: "cat-bg-pink", icon: "Paint" },
  "Pengembangan Diri": { pill: "pill-yellow", bg: "cat-bg-yellow", icon: "Bulb" },
  AI: { pill: "pill-lilac", bg: "cat-bg-purple", icon: "Brain" },
  Sosial: { pill: "pill-green", bg: "cat-bg-green", icon: "Heart" },
};

const COURSES = [
  { id:1, name:"UI/UX Design Fundamentals", cat:"Design", modules:24, progress:60, icon:"Paint", color:"blue" },
  { id:2, name:"Creative Thinking & Innovation", cat:"Pengembangan Diri", modules:18, progress:40, icon:"Bulb", color:"yellow" },
  { id:3, name:"Digital Illustration Basics", cat:"Seni", modules:20, progress:25, icon:"Pen", color:"pink" },
  { id:4, name:"Introduction to Python", cat:"Programming", modules:30, progress:75, icon:"Code", color:"green" },
  { id:5, name:"Digital Marketing Essentials", cat:"Marketing", modules:22, progress:30, icon:"Trend", color:"purple" },
];

const RECOMMENDATIONS = [
  { id:11, name:"Artificial Intelligence For Beginners", cat:"Programming", rating:4.8, ratings:"1.2k", icon:"Brain", color:"blue" },
  { id:12, name:"Social Media Strategy Masterclass", cat:"Marketing", rating:4.7, ratings:"856", icon:"Megaphone", color:"purple" },
  { id:13, name:"Public Speaking for Youth", cat:"Pengembangan Diri", rating:4.9, ratings:"2.1k", icon:"Bulb", color:"yellow" },
];

const OPPORTUNITIES = [
  { id:1, type:"Beasiswa", title:"Fully Funded Scholarships 2026–2027", source:"worldscholarshipforum.com", loc:"Internasional", tags:["scholarship","phd"], saved:false },
  { id:2, type:"Beasiswa", title:"UNICEF Equity-free funding for blockchain solutions", source:"unicef.org", loc:"Internasional", tags:["scholarship","sosial"], saved:true },
  { id:3, type:"Beasiswa", title:"Tech Skills Students Can Learn to Make Money on Campus", source:"worldscholarshipforum.com", loc:"Internasional", tags:["scholarship"], saved:false },
  { id:4, type:"Kompetisi", title:"Indonesia Design Week 2026 — Student Open Call", source:"designweek.id", loc:"Jakarta", tags:["design","kompetisi"], saved:false },
  { id:5, type:"Magang", title:"Product Design Intern — Gojek Summer 2026", source:"gojek.com/careers", loc:"Jakarta · Hybrid", tags:["magang","design"], saved:true },
  { id:6, type:"Magang", title:"Data Science Internship — Tokopedia", source:"tokopedia.com", loc:"Jakarta", tags:["magang","data"], saved:false },
  { id:7, type:"Konferensi", title:"AI Summit Asia 2026 — Student Pass", source:"aisummitasia.com", loc:"Singapore", tags:["konferensi","ai"], saved:false },
  { id:8, type:"Lowongan Kerja", title:"Junior UX Designer @ Bukalapak", source:"bukalapak.com/careers", loc:"Jakarta", tags:["fulltime","design"], saved:false },
];

const COMMUNITIES = [
  { id:1, name:"Tech Innovators Community", cat:"Technology", color:"blue", desc:"Komunitas untuk para innovator teknologi yang ingin berbagi ide dan berkolaborasi.", members:"1.247", discussions:"86", tags:["Programming","AI"], joined:false, rec:true },
  { id:2, name:"Creative Designers Hub", cat:"Design", color:"orange", desc:"Tempat berkumpul para desainer untuk saling menginspirasi dan belajar.", members:"892", discussions:"156", tags:["UI/UX","Graphic Design"], joined:false, rec:true },
  { id:3, name:"Social Impact Leaders", cat:"Social", color:"green", desc:"Komunitas untuk mereka yang ingin membuat perubahan positif di masyarakat.", members:"567", discussions:"78", tags:["Social Work","NGO"], joined:false, rec:true },
  { id:4, name:"Future Marketers ID", cat:"Marketing", color:"purple", desc:"Belajar growth, branding, dan media bersama marketer muda Indonesia.", members:"1.034", discussions:"122", tags:["Growth","Branding"], joined:true },
  { id:5, name:"Young Writers Indonesia", cat:"Seni", color:"pink", desc:"Komunitas menulis kreatif dan jurnalisme untuk anak muda.", members:"445", discussions:"203", tags:["Writing","Storytelling"], joined:false },
  { id:6, name:"Beasiswa Hunters", cat:"Pengembangan Diri", color:"yellow", desc:"Sharing info beasiswa, tips esai, dan timeline aplikasi.", members:"2.108", discussions:"341", tags:["Scholarship","Tips"], joined:false },
];

const CHALLENGES = [
  { id:1, name:"7 Days Creative Challenge", desc:"Buat satu karya kreatif setiap hari selama 7 hari berturut-turut.", days:7, joined:1832, reward:"Badge: Consistent Creator", color:"orange", active:true, progress:42 },
  { id:2, name:"Daily Code Streak", desc:"Selesaikan minimal 1 latihan coding setiap hari.", days:30, joined:1124, reward:"Badge: Code Warrior", color:"blue", active:true, progress:23 },
  { id:3, name:"Pitch in 60 Seconds", desc:"Rekam video pitch ide 1 menit dan share ke komunitas.", days:3, joined:602, reward:"Badge: Confident Speaker", color:"yellow", active:false, progress:0 },
  { id:4, name:"Read & Reflect", desc:"Baca 1 artikel pengembangan diri dan tulis refleksi 200 kata.", days:14, joined:889, reward:"Badge: Mindful Learner", color:"purple", active:false, progress:0 },
];

const BADGES = [
  { name:"Consistent Learner", desc:"Belajar 7 hari berturut-turut", icon:"Star", color:"green", earned:true, when:"2 hari lalu" },
  { name:"First Steps", desc:"Selesaikan onboarding", icon:"Rocket", color:"blue", earned:true, when:"April 2026" },
  { name:"Talent Test Master", desc:"Selesaikan Talent Test", icon:"Brain", color:"purple", earned:true, when:"11 Mei 2026" },
  { name:"Community Builder", desc:"Bergabung dengan 3 komunitas", icon:"Users", color:"orange", earned:false },
  { name:"Code Warrior", desc:"30 hari coding streak", icon:"Code", color:"blue", earned:false },
  { name:"Scholar", desc:"Apply ke 5 beasiswa", icon:"Trophy", color:"yellow", earned:false },
  { name:"Mentor", desc:"Bantu 10 anggota community", icon:"Heart", color:"pink", earned:false },
  { name:"Pro Achiever", desc:"Selesaikan 10 kursus", icon:"Crown", color:"yellow", earned:false },
];

const ACTIVITY = [
  { icon:"Pen", color:"blue", title:"Menyelesaikan pelajaran", subject:"Design Thinking Basics", time:"2 jam lalu" },
  { icon:"Star", color:"green", title:"Mendapatkan badge", subject:"Consistent Learner", time:"1 hari lalu" },
  { icon:"Trophy", color:"orange", title:"Mendaftar tantangan baru", subject:"7 Days Creative Challenge", time:"2 hari lalu" },
  { icon:"Check", color:"purple", title:"Menyelesaikan kuis", subject:"UI/UX Fundamentals Quiz", time:"3 hari lalu" },
  { icon:"Bookmark", color:"yellow", title:"Menyimpan peluang", subject:"UNICEF Equity Funding", time:"4 hari lalu" },
  { icon:"Users", color:"blue", title:"Bergabung komunitas", subject:"Future Marketers ID", time:"5 hari lalu" },
];

const TALENT_QUESTIONS = [
  { q:"Apa yang paling kamu suka lakukan di waktu luang?", opts:["Membuat sesuatu (gambar, musik, video)","Membantu teman menyelesaikan masalah","Memimpin proyek kelompok","Belajar hal baru dari buku/video"] },
  { q:"Saat mengerjakan tugas, kamu lebih suka...","opts":["Bereksperimen dengan cara baru","Mendiskusikan dengan tim","Membuat rencana detail dulu","Mencari referensi dari pakar"] },
  { q:"Karier impianmu lebih dekat ke...","opts":["Seniman / desainer / kreator","Guru / konselor / pekerja sosial","Wirausahawan / pemimpin tim","Peneliti / analis / engineer"] },
  { q:"Hal yang paling memotivasimu adalah...","opts":["Kebebasan berekspresi","Dampak positif untuk orang lain","Tantangan & pencapaian","Pengetahuan & pemahaman mendalam"] },
];

const SKILL_RADAR = [
  { skill:"Kreativitas", value:88 },
  { skill:"Komunikasi", value:72 },
  { skill:"Analitis", value:64 },
  { skill:"Kepemimpinan", value:55 },
  { skill:"Teknis", value:70 },
  { skill:"Empati", value:81 },
];

const WEEK_HOURS = [
  { d:"Sen", h:2.5 },{ d:"Sel", h:3.2 },{ d:"Rab", h:1.8 },
  { d:"Kam", h:4.0 },{ d:"Jum", h:2.2 },{ d:"Sab", h:5.1 },{ d:"Min", h:4.7 },
];

const TIMELINE_EVENTS = [
  { date:"Hari ini", items:[
    { time:"14:30", icon:"Pen", color:"blue", title:"Menyelesaikan modul UI Typography", meta:"UI/UX Design Fundamentals" },
    { time:"10:15", icon:"Bookmark", color:"yellow", title:"Menyimpan beasiswa baru", meta:"UNICEF Equity Funding" },
    { time:"09:00", icon:"Bell", color:"orange", title:"Reminder: Sesi belajar mingguan", meta:"Talentika System" },
  ]},
  { date:"Kemarin", items:[
    { time:"19:45", icon:"Star", color:"green", title:"Mendapatkan badge Consistent Learner", meta:"7 hari beruntun" },
    { time:"16:20", icon:"Users", color:"blue", title:"Bergabung dengan komunitas", meta:"Future Marketers ID" },
  ]},
  { date:"3 hari lalu", items:[
    { time:"21:00", icon:"Check", color:"purple", title:"Menyelesaikan UI/UX Fundamentals Quiz", meta:"Nilai: 92 / 100" },
    { time:"15:30", icon:"Trophy", color:"orange", title:"Mendaftar 7 Days Creative Challenge", meta:"Tantangan aktif" },
  ]},
];

window.DATA = { USER, TAXONOMY, COURSES, RECOMMENDATIONS, OPPORTUNITIES, COMMUNITIES, CHALLENGES, BADGES, ACTIVITY, TALENT_QUESTIONS, SKILL_RADAR, WEEK_HOURS, TIMELINE_EVENTS };
