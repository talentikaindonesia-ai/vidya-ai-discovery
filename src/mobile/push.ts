import { db, isNative } from "./store";

/**
 * Push notifikasi native (NOT-01..03).
 * Android → token FCM, iOS → token APNs; disimpan di device_push_tokens dan
 * dipakai edge function kirim-push. Saluran (channel) Android dibuat per
 * kategori agar pengguna bisa mematikannya dari pengaturan sistem.
 */
const CHANNELS: [string, string][] = [
  ["opportunities", "Peluang & deadline"], ["learning", "Belajar"], ["mentorship", "Mentoring"],
  ["achievement", "Pencapaian"], ["ai", "AI Insight"], ["community", "Komunitas"],
];

let listenersReady = false;

/** Daftarkan perangkat. `ask` = boleh memunculkan dialog izin sistem. */
export async function initPush(userId: string, ask: boolean): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (!isNative()) return "unsupported";
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const platform = (window as any).Capacitor.getPlatform() as "android" | "ios";

  if (!listenersReady) {
    listenersReady = true;
    await PushNotifications.addListener("registration", async ({ value }) => {
      localStorage.setItem("tk-push-token", value);
      await db.from("device_push_tokens").upsert({ token: value, user_id: userId, platform, updated_at: new Date().toISOString(), last_error: null });
    });
    await PushNotifications.addListener("registrationError", e => console.warn("push registration error", e));
    // Tap notifikasi → buka layar yang tepat (deep link)
    await PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
      const url = (notification.data as any)?.url;
      if (typeof url === "string" && url.startsWith("/app")) window.dispatchEvent(new CustomEvent("tk-nav", { detail: url }));
    });
    if (platform === "android") {
      for (const [id, name] of CHANNELS) {
        await PushNotifications.createChannel({ id, name, importance: id === "opportunities" || id === "mentorship" ? 4 : 3, visibility: 1, lightColor: "#1D4ED8" }).catch(() => {});
      }
    }
  }

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
    if (!ask) return "prompt";
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") return "denied";
  await PushNotifications.register();
  return "granted";
}

/** Keluar akun dengan aman: lepas token push perangkat ini lebih dulu. */
export async function keluar() {
  try { await unregisterPush(); } catch { /* tetap keluar */ }
  await db.auth.signOut();
}

/** Saat keluar akun: hapus token perangkat ini agar notifikasi tidak nyasar ke akun lain. */
export async function unregisterPush() {
  if (!isNative()) return;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const token = localStorage.getItem("tk-push-token");
  if (token) await db.from("device_push_tokens").delete().eq("token", token);
  localStorage.removeItem("tk-push-token");
  await PushNotifications.removeAllListeners();
  listenersReady = false;
}
