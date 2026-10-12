import { DI_LUAR_PAKET, MATRIKS_PAKET } from "@/lib/paket";

/**
 * Tabel Free vs Plus — isi yang sama persis dengan aplikasi (/app/pro),
 * dari src/lib/paket.ts. Batas angkanya ditegakkan di database.
 */
export function PerbandinganPaket({ judul = true }: { judul?: boolean }) {
  return (
    <div style={{ maxWidth: 880, margin: "32px auto 0", textAlign: "left" }}>
      {judul && (
        <h3 style={{ fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 800, fontSize: 20, color: "#0F172A", margin: "0 0 12px", textAlign: "center" }}>
          Free vs Plus
        </h3>
      )}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px,1.1fr) 1fr 1fr", gap: 12, padding: "12px 16px", background: "#F8FAFC", fontSize: 12, fontWeight: 800, letterSpacing: ".04em", color: "#64748B" }}>
          <span>FITUR</span><span>FREE</span><span style={{ color: "#2563EB" }}>PLUS</span>
        </div>
        {MATRIKS_PAKET.map((r, i) => (
          <div key={r.fitur} style={{ display: "grid", gridTemplateColumns: "minmax(120px,1.1fr) 1fr 1fr", gap: 12, padding: "11px 16px", borderTop: i ? "1px solid #F1F5F9" : "none", fontSize: 13, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 700, color: "#0F172A" }}>{r.fitur}</span>
            <span style={{ color: "#64748B" }}>{r.free}</span>
            <span style={{ color: "#1D4ED8", fontWeight: 600 }}>{r.plus}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.6, marginTop: 10 }}>
        <b>Tidak termasuk langganan:</b> {DI_LUAR_PAKET.map(([id]) => id).join(", ")} — dijual atau dikenakan terpisah.
        Fitur keselamatan, pengaturan privasi, dan penghapusan akun selalu tersedia untuk semua pengguna.
      </p>
    </div>
  );
}
