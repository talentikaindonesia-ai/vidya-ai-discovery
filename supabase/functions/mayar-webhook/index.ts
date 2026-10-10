import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
};

const STATUS_LUNAS = new Set(["paid", "success", "settled", "settlement", "completed"]);
const STATUS_GAGAL = new Set(["closed", "expired", "cancelled", "canceled", "failed"]);

// profiles.subscription_type hanya menerima individual | premium | school.
function tipeProfil(planType: string): string {
  return planType === "school" ? "school" : "premium";
}

function balas(teks: string, status = 200) {
  return new Response(teks, { headers: corsHeaders, status });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let payload: any;
    try { payload = JSON.parse(await req.text()); }
    catch { return balas("Bad Request", 400); }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

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

    // ── Klaim atomik (compare-and-swap pada notes) ───────────────────────
    // Notifikasi Mayar dan cek ulang pengguna bisa tiba bersamaan; hanya
    // proses yang berhasil mengganti notes asli yang boleh mengaktifkan,
    // sehingga masa aktif tidak diperpanjang dua kali.
    const { data: klaim } = await supabase.from("payment_transactions")
      .update({ notes: JSON.stringify({ ...notes, diaktifkan_pada: new Date().toISOString(), dibayar_menurut_mayar: dibayar }) })
      .eq("id", tx.id).eq("notes", tx.notes).select("id");
    if (!klaim?.length) return balas("OK — sedang/sudah diproses");
    // Aktivasi gagal → kembalikan notes agar notifikasi ulang Mayar bisa memproses lagi
    const gagalAktivasi = async (pesan: string) => {
      console.error(pesan);
      await supabase.from("payment_transactions").update({ notes: tx.notes }).eq("id", tx.id);
      return balas("Gagal aktivasi", 500);
    };

    // ── Program bootcamp: cukup catat pendaftaran ────────────────────────
    if (notes.kind === "bootcamp") {
      if (!notes.bootcampId) return await tahan("transaksi bootcamp tanpa bootcampId");
      const { error: enErr } = await supabase.from("bootcamp_enrollments").upsert({
        user_id: tx.user_id,
        bootcamp_id: notes.bootcampId,
        transaction_id: tx.id,
        amount_paid: dibayar,
        source: "purchase",
      }, { onConflict: "user_id,bootcamp_id", ignoreDuplicates: true });
      if (enErr) return await gagalAktivasi("Gagal mencatat pendaftaran bootcamp: " + enErr.message);
      const { error: stErr } = await tandaiLunas();
      if (stErr) console.error("Akses aktif, tapi status transaksi gagal ditandai:", stErr.message);
      console.log(`Bootcamp aktif: user ${tx.user_id}, bootcamp ${notes.bootcampId}`);
      return balas("OK");
    }

    // ── Playbook (aplikasi mobile): catat kepemilikan ────────────────────
    if (notes.kind === "playbook") {
      if (!notes.playbookId) return await tahan("transaksi playbook tanpa playbookId");
      const { error: pbErr } = await supabase.from("playbook_purchases").upsert({
        user_id: tx.user_id,
        playbook_id: notes.playbookId,
        transaction_id: tx.id,
      }, { onConflict: "user_id,playbook_id", ignoreDuplicates: true });
      if (pbErr) return await gagalAktivasi("Gagal mencatat pembelian playbook: " + pbErr.message);
      const { error: stErr } = await tandaiLunas();
      if (stErr) console.error("Akses aktif, tapi status transaksi gagal ditandai:", stErr.message);
      console.log(`Playbook aktif: user ${tx.user_id}, playbook ${notes.playbookId}`);
      return balas("OK");
    }

    const { data: plan } = await supabase
      .from("subscription_packages").select("*").eq("id", notes.planId).maybeSingle();
    if (!plan) return await gagalAktivasi("Paket tidak ditemukan: " + notes.planId);

    // ── Masa aktif: perpanjang dari sisa masa aktif ──────────────────────
    const siklus = notes.billingCycle === "yearly" ? "yearly" : "monthly";
    const { data: prof } = await supabase
      .from("profiles").select("subscription_status, subscription_end_date")
      .eq("user_id", tx.user_id).maybeSingle();
    const sekarang = new Date();
    const akhirLama = prof?.subscription_end_date ? new Date(prof.subscription_end_date) : null;
    const mulai = prof?.subscription_status === "active" && akhirLama && akhirLama > sekarang ? akhirLama : sekarang;
    const berakhir = new Date(mulai);
    if (siklus === "yearly") berakhir.setFullYear(berakhir.getFullYear() + 1);
    else berakhir.setMonth(berakhir.getMonth() + 1);

    // ── user_subscriptions (tanpa ON CONFLICT — tak bergantung unique index) ─
    const baris = {
      user_id: tx.user_id,
      package_id: plan.id,
      status: "active",
      billing_cycle: siklus,
      amount_paid: dibayar,
      starts_at: sekarang.toISOString(),
      expires_at: berakhir.toISOString(),
      auto_renew: false,
    };
    const { data: ada } = await supabase
      .from("user_subscriptions").select("id").eq("user_id", tx.user_id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { error: subErr } = ada
      ? await supabase.from("user_subscriptions").update(baris).eq("id", ada.id)
      : await supabase.from("user_subscriptions").insert(baris);
    if (subErr) return await gagalAktivasi("Gagal menulis user_subscriptions: " + subErr.message);

    // ── Profil — inilah yang dibaca is_premium() ─────────────────────────
    const { error: profErr } = await supabase.from("profiles").update({
      subscription_status: "active",
      subscription_type: tipeProfil(plan.type),
      subscription_end_date: berakhir.toISOString(),
    }).eq("user_id", tx.user_id);
    if (profErr) return await gagalAktivasi("Gagal mengaktifkan profil: " + profErr.message);

    const { error: stErr } = await tandaiLunas();
    if (stErr) console.error("Akses aktif, tapi status transaksi gagal ditandai:", stErr.message);

    // ── Catat pemakaian voucher ──────────────────────────────────────────
    if (notes.voucherId) {
      const { error: vuErr } = await supabase.from("voucher_usage")
        .insert({ voucher_id: notes.voucherId, user_id: tx.user_id });
      if (vuErr) console.warn("Gagal mencatat voucher_usage:", vuErr.message);
      const { data: v } = await supabase.from("voucher_codes")
        .select("current_uses").eq("id", notes.voucherId).maybeSingle();
      if (v) {
        await supabase.from("voucher_codes")
          .update({ current_uses: (v.current_uses ?? 0) + 1 }).eq("id", notes.voucherId);
      }
    }

    console.log(`Langganan aktif: user ${tx.user_id}, ${plan.name} ${siklus}, berakhir ${berakhir.toISOString()}`);
    return balas("OK");
  } catch (error) {
    console.error("mayar-webhook error:", error);
    return balas("Internal server error", 500);
  }
});
