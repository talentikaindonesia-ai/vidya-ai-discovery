import { supabase } from "@/integrations/supabase/client";

type Baris = { id: string; is_premium?: boolean | null; content_url?: string | null };

/**
 * URL materi kelas premium tidak ada di `learning_content` (katalog publik),
 * melainkan di `materi_premium` yang hanya terbaca bila kelasnya terbuka
 * untuk pengguna (admin, siswa sekolah mitra, atau pembeli kelas).
 * Fungsi ini mengisi `content_url` baris premium yang boleh dibuka; sisanya
 * tetap kosong. Saat admin menyimpan, trigger database memindahkan URL-nya lagi.
 */
export async function isiUrlPremium<T extends Baris>(baris: T[]): Promise<T[]> {
  const ids = baris.filter(b => b.is_premium && !b.content_url).map(b => b.id);
  if (!ids.length) return baris;
  const { data } = await (supabase as any).from("materi_premium").select("content_id,content_url").in("content_id", ids);
  const peta = new Map<string, string>((data ?? []).map((d: { content_id: string; content_url: string }) => [d.content_id, d.content_url]));
  return baris.map(b => (peta.has(b.id) ? { ...b, content_url: peta.get(b.id)! } : b));
}

export async function isiUrlPremiumSatu<T extends Baris>(b: T | null | undefined): Promise<T | null | undefined> {
  if (!b) return b;
  return (await isiUrlPremium([b]))[0];
}
