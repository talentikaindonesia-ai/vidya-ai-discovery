import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * hapus-akun — AUTH-06 (wajib App Store & Google Play).
 * Pengguna menghapus akunnya sendiri dari dalam aplikasi. Permintaan dicatat
 * dulu (bukti untuk audit UU PDP), lalu auth user dihapus — sebagian besar
 * tabel ikut terhapus lewat ON DELETE CASCADE. Bila penghapusan gagal karena
 * relasi lain, permintaan tetap tercatat dan diselesaikan admin ≤ 30 hari.
 */
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data } = await admin.auth.getUser(jwt);
  const user = data?.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { /* kosong */ }
  if (body.confirm !== "HAPUS") return json({ error: "Ketik HAPUS untuk konfirmasi." }, 400);

  const { data: reqRow } = await admin.from("account_deletion_requests")
    .insert({ user_id: user.id, email: user.email }).select("id").single();

  // Lepaskan relasi tanpa CASCADE
  await admin.from("mentors").update({ user_id: null, is_available: false }).eq("user_id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    await admin.from("account_deletion_requests").update({ error: error.message }).eq("id", reqRow?.id);
    console.error("hapus-akun gagal", user.id, error.message);
    return json({ ok: true, pending: true, message: "Permintaan tercatat. Data pribadimu akan dihapus paling lambat 30 hari dan kami kirim konfirmasi via email." });
  }
  await admin.from("account_deletion_requests").update({ completed_at: new Date().toISOString() }).eq("id", reqRow?.id);
  return json({ ok: true, pending: false });
});
