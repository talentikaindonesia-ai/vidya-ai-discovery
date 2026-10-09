import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Anak komponen baru dirender setelah peran admin terkonfirmasi — sebelum
// itu hanya spinner. Data tetap dilindungi RLS; ini menjaga tampilannya.
export default function AdminGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase.from("user_roles").select("role")
        .eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!data) { toast.error("Akses ditolak. Bukan admin."); navigate("/dashboard", { replace: true }); return; }
      setOk(true);
    })();
  }, [navigate]);

  if (!ok) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F8FAFC" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#2563EB" }} />
      </div>
    );
  }
  return <>{children}</>;
}
