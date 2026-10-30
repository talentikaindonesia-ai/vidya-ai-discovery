import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * mayar-webhook — mengaktifkan langganan (atau pendaftaran bootcamp, bila
 * notes.kind = "bootcamp") setelah pembayaran Mayar.
 *
 * DITULIS ULANG 2026-09-11. Versi lama punya empat masalah:
 *  1. Mempercayai isi notifikasi. Bila MAYAR_WEBHOOK_TOKEN belum dipasang,
 *     siapa pun bisa mengirim {status:"paid"} dan paket aktif.
 *  2. Tidak mencocokkan nominal. Ditambah create-mayar-payment lama yang
 *     memakai nominal kiriman browser: bayar Rp1.000, dapat paket Rp39.000.
 *  3. Menulis subscription_type = plan.type ("premium_individual") ke
 *     profiles — ditolak profiles_subscription_type_check
 *     (individual|premium|school). Errornya tidak dibaca.
 *  4. Menulis kolom payment_method ke user_subscriptions — kolom itu tidak
 *     ada di tabel tersebut.
 * Akibat (3) dan (4), pembayar SUNGGUHAN pun tidak akan pernah mendapat
 * akses. Belum ada yang terdampak karena belum pernah ada pembayaran
 * berhasil (41 transaksi, 0 lunas).
 *
 * Sekarang:
 *  • status ditanyakan langsung ke API Mayar (GET /hl/v1/payment/{id});
 *    isi notifikasi hanya dipakai untuk menemukan transaksi;
 *  • nominal dari Mayar harus ≥ harga yang dihitung server;
 *  • transaksi lama tanpa `dihitung_server` tidak diaktifkan otomatis;
 *  • idempoten — notifikasi berulang tidak memperpanjang dua kali;
 *  • masa aktif diperpanjang dari sisa masa aktif, bukan dipotong;
 *  • setiap error penulisan dibaca; bila aktivasi gagal, balas 500 agar
 *    Mayar mengirim ulang.
 *
 * 2026-10-10:
 *  • jalur cek ulang {transaction_id} dengan JWT pemilik transaksi / admin —
 *    cadangan bila notifikasi Mayar tidak sampai (dipanggil halaman setelah
 *    bayar & tombol Sync admin lewat src/lib/pembayaran.ts);
 *  • klaim atomik (compare-and-swap notes) agar notifikasi dan cek ulang yang
 *    bersamaan tidak memperpanjang masa aktif dua kali;
 *  • transaksi hanya bisa dibuat/diubah server (policy INSERT klien & RPC
 *    update_transaction_status dicabut) — dulu harga bisa dipalsukan.
 *
 * 2026-10-30 (PRD Monetization):
 *  • webhook_events: notifikasi yang sudah selesai diproses tidak diproses lagi;
 *  • aktivasi pindah ke RPC aktifkan_order — langganan, hak akses, voucher,
 *    order, dan status transaksi berhasil atau gagal bersama dalam satu transaksi
 *    database, dan aman dipanggil berulang.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
};

const STATUS_LUNAS = new Set(["paid", "success", "settled", "settlement", "completed"]);
const STATUS_GAGAL = new Set(["closed", "expired", "cancelled", "canceled", "failed"]);

interface KonteksEvent {
  id?: string;
  belumFinal?: boolean;
}

async function sidikJari(teks: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(teks));
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function balas(teks: string, status = 200) {
  return new Response(teks, { headers: corsHeaders, status });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const ctx: KonteksEvent = {};
  const res = await tangani(req, supabase, ctx);
  if (ctx.id && !ctx.belumFinal) {
    const berhasil = res.status < 400;
    await supabase.from("webhook_events").update({
      status: berhasil ? "processed" : "failed",
      processed_at: berhasil ? new Date().toISOString() : null,
      error: berhasil ? null : `HTTP ${res.status}`,
    }).eq("id", ctx.id);
  }
  return res;
});

async function tangani(req: Request, supabase: SupabaseClient, ctx: KonteksEvent): Promise<Response> {
  try {
    const teks = await req.text();
    let payload: any;
    try { payload = JSON.parse(teks); }
    catch { return balas("Bad Request", 400); }

    let tx: any = null;

    if (typeof payload?.transaction_id === "string") {
      // ── Cek ulang oleh pemilik transaksi / admin (2026-10-10) ──────────
      // Jalur cadangan bila notifikasi Mayar tidak sampai (URL webhook salah,
      // gangguan jaringan). Aman: hanya transaksi milik pemanggil, dan status
      // tetap ditanyakan ke API Mayar di bawah — isi permintaan tidak dipercaya.
      const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
      const { data: au } = await supabase.auth.getUser(jwt);
      if (!au?.user) return balas("Unauthorized", 401);
      const { data: t } = await supabase.from("payment_transactions").select("*").eq("id", payload.transaction_id).maybeSingle();
      if (!t) return balas("OK");
      if (t.user_id !== au.user.id) {
        const { data: adm } = await supabase.from("user_roles").select("id").eq("user_id", au.user.id).eq("role", "admin").maybeSingle();
        if (!adm) return balas("Forbidden", 403);
      }
      tx = t;
    } else {
      // ── Notifikasi dari Mayar ──────────────────────────────────────────
      // Token = lapisan tambahan. Pengaman utamanya adalah verifikasi ke API
      // Mayar di bawah, jadi webhook tetap aman walau token belum dipasang.
      const expectedToken = Deno.env.get("MAYAR_WEBHOOK_TOKEN");
      const callbackToken = req.headers.get("x-callback-token");
      if (expectedToken && callbackToken !== expectedToken) {
        console.warn("Token webhook Mayar tidak cocok");
        return balas("Unauthorized", 401);
      }
      if (!expectedToken) {
        console.warn("MAYAR_WEBHOOK_TOKEN belum dipasang — isi notifikasi tidak dipercaya, status diverifikasi ke API Mayar.");
      }

      const data = payload?.data ?? payload;
      const mayarPaymentId: string | undefined = data?.id;
      const referenceNo: string | undefined = data?.referenceNo;
      if (!mayarPaymentId && !referenceNo) return balas("OK"); // ping uji dari Mayar

      // ── Dedup: event yang sudah selesai tidak diproses dua kali ────────
      const eventId = mayarPaymentId
        ? `${payload?.event ?? "payment"}:${mayarPaymentId}:${String(data?.status ?? "")}`
        : await sidikJari(teks);
      const { data: baru, error: evErr } = await supabase.from("webhook_events").upsert({
        provider: "mayar",
        event_id: eventId,
        event_type: payload?.event ?? null,
        provider_payment_id: mayarPaymentId ?? referenceNo ?? null,
      }, { onConflict: "provider,event_id", ignoreDuplicates: true }).select("id");
      if (evErr) {
        console.error("Gagal mencatat webhook_events:", evErr.message);
      } else if (baru?.length) {
        ctx.id = baru[0].id;
      } else {
        const { data: ada } = await supabase.from("webhook_events").select("id, status")
          .eq("provider", "mayar").eq("event_id", eventId).maybeSingle();
        if (ada?.status === "processed") return balas("OK — event sudah diproses");
        ctx.id = ada?.id;
      }

      // ── Temukan transaksi ──────────────────────────────────────────────
      if (mayarPaymentId) {
        const { data: byId } = await supabase
          .from("payment_transactions").select("*")
          .eq("external_transaction_id", mayarPaymentId).maybeSingle();
        tx = byId;
      }
      if (!tx && referenceNo) {
        const { data: byRef } = await supabase
          .from("payment_transactions").select("*")
          .eq("invoice_number", referenceNo).maybeSingle();
        tx = byRef;
      }
    }
    if (!tx || !tx.external_transaction_id) {
      console.log("Transaksi tidak ditemukan untuk", payload?.transaction_id ?? payload?.data?.id ?? payload?.id ?? payload?.data?.referenceNo);
      return balas("OK");
    }

    if (tx.status === "completed") return balas("OK — sudah diproses");

    let notes: any = {};
    try { notes = tx.notes ? JSON.parse(tx.notes) : {}; } catch { notes = {}; }

    // ── Jangan percaya isi notifikasi: tanya Mayar ───────────────────────
    const r = await fetch(`https://api.mayar.id/hl/v1/payment/${tx.external_transaction_id}`, {
      headers: {
        Authorization: `Bearer ${Deno.env.get("MAYAR_API_KEY") ?? ""}`,
        "Content-Type": "application/json",
      },
    });
    if (!r.ok) {
      console.error("Verifikasi ke Mayar gagal:", r.status);
      return balas("Verifikasi gagal", 502); // Mayar akan mengirim ulang
    }
    const detail = (await r.json())?.data;
    if (!detail || String(detail.id) !== String(tx.external_transaction_id)) {
      console.error("Respons Mayar tidak cocok dengan transaksi", tx.id);
      return balas("Verifikasi gagal", 502);
    }

    const statusMayar = String(detail.status ?? "").toLowerCase();
    if (!STATUS_LUNAS.has(statusMayar)) {
      if (STATUS_GAGAL.has(statusMayar) && tx.status === "pending") {
        await supabase.rpc("update_transaction_status", {
          p_transaction_id: tx.id, p_new_status: "failed", p_external_id: tx.external_transaction_id,
        });
      }
      console.log(`Transaksi ${tx.id}: Mayar berkata "${statusMayar}" — belum lunas, tidak diaktifkan.`);
      ctx.belumFinal = !STATUS_GAGAL.has(statusMayar);
      return balas("OK");
    }

    const tandaiLunas = () => supabase.rpc("update_transaction_status", {
      p_transaction_id: tx.id, p_new_status: "completed", p_external_id: tx.external_transaction_id,
    });

    // Sudah pernah diaktifkan tapi status belum sempat ditandai → cukup tandai.
    if (notes.diaktifkan_pada) {
      await tandaiLunas();
      return balas("OK — sudah diaktifkan sebelumnya");
    }

    const tahan = async (alasan: string) => {
      console.error(`Transaksi ${tx.id} LUNAS tapi ditahan: ${alasan}`);
      await supabase.from("payment_transactions").update({
        notes: JSON.stringify({ ...notes, ditahan: alasan, ditahan_pada: new Date().toISOString() }),
      }).eq("id", tx.id);
      if (notes.orderId) {
        await supabase.from("orders").update({ status: "held", hold_reason: alasan }).eq("id", notes.orderId);
      }
      return balas("OK — ditahan untuk tinjauan admin");
    };

    // ── Harga harus dihitung server & nominal harus cukup ────────────────
    const harga = Number(notes.harga_final);
    const dibayar = Number(detail.amount);
    if (notes.dihitung_server !== true || !Number.isFinite(harga) || harga <= 0) {
      return await tahan("harga transaksi lama tidak dihitung server");
    }
    if (!(dibayar >= harga) || Number(tx.amount) < harga) {
      return await tahan(`nominal kurang: dibayar ${dibayar}, harga ${harga}`);
    }

    // Transaksi tanpa order hanya mungkin berasal dari sebelum 2026-10-30.
    if (!notes.orderId) return await tahan("transaksi lama tanpa order");

    // ── Aktivasi ─────────────────────────────────────────────────────────
    // Satu transaksi database dengan kunci baris order: notifikasi Mayar dan cek
    // ulang pengguna yang tiba bersamaan tidak memperpanjang masa aktif dua kali.
    const { data: hasil, error: aktifErr } = await supabase.rpc("aktifkan_order", {
      p_order_id: notes.orderId,
      p_dibayar: Math.round(dibayar),
    });
    if (aktifErr) {
      console.error(`Aktivasi order ${notes.orderId} gagal:`, aktifErr.message);
      return balas("Gagal aktivasi", 500); // Mayar akan mengirim ulang
    }

    await supabase.from("payment_transactions").update({
      notes: JSON.stringify({ ...notes, diaktifkan_pada: new Date().toISOString(), dibayar_menurut_mayar: dibayar }),
    }).eq("id", tx.id);

    console.log(`Order ${notes.orderId} ${hasil?.status}: user ${tx.user_id}, berakhir ${hasil?.berakhir ?? "-"}`);
    return balas("OK");
  } catch (error) {
    console.error("mayar-webhook error:", error);
    return balas("Internal server error", 500);
  }
}
