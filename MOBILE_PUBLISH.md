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

## Build otomatis (GitHub Actions) — tanpa Android Studio/Mac
- **Android build** (`.github/workflows/android.yml`): Actions → *Android build* → Run workflow.
  Hasil AAB + APK ada di *Artifacts*. `versionCode` otomatis = nomor run.
- **iOS build** (`.github/workflows/ios.yml`): tanpa secrets hanya cek kompilasi;
  dengan secrets langsung archive + unggah ke TestFlight.
- Push tag `v1.0.0` menjalankan keduanya.

Secrets GitHub (Settings → Secrets and variables → Actions):

| Secret | Isi |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 android/talentika-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | dari langkah keytool |
| `GOOGLE_SERVICES_JSON` | isi `google-services.json` (Firebase → Project settings → Android app `id.talentika.app`) |
| `PLAY_SERVICE_ACCOUNT_JSON` | opsional — unggah otomatis ke Internal testing |
| `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` | App Store Connect → Users and Access → Integrations → API key |

## Push notifikasi
Alur: baris baru di `notifications` → trigger `trg_teruskan_push` → edge function
`kirim-push` → FCM (Android) / APNs (iOS). Preferensi kategori di Settings aplikasi,
jam tenang 21.00–06.00 WIB untuk < 18 th (ditunda & dikirim 06.05 WIB).
Pengingat otomatis: deadline peluang H-7/H-3/H-1 (cron harian) dan sesi mentor
24 jam & 1 jam sebelumnya (cron 10 menit).

Secrets Supabase (Edge Functions → Secrets):

| Secret | Isi |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON service account Firebase (Project settings → Service accounts → Generate key) |
| `APNS_KEY_P8` | isi file `.p8` (Apple Developer → Keys → Apple Push Notifications service) |
| `APNS_KEY_ID`, `APNS_TEAM_ID` | ID key & Team ID |
| `APNS_BUNDLE_ID` | `id.talentika.app` |
| `APNS_PRODUCTION` | `true` untuk TestFlight/App Store, `false` untuk build dari Xcode |

## Pembelian di aplikasi native
Untuk v1, **tombol beli, harga, dan checkout disembunyikan di Android/iOS**
(`canPurchase()` di `src/mobile/store.tsx`) — sesuai App Store Guideline 3.1.1 dan
kebijakan Google Play Payments. Pro yang dibeli di talentika.id atau lewat sekolah
tetap aktif di aplikasi. Jangan menambahkan teks/tautan yang mengarahkan ke
pembayaran web dari dalam aplikasi. IAP (RevenueCat) bisa ditambahkan di versi berikutnya.

## Catatan lain
- Data dihosting di Supabase; PRD meminta region Indonesia (UU PDP) — cek region project.
- Review notes untuk Apple/Google: sertakan akun demo (email + kata sandi) yang sudah
  onboarding, karena hampir semua layar butuh login.
