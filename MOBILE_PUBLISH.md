# Publikasi Talentika Mobile (Android & iOS)

Aplikasi = bundle web `dist/` (rute `/app`) dibungkus Capacitor 7.
Package / bundle ID: **`id.talentika.app`** · versi **1.0.0 (build 1)**.

## Setiap kali kode berubah

```bash
npm run mobile:sync      # vite build + cap sync (salin web ke android/ & ios/)
npm run mobile:android   # buka Android Studio
npm run mobile:ios       # buka Xcode (hanya di Mac)
```

Naikkan `versionCode` di `android/app/build.gradle` dan `CURRENT_PROJECT_VERSION`
di Xcode untuk setiap unggahan ke toko.

## Sekali saja — sebelum rilis pertama

### 1. Supabase (dashboard → Authentication)
- **URL Configuration → Redirect URLs**, tambahkan:
  - `id.talentika.app://login-callback` (login Google/Apple di aplikasi)
  - `https://talentika.id/app/start` (verifikasi email)
- **Providers → Apple**: aktifkan (wajib di App Store karena ada login Google).
- **Providers → Phone**: aktifkan + penyedia SMS bila login nomor HP dipakai.
- **Edge Functions → Secrets**: `ANTHROPIC_API_KEY` untuk Talentika AI.

### 2. Android (Google Play)
1. Pasang Android Studio (sudah termasuk JDK 21 & Android SDK).
2. Buat kunci rilis (simpan cadangannya — hilang = tidak bisa update aplikasi):
   ```bash
   keytool -genkey -v -keystore android/talentika-release.keystore -alias talentika -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Buat `android/keystore.properties` (sudah di-.gitignore):
   ```
   storeFile=../talentika-release.keystore
   storePassword=...
   keyAlias=talentika
   keyPassword=...
   ```
4. Android Studio → Build → Generate Signed Bundle → **AAB** → unggah ke Play Console.
5. Play Console → Setup → App signing → salin **SHA-256** ke
   `public/.well-known/assetlinks.json` (ganti teks `GANTI_DENGAN_SHA256…`), lalu deploy web.
   Ini membuat link `talentika.id/app/...` (notifikasi, email, pembayaran Mayar) terbuka di aplikasi.
6. Formulir Play: Data safety (tanpa iklan/pelacakan; data akun, aktivitas belajar,
   foto opsional), **Target audience 13–17 → Families policy**, penghapusan akun
   (ada di Settings → Hapus akun, URL web: `https://talentika.id/app/settings`).

### 3. iOS (App Store) — butuh Mac + akun Apple Developer
1. `sudo gem install cocoapods` lalu `cd ios/App && pod install`.
2. Xcode → target App → Signing & Capabilities → pilih Team.
   Entitlements sudah disiapkan: Associated Domains + Sign in with Apple.
3. Ganti `TEAMID_GANTI` di `public/.well-known/apple-app-site-association`
   dengan Team ID Apple Developer, lalu deploy web.
4. Product → Archive → Distribute → App Store Connect.
5. App Store Connect: Privacy Nutrition Labels, Age Rating, URL kebijakan privasi.

## Catatan kebijakan toko
- **Langganan Pro saat ini dibayar via Mayar.** Apple & Google umumnya mewajibkan
  In-App Purchase untuk langganan digital (PRD PAY-02). Sebelum submit, pilih:
  integrasikan IAP/Play Billing, atau sembunyikan tombol beli di build native.
- Data dihosting di Supabase; PRD meminta region Indonesia (UU PDP) — cek region project.
