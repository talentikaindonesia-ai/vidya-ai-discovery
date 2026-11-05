import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DOMAIN = 'https://talentika.id'

// Hanya halaman yang bisa dibuka TANPA login. Halaman yang butuh login dialihkan
// ke /auth (noindex), jadi tidak boleh masuk sitemap.
const STATIC_PAGES = [
  { loc: '/',                 changefreq: 'weekly',  priority: '1.0' },
  { loc: '/articles',         changefreq: 'daily',   priority: '0.9' },
  { loc: '/for-schools',      changefreq: 'monthly', priority: '0.8' },
  { loc: '/roadmap',          changefreq: 'weekly',  priority: '0.7' },
  { loc: '/tentang-kami',     changefreq: 'monthly', priority: '0.6' },
  { loc: '/mitra',            changefreq: 'monthly', priority: '0.6' },
  { loc: '/talentika-junior', changefreq: 'monthly', priority: '0.5' },
  { loc: '/kebijakan-privasi', changefreq: 'yearly', priority: '0.3' },
  { loc: '/syarat-ketentuan', changefreq: 'yearly',  priority: '0.3' },
]

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const tgl = (v: string | null | undefined, cadangan: string) => (v || cadangan).split('T')[0]

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )
  const now = new Date().toISOString().split('T')[0]

  const [{ data: articles }, { data: roadmaps }, { data: bootcamps }] = await Promise.all([
    supabase.from('articles').select('slug, created_at, updated_at').eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('roadmaps').select('slug, dibuat_pada, diperbarui_pada').eq('status', 'terbit'),
    supabase.from('bootcamps').select('slug, created_at, updated_at').eq('is_published', true),
  ])

  const url = (loc: string, lastmod: string, changefreq: string, priority: string) => `
  <url>
    <loc>${esc(DOMAIN + loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`

  // Beranda & daftar artikel ikut berubah saat artikel baru terbit
  const artikelTerbaru = tgl(articles?.[0]?.updated_at ?? articles?.[0]?.created_at, now)
  const urls: string[] = STATIC_PAGES.map(p =>
    url(p.loc, p.loc === '/' || p.loc === '/articles' ? artikelTerbaru : now, p.changefreq, p.priority))

  for (const a of articles ?? []) {
    if (a.slug) urls.push(url(`/articles/${encodeURIComponent(a.slug)}`, tgl(a.updated_at ?? a.created_at, now), 'monthly', '0.8'))
  }
  for (const r of roadmaps ?? []) {
    if (r.slug) urls.push(url(`/roadmap/${encodeURIComponent(r.slug)}`, tgl(r.diperbarui_pada ?? r.dibuat_pada, now), 'monthly', '0.7'))
  }
  for (const b of bootcamps ?? []) {
    if (b.slug) urls.push(url(`/bootcamp/${encodeURIComponent(b.slug)}`, tgl(b.updated_at ?? b.created_at, now), 'weekly', '0.7'))
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
