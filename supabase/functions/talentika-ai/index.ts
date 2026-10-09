import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * talentika-ai — gateway AI untuk aplikasi mobile (PRD §9, AI-01..05).
 *
 *  • Kunci API hanya di server; model dibaca dari app_config.ai_model
 *    sehingga bisa diganti tanpa rilis aplikasi.
 *  • Konteks = data siswa ini saja (profil, Talent DNA, target, goals,
 *    tracker) + katalog peluang. Fakta peluang (deadline, syarat) HANYA
 *    dari katalog — model diminta tidak mengarang.
 *  • Batas harian untuk akun gratis (app_config.ai_free_daily_limit).
 *  • Prompt sadar usia; topik distress diarahkan ke Guru BK / layanan bantuan.
 *  • Semua keluaran berlabel "AI-generated" di UI dan bisa diedit.
 *
 * mode:
 *   chat        — percakapan Copilot (streaming SSE)
 *   insight     — satu "next best step" untuk Home
 *   mentor_prep — 5 pertanyaan untuk sesi mentor
 *   coach       — AI Project Coach (topic: problem|roadmap|research|portfolio)
 *   reflect     — umpan balik refleksi belajar
 *   evidence    — ubah aktivitas mentah jadi bukti profesional
 *   compare     — jelaskan beda dua karier
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AXIS_ID: Record<string, string> = {
  analytical: "Analitis", creative: "Kreatif", leadership: "Kepemimpinan",
  technology: "Teknologi", communication: "Komunikasi",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "ai_unavailable", message: "Talentika AI belum diaktifkan oleh admin." }, 503);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await admin.auth.getUser(jwt);
  const user = auth?.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const mode: string = body.mode ?? "chat";
  const input: string = String(body.input ?? "").slice(0, 4000);
  const lang: "id" | "en" = body.lang === "en" ? "en" : "id";

  // ── Konteks siswa (hanya milik pengguna ini) ───────────────────────────
  const [{ data: prof }, { data: dna }, { data: goals }, { data: tracked }, { data: cfg }, { data: prem }] = await Promise.all([
    admin.from("profiles").select("full_name, usia, jenjang, kelas, school_name, career_target, tujuan, bio").eq("user_id", user.id).maybeSingle(),
    admin.rpc("dna_axes_for", { p_uid: user.id }),
    admin.from("user_goals").select("horizon, title").eq("user_id", user.id).limit(10),
    admin.from("saved_opportunities").select("opportunity_title, status, deadline").eq("user_id", user.id).not("status", "in", "(completed,rejected)").limit(10),
    admin.from("app_config").select("key, value").in("key", ["ai_model", "ai_free_daily_limit"]),
    admin.rpc("is_premium", { uid: user.id }),
  ]);
  const conf = Object.fromEntries((cfg ?? []).map((r: any) => [r.key, r.value]));
  const model: string = typeof conf.ai_model === "string" ? conf.ai_model : "claude-opus-5-5";
  const isPro = prem === true;

  // ── AI-05: batas harian untuk akun gratis ──────────────────────────────
  if (mode === "chat") {
    const limit = isPro ? 200 : Number(conf.ai_free_daily_limit ?? 20);
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const { count } = await admin.from("ai_messages").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("role", "user").gte("created_at", since.toISOString());
    if ((count ?? 0) >= limit) {
      return json({ error: "limit", message: isPro
        ? "Batas harian tercapai. Coba lagi besok."
        : `Kamu sudah memakai ${limit} pesan hari ini. Upgrade ke Talentika Pro untuk chat tanpa batas.` }, 429);
    }
  }

  // Katalog peluang aktif — satu-satunya sumber fakta peluang
  const { data: opps } = await admin.from("scraped_content")
    .select("title, organizer, opportunity_type, deadline, location")
    .eq("is_active", true).or(`deadline.is.null,deadline.gt.${new Date().toISOString()}`)
    .order("deadline", { ascending: true, nullsFirst: false }).limit(12);

  const usia = prof?.usia ?? null;
  const minor = usia === null || usia < 18;
  const axesTxt = dna
    ? Object.entries(dna as Record<string, number>).map(([k, v]) => `${AXIS_ID[k] ?? k} ${v}`).join(", ")
    : "belum ada (siswa belum menyelesaikan modul Talent DNA)";

  const profil = [
    `Nama: ${prof?.full_name ?? "-"}`,
    `Usia: ${usia ?? "tidak diketahui"}; jenjang: ${prof?.jenjang ?? "-"}; kelas: ${prof?.kelas ?? "-"}; sekolah: ${prof?.school_name ?? "-"}`,
    `Talent DNA (0–100): ${axesTxt}`,
    `Target karier: ${prof?.career_target ?? "belum dipilih"}; arah: ${prof?.tujuan ?? "-"}`,
    `Goals: ${(goals ?? []).map((g: any) => `[${g.horizon}] ${g.title}`).join("; ") || "-"}`,
    `Peluang yang sedang dilacak: ${(tracked ?? []).map((t: any) => `${t.opportunity_title} (${t.status}${t.deadline ? ", deadline " + t.deadline.slice(0, 10) : ""})`).join("; ") || "-"}`,
  ].join("\n");
  const katalog = (opps ?? []).map((o: any) =>
    `- ${o.title} · ${o.organizer ?? "-"} · ${o.opportunity_type ?? "-"} · deadline ${o.deadline ? o.deadline.slice(0, 10) : "tidak tercantum"} · ${o.location ?? "-"}`).join("\n") || "(katalog kosong)";

  const system = `Kamu adalah Talentika AI, career copilot untuk pelajar Indonesia di aplikasi Talentika.
Gaya: positif, ramah, jelas, solutif. Pakai ${lang === "en" ? "bahasa Inggris" : "bahasa Indonesia santai yang sopan (aku/kamu)"}. Ringkas: maksimal ~150 kata kecuali diminta lebih.
Prinsip:
- Semua saran berupa eksplorasi dan kecocokan, bukan vonis. Jangan menyebut satu karier sebagai "yang benar".
- Akhiri dengan satu langkah berikutnya yang konkret bila relevan.
- Fakta peluang (nama, deadline, syarat) HANYA boleh diambil dari KATALOG di bawah. Jika tidak ada di katalog, katakan kamu tidak punya datanya dan sarankan cek situs resmi. Jangan mengarang beasiswa, lomba, tanggal, atau nominal.
- Jangan meminta atau menyimpan data pribadi sensitif (alamat, nomor KTP, kata sandi).
${minor ? "- Pengguna kemungkinan di bawah 18 tahun: hindari konten dewasa, jangan sarankan bertemu orang asing di luar platform, dan jangan bahas topik berbahaya.\n" : ""}- Jika pengguna menunjukkan tanda distres, ingin menyakiti diri, atau mengalami kekerasan: tanggapi dengan empati, sarankan bicara dengan orang dewasa tepercaya atau Guru BK, dan sebutkan layanan bantuan SEJIWA 119 ext 8. Jangan lanjutkan topik karier dulu.
- Untuk rencana terstruktur (rencana belajar 30 hari, rencana kuliah ke luar negeri, dsb.), sertakan SATU blok di akhir jawaban persis dengan format:
\`\`\`card
{"title":"<judul singkat>","rows":[["<label>","<isi>"], ...]}
\`\`\`
maksimal 6 baris.

PROFIL SISWA (konteks privat, jangan dibacakan ulang mentah-mentah):
${profil}

KATALOG PELUANG AKTIF:
${katalog}`;

  const client = new Anthropic({ apiKey });
  const base = {
    model,
    max_tokens: 4000,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
  } as any;

  // ── Mode satu-kali (non-stream) ─────────────────────────────────────────
  if (mode !== "chat") {
    const prompts: Record<string, string> = {
      insight: `Langkah berikutnya yang dipilih sistem untuk siswa ini: "${input}". Tulis ulang jadi SATU 'next best step' yang personal dan memotivasi dalam 1–2 kalimat (maks 28 kata), tetap pada langkah yang sama. Tanpa salam, tanpa blok card.`,
      mentor_prep: `Siswa akan bertemu mentor: ${input}. Tulis tepat 5 pertanyaan yang bagus untuk ditanyakan, satu per baris, tanpa nomor dan tanpa pengantar. Tanpa blok card.`,
      coach: `Kamu adalah AI Project Coach. Proyek siswa:\n${input}\nTopik bantuan: ${body.topic}. ` +
        ({ problem: "Bantu persempit rumusan masalah jadi spesifik dan terukur.", roadmap: "Buat roadmap mingguan 4 minggu.",
           research: "Tulis 3 pertanyaan riset yang tajam.", portfolio: "Tulis deskripsi portofolio 1–2 kalimat yang profesional dan terukur (jangan mengarang angka yang tidak ada di data proyek)." } as any)[body.topic ?? "problem"] +
        " Maks 90 kata. Tanpa blok card.",
      reflect: `Refleksi belajar siswa untuk materi "${body.context ?? "-"}":\n"${input}"\nBeri umpan balik positif 2–3 kalimat + satu langkah berikutnya. Tanpa blok card.`,
      evidence: `Ubah aktivitas mentah berikut menjadi bukti profesional untuk portofolio.\nAktivitas: "${input}"\nBalas HANYA JSON: {"title":"<judul ≤8 kata, bahasa Inggris>","body":"<1–2 kalimat, bahasa Inggris, tanpa mengarang angka>"}`,
      compare: `Jelaskan beda dua karier ini untuk siswa ini, kaitkan dengan Talent DNA-nya, 3–4 kalimat: ${input}. Tanpa blok card.`,
    };
    const p = prompts[mode];
    if (!p) return json({ error: "bad_mode" }, 400);
    try {
      const msg: any = await client.beta.messages.create({ ...base, messages: [{ role: "user", content: p }] });
      if (msg.stop_reason === "refusal") return json({ text: "Maaf, aku tidak bisa membantu permintaan ini." });
      const text = (msg.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
      return json({ text, model: msg.model });
    } catch (e) {
      console.error("talentika-ai one-shot error", e);
      return json({ error: "ai_error", message: "Talentika AI sedang sibuk. Coba lagi sebentar." }, 502);
    }
  }

  // ── Chat (streaming SSE) ────────────────────────────────────────────────
  if (!input.trim()) return json({ error: "empty" }, 400);
  const { data: hist } = await admin.from("ai_messages").select("role, content")
    .eq("user_id", user.id).eq("surface", "copilot").order("created_at", { ascending: false }).limit(16);
  const history = (hist ?? []).reverse().map((m: any) => ({ role: m.role, content: m.content }));
  // pesan pertama harus "user"
  while (history.length && history[0].role !== "user") history.shift();

  await admin.from("ai_messages").insert({ user_id: user.id, surface: "copilot", role: "user", content: input });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (ev: string, data: unknown) => ctrl.enqueue(enc.encode(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`));
      let full = "";
      try {
        const s: any = client.beta.messages.stream({ ...base, messages: [...history, { role: "user", content: input }] });
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
            full += ev.delta.text;
            send("delta", { t: ev.delta.text });
          }
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal") {
          full = "Maaf, aku tidak bisa membantu permintaan ini. Coba tanya soal karier, belajar, atau peluang ya.";
          send("replace", { text: full });
        }
      } catch (e) {
        console.error("talentika-ai stream error", e);
        send("error", { message: "Talentika AI sedang sibuk. Coba lagi sebentar." });
        ctrl.close();
        return;
      }
      // Ekstrak kartu terstruktur (AI-02)
      let card: unknown = null;
      const m = full.match(/```card\s*([\s\S]*?)```/);
      if (m) {
        try {
          const c = JSON.parse(m[1]);
          if (c && typeof c.title === "string" && Array.isArray(c.rows)) card = { title: c.title, rows: c.rows.slice(0, 6) };
        } catch { /* abaikan kartu rusak */ }
      }
      const text = full.replace(/```card[\s\S]*?```/g, "").trim();
      await admin.from("ai_messages").insert({ user_id: user.id, surface: "copilot", role: "assistant", content: text || "(kartu)", card });
      send("done", { text, card });
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
});
