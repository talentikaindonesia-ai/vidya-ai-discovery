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
 *
 * 2026-10-30 (PRD Monetization):
 *  • setiap checkout membuat order + order_items: harga, nama, dan hak akses
 *    dibekukan saat itu, jadi perubahan harga tidak mengubah order lama;
 *  • idempotencyKey: klik ganda / muat ulang mengembalikan link yang sama;
 *  • { kind: "product", sku } untuk Starter Kit dan kelas premium;
 *  • paket sekolah tidak bisa dibeli di sini — lewat kontrak.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  kind?: "subscription" | "bootcamp" | "playbook" | "product";
  sku?: string;
  idempotencyKey?: string;
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
  transactionType: "subscription" | "course" | "kit";
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

class GalatCheckout extends Error {
  constructor(public code: string, pesan: string, public status = 400) { super(pesan); }
}

interface ItemOrder {
  item_kind: "subscription" | "one_time" | "class" | "bootcamp" | "playbook";
  product_id?: string | null;
  product_price_id?: string | null;
  item_ref?: string | null;
  sku: string;
  name: string;
  billing_interval?: "month" | "year" | null;
  feature_codes: string[];
  unit_price: number;
}

interface CheckoutArgs extends LinkArgs {
  idempotencyKey?: string;
  subtotal: number;
  diskon?: number;
  voucherId?: string | null;
  item: ItemOrder;
}

const POLA_KUNCI = /^[\w:-]{8,120}$/;
// Order tanpa link yang lebih muda dari ini dianggap masih diproses permintaan lain.
const BATAS_PROSES_MS = 60_000;

/** Order + link pembayaran. Permintaan berulang dengan kunci sama mendapat link yang sama. */
async function checkout(a: CheckoutArgs) {
  const { supabase, user } = a;
  const kunci = a.idempotencyKey && POLA_KUNCI.test(a.idempotencyKey) ? a.idempotencyKey : crypto.randomUUID();

  const { data: lama } = await supabase
    .from("orders")
    .select("id, status, total, checkout_url, transaction_id, provider_payment_id, created_at, order_number, order_items(sku)")
    .eq("user_id", user.id)
    .eq("idempotency_key", kunci)
    .maybeSingle();

  if (lama) {
    const samaIsi = lama.total === a.harga && (lama.order_items as { sku: string }[])?.[0]?.sku === a.item.sku;
    if (lama.status === "pending" && samaIsi && lama.checkout_url) {
      return {
        invoice_url: lama.checkout_url,
        invoice_id: lama.provider_payment_id,
        transaction_id: lama.transaction_id,
        order_id: lama.id,
        order_number: lama.order_number,
        dipakai_ulang: true,
      };
    }
    if (lama.status === "pending" && samaIsi && Date.now() - new Date(lama.created_at).getTime() < BATAS_PROSES_MS) {
      throw new GalatCheckout("CHECKOUT_DIPROSES", "Pembayaran sedang disiapkan. Coba lagi sebentar.", 409);
    }
    // Sesi lama sudah selesai atau isinya berbeda: kuncinya dilepas untuk checkout baru.
    await supabase.from("orders").update({ idempotency_key: `${kunci}:lama:${lama.id}` }).eq("id", lama.id);
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      subtotal: a.subtotal,
      discount: a.diskon ?? 0,
      total: a.harga,
      voucher_id: a.voucherId ?? null,
      idempotency_key: kunci,
    })
    .select("id, order_number")
    .single();
  if (orderErr?.code === "23505") {
    throw new GalatCheckout("CHECKOUT_DIPROSES", "Pembayaran sedang disiapkan. Coba lagi sebentar.", 409);
  }
  if (orderErr || !order) throw new Error("Gagal membuat order: " + (orderErr?.message ?? "unknown"));

  const { error: itemErr } = await supabase.from("order_items").insert({ ...a.item, order_id: order.id });
  if (itemErr) {
    await supabase.from("orders").update({ status: "failed", hold_reason: itemErr.message }).eq("id", order.id);
    throw new Error("Gagal membuat rincian order: " + itemErr.message);
  }

  try {
    const link = await buatLinkMayar({ ...a, notes: { ...a.notes, orderId: order.id } });
    const { error: simpanErr } = await supabase.from("orders").update({
      transaction_id: link.transaction_id,
      provider_payment_id: link.invoice_id,
      checkout_url: link.invoice_url,
    }).eq("id", order.id);
    if (simpanErr) console.error("Link dibuat, order gagal diperbarui:", simpanErr.message);
    return { ...link, order_id: order.id, order_number: order.order_number };
  } catch (e) {
    await supabase.from("orders").update({
      status: "failed",
      hold_reason: e instanceof Error ? e.message : String(e),
    }).eq("id", order.id);
    throw e;
  }
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

      const link = await checkout({
        supabase, user, phone: body.phone,
        idempotencyKey: body.idempotencyKey,
        subtotal: harga,
        item: {
          item_kind: "bootcamp",
          item_ref: bc.id,
          sku: `BOOTCAMP_${bc.id}`,
          name: bc.title,
          feature_codes: [`bootcamp:${bc.id}`],
          unit_price: harga,
        },
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

      const link = await checkout({
        supabase, user, phone: body.phone,
        idempotencyKey: body.idempotencyKey,
        subtotal: harga,
        item: {
          item_kind: "playbook",
          item_ref: pb.id,
          sku: `PLAYBOOK_${pb.id}`,
          name: pb.title,
          feature_codes: [`playbook:${pb.id}`],
          unit_price: harga,
        },
        transactionType: "course",
        harga,
        notes: { kind: "playbook", playbookId: pb.id, harga_asli: harga, diskon: 0, harga_final: harga },
        nama: pb.title,
        deskripsi: ref => `${pb.title} | Ref: ${ref}`,
        redirectPath: tx => `/app/playbooks?payment=success&ref=${tx}`,
      });
      return balas({ success: true, ...link, amount: harga, harga_asli: harga, diskon: 0 });
    }

    // ── Produk katalog: Starter Kit & kelas premium ──────────────────────
    if (body.kind === "product") {
      const { data: produk } = await supabase
        .from("products")
        .select("id, sku, name, product_type, feature_codes, content_id, is_active, product_prices(id, amount, valid_to)")
        .eq("sku", body.sku ?? "")
        .maybeSingle();
      if (!produk?.is_active || produk.product_type === "subscription") {
        throw new GalatCheckout("PRODUK_TIDAK_TERSEDIA", "Produk ini belum tersedia.", 404);
      }
      const hargaAktif = (produk.product_prices as { id: string; amount: number; valid_to: string | null }[])
        .find(h => h.valid_to === null);
      if (!hargaAktif || hargaAktif.amount < NOMINAL_MINIMUM) {
        throw new GalatCheckout("PRODUK_TIDAK_TERSEDIA", "Harga produk ini belum diatur.", 404);
      }

      const sekarang = new Date().toISOString();
      const { data: milik } = await supabase
        .from("entitlements")
        .select("feature_code")
        .eq("user_id", userId)
        .in("feature_code", produk.feature_codes)
        .is("revoked_at", null)
        .or(`expires_at.is.null,expires_at.gt.${sekarang}`);
      const dimiliki = new Set((milik ?? []).map(m => m.feature_code));
      if (produk.feature_codes.every((k: string) => dimiliki.has(k))) {
        throw new GalatCheckout("SUDAH_DIMILIKI", "Kamu sudah memiliki produk ini.", 409);
      }

      const kelas = produk.product_type === "class";
      const link = await checkout({
        supabase, user, phone: body.phone,
        idempotencyKey: body.idempotencyKey,
        subtotal: hargaAktif.amount,
        item: {
          item_kind: kelas ? "class" : "one_time",
          product_id: produk.id,
          product_price_id: hargaAktif.id,
          item_ref: produk.content_id,
          sku: produk.sku,
          name: produk.name,
          feature_codes: produk.feature_codes,
          unit_price: hargaAktif.amount,
        },
        transactionType: kelas ? "course" : "kit",
        harga: hargaAktif.amount,
        notes: { kind: "product", sku: produk.sku, harga_asli: hargaAktif.amount, diskon: 0, harga_final: hargaAktif.amount },
        nama: produk.name,
        deskripsi: ref => `${produk.name} | Ref: ${ref}`,
        redirectPath: tx => body.returnTo === "app"
          ? `/app/purchases?payment=success&ref=${tx}`
          : `/purchases?payment=success&ref=${tx}`,
      });
      return balas({ success: true, ...link, amount: hargaAktif.amount, harga_asli: hargaAktif.amount, diskon: 0 });
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
    if (plan.type === "school") {
      throw new GalatCheckout("PAKET_KONTRAK", "Paket sekolah diatur lewat kontrak. Hubungi tim Talentika.");
    }

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

    const intervalTagih = billingCycle === "yearly" ? "year" : "month";
    const { data: produkPaket } = await supabase
      .from("products")
      .select("id, sku, name, feature_codes, product_prices(id, valid_to)")
      .eq("package_id", plan.id)
      .eq("billing_interval", intervalTagih)
      .maybeSingle();
    const hargaProduk = (produkPaket?.product_prices as { id: string; valid_to: string | null }[] | undefined)
      ?.find(h => h.valid_to === null);

    const link = await checkout({
      supabase, user, phone: body.phone,
      idempotencyKey: body.idempotencyKey,
      subtotal: hargaAsli,
      diskon,
      voucherId: voucherDipakai,
      item: {
        item_kind: "subscription",
        product_id: produkPaket?.id ?? null,
        product_price_id: hargaProduk?.id ?? null,
        item_ref: plan.id,
        sku: produkPaket?.sku ?? `PACKAGE_${plan.id}_${intervalTagih}`,
        name: produkPaket?.name ?? `${plan.name} ${billingCycle === "monthly" ? "Bulanan" : "Tahunan"}`,
        billing_interval: intervalTagih,
        feature_codes: produkPaket?.feature_codes ?? ["plus_access"],
        unit_price: hargaAsli,
      },
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
    if (error instanceof GalatCheckout) {
      return balas({ success: false, error: message, code: error.code }, error.status);
    }
    return balas({ success: false, error: message, code: "CHECKOUT_GAGAL" }, 400);
  }
});
