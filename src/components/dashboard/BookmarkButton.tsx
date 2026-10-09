import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userId: string;
  opportunityId: string;
  opportunityTitle?: string;
  opportunityUrl?: string;
  category?: string;
  size?: number;
}

export function BookmarkButton({ userId, opportunityId, opportunityTitle, opportunityUrl, category, size = 16 }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("saved_opportunities")
      .select("id").eq("user_id", userId).eq("opportunity_id", opportunityId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [userId, opportunityId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (saved) {
        await supabase.from("saved_opportunities").delete().eq("user_id", userId).eq("opportunity_id", opportunityId);
        setSaved(false);
        toast("Dihapus dari simpanan");
      } else {
        await supabase.from("saved_opportunities").insert({
          user_id: userId, opportunity_id: opportunityId,
          opportunity_title: opportunityTitle, opportunity_url: opportunityUrl, category,
        });
        setSaved(true);
        toast.success("Tersimpan! Lihat di halaman Simpanan 🔖");
      }
    } catch { toast.error("Gagal menyimpan"); }
    finally { setLoading(false); }
  };

  return (
    <button onClick={toggle} title={saved ? "Hapus simpanan" : "Simpan peluang"} style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
      background: saved ? "var(--tk-blue-50)" : "var(--tk-gray-100)",
      color: saved ? "var(--tk-blue-600)" : "var(--tk-gray-400)",
      transition: "all .15s", flexShrink: 0,
    }}>
      {saved
        ? <BookmarkCheck size={size} />
        : <Bookmark size={size} />
      }
    </button>
  );
}
