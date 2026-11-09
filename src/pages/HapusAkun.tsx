/**
 * /hapus-akun — halaman publik cara menghapus akun Talentika.
 *
 * Google Play mewajibkan URL web yang bisa dibuka TANPA memasang aplikasi dan
 * menjelaskan cara meminta penghapusan akun serta data apa yang dihapus/disimpan.
 * Penghapusan sebenarnya dilakukan fungsi hapus-akun (dipanggil dari Profil →
 * Privasi & Data di aplikasi maupun di talentika.id/app).
 */
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const EMAIL = "Discover@Talentika.id";
const h2: CSSProperties = { fontSize: 19, fontWeight: 800, margin: "28px 0 8px" };
const p: CSSProperties = { margin: "0 0 10px", fontSize: 15, lineHeight: 1.7, color: "#334155" };
const ol: CSSProperties = { margin: "0 0 10px", paddingLeft: 22, fontSize: 15, lineHeight: 1.8, color: "#334155" };

export default function HapusAkun() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <SEO
        title="Hapus Akun Talentika"
        description="Cara menghapus akun Talentika dan data pribadimu, di aplikasi Android/iOS maupun lewat web, serta data apa yang dihapus dan disimpan."
        canonical="https://talentika.id/hapus-akun"
      />
      <Header />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "104px 16px 56px" }}>
        <h1 style={{ fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 800, margin: 0 }}>Hapus akun Talentika</h1>
        <p style={{ ...p, marginTop: 10 }}>
          Kamu bisa menghapus akun Talentika beserta data pribadimu kapan saja. Halaman ini berlaku untuk aplikasi
          Talentika di Android dan iOS serta situs talentika.id (pengembang: Talentika).
        </p>

        <h2 style={h2}>Cara 1 — Dari aplikasi</h2>
        <ol style={ol}>
          <li>Buka aplikasi Talentika dan masuk ke akunmu.</li>
          <li>Buka <b>Profil → Privasi &amp; Data</b>.</li>
          <li>Pilih <b>Hapus akun</b>, ketik <b>HAPUS</b> untuk konfirmasi, lalu tekan <b>Hapus akunku</b>.</li>
        </ol>

        <h2 style={h2}>Cara 2 — Lewat web (tanpa aplikasi)</h2>
        <ol style={ol}>
          <li>Buka <a href="/app/privacy" style={{ color: "#2563EB", fontWeight: 700 }}>talentika.id/app/privacy</a> di browser dan masuk dengan akun yang sama.</li>
          <li>Pilih <b>Hapus akun</b>, ketik <b>HAPUS</b>, lalu konfirmasi.</li>
        </ol>

        <h2 style={h2}>Cara 3 — Lewat email</h2>
        <p style={p}>
          Bila tidak bisa masuk ke akunmu, kirim email ke <a href={`mailto:${EMAIL}?subject=Permintaan%20hapus%20akun`} style={{ color: "#2563EB", fontWeight: 700 }}>{EMAIL}</a> dari
          alamat email yang terdaftar dengan judul <i>Permintaan hapus akun</i>. Kami memverifikasi kepemilikan akun
          lalu memprosesnya paling lambat 30 hari.
        </p>

        <h2 style={h2}>Data yang dihapus</h2>
        <p style={p}>
          Akun masuk dan data pribadi yang terkait: profil (nama, usia, sekolah, kelas, kota), hasil tes minat dan
          kepribadian, progres belajar, portofolio dan prestasi, peluang yang disimpan, riwayat chat Tika AI,
          postingan komunitas, serta token notifikasi perangkat. Penghapusan dijalankan segera dan selesai paling
          lambat 30 hari.
        </p>

        <h2 style={h2}>Data yang tetap disimpan</h2>
        <p style={p}>
          Catatan transaksi pembayaran (nomor pesanan, nominal, tanggal) disimpan selama diwajibkan peraturan
          perpajakan dan hukum yang berlaku, tanpa dipakai untuk keperluan lain. Data agregat yang tidak lagi bisa
          dikaitkan dengan dirimu dapat tetap dipakai untuk statistik layanan.
        </p>

        <p style={{ ...p, marginTop: 28, fontSize: 14, color: "#64748B" }}>
          Selengkapnya di <Link to="/kebijakan-privasi" style={{ color: "#2563EB" }}>Kebijakan Privasi</Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
