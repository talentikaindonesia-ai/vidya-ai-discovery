/**
 * article-og — pre-rendered HTML for social-share crawlers.
 *
 * WhatsApp/Facebook/Twitter/Telegram bots don't execute JS, so the SPA's
 * client-side meta tags are invisible to them. Vercel rewrites bot requests
 * for /articles/:slug here (user-agent match in vercel.json); humans still
 * get the SPA. Returns full OG/Twitter meta + Article JSON-LD + readable body.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DOMAIN = "https://talentika.id";
const LOGO = `${DOMAIN}/logo.png`;
/** Gambar bagikan 1200×630 untuk artikel tanpa gambar sampul */
const OG_DEFAULT = `${DOMAIN}/og-talentika.jpg`;

const esc = (s: string) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Minimal markdown → HTML (headings, bold, links, paragraphs) — enough for crawlers
function mdToHtml(md: string): string {
  return esc(md)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .split(/\n{2,}/).map(b => b.match(/^<(h\d|li)/) ? b : `<p>${b.replace(/\n/g, "<br/>")}</p>`).join("\n");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? url.pathname.split("/").pop() ?? "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const { data: a } = await supabase
    .from("articles")
    .select("title, slug, content, excerpt, featured_image_url, category, tags, seo_title, seo_description, published_at, updated_at, created_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!a) {
    return new Response("Not found", { status: 404 });
  }

  const pageUrl = `${DOMAIN}/articles/${a.slug}`;
  const title = a.seo_title || `${a.title} | Talentika`;
  const desc = a.seo_description || a.excerpt || "";
  const img = a.featured_image_url || OG_DEFAULT;
  const published = a.published_at || a.created_at;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    image: img,
    author: { "@type": "Organization", name: "Tim Talentika", url: DOMAIN },
    publisher: { "@type": "Organization", name: "Talentika", logo: { "@type": "ImageObject", url: LOGO } },
    datePublished: published,
    dateModified: a.updated_at || published,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    inLanguage: "id-ID",
    keywords: (a.tags || []).join(", "),
    articleSection: a.category,
  };
  // "<" di dalam JSON bisa menutup tag <script> lebih awal
  const ld = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"/>
<link rel="canonical" href="${pageUrl}"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="${pageUrl}"/>
<meta property="og:site_name" content="Talentika"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(desc)}"/>
<meta property="og:image" content="${esc(img)}"/>${a.featured_image_url ? "" : `
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>`}
<meta property="og:locale" content="id_ID"/>
<meta property="article:published_time" content="${esc(published)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@talentikaid"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(desc)}"/>
<meta name="twitter:image" content="${esc(img)}"/>
<script type="application/ld+json">${ld}</script>
<script>location.replace(${JSON.stringify(pageUrl)});</script>
</head>
<body>
<article>
${mdToHtml(a.content || "")}
</article>
<p><a href="${pageUrl}">Baca di talentika.id →</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
