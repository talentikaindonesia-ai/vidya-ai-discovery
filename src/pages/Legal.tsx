import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

/**
 * Kebijakan Privasi & Syarat dan Ketentuan Talentika (web + aplikasi).
 *
 * Isinya ditulis dari cara sistem BENAR-BENAR bekerja (per 2026-10-19):
 * paket Free/Plus & kuotanya (src/lib/paket.ts), penghapusan akun
 * (fungsi hapus-akun), pembatalan langganan (batalkan_langganan — akses
 * jalan sampai periode habis), persetujuan wali untuk < 18 tahun, dan
 * penyedia yang dipakai. Kalau salah satunya berubah, ubah juga halaman ini.
 */

const BERLAKU = "30 Oktober 2026";
const EMAIL = "support@talentika.id";
const WA = "https://wa.me/6285148434141";
const ALAMAT = "Jalan Kuningan Mulia Lot 9 B, Kota Adm. Jakarta Selatan, DKI Jakarta";

type Bagian = { judul: string; isi: (string | string[])[] };

const PRIVASI: Bagian[] = [
  { judul: "1. Tentang kebijakan ini", isi: [
    "Kebijakan ini menjelaskan bagaimana Talentika (\"kami\") mengumpulkan, memakai, menyimpan, membagikan, dan melindungi data pribadimu saat kamu memakai situs talentika.id dan aplikasi Talentika (web, Android, dan iOS).",
    "Kami memproses data pribadi sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) dan peraturan terkait di Indonesia.",
  ] },
  { judul: "2. Data yang kami kumpulkan", isi: [
    [
      "Data akun: nama, alamat email, dan foto profil (jika masuk dengan Google).",
      "Data profil: usia, jenjang pendidikan, kelas, sekolah atau kampus, kota, bio, nama pengguna, tujuan setelah lulus, dan target karier.",
      "Hasil asesmen: jawaban dan skor tes minat RIASEC, kode Holland, serta modul Talent DNA yang kamu kerjakan.",
      "Aktivitas belajar dan pengembangan: progres materi, kuis, refleksi, proyek, portofolio, file bukti yang kamu unggah, pencapaian, dan sertifikat.",
      "Peluang: peluang yang kamu buka, simpan, atau lacak di Tracker, beserta checklist persiapannya.",
      "Percakapan dengan Tika AI: pesan yang kamu kirim dan jawaban yang dihasilkan.",
      "Komunitas: postingan dan balasan yang kamu buat.",
      "Pembayaran: paket, nominal, dan status transaksi. Data kartu, rekening, atau dompet digital diproses oleh penyedia pembayaran dan tidak kami simpan.",
      "Data orang tua atau wali: kontak yang kamu masukkan untuk meminta persetujuan.",
      "Data teknis: jenis perangkat, token notifikasi, dan catatan pemakaian fitur (misalnya \"modul selesai\") tanpa isi teks bebas.",
    ],
  ] },
  { judul: "3. Untuk apa data dipakai", isi: [
    [
      "Menjalankan layanan: akun, asesmen, belajar, Tracker peluang, portofolio, dan Talent Passport.",
      "Personalisasi: menyusun rekomendasi karier, materi, dan peluang berdasarkan tipe RIASEC, jenjang, tujuan, dan target kariermu.",
      "Paket dan pembayaran: menghitung kuota paket Free, mengaktifkan Talentika Plus, dan mencatat transaksi.",
      "Komunikasi: pengingat tenggat peluang, informasi akun, serta info program. Info promo bisa kamu matikan di Pengaturan.",
      "Keamanan: mencegah penyalahgunaan, kecurangan XP atau sertifikat, dan akses tanpa izin.",
      "Peningkatan produk: memakai data agregat yang tidak menunjuk ke orang tertentu.",
    ],
  ] },
  { judul: "4. Dasar pemrosesan", isi: [
    "Kami memproses data berdasarkan persetujuanmu (atau persetujuan orang tua/wali untuk pengguna di bawah 18 tahun), pelaksanaan perjanjian layanan denganmu, pemenuhan kewajiban hukum, dan kepentingan yang sah seperti menjaga keamanan layanan.",
  ] },
  { judul: "5. Anak dan remaja", isi: [
    "Banyak pengguna Talentika adalah pelajar di bawah 18 tahun. Untuk mereka:",
    [
      "Persetujuan orang tua atau wali diperlukan sebelum data dibagikan kepada pihak lain dan sebelum melakukan pembayaran.",
      "Profil talenta publik tidak dapat dilihat orang lain kecuali pengguna berusia 18 tahun ke atas atau sudah terhubung dengan orang tua/wali.",
      "Orang tua yang terhubung hanya melihat ringkasan perkembangan sesuai pengaturan berbagi yang dipilih anak. Percakapan dengan Tika AI dan refleksi pribadi tidak ditampilkan kepada orang tua.",
      "Tika AI diarahkan untuk tidak membahas konten dewasa, dan menyarankan bicara dengan orang dewasa tepercaya atau Guru BK bila ada tanda kesulitan.",
    ],
  ] },
  { judul: "6. Dengan siapa data dibagikan", isi: [
    "Kami tidak menjual data pribadimu. Data hanya dibagikan kepada:",
    [
      "Penyedia layanan yang membantu kami: Supabase (database dan login, server di Singapura), Vercel (hosting situs), Mayar (pemrosesan pembayaran), Anthropic (memproses pesan Tika AI untuk menghasilkan jawaban), Google (masuk dengan akun Google), serta penyedia email dan notifikasi bila fitur tersebut aktif. Mereka hanya boleh memakai data untuk menjalankan layanan bagi kami.",
      "Sekolah: jika kamu bergabung memakai kode sekolah, admin sekolah dapat melihat ringkasan perkembanganmu sesuai pengaturan berbagi.",
      "Orang tua atau wali yang terhubung, sesuai pengaturan berbagi.",
      "Publik: hanya bagian profil talenta publik yang kamu aktifkan sendiri.",
      "Pihak berwenang, bila diwajibkan oleh hukum.",
    ],
  ] },
  { judul: "7. Penyimpanan di luar Indonesia", isi: [
    "Sebagian data disimpan atau diproses di luar Indonesia (misalnya server database di Singapura dan penyedia AI di Amerika Serikat). Kami memilih penyedia yang menerapkan standar keamanan yang memadai dan hanya mengirimkan data yang diperlukan untuk fungsi tersebut.",
  ] },
  { judul: "8. Berapa lama data disimpan", isi: [
    "Data disimpan selama akunmu aktif. Kamu dapat menghapus akun kapan saja di aplikasi melalui Profil → Privasi & Data → Hapus akun. Setelah itu, akun dan data pribadi yang terkait dengannya dihapus paling lambat 30 hari. Catatan transaksi pembayaran dapat tetap disimpan selama diwajibkan oleh peraturan perpajakan atau hukum lain.",
  ] },
  { judul: "9. Hak kamu", isi: [
    [
      "Mengakses dan mendapatkan salinan data: gunakan Ekspor data di Profil → Privasi & Data.",
      "Memperbaiki data yang keliru melalui halaman profil, atau menghubungi kami.",
      "Menghapus akun dan data pribadimu.",
      "Menarik persetujuan, termasuk memutus akses orang tua atau sekolah dan mematikan profil publik.",
      "Mengajukan keberatan atas pemrosesan tertentu dan menyampaikan keluhan kepada kami.",
    ],
    `Untuk permintaan yang tidak bisa dilakukan sendiri di aplikasi, hubungi ${EMAIL}. Kami akan menanggapi secepatnya sesuai ketentuan UU PDP.`,
  ] },
  { judul: "10. Keamanan", isi: [
    "Data dikirim melalui koneksi terenkripsi (HTTPS). Akses ke database dibatasi per pengguna di tingkat server, dan perubahan penting seperti XP, kuota paket, sertifikat, dan status langganan hanya dapat dilakukan oleh server. Jika terjadi kegagalan pelindungan data pribadi, kami akan memberi tahu pengguna yang terdampak dan otoritas terkait sesuai UU PDP.",
  ] },
  { judul: "11. Penyimpanan lokal di perangkat", isi: [
    "Situs dan aplikasi menyimpan sebagian data di perangkatmu (misalnya sesi masuk, pilihan bahasa, tema, dan jawaban tes yang belum selesai) agar layanan berjalan lancar. Data ini dapat kamu hapus dengan keluar dari akun atau menghapus data situs di browser.",
  ] },
  { judul: "12. Perubahan kebijakan", isi: [
    "Kebijakan ini dapat diperbarui. Perubahan penting akan kami umumkan di aplikasi atau melalui email sebelum berlaku.",
  ] },
];

const SYARAT: Bagian[] = [
  { judul: "1. Penerimaan", isi: [
    "Dengan membuat akun atau memakai talentika.id dan aplikasi Talentika, kamu menyetujui Syarat dan Ketentuan ini serta Kebijakan Privasi kami. Jika kamu berusia di bawah 18 tahun, pastikan orang tua atau walimu mengetahui dan menyetujui pemakaian layanan ini.",
  ] },
  { judul: "2. Akun", isi: [
    [
      "Gunakan data yang benar, termasuk usia dan jenjang pendidikan, karena keduanya menentukan isi dan perlindungan yang kamu dapat.",
      "Jaga kerahasiaan akunmu. Kamu bertanggung jawab atas aktivitas yang terjadi di akunmu.",
      "Satu akun untuk satu orang. Akun tidak boleh dijual atau dipindahtangankan.",
    ],
  ] },
  { judul: "3. Sifat layanan", isi: [
    [
      "Tes minat RIASEC dan Talent DNA adalah alat eksplorasi diri, bukan diagnosis psikologis atau vonis tentang masa depanmu.",
      "Rekomendasi dan jawaban Tika AI dibuat oleh kecerdasan buatan dan bisa keliru. Gunakan sebagai bahan pertimbangan, bukan keputusan akhir.",
      "Informasi peluang (beasiswa, kompetisi, magang, dan lainnya) dikurasi dari sumber resmi. Persyaratan dan tenggat dapat berubah sewaktu-waktu, jadi selalu periksa ulang di situs penyelenggara. Talentika bukan penyelenggara peluang pihak ketiga dan tidak menjamin penerimaan atau kelulusan.",
    ],
  ] },
  { judul: "4. Paket Free dan Plus", isi: [
    "Talentika memiliki dua paket:",
    [
      "Free (gratis): asesmen dasar dan satu profil hasil, maksimal 3 materi atau kursus aktif, maksimal 5 peluang dibuka per bulan, Talent Passport dasar dengan maksimal 3 proyek, progres dasar, dan akses komunitas dasar.",
      "Plus: asesmen lengkap, seluruh katalog belajar yang termasuk paket, AI Talent Coach, rekomendasi peluang sesuai profil, jalur studi dan karier personal, Talent Passport lengkap, progres terperinci, dan sertifikat yang memenuhi syarat. Rincian lengkap ada di halaman langganan.",
    ],
    "Harga Plus saat ini Rp49.000 per bulan atau Rp499.000 per tahun. Harga yang berlaku adalah harga yang tercantum saat kamu membeli. Perubahan harga tidak memengaruhi periode yang sudah dibayar.",
    "Kelas premium tidak termasuk Plus dan dibeli per kelas saat tersedia. Pembelian sekali bayar tetap menjadi milikmu walau langgananmu berakhir.",
    "Tidak termasuk dalam paket mana pun: mentoring langsung, sertifikasi berbayar pihak ketiga, program Global Immersion, dan biaya pendaftaran peluang. Layanan tersebut dijual atau dikenakan terpisah.",
    "Siswa di sekolah mitra yang terverifikasi dapat memperoleh akses Plus melalui sekolahnya selama keanggotaan sekolah aktif.",
  ] },
  { judul: "5. Pembayaran, pembatalan, dan pengembalian dana", isi: [
    [
      "Pembayaran diproses oleh penyedia pembayaran resmi (Mayar). Pengguna di bawah 18 tahun memerlukan persetujuan orang tua atau wali untuk membeli.",
      "Plus dibayar per periode (bulanan atau tahunan) dan tidak diperpanjang otomatis. Untuk melanjutkan, bayar periode berikutnya sebelum masa aktif habis. Kami tidak menyimpan data kartu atau dompet digitalmu.",
      "Kamu dapat membatalkan langganan kapan saja di halaman Talentika Plus. Akses Plus tetap berjalan sampai akhir periode yang sudah dibayar, lalu akunmu kembali ke paket Free tanpa kehilangan data.",
      `Jika terjadi tagihan ganda atau kesalahan sistem, hubungi ${EMAIL} dengan bukti pembayaran. Dana yang terbukti salah tagih akan kami kembalikan. Di luar itu, pembayaran untuk periode yang sudah berjalan tidak dapat dikembalikan, kecuali diwajibkan oleh hukum.`,
    ],
  ] },
  { judul: "6. Konten milikmu", isi: [
    "Proyek, portofolio, refleksi, postingan, dan file yang kamu unggah tetap milikmu. Kamu memberi Talentika izin untuk menyimpan dan menampilkannya sebatas yang diperlukan untuk menjalankan layanan dan sesuai pengaturan berbagi yang kamu pilih. Pastikan kamu berhak atas konten yang kamu unggah.",
  ] },
  { judul: "7. Perilaku yang tidak diperbolehkan", isi: [
    [
      "Merundung, melecehkan, mengancam, atau menyebarkan ujaran kebencian.",
      "Mengunggah konten pornografi, kekerasan, perjudian, atau konten ilegal lainnya.",
      "Membagikan data pribadi orang lain tanpa izin, atau meminta kontak pribadi anak di luar platform.",
      "Menyebarkan informasi palsu, spam, atau penipuan, termasuk peluang palsu.",
      "Mencoba membobol sistem, memanipulasi XP, kuota, sertifikat, atau pembayaran.",
    ],
    "Kami dapat menghapus konten dan membatasi atau menutup akun yang melanggar ketentuan ini. Kamu dapat melaporkan konten atau memblokir pengguna lain langsung di aplikasi.",
  ] },
  { judul: "8. Hak kekayaan intelektual", isi: [
    "Merek, desain, materi belajar, soal asesmen, dan perangkat lunak Talentika dilindungi hukum. Kamu boleh memakainya untuk keperluan pribadi dalam layanan ini, tetapi tidak boleh menyalin, menjual, atau mendistribusikannya tanpa izin tertulis.",
  ] },
  { judul: "9. Batasan tanggung jawab", isi: [
    "Kami berusaha menjaga layanan tetap tersedia dan akurat, tetapi layanan disediakan sebagaimana adanya. Sepanjang diizinkan hukum, Talentika tidak bertanggung jawab atas keputusan pendidikan atau karier yang kamu ambil, perubahan informasi oleh penyelenggara peluang, atau gangguan dari pihak ketiga.",
  ] },
  { judul: "10. Penghentian", isi: [
    "Kamu dapat berhenti memakai layanan dan menghapus akun kapan saja melalui Profil → Privasi & Data. Kami dapat menangguhkan atau menutup akun yang melanggar Syarat dan Ketentuan ini.",
  ] },
  { judul: "11. Hukum yang berlaku", isi: [
    "Syarat dan Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan akan diupayakan diselesaikan secara musyawarah terlebih dahulu.",
  ] },
  { judul: "12. Perubahan", isi: [
    "Syarat dan Ketentuan ini dapat diperbarui. Perubahan penting akan kami umumkan di aplikasi atau melalui email sebelum berlaku. Dengan terus memakai layanan setelah perubahan berlaku, kamu dianggap menyetujuinya.",
  ] },
];

export default function Legal({ jenis }: { jenis: "privasi" | "syarat" }) {
  const privasi = jenis === "privasi";
  const judul = privasi ? "Kebijakan Privasi" : "Syarat dan Ketentuan";
  const bagian = privasi ? PRIVASI : SYARAT;
  useEffect(() => { window.scrollTo(0, 0); }, [jenis]);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <SEO
        title={`${judul} – Talentika`}
        description={privasi
          ? "Bagaimana Talentika mengumpulkan, memakai, dan melindungi data pribadi pelajar sesuai UU PDP."
          : "Syarat dan ketentuan pemakaian talentika.id dan aplikasi Talentika, termasuk paket Free dan Plus."}
      />
      <Header />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "104px 16px 56px", color: "#0F172A", fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {[["/privacy", "Kebijakan Privasi", true], ["/terms", "Syarat dan Ketentuan", false]].map(([to, l, p]) => (
            <Link key={to as string} to={to as string}
              style={{ padding: "7px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, textDecoration: "none", border: `1.5px solid ${p === privasi ? "#2563EB" : "#E2E8F0"}`, background: p === privasi ? "#EFF6FF" : "#fff", color: p === privasi ? "#1D4ED8" : "#334155" }}>
              {l as string}
            </Link>
          ))}
        </div>
        <h1 style={{ fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 800, fontSize: "clamp(26px, 5vw, 34px)", lineHeight: 1.2, margin: 0 }}>{judul}</h1>
        <p style={{ color: "#64748B", fontSize: 14, marginTop: 8 }}>Berlaku sejak {BERLAKU}</p>

        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: "clamp(18px, 4vw, 30px)", marginTop: 20 }}>
          {bagian.map(b => (
            <section key={b.judul} style={{ marginBottom: 26 }}>
              <h2 style={{ fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 700, fontSize: 18, margin: "0 0 10px" }}>{b.judul}</h2>
              {b.isi.map((x, i) => Array.isArray(x) ? (
                <ul key={i} style={{ margin: "0 0 10px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                  {x.map(li => <li key={li} style={{ fontSize: 15, lineHeight: 1.65, color: "#334155" }}>{li}</li>)}
                </ul>
              ) : (
                <p key={i} style={{ fontSize: 15, lineHeight: 1.7, color: "#334155", margin: "0 0 10px" }}>{x}</p>
              ))}
            </section>
          ))}
          <section>
            <h2 style={{ fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 700, fontSize: 18, margin: "0 0 10px" }}>{privasi ? "13. Hubungi kami" : "13. Kontak"}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "#334155", margin: 0 }}>
              Talentika · {ALAMAT}<br />
              Email: <a href={`mailto:${EMAIL}`} style={{ color: "#2563EB" }}>{EMAIL}</a> · WhatsApp: <a href={WA} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB" }}>+62 851-4843-4141</a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
