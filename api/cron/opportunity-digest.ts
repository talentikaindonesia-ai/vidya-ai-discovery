
const SUPABASE_URL     = process.env.SUPABASE_URL     ?? "https://doogbcrodipaeahgbjuj.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Signature Web standard (GET) — dulu `export default handler(req: Request)` di runtime Node
// menggantung tanpa respons (teramati 2026-10-10); GET(Request) dipakai Vercel Cron.
export async function GET(req: Request): Promise<Response> {
  // Hanya Vercel Cron (mengirim Authorization: Bearer $CRON_SECRET) — dulu siapa pun bisa memicu email massal
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/send-opportunity-digest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await r.json();
    return Response.json(data, { status: r.ok ? 200 : 500 });
  } catch (e: any) {
    return Response.json({ error: e.message });
  }
}
