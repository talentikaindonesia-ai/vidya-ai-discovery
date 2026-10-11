import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { C, F, SH } from "./theme";
import { dnaTitle } from "./logic";
import { GLOBAL_CSS, Icon, Loading, LOGO } from "./ui";

const BAR = [C.blue, C.purple, C.orange, C.green, C.sky, C.red];
const card: React.CSSProperties = { background: "#fff", borderRadius: 20, padding: "14px 16px", boxShadow: SH.card };
const Title = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 15, fontWeight: 700 }}>{children}</div>;

/** Isi profil publik — dipakai pratinjau di aplikasi dan halaman publik /u/:username (PRJ-04). */
export function PublicProfileBody({ p }: { p: any }) {
  const title = p.axes ? dnaTitle(p.axes, 4) : null;
  return (
    <>
      <div style={{ background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 24, padding: 18, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,209,70,.8)" }} />
        <div style={{ position: "relative", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.yellow, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 26, border: "3px solid rgba(255,255,255,.7)", overflow: "hidden", flex: "none" }}>
            {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.name || "?")[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.3px" }}>{p.name}</div>
            <div style={{ fontSize: 12.5, opacity: .9, marginTop: 2 }}>{[p.career_target && `Aspiring ${p.career_target}`, p.school].filter(Boolean).join(" · ")}</div>
            {title && <div style={{ marginTop: 7, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: C.purple, background: "#fff", padding: "4px 10px", borderRadius: 99 }}><Icon name="sparkle" size={12} />{title}</div>}
          </div>
        </div>
        {p.bio && <p style={{ position: "relative", margin: "14px 0 0", fontSize: 13, lineHeight: 1.6, background: "rgba(255,255,255,.16)", borderRadius: 14, padding: "10px 12px" }}>“{p.bio}”</p>}
      </div>
      {p.skills?.length > 0 && (
        <div style={card}><Title>Skills</Title>
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 10 }}>
            {p.skills.slice(0, 8).map((s: any, i: number) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 110, fontSize: 12.5, fontWeight: 500, flex: "none" }}>{s.n}</span><div style={{ flex: 1, height: 7, borderRadius: 99, background: C.track }}><div style={{ width: `${s.v}%`, height: "100%", borderRadius: 99, background: BAR[i % BAR.length] }} /></div></div>
            ))}
          </div>
        </div>
      )}
      {p.projects?.length > 0 && (
        <div style={card}><Title>Projects</Title>
          {p.projects.map((x: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 11, marginTop: 11 }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: x.status === "completed" ? C.tintGreen : C.tintYellow, color: x.status === "completed" ? C.green : C.amber, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={x.status === "completed" ? "check" : "folder"} size={16} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{x.title}</div>{x.solution && <div style={{ marginTop: 2, fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{x.solution}</div>}</div>
            </div>
          ))}
        </div>
      )}
      {(p.achievements?.length > 0 || p.certificates?.length > 0) && (
        <div style={card}><Title>Achievements & Certificates</Title>
          {p.achievements?.map((a: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: `1px solid ${C.track}` }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.tintYellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flex: "none" }}>{a.medal}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a.title} · {a.event} {a.year}</span>
              {a.verified && <span style={{ fontSize: 10.5, fontWeight: 600, color: C.green, background: C.tintGreen, padding: "3px 9px", borderRadius: 99 }}>Verified</span>}
            </div>
          ))}
          {p.certificates?.map((c: any, i: number) => (
            <a key={i} href={`/sertifikat/${c.code}`} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", color: C.text, textDecoration: "none" }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.tintTeal, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="medal" size={16} /></span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.title} · {c.issuer} {c.year}</span>
              <span style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>Verifikasi →</span>
            </a>
          ))}
        </div>
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
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.text }}>
          <img src={LOGO} alt="" style={{ width: 36, height: 36, borderRadius: 11, boxShadow: "0 3px 10px rgba(15,23,42,.08)" }} />
          <span><span style={{ display: "block", fontSize: 17, fontWeight: 700, lineHeight: 1 }}>Talentika</span><span style={{ display: "block", fontSize: 10, color: C.muted, marginTop: 3 }}>Discover your full potential</span></span>
        </a>
        {isLoading && <Loading />}
        {!isLoading && !data && <div style={card}><Title>Profil tidak ditemukan</Title><p style={{ fontSize: 13, color: C.muted, margin: "6px 0 0" }}>Link ini tidak aktif atau pemiliknya membuatnya privat.</p></div>}
        {data && <PublicProfileBody p={data} />}
        <a href="/app" style={{ display: "block", textAlign: "center", marginTop: 8, height: 52, lineHeight: "52px", borderRadius: 16, background: C.blue, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", boxShadow: "0 10px 22px rgba(0,102,255,.28)" }}>Buat Profil Talenta-mu sendiri</a>
      </div>
    </div>
  );
}
