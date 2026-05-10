import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DOMAIN = 'https://talentika.id'

const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly',  priority: '1.0' },
  { loc: '/articles',     changefreq: 'daily',   priority: '0.9' },
  { loc: '/assessment',   changefreq: 'monthly', priority: '0.9' },
  { loc: '/auth',         changefreq: 'monthly', priority: '0.8' },
  { loc: '/talentika-junior', changefreq: 'weekly', priority: '0.8' },
  { loc: '/for-schools',  changefreq: 'weekly',  priority: '0.8' },
  { loc: '/opportunities',changefreq: 'daily',   priority: '0.7' },
  { loc: '/community',    changefreq: 'daily',   priority: '0.7' },
  { loc: '/learning',     changefreq: 'weekly',  priority: '0.7' },
  { loc: '/subscription', changefreq: 'monthly', priority: '0.6' },
]

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  const now = new Date().toISOString().split('T')[0]

  // Fetch published articles for dynamic URLs
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, created_at, updated_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const urls: string[] = []

  // Static pages
  for (const page of STATIC_PAGES) {
    urls.push(`
  <url>
    <loc>${DOMAIN}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
  }

  // Dynamic article pages
  for (const article of articles || []) {
    const lastmod = (article.updated_at || article.created_at || now).split('T')[0]
    urls.push(`
  <url>
    <loc>${DOMAIN}/articles/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
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
