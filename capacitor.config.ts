import { CapacitorConfig } from "@capacitor/cli";

/**
 * Talentika Mobile (PRD v1.0) — Android & iOS.
 * Bundle web (dist/) dibuka di /app lewat redirect di App.tsx. Login OAuth
 * kembali ke aplikasi lewat skema id.talentika.app://login-callback;
 * link talentika.id/app/* dan /u/* dibuka langsung di aplikasi (App Links /
 * Universal Links — lihat public/.well-known/).
 */
const config: CapacitorConfig = {
  appId: "id.talentika.app",
  appName: "Talentika",
  webDir: "dist",
  server: {
    androidScheme: "https",
    // Untuk live-reload saat pengembangan saja — JANGAN aktif di build rilis:
    // url: "http://192.168.1.x:8080",
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#1D4ED8",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      // "LIGHT" = teks gelap untuk latar terang aplikasi (#F5F7FA)
      style: "LIGHT",
      backgroundColor: "#F5F7FA",
      overlaysWebView: false,
    },
  },
  android: {
    // Rilis ditandatangani lewat android/keystore.properties (tidak di-commit)
    buildOptions: {
      keystorePath: "talentika-release.keystore",
      keystoreAlias: "talentika",
    },
  },
  ios: {
    contentInset: "never",
    scheme: "Talentika",
  },
};

export default config;
