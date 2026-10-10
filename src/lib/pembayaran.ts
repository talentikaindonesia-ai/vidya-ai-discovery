import { supabase } from "@/integrations/supabase/client";

/**
 * Minta server memeriksa ulang status pembayaran Mayar untuk transaksi milik
 * pengguna (atau admin) yang sedang login, lalu mengaktifkan akses bila lunas.
 *
 * Jalur cadangan bila notifikasi webhook Mayar tidak sampai. Aman dipanggil
 * berulang: server menanyakan status langsung ke API Mayar dan aktivasinya
 * idempoten (klaim atomik di mayar-webhook).
 */
export async function cekPembayaran(transactionId: string | null | undefined) {
  if (!transactionId) return;
  try {
    await supabase.functions.invoke("mayar-webhook", { body: { transaction_id: transactionId } });
  } catch {
    /* abaikan — polling berikutnya akan mencoba lagi */
  }
}
