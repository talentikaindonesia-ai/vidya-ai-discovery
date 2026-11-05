/**
 * Kembali ke halaman asal setelah login (?redirect=…).
 *
 * Pola dibatasi ketat supaya ?redirect= tidak bisa dipakai untuk mengarahkan
 * ke situs lain. Login Google keluar ke situs Google lalu mendarat di
 * /dashboard, jadi jalurnya disimpan dulu di localStorage dan diambil di sana.
 */
export const jalurKembali = (r: string | null | undefined): string | null =>
  r && (/^\/bootcamp\/[a-z0-9]+(-[a-z0-9]+)*$/.test(r) || /^\/peluang\/[a-z0-9-]+$/.test(r)) ? r : null;

const KUNCI = "tk_kembali_login";

export function simpanKembali(r: string | null | undefined) {
  const j = jalurKembali(r);
  try {
    if (j) localStorage.setItem(KUNCI, JSON.stringify({ j, t: Date.now() }));
    else localStorage.removeItem(KUNCI);
  } catch { /* penyimpanan diblokir — abaikan */ }
}

/** Ambil sekali lalu hapus; kedaluwarsa setelah 30 menit. */
export function ambilKembali(): string | null {
  try {
    const raw = localStorage.getItem(KUNCI);
    localStorage.removeItem(KUNCI);
    if (!raw) return null;
    const { j, t } = JSON.parse(raw);
    return Date.now() - t < 30 * 60_000 ? jalurKembali(j) : null;
  } catch { return null; }
}
