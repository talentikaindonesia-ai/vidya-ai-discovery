import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DOMAIN = 'https://talentika.id'

const STATIC_PAGES = [
  { loc: '/',                 changefreq: 'weekly',  priority: '1.0', lastmod: '2026-06-01' },
  { loc: '/articles',         changefreq: 'daily',   priority: '0.9' },
  { loc: '/assessment',       changefreq: 'monthly', priority: '0.9', lastmod: '2026-05-01' },
  { loc: '/opportunities',    changefreq: 'daily',   priority: '0.8' },
  { loc: '/for-schools',      changefreq: 'weekly',  priority: '0.8', lastmod: '2026-05-01' },
  { loc: '/talentika-junior', changefreq: 'weekly',  priority: '0.8', lastmod: '2026-05-01' },
  { loc: '/tentang-kami',     changefreq: 'monthly', priority: '0.7', lastmod: '2026-04-01' },
  { loc: '/subscription',     changefreq: 'monthly', priority: '0.7' },
  { loc: '/community',        changefreq: 'daily',   priority: '0.6' },
  { loc: '/learning',         changefreq: 'weekly',  priority: '0.6' },
  { loc: '/mitra',            changefreq: 'monthly', priority: '0.5', lastmod: '2026-04-01' },
]

function xmlEscape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  const today = new Date().toISOString().split('T')[0]

  // Fetch published articles with image data
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title, excerpt, featured_image_url, category, created_at, updated_at, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const urls: string[] = []

  // ── Static pages ──────────────────────────────────────────────────────────
  for (const page of STATIC_PAGES) {
    const lastmod = page.lastmod ?? today
    urls.push(`  <url>
    <loc>${DOMAIN}${page.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
  }

  // ── Dynamic article pages ─────────────────────────────────────────────────
  for (const article of articles || []) {
    const lastmod = ((article.updated_at || article.published_at || article.created_at) as string).split('T')[0]
    const imageBlock = article.featured_image_url
      ? `\n    <image:image>
      <image:loc>${xmlEscape(article.featured_image_url)}</image:loc>
      <image:title>${xmlEscape(article.title)}</image:title>
      <image:caption>${xmlEscape((article.excerpt || '').slice(0, 200))}</image:caption>
    </image:image>`
      : ''

    urls.push(`  <url>
    <loc>${DOMAIN}/articles/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>${imageBlock}
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
