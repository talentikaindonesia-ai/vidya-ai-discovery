import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Link2, ImageIcon } from "lucide-react";
import { inputStyle } from "./adminShared";

/**
 * UnggahGambar — satu komponen unggah gambar untuk semua form CMS
 * (jalur belajar, peluang, artikel, event, mentor, thumbnail materi).
 *
 * Sebelumnya hanya thumbnail materi yang bisa diunggah; sisanya diisi dengan
 * menempel URL dari tempat lain. Komponen ini:
 *  • menerima seret-lepas atau pilih file;
 *  • menolak selain JPG/PNG/WebP/GIF (SVG ditolak — bisa membawa skrip);
 *  • memperkecil gambar di browser (sisi terpanjang maks 1600 px, WebP 85%)
 *    SEBELUM diunggah, jadi foto ponsel 4–8 MB biasanya jadi ±150–400 KB;
 *  • mengunggah ke bucket `cms-gambar` (publik, maks 5 MB, hanya admin —
 *    ditegakkan kebijakan storage, bukan hanya di sini);
 *  • tetap menyediakan tempel-URL sebagai cadangan.
 *
 * Menghapus gambar dari form TIDAK menghapus file di storage — file yang
 * sama bisa saja dipakai konten lain.
 */

const BUCKET = "cms-gambar";
const MAKS_MASUK_MB = 10;     // batas file mentah sebelum dikompres
const MAKS_UNGGAH_MB = 5;     // sama dengan file_size_limit bucket
const SISI_MAKS = 1600;
const JENIS_OK = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function kompres(file: File): Promise<Blob> {
  // GIF dibiarkan apa adanya: lewat canvas animasinya hilang.
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const skala = Math.min(1, SISI_MAKS / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * skala));
  const h = Math.max(1, Math.round(bitmap.height * skala));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const webp = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/webp", 0.85));
  if (webp && webp.type === "image/webp") return webp;
  // Browser lama tanpa encoder WebP
  const jpg = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", 0.85));
  return jpg ?? file;
}

function ekstensi(tipe: string) {
  return tipe === "image/webp" ? "webp" : tipe === "image/gif" ? "gif" : tipe === "image/png" ? "png" : "jpg";
}

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  /** Subfolder di bucket, mis. "peluang", "artikel", "event", "mentor", "jalur". */
  folder: string;
  /** CSS aspect-ratio untuk pratinjau, mis. "16 / 9", "1 / 1", "1200 / 630". */
  rasio?: string;
  /** Saran ukuran untuk admin, mis. "1200 × 630 px". */
  saran?: string;
  /** Tampilan melingkar (foto profil mentor). */
  bulat?: boolean;
}

export default function UnggahGambar({ value, onChange, folder, rasio = "16 / 9", saran, bulat }: Props) {
  const [mengunggah, setMengunggah] = useState(false);
  const [modeUrl, setModeUrl] = useState(false);
  const [diseret, setDiseret] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function unggah(file: File) {
    if (!JENIS_OK.includes(file.type)) {
      toast.error("File harus gambar JPG, PNG, WebP, atau GIF.");
      return;
    }
    if (file.size > MAKS_MASUK_MB * 1024 * 1024) {
      toast.error(`Gambar maksimal ${MAKS_MASUK_MB} MB.`);
      return;
    }
    setMengunggah(true);
    try {
      const blob = await kompres(file);
      if (blob.size > MAKS_UNGGAH_MB * 1024 * 1024) {
        throw new Error(`Setelah dikompres masih di atas ${MAKS_UNGGAH_MB} MB. Gunakan gambar yang lebih kecil.`);
      }
      const bulan = new Date().toISOString().slice(0, 7);
      const path = `${folder}/${bulan}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ekstensi(blob.type)}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: blob.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success(`Gambar diunggah (${Math.max(1, Math.round(blob.size / 1024))} KB)`);
    } catch (e: any) {
      const pesan = String(e?.message ?? e);
      toast.error(
        /row-level security|unauthorized|403/i.test(pesan)
          ? "Gagal unggah: hanya admin yang boleh mengunggah gambar CMS."
          : "Gagal unggah: " + pesan,
      );
    } finally {
      setMengunggah(false);
    }
  }

  const pilih = () => !mengunggah && inputRef.current?.click();

  return (
    <div>
      <div
        onClick={pilih}
        onDragOver={e => { e.preventDefault(); setDiseret(true); }}
        onDragLeave={() => setDiseret(false)}
        onDrop={e => {
          e.preventDefault();
          setDiseret(false);
          const f = e.dataTransfer.files?.[0];
          if (f) unggah(f);
        }}
        style={{
          position: "relative",
          width: bulat ? 112 : "100%",
          aspectRatio: bulat ? "1 / 1" : rasio,
          maxHeight: bulat ? undefined : 260,
          borderRadius: bulat ? "50%" : 12,
          overflow: "hidden",
          border: `1.5px dashed ${diseret ? "#2563EB" : value ? "transparent" : "#CBD5E1"}`,
          background: diseret ? "#EFF6FF" : "#F8FAFC",
          cursor: mengunggah ? "wait" : "pointer",
          display: "grid",
          placeItems: "center",
        }}
      >
        {value ? (
          <img src={value} alt="Pratinjau" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ textAlign: "center", color: "#94A3B8", padding: 12 }}>
            <ImageIcon size={bulat ? 22 : 26} style={{ margin: "0 auto 6px", display: "block" }} />
            {!bulat && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Seret gambar ke sini atau klik</div>
                <div style={{ fontSize: 11.5, marginTop: 2 }}>
                  JPG, PNG, WebP, GIF · maks {MAKS_MASUK_MB} MB{saran ? ` · saran ${saran}` : ""}
                </div>
              </>
            )}
          </div>
        )}

        {mengunggah && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.8)", display: "grid", placeItems: "center" }}>
            <Loader2 size={22} className="animate-spin" style={{ color: "#2563EB" }} />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={JENIS_OK.join(",")}
          hidden
          disabled={mengunggah}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) unggah(f);
            e.target.value = "";
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={pilih} disabled={mengunggah}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 12, fontWeight: 700, color: "#475569", cursor: "pointer" }}>
          <Upload size={12} /> {value ? "Ganti" : "Unggah"}
        </button>
        <button type="button" onClick={() => setModeUrl(v => !v)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8, border: "1px solid #E2E8F0", background: modeUrl ? "#EFF6FF" : "white", fontSize: 12, fontWeight: 700, color: "#475569", cursor: "pointer" }}>
          <Link2 size={12} /> Tempel URL
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8, border: "1px solid #FECACA", background: "white", fontSize: 12, fontWeight: 700, color: "#B91C1C", cursor: "pointer" }}>
            <X size={12} /> Hapus
          </button>
        )}
      </div>

      {modeUrl && (
        <input
          value={value ?? ""}
          onChange={e => onChange(e.target.value.trim() || null)}
          placeholder="https://…"
          style={{ ...inputStyle, marginTop: 8, fontSize: 12.5 }}
        />
      )}
    </div>
  );
}
