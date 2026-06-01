import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Tag, Trophy, Users, Star, CheckCircle } from "lucide-react";
import { StatCard, NavSection } from "../adminShared";

export default function Overview({ onNav }: { onNav: (s: NavSection) => void }) {
  const [stats, setStats] = useState({ content: 0, active: 0, categories: 0, challenges: 0, users: 0, featured: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("learning_content").select("id, is_active, is_featured", { count: "exact" }),
      supabase.from("learning_categories").select("id", { count: "exact" }),
      supabase.from("community_challenges").select("id", { count: "exact" }),
      supabase.from("profiles").select("user_id", { count: "exact" }),
    ]).then(([{ data: c }, { count: cats }, { count: chal }, { count: users }]) => {
      setStats({
        content: c?.length ?? 0,
        active: c?.filter(x => x.is_active).length ?? 0,
        featured: c?.filter(x => x.is_featured).length ?? 0,
        categories: cats ?? 0,
        challenges: chal ?? 0,
        users: users ?? 0,
      });
    });
  }, []);

  const quickLinks = [
    { label: "Tambah Konten Baru", desc: "Tambah video, artikel, atau kursus", icon: BookOpen, color: "#2563EB", action: () => onNav("content") },
    { label: "Tambah Kategori",    desc: "Buat kategori baru untuk konten",   icon: Tag,      color: "#7C3AED", action: () => onNav("categories") },
    { label: "Buat Tantangan",     desc: "Buat tantangan dengan XP reward",   icon: Trophy,   color: "#D97706", action: () => onNav("challenges") },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={BookOpen}    value={stats.content}    label="Total Konten"     sub="Learning content" color="#2563EB" />
        <StatCard icon={CheckCircle} value={stats.active}     label="Konten Aktif"     sub="Ditampilkan"      color="#059669" />
        <StatCard icon={Star}        value={stats.featured}   label="Konten Unggulan"  sub="Featured"         color="#D97706" />
        <StatCard icon={Tag}         value={stats.categories} label="Kategori"         sub="Learning topics"  color="#7C3AED" />
        <StatCard icon={Trophy}      value={stats.challenges} label="Tantangan"        sub="Community"        color="#DC2626" />
        <StatCard icon={Users}       value={stats.users}      label="Pengguna"         sub="Terdaftar"        color="#0891B2" />
      </div>

      <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "#0F172A", margin: "0 0 14px" }}>Aksi Cepat</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {quickLinks.map(({ label, desc, icon: Icon, color, action }) => (
          <button key={label} onClick={action} style={{
            background: "white", border: "1px solid #E2E8F0", borderRadius: 14,
            padding: "20px 22px", textAlign: "left", cursor: "pointer",
            transition: "all .15s", boxShadow: "0 2px 8px rgba(0,0,0,.04)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}22`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,.04)"; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0F172A", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
