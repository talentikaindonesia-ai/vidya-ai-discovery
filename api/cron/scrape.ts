import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL     = process.env.SUPABASE_URL     ?? "https://doogbcrodipaeahgbjuj.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/web-scraper`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await r.json();
    return res.status(r.ok ? 200 : 500).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
