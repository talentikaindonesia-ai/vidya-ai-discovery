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

/**
 * Kunci idempotensi per checkout. Disimpan di sessionStorage agar klik ganda dan
 * muat ulang mendapat link yang sama; server memberi order baru bila sesi lama
 * sudah lunas, gagal, atau kedaluwarsa.
 */
export function kunciCheckout(lingkup: string): string {
  const nama = `tk_checkout:${lingkup}`;
  try {
    const ada = sessionStorage.getItem(nama);
    if (ada) return ada;
    const baru = crypto.randomUUID();
    sessionStorage.setItem(nama, baru);
    return baru;
  } catch {
    return crypto.randomUUID();
  }
}

export interface OrderSaya {
  id: string;
  nomor: string;
  status: string;
  total: number;
  diskon: number;
  dibuat: string;
  dibayar: string | null;
  lanjut_url: string | null;
  item: string[];
}

export interface HakSaya {
  kode: string;
  nama: string;
  sumber: string;
  mulai: string;
  berakhir: string | null;
}

export interface DataPembelian {
  orders: OrderSaya[];
  hak: HakSaya[];
}

export async function bacaPembelian(): Promise<DataPembelian> {
  const { data, error } = await (supabase as any).rpc("pembelian_saya");
  if (error) throw error;
  return data as DataPembelian;
}

export const STATUS_ORDER: Record<string, { label: string; warna: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Menunggu pembayaran", warna: "outline" },
  paid: { label: "Lunas", warna: "default" },
  failed: { label: "Gagal", warna: "destructive" },
  expired: { label: "Kedaluwarsa", warna: "secondary" },
  held: { label: "Sedang ditinjau", warna: "outline" },
  refunded: { label: "Dikembalikan", warna: "secondary" },
  partially_refunded: { label: "Dikembalikan sebagian", warna: "secondary" },
};

export const LABEL_SUMBER: Record<string, string> = {
  purchase: "Pembelian",
  subscription: "Langganan",
  institution: "Lewat sekolah",
  admin_grant: "Diberikan Talentika",
};
