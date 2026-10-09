import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * create-mayar-payment — membuat link pembayaran Mayar untuk langganan
 * dan (sejak 2026-09-21) untuk program bootcamp.
 *
 * HARGA DAN PEMBELI DITENTUKAN SERVER (2026-09-11).
 * Versi sebelumnya memakai `amount` dan `userId` dari body request — nilai
 * yang dikirim browser. Link Mayar dibuat dengan `closedAmount: true` pada
 * nominal itu, dan mayar-webhook mengaktifkan paket tanpa mencocokkan
 * nominal. Rantainya utuh: bayar Rp1.000, dapat paket Rp39.000.
 *
 * Sekarang:
 *  • pembeli = pemilik token login (Authorization header), bukan body;
 *  • harga = subscription_packages.price_monthly / price_yearly, atau
 *    bootcamps.price untuk { kind: "bootcamp", bootcampId };
 *  • voucher divalidasi di server (aktif, masa berlaku, kuota, minimum
 *    pembelian, paket yang berlaku, belum pernah dipakai pengguna ini) —
 *    khusus langganan; voucher belum berlaku untuk bootcamp;
 *  • `amount` & `userId` di body DIABAIKAN — tetap diterima agar frontend
 *    lama tidak rusak;
 *  • notes menyimpan `dihitung_server: true` + rincian harga, dan
 *    mayar-webhook menolak mengaktifkan transaksi yang tidak punya penanda
 *    itu (transaksi lama dengan nominal kiriman browser).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  kind?: "subscription" | "bootcamp" | "playbook";
  bootcampId?: string;
  playbookId?: string;
  returnTo?: "web" | "app";
  planId?: string;
  billingCycle?: string;
  paymentMethod?: string;
  voucherId?: string;
  phone?: string;
  // Diabaikan — hanya diterima demi kompatibilitas frontend lama.
  amount?: number;
  userId?: string;
}

// Batas bawah yang aman untuk diproses gateway. Voucher yang membuat harga
// di bawah ini ditolak dengan pesan jelas, bukan diteruskan diam-diam.
const NOMINAL_MINIMUM = 1000;

function balas(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

interface LinkArgs {
  supabase: SupabaseClient;
  user: User;
  phone?: string;
  transactionType: "subscription" | "course";
  harga: number;
  notes: Record<string, unknown>;
  nama: string;
  deskripsi: (ref: string) => string;
  redirectPath: (transactionId: string) => string;
}

async function buatLinkMayar(a: LinkArgs) {
  const { supabase, user } = a;

  // ── Profil untuk nama / email / HP ─────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  const mobile = a.phone?.trim() || profile?.phone?.trim() || "";
  if (!mobile) throw new Error("Nomor HP wajib diisi untuk melanjutkan pembayaran.");
  const customerEmail = profile?.email ?? user.email ?? "";

  // ── Transaksi pending ──────────────────────────────────────────────────
  const { data: transactionId, error: txError } = await supabase.rpc("create_payment_transaction", {
    p_user_id: user.id,
    p_transaction_type: a.transactionType,
    p_amount: a.harga,
    p_payment_gateway: "mayar",
    p_currency: "IDR",
  });
  if (txError || !transactionId) {
    throw new Error("Gagal membuat transaksi: " + (txError?.message ?? "unknown"));
  }

  await supabase
    .from("payment_transactions")
    .update({ notes: JSON.stringify({ ...a.notes, transactionId, dihitung_server: true }) })
    .eq("id", transactionId);

  // ── Link Mayar dengan nominal dari server ──────────────────────────────
  const mayarApiKey = Deno.env.get("MAYAR_API_KEY");
  if (!mayarApiKey) throw new Error("Mayar API key not configured");

  const baseUrl = Deno.env.get("APP_URL") ?? "https://talentika.id";
  const mayarBody: Record<string, unknown> = {
    name: a.nama,
    amount: a.harga,
    description: a.deskripsi(String(transactionId).slice(0, 8)),
    redirectUrl: `${baseUrl}${a.redirectPath(String(transactionId))}`,
    closedAmount: true,
    mobile,
  };
  if (customerEmail) mayarBody.email = customerEmail;

  const mayarResponse = await fetch("https://api.mayar.id/hl/v1/payment/create", {
    method: "POST",
    headers: { Authorization: `Bearer ${mayarApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(mayarBody),
  });

  const mayarText = await mayarResponse.text();
  if (!mayarResponse.ok) throw new Error(`Mayar API error ${mayarResponse.status}: ${mayarText}`);

  let mayarData: any;
  try { mayarData = JSON.parse(mayarText); }
  catch { throw new Error("Mayar returned non-JSON response"); }

  const payment = mayarData?.data;
  if (!payment?.link) throw new Error("Mayar did not return a payment link");

  await supabase.rpc("update_transaction_status", {
    p_transaction_id: transactionId,
    p_new_status: "pending",
    p_external_id: payment.id,
  });

  return { invoice_url: payment.link, invoice_id: payment.id, transaction_id: transactionId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── Pembeli = pemilik token, bukan isi body ──────────────────────────
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    const user = authData?.user;
    if (authError || !user) {
      return balas({ success: false, error: "Silakan login terlebih dahulu." }, 401);
    }
    const userId = user.id;

    const body: PaymentRequest = await req.json();

    // ── Program bootcamp ─────────────────────────────────────────────────
    if (body.kind === "bootcamp") {
      const { data: bc } = await supabase
        .from("bootcamps")
        .select("id, slug, title, price, is_published")
        .eq("id", body.bootcampId ?? "")
        .maybeSingle();
      if (!bc || !bc.is_published) throw new Error("Program tidak ditemukan atau belum dibuka.");

      const harga = Math.round(Number(bc.price) || 0);
      if (harga <= 0) throw new Error("Program ini gratis — tidak perlu pembayaran.");
      if (harga < NOMINAL_MINIMUM) throw new Error("Harga program terlalu kecil untuk diproses.");

      const { data: sudah } = await supabase
        .from("bootcamp_enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("bootcamp_id", bc.id)
        .maybeSingle();
      if (sudah) throw new Error("Kamu sudah terdaftar di program ini.");

      const link = await buatLinkMayar({
        supabase, user, phone: body.phone,
        transactionType: "course",
        harga,
        notes: { kind: "bootcamp", bootcampId: bc.id, harga_asli: harga, diskon: 0, harga_final: harga },
        nama: bc.title,
        deskripsi: ref => `${bc.title} | Ref: ${ref}`,
        redirectPath: tx => `/bootcamp/${bc.slug}?payment=success&ref=${tx}`,
      });
      return balas({ success: true, ...link, amount: harga, harga_asli: harga, diskon: 0 });
    }

    // ── Playbook (aplikasi mobile) ───────────────────────────────────────
    if (body.kind === "playbook") {
      const { data: pb } = await supabase
        .from("playbooks")
        .select("id, slug, title, price, is_active")
        .eq("id", body.playbookId ?? "")
        .maybeSingle();
      if (!pb || !pb.is_active) throw new Error("Playbook tidak ditemukan.");
      const harga = Math.round(Number(pb.price) || 0);
      if (harga < NOMINAL_MINIMUM) throw new Error("Playbook ini gratis — tidak perlu pembayaran.");
      const { data: sudah } = await supabase
        .from("playbook_purchases").select("playbook_id")
        .eq("user_id", userId).eq("playbook_id", pb.id).maybeSingle();
      if (sudah) throw new Error("Kamu sudah memiliki playbook ini.");

      const link = await buatLinkMayar({
        supabase, user, phone: body.phone,
        transactionType: "course",
        harga,
        notes: { kind: "playbook", playbookId: pb.id, harga_asli: harga, diskon: 0, harga_final: harga },
        nama: pb.title,
        deskripsi: ref => `${pb.title} | Ref: ${ref}`,
        redirectPath: tx => `/app/playbooks?payment=success&ref=${tx}`,
      });
      return balas({ success: true, ...link, amount: harga, harga_asli: harga, diskon: 0 });
    }

    // ── Langganan ────────────────────────────────────────────────────────
    const { planId, billingCycle, paymentMethod, voucherId } = body;

    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      throw new Error("Siklus tagihan tidak valid.");
    }

    // ── Harga dari database ──────────────────────────────────────────────
    const { data: plan, error: planError } = await supabase
      .from("subscription_packages")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle();

    if (planError || !plan) throw new Error("Paket tidak ditemukan atau tidak aktif.");
    if (plan.type === "free") throw new Error("Paket gratis tidak memerlukan pembayaran.");

    const hargaAsli = Math.round(Number(billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly) || 0);
    if (hargaAsli <= 0) throw new Error("Harga paket belum diatur.");

    // ── Voucher divalidasi di server ─────────────────────────────────────
    let diskon = 0;
    let voucherDipakai: string | null = null;

    if (voucherId) {
      const { data: v } = await supabase
        .from("voucher_codes")
        .select("*")
        .eq("id", voucherId)
        .maybeSingle();

      const now = new Date();
      if (!v || !v.is_active) throw new Error("Voucher tidak valid.");
      if (v.valid_from && new Date(v.valid_from) > now) throw new Error("Voucher belum berlaku.");
      if (v.valid_until && new Date(v.valid_until) < now) throw new Error("Voucher sudah kedaluwarsa.");
      if (v.max_uses && (v.current_uses ?? 0) >= v.max_uses) throw new Error("Kuota voucher sudah habis.");
      if (v.min_purchase_amount && hargaAsli < Number(v.min_purchase_amount)) {
        throw new Error("Harga paket di bawah minimum pembelian voucher ini.");
      }
      const berlakuUntuk = Array.isArray(v.applicable_packages) ? v.applicable_packages.map(String) : [];
      if (berlakuUntuk.length > 0 && !berlakuUntuk.includes(String(planId))) {
        throw new Error("Voucher tidak berlaku untuk paket ini.");
      }

      const { data: pernah } = await supabase
        .from("voucher_usage")
        .select("id")
        .eq("voucher_id", v.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (pernah) throw new Error("Voucher ini sudah pernah kamu gunakan.");

      diskon = v.discount_type === "percentage"
        ? Math.floor((hargaAsli * Number(v.discount_value)) / 100)
        : Math.min(Number(v.discount_value) || 0, hargaAsli);
      voucherDipakai = v.id;
    }

    const hargaFinal = hargaAsli - diskon;
    if (hargaFinal < NOMINAL_MINIMUM) {
      throw new Error("Nominal setelah diskon terlalu kecil untuk diproses. Hubungi admin untuk aktivasi manual.");
    }

    const link = await buatLinkMayar({
      supabase, user, phone: body.phone,
      transactionType: "subscription",
      harga: hargaFinal,
      notes: {
        billingCycle,
        planId,
        paymentMethod: paymentMethod ?? null,
        voucherId: voucherDipakai,
        harga_asli: hargaAsli,
        diskon,
        harga_final: hargaFinal,
      },
      nama: plan.name,
      deskripsi: ref => `${plan.name} – ${billingCycle === "monthly" ? "Bulanan" : "Tahunan"} | Ref: ${ref}`,
      // Aplikasi mobile kembali ke layar "Pembayaran Berhasil"-nya sendiri.
      redirectPath: tx => body.returnTo === "app" ? `/app/paid?ref=${tx}` : `/subscription?payment=success&ref=${tx}`,
    });

    return balas({ success: true, ...link, amount: hargaFinal, harga_asli: hargaAsli, diskon });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("create-mayar-payment error:", message);
    return balas({ success: false, error: message }, 400);
  }
});
