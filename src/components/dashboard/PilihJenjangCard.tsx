import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const OPSI: [string, string][] = [["smp", "SMP"], ["sma_smk", "SMA / SMK"], ["kuliah", "Kuliah"], ["lulusan", "Sudah lulus"]];

/**
 * Jenjang satu ketukan. Jenjang adalah penentu terkuat kecocokan peluang
 * (peluang_untukku: cocok +20, tidak cocok −30), tetapi per 2026-10-19
 * 96 dari 103 siswa yang sudah tes belum mengisinya. Kartu yang sama ada
 * di Beranda aplikasi.
 */
export function PilihJenjangCard({ userId, profile }: { userId?: string; profile: any }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [selesai, setSelesai] = useState(false);
  if (!userId || !profile || profile.jenjang || selesai || (profile.role && profile.role !== "student")) return null;

  const pilih = async (v: string) => {
    if (busy) return;
    setBusy(v);
    const { error } = await supabase.from("profiles").update({ jenjang: v } as any).eq("user_id", userId);
    setBusy(null);
    if (error) { toast.error("Gagal menyimpan jenjang. Coba lagi."); return; }
    setSelesai(true);
    toast.success("Tersimpan — peluang kini disaring sesuai jenjangmu");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Sekarang kamu di jenjang apa?</p>
          <p className="text-xs text-slate-600">Supaya peluang yang direkomendasikan memang bisa kamu ikuti.</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPSI.map(([v, l]) => (
          <button key={v} onClick={() => pilih(v)} disabled={!!busy}
            className="h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-500 hover:bg-blue-50 disabled:opacity-60">
            {busy === v ? "…" : l}
          </button>
        ))}
      </div>
    </div>
  );
}
