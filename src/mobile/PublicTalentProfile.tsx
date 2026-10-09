import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { C, F, SH } from "./theme";
import { dnaTitle } from "./logic";
import { Card, CardTitle, GLOBAL_CSS, Loading } from "./ui";

const BAR = [C.blue, C.green, C.purple, C.orange, C.gold, C.sky];

/** Isi profil publik — dipakai pratinjau di aplikasi dan halaman publik /u/:username (PRJ-04). */
export function PublicProfileBody({ p }: { p: any }) {
  const title = p.axes ? dnaTitle(p.axes, 4) : null;
  return (
    <>
      <div style={{ background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: SH.card }}>
        <div style={{ height: 84, background: C.blue, position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,193,7,.35)" }} /></div>
        <div style={{ padding: "0 18px 18px" }}>
          <div style={{ width: 76, height: 76, borderRadius: 24, background: C.yellow, color: "#7A5200", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: F.display, fontSize: 30, border: "4px solid #fff", marginTop: -38, position: "relative", overflow: "hidden" }}>
            {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.name || "?")[0]}
          </div>
          <div style={{ marginTop: 10, fontSize: 21, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.3px" }}>{p.name}</div>
          <div style={{ marginTop: 3, fontSize: 13, color: C.text3, fontWeight: 600 }}>{[p.career_target && `Aspiring ${p.career_target}`, p.school].filter(Boolean).join(" · ")}</div>
          {title && <div style={{ marginTop: 10, display: "inline-flex", fontSize: 11.5, fontWeight: 700, fontFamily: F.display, color: "#fff", background: C.navy, padding: "5px 11px", borderRadius: 99 }}>🧬 {title}</div>}
          {p.bio && <p style={{ margin: "12px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text2 }}>{p.bio}</p>}
        </div>
      </div>
      {p.skills?.length > 0 && (
        <Card><CardTitle>Skills</CardTitle>
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 9 }}>
            {p.skills.slice(0, 8).map((s: any, i: number) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 100, fontSize: 12.5, fontWeight: 700, color: C.text3, flex: "none" }}>{s.n}</span><div style={{ flex: 1, height: 6, borderRadius: 3, background: C.track }}><div style={{ width: `${s.v}%`, height: "100%", borderRadius: 3, background: BAR[i % BAR.length] }} /></div></div>
            ))}
          </div>
        </Card>
      )}
      {p.projects?.length > 0 && (
        <Card><CardTitle>Projects</CardTitle>
          {p.projects.map((x: any, i: number) => <div key={i} style={{ marginTop: 10 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{x.status === "completed" ? "✅" : "🛠️"} {x.title}</div>{x.solution && <div style={{ marginTop: 2, fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{x.solution}</div>}</div>)}
        </Card>
      )}
      {(p.achievements?.length > 0 || p.certificates?.length > 0) && (
        <Card><CardTitle>Achievements & Certificates</CardTitle>
          {p.achievements?.map((a: any, i: number) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: `1px solid ${C.track}` }}><span style={{ fontSize: 20 }}>{a.medal}</span><span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{a.title} · {a.event} {a.year}</span>{a.verified && <span style={{ fontSize: 11, fontWeight: 700, color: C.blue }}>✓ Verified</span>}</div>)}
          {p.certificates?.map((c: any, i: number) => <a key={i} href={`/sertifikat/${c.code}`} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", color: C.text }}><span style={{ fontSize: 20 }}>📜</span><span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{c.title} · {c.issuer} {c.year}</span><span style={{ fontSize: 11, color: C.blue, fontWeight: 700 }}>Verifikasi →</span></a>)}
        </Card>
      )}
    </>
  );
}

export default function PublicTalentProfile() {
  const { username = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => (await (supabase as any).rpc("public_talent_profile", { p_username: username })).data,
  });
  return (
    <div className="tk-app" style={{ minHeight: "100dvh", background: C.bg, fontFamily: F.body, color: C.text }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
        <a href="/" style={{ display: "flex", alignItems: "flex-start", gap: 2, textDecoration: "none" }}><span style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.blue }}>Talentika</span><span style={{ color: C.yellow, fontSize: 11 }}>✦</span></a>
        {isLoading && <Loading />}
        {!isLoading && !data && <Card><CardTitle>Profil tidak ditemukan</CardTitle><p style={{ fontSize: 13, color: C.muted }}>Link ini tidak aktif atau pemiliknya membuatnya privat.</p></Card>}
        {data && <PublicProfileBody p={data} />}
        <a href="/app" style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: C.blue, marginTop: 8 }}>Buat Talent Profile-mu sendiri di Talentika →</a>
      </div>
    </div>
  );
}
