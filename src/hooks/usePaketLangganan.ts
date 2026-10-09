import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Paket langganan individu dari subscription_packages — satu-satunya sumber
 * harga. Landing dulu menulis Rp39.000/Rp89.000 langsung di kode sehingga
 * berbeda dari harga yang ditagih; banner "mulai dari Rp39rb" tersebar di
 * empat komponen. Sekarang semuanya membaca tabel yang sama dengan
 * create-mayar-payment.
 */
export interface PaketLangganan {
  id: string;
  name: string;
  type: string;
  tier: string | null;
  tagline: string | null;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_popular: boolean;
  cta_label: string | null;
  sort_order: number;
}

let cache: Promise<PaketLangganan[]> | null = null;

function muat(): Promise<PaketLangganan[]> {
  if (!cache) {
    cache = Promise.resolve(
      supabase
        .from("subscription_packages")
        .select("id,name,type,tier,tagline,description,price_monthly,price_yearly,features,is_popular,cta_label,sort_order")
        .eq("is_active", true)
        .neq("type", "school")
        .order("sort_order")
        .order("price_monthly"),
    ).then(({ data, error }) => {
      if (error) { cache = null; return []; }
      return (data ?? []) as unknown as PaketLangganan[];
    });
  }
  return cache;
}

export function usePaketLangganan() {
  const [paket, setPaket] = useState<PaketLangganan[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let aktif = true;
    muat().then(p => { if (aktif) { setPaket(p); setLoading(false); } });
    return () => { aktif = false; };
  }, []);
  return { paket, loading };
}

/** "Rp99rb" — harga bulanan paket berbayar termurah, atau null saat belum termuat. */
export function useHargaMulai(): string | null {
  const { paket } = usePaketLangganan();
  const termurah = paket.filter(p => p.price_monthly > 0).map(p => p.price_monthly).sort((a, b) => a - b)[0];
  if (!termurah) return null;
  return termurah % 1000 === 0 ? `Rp${(termurah / 1000).toLocaleString("id-ID")}rb` : `Rp${termurah.toLocaleString("id-ID")}`;
}
