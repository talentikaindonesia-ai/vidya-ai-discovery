
const SUPABASE_URL     = process.env.SUPABASE_URL     ?? "https://doogbcrodipaeahgbjuj.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export default async function handler(_req: Request): Promise<Response> {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/send-expiry-warning`, {
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
