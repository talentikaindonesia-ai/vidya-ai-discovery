import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, TrendingUp, Users, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "talentika_welcome_v1";

const FEATURES = [
  { icon: Search,     label: "Tes Minat & Bakat" },
  { icon: TrendingUp, label: "Jalur Pengembangan" },
  { icon: Users,      label: "Komunitas Aktif" },
  { icon: Star,       label: "Sertifikasi Resmi" },
];

const WelcomePopup = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleStart = () => {
    dismiss();
    navigate("/auth?mode=register");
  };

  if (!visible) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={dismiss}
    >
      {/* Modal */}
      <div
        className="relative flex w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between w-full md:w-[48%] bg-white p-8 md:p-10">

          {/* Logo */}
          <div className="mb-6">
            <img
              src="/lovable-uploads/ce4aabf2-d425-472e-ada0-d085a2b285b9.png"
              alt="Talentika"
              className="h-9 w-auto"
            />
          </div>

          {/* Heading */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
              Selamat Datang di{" "}
              <span className="text-blue-600">Talentika!</span> 🎉
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Temukan minat & bakat terbaikmu. Bergabunglah bersama ribuan pelajar
              yang sudah memulai perjalanan pengembangan diri mereka.
            </p>

            {/* Checklist */}
            <ul className="space-y-3 mb-7">
              {[
                "Tes minat & bakat berbasis AI yang akurat",
                "Jalur belajar personal yang terstruktur",
                "Komunitas aktif & mentor berpengalaman",
                "Sertifikat resmi yang diakui industri",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            {/* Feature icon pills */}
            <div className="grid grid-cols-2 gap-2 mb-8">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button
              className="w-full h-12 font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
              onClick={handleStart}
            >
              Mulai Perjalananmu Sekarang 🚀
            </Button>
            <button
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
              onClick={dismiss}
            >
              Nanti Saja
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL — hero photo + floating cards ──────────────── */}
        <div
          className="hidden md:block relative w-[52%] overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)" }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-900/40 blur-3xl pointer-events-none" />

          {/* Hashtag */}
          <p className="absolute top-6 left-6 text-xs font-semibold text-white/70 tracking-widest z-10">
            #mulaidaritalentika
          </p>

          {/* Hero photo */}
          <img
            src="/lovable-uploads/029928be-11a9-49ba-9a70-7dd69aff1316.png"
            alt="Talentika user"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] object-contain object-bottom z-10"
            style={{ maxHeight: "86%" }}
          />

          {/* Floating card — top right */}
          <div className="absolute top-14 right-4 z-20 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 w-44">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center flex-shrink-0 text-lg">
              🏆
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Achievement</p>
              <p className="text-[10px] text-gray-500">Bakat teridentifikasi!</p>
            </div>
          </div>

          {/* Floating card — mid left */}
          <div className="absolute top-[38%] left-3 z-20 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 w-40">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 text-lg">
              🎯
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">98% Akurat</p>
              <p className="text-[10px] text-gray-500">Hasil tes minat</p>
            </div>
          </div>

          {/* Stats bar — bottom overlay */}
          <div className="absolute bottom-4 left-3 right-3 z-20 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/30 flex items-center justify-between text-white">
            <div className="text-center">
              <p className="text-base font-bold">10K+</p>
              <p className="text-[10px] opacity-75">Pengguna</p>
            </div>
            <div className="w-px h-8 bg-white/30" />
            <div className="text-center">
              <p className="text-base font-bold">50+</p>
              <p className="text-[10px] opacity-75">Tes Bakat</p>
            </div>
            <div className="w-px h-8 bg-white/30" />
            <div className="text-center">
              <p className="text-base font-bold">4.9★</p>
              <p className="text-[10px] opacity-75">Rating</p>
            </div>
          </div>
        </div>

        {/* ── CLOSE BUTTON ───────────────────────────────────────────── */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition-colors z-30"
          aria-label="Tutup"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default WelcomePopup;
