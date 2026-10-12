import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LABEL_RIASEC, useIdentitasSiswa } from "@/hooks/useIdentitasSiswa";

const KUNCI_TUTUP = "tk-app-promo-tutup";

/**
 * Ajakan membuka aplikasi untuk siswa yang sudah tes RIASEC di web.
 *
 * Per 2026-10-12: 103 siswa sudah tes di web, tapi baru 2 yang membuka
 * aplikasi. Hasil tesnya sudah otomatis ada di aplikasi (view identitas_siswa
 * yang sama), dan di sana langkah berikutnya — memilih 1 dari 3 karier —
 * langsung ditawarkan. Disembunyikan bagi yang sudah onboarding di aplikasi.
 */
export function AppPromoBanner({ userId, profile }: { userId?: string; profile: any }) {
  const navigate = useNavigate();
  const { identitas } = useIdentitasSiswa(userId);
  const [tutup, setTutup] = useState(() => {
    try { return localStorage.getItem(KUNCI_TUTUP) === "1"; } catch { return false; }
  });

  if (tutup || !identitas || profile?.onboarding_done || (profile?.role && profile.role !== "student")) return null;

  const sembunyikan = () => {
    try { localStorage.setItem(KUNCI_TUTUP, "1"); } catch { /* abaikan */ }
    setTutup(true);
  };

  return (
    <div className="relative flex items-center gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-4 pr-10">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
        <Smartphone className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          Hasil tesmu ({LABEL_RIASEC[identitas.tipeUtama]}{identitas.kode ? ` · ${identitas.kode}` : ""}) sudah ada di aplikasi Talentika
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          Tidak perlu tes ulang. Pilih 1 dari 3 karier yang cocok dan mulai jelajahi langkah pertamamu.
        </p>
      </div>
      <Button size="sm" className="shrink-0" onClick={() => navigate("/app")}>
        Buka aplikasi
      </Button>
      <button
        onClick={sembunyikan}
        aria-label="Tutup"
        className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
