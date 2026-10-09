# Archived payment-gateway edge functions

These are **dead code** from abandoned payment-gateway migrations. Preserved here
for history/reversibility only — they are **not referenced** by the frontend
(which calls `create-mayar-payment` exclusively).

> ⚠️ **Koreksi 2026-09-11:** versi sebelumnya README ini menulis "Removed from
> Supabase on 2026-07-14 … not deployed". Itu KELIRU — kedua fungsi masih
> ACTIVE di produksi, dan `xendit-webhook` berjalan tanpa login maupun token
> apa pun (siapa pun bisa mengirim `status: "PAID"`). Pada 2026-09-11 keduanya
> di-deploy ulang sebagai stub yang selalu membalas **410 Gone**. Supabase CLI
> tidak dipakai di proyek ini, jadi fungsi tidak dihapus — dilumpuhkan.
> Selalu cek `list_edge_functions` sebelum menyatakan sebuah fungsi "tidak
> ter-deploy".

| Function | Gateway | Last real use | Why removed |
|----------|---------|---------------|-------------|
| `create-xendit-payment` | Xendit | Sep 2025 (14 failed txns) | Migrated off Xendit; frontend has zero references |
| `xendit-webhook` | Xendit | Sep 2025 | Paired with the above |

Midtrans (8 failed txns, Aug–Sep 2025) had no edge functions — it was a
frontend-only Snap integration already fully removed from `src/`.

**Active gateway: Mayar** (`create-mayar-payment` + `mayar-webhook`). Do not
resurrect these unless deliberately re-adopting Xendit; they reference the old
`lovable.app` redirect domain and a legacy `user_subscriptions` upsert shape.
