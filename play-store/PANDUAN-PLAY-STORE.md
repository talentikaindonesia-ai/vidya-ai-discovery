# Rilis Talentika ke Google Play

Paket aplikasi: `id.talentika.app` · Target Android 16 (API 36) · minimum Android 9 (API 28)
File rilis dibuat di GitHub Actions (workflow **Android build**) — tidak perlu Android Studio.

---

## 1. Akun Google Play Console
- Daftar di https://play.google.com/console (biaya sekali US$25).
- **Pilih jenis akun Organisasi bila Talentika sudah berbadan hukum** (butuh nomor D-U-N-S, gratis
  dari Dun & Bradstreet, prosesnya beberapa hari). Akun **Pribadi** baru wajib menjalankan
  *closed testing* minimal **12 penguji selama 14 hari** sebelum boleh rilis ke publik.

## 2. Kunci tanda tangan (sudah dibuat)
Folder `kunci-android-talentika/` (di luar repo, **jangan di-commit**):
- `talentika-release.keystore` — upload key
- `talentika-release.keystore.base64.txt` — untuk GitHub Secret
- `RAHASIA-kunci-android.txt` — kata sandi & alias

Cadangkan ketiganya di tempat aman. Play App Signing menyimpan kunci aplikasi yang sebenarnya;
bila upload key hilang, bisa diganti lewat dukungan Play Console.

Isi **GitHub → repo vidya-ai-discovery → Settings → Secrets and variables → Actions**:

| Secret | Isi |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | isi file `talentika-release.keystore.base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | dari `RAHASIA-kunci-android.txt` |
| `ANDROID_KEY_ALIAS` | `talentika` |
| `ANDROID_KEY_PASSWORD` | sama dengan kata sandi keystore |
| `GOOGLE_SERVICES_JSON` | *(opsional)* isi `google-services.json` dari Firebase — untuk notifikasi push |
| `PLAY_SERVICE_ACCOUNT_JSON` | *(opsional, nanti)* unggah otomatis ke Internal testing |

Tanpa `GOOGLE_SERVICES_JSON` aplikasi tetap jalan; notifikasi push saja yang nonaktif.

## 3. Buat file rilis (.aab)
GitHub → tab **Actions** → **Android build** → **Run workflow** (branch `main`).
Setelah selesai (±10 menit), unduh artifact `talentika-android-<nomor>`:
- `app-release.aab` → diunggah ke Play Console
- `app-release.apk` → dipasang langsung di HP untuk uji coba

`versionCode` otomatis = nomor run, jadi setiap build bisa diunggah.

## 4. Play Console
1. **Buat aplikasi**: nama *Talentika*, bahasa default Indonesia, jenis *Aplikasi*, *Gratis*.
2. **Pengujian → Pengujian internal** → buat rilis → unggah `.aab` → terima **Play App Signing**.
3. **Setelah unggahan pertama**: Setelan → Integritas aplikasi → salin **SHA-256 kunci penandatanganan
   aplikasi** → kirim ke saya untuk dipasang di `public/.well-known/assetlinks.json`
   (supaya link talentika.id/app/... terbuka langsung di aplikasi).
4. Isi **Konten aplikasi** (bagian 6) dan **Listing Play Store** (bagian 5).
5. Akun pribadi: **Pengujian tertutup** dengan ≥12 penguji selama 14 hari → **Produksi**.

## 5. Listing Play Store

**Nama aplikasi** (≤30): `Talentika: Tes Minat & Karier`

**Deskripsi singkat** (≤80):
`Tes minat RIASEC gratis, jalur karier, beasiswa & kompetisi untuk pelajar.`

**Deskripsi lengkap:**
```
Talentika membantu pelajar SMP, SMA/SMK, dan mahasiswa Indonesia mengenali minat dan bakatnya, lalu menyusun langkah nyata menuju jurusan dan karier impian.

APA YANG BISA KAMU LAKUKAN
• Tes minat RIASEC (Holland) gratis — dapatkan kode minat 3 huruf dan penjelasannya
• Temukan jurusan dan karier yang cocok dengan kepribadianmu
• Beasiswa, kompetisi, dan magang yang dikurasi dari situs resmi penyelenggara, diurutkan sesuai minat dan jenjangmu
• Pengingat tenggat untuk peluang yang kamu simpan
• Jalur belajar dan roadmap dari praktisi
• Talent Passport: kumpulkan proyek, prestasi, dan sertifikat dalam satu profil
• Tanya Tika AI, asisten karier yang siap menjawab kapan saja
• Komunitas pelajar untuk berbagi pengalaman

UNTUK SEKOLAH
Sekolah mitra terverifikasi dapat membuka Talentika Plus untuk siswanya dan memantau perkembangan minat siswa.

AMAN UNTUK PELAJAR
Pengguna di bawah 18 tahun membutuhkan persetujuan orang tua. Kamu bisa menghapus akun dan data pribadi kapan saja dari Profil → Privasi & Data.

Talentika — temukan potensi terbaikmu.
```

**Grafis** (folder ini):
- Ikon 512×512: `ikon-512.png`
- Feature graphic 1024×500: `feature-graphic-1024x500.png`
- **Screenshot ponsel**: minimal 2, sebaiknya 4–8, ambil dari HP setelah memasang APK uji
  (Beranda, hasil tes RIASEC, daftar peluang, jalur belajar, profil). Rasio sisi maksimal 2:1.

**Kategori**: Pendidikan · **Email kontak**: Discover@Talentika.id · **Situs**: https://talentika.id

## 6. Konten aplikasi (formulir wajib)

| Formulir | Isi |
|---|---|
| Kebijakan privasi | https://talentika.id/kebijakan-privasi |
| Akses aplikasi | *Sebagian fitur butuh login* → buat **akun demo** khusus peninjau Google (email + kata sandi) dan cantumkan di sini |
| Iklan | Tidak berisi iklan |
| Rating konten (IARC) | Kategori pendidikan/referensi. Jawab **Ya** untuk interaksi pengguna (komunitas) dan konten buatan AI (Tika AI); tidak ada kekerasan, judi, atau konten seksual |
| Target audiens | lihat **Keputusan usia** di bawah |
| Penghapusan akun | Di aplikasi: Profil → Privasi & Data → Hapus akun. **URL web: https://talentika.id/hapus-akun** (halaman publik: cara hapus di aplikasi, lewat web, atau email; data yang dihapus & disimpan) |
| Aplikasi pemerintah / keuangan / kesehatan | Tidak |

**Keamanan data** (berdasarkan kode aplikasi per November 2026):
- Data **dikumpulkan**, **tidak dibagikan** ke pihak ketiga untuk iklan; dienkripsi saat transit; pengguna bisa minta penghapusan.
- *Info pribadi*: nama, email, usia, sekolah/kelas, lokasi (kota, diisi sendiri) — fungsi aplikasi & personalisasi.
- *Aktivitas aplikasi*: interaksi di aplikasi (app_events), konten buatan pengguna (postingan komunitas, refleksi, chat Tika AI) — fungsi aplikasi & analitik.
- *Info aplikasi & performa*: tidak dikumpulkan (tidak ada SDK crash report).
- *ID perangkat*: token notifikasi push (bila Firebase aktif) — fungsi aplikasi.
- *Info keuangan*: tidak di aplikasi (pembelian hanya di web).

## 7. Keputusan usia (perlu dipilih)
Formulir onboarding saat ini menerima usia **8–90 tahun**. Bila target audiens di Play Console
mencakup **di bawah 13 tahun**, aplikasi masuk **Kebijakan Keluarga Google Play** (tinjauan lebih
ketat, persyaratan konten & SDK khusus anak). Pilihan:
- **13+ (disarankan)**: centang 13–15, 16–17, 18+ di Play Console, dan naikkan usia minimum di
  onboarding menjadi 13 (siswa SMP kelas 7 umumnya sudah 12–13 tahun).
- **Termasuk 9–12**: centang juga kelompok itu dan ikuti Kebijakan Keluarga.

## 8. Catatan kebijakan
- Pembelian Talentika Plus **tidak ada di aplikasi Android** (hanya di web) dan aplikasi tidak
  mengarahkan ke pembayaran luar — sesuai kebijakan Pembayaran Google Play.
- Konten AI (Tika AI) dan komunitas: Google mewajibkan cara melaporkan konten bermasalah dari
  dalam aplikasi. Komunitas sudah punya tombol 🚩 lapor; pastikan jawaban Tika AI juga bisa dilaporkan.
