import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS feeds and JSON APIs — structured data only, no fragile HTML scraping
const SOURCES = {
  beasiswa: [
    { url: 'https://www.scholars4dev.com/feed/', type: 'rss' },
    { url: 'https://opportunitydesk.org/category/scholarships/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/scholarships/feed/', type: 'rss' },
    { url: 'https://worldscholarshipforum.com/feed/', type: 'rss' },
    { url: 'https://scholarshipscorner.website/feed/', type: 'rss' },
  ],
  magang: [
    { url: 'https://opportunitydesk.org/category/internships/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/internships/feed/', type: 'rss' },
  ],
  lowongan_kerja: [
    { url: 'https://opportunitydesk.org/category/fellowships/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/opportunities/feed/', type: 'rss' },
  ],
  kompetisi: [
    { url: 'https://devpost.com/hackathons.json?status[]=upcoming&per_page=20', type: 'json_devpost' },
    { url: 'https://opportunitydesk.org/category/competitions/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/competitions/feed/', type: 'rss' },
  ],
  konferensi: [
    { url: 'https://opportunitydesk.org/category/conferences/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/events/feed/', type: 'rss' },
    { url: 'https://opportunitydesk.org/category/workshops/feed/', type: 'rss' },
  ],
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Talentika/1.0; +https://talentika.id)',
  'Accept': 'application/rss+xml, application/xml, text/xml, application/json, */*',
}

// Extract text content from an XML tag
function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'))
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return plainMatch ? plainMatch[1].replace(/<[^>]+>/g, '').trim() : ''
}

// Extract image URL from RSS item: media:content, enclosure, or first <img> in content
function extractImage(block: string): string | null {
  // media:content url="..."
  const media = block.match(/<media:content[^>]+url=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i)
  if (media) return media[1]
  // media:thumbnail
  const thumb = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)
  if (thumb) return thumb[1]
  // enclosure url="..." type="image/..."
  const enc = block.match(/<enclosure[^>]+(?:type=["']image[^"']*["'][^>]+url|url=["']([^"']+)["'][^>]+type=["']image)/i)
  if (enc) return enc[1] || null
  // <img src="..." inside description
  const img = block.match(/<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i)
  if (img) return img[1]
  return null
}

// Extract a date string and convert to ISO — returns null if invalid/past
function parseDate(raw: string): string | null {
  if (!raw) return null
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  } catch {
    return null
  }
}

// Find a deadline-like date in the description text
function extractDeadlineFromText(text: string): string | null {
  // Patterns: "31 December 2025", "December 31, 2025", "2025-12-31"
  const patterns = [
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
    /\b(\d{4}-\d{2}-\d{2})\b/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const d = new Date(match[0])
      if (!isNaN(d.getTime()) && d > new Date()) {
        return d.toISOString()
      }
    }
  }
  return null
}

// Infer category tags from title + description
function inferTags(title: string, description: string, baseCategory: string): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const tags: string[] = [baseCategory.toLowerCase()]

  const keywords: Record<string, string> = {
    'indonesia': 'indonesia', 'internasional': 'internasional', 'international': 'internasional',
    'phd': 'phd', 'master': 'S2', 's2': 'S2', 'undergraduate': 'S1', 's1': 'S1',
    'stem': 'STEM', 'technology': 'teknologi', 'teknologi': 'teknologi',
    'business': 'bisnis', 'bisnis': 'bisnis', 'social': 'sosial',
    'art': 'seni', 'design': 'desain', 'engineering': 'teknik',
    'fully funded': 'beasiswa-penuh', 'full scholarship': 'beasiswa-penuh',
    'remote': 'remote', 'online': 'online',
    'hackathon': 'hackathon', 'data science': 'data-science',
  }

  for (const [keyword, tag] of Object.entries(keywords)) {
    if (text.includes(keyword) && !tags.includes(tag)) tags.push(tag)
  }

  return tags.slice(0, 8)
}

// Parse an RSS/Atom feed, return array of opportunity objects
function parseRSS(xml: string, sourceUrl: string, category: string): any[] {
  const hostname = new URL(sourceUrl).hostname
  const items: any[] = []

  // Split on <item> or <entry> tags
  const itemPattern = /<item[\s>]([\s\S]*?)<\/item>|<entry[\s>]([\s\S]*?)<\/entry>/gi
  let match: RegExpExecArray | null

  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1] || match[2]

    const title = extractTag(block, 'title')
    if (!title || title.length < 5) continue

    const link =
      extractTag(block, 'link') ||
      block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || ''

    const description =
      extractTag(block, 'description') ||
      extractTag(block, 'summary') ||
      extractTag(block, 'content:encoded') || ''

    const pubDate =
      extractTag(block, 'pubDate') ||
      extractTag(block, 'published') ||
      extractTag(block, 'updated') || ''

    const organizer =
      extractTag(block, 'dc:creator') ||
      extractTag(block, 'author') || hostname

    // Skip very short or meaningless titles
    if (title.length < 8) continue

    // Try to find a deadline in the description
    const deadline = extractDeadlineFromText(description) || extractDeadlineFromText(title)

    // Skip if deadline already passed
    if (deadline && new Date(deadline) < new Date()) continue

    const cleanDescription = description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)

    // Try to extract an image from the raw block
    const posterUrl = extractImage(block) || null

    items.push({
      title: title.slice(0, 200),
      description: cleanDescription || `Peluang ${category.toLowerCase()} terbaru dari ${hostname}.`,
      url: link.startsWith('http') ? link : `https://${hostname}${link}`,
      source_website: hostname,
      category: category.toLowerCase(),
      content_type: category.toLowerCase(),
      organizer: organizer.slice(0, 100),
      location: hostname.includes('.id') ? 'Indonesia' : 'Internasional',
      deadline,
      poster_url: posterUrl,
      tags: inferTags(title, cleanDescription, category),
      is_active: true,
      is_manual: false,
    })
  }

  return items
}

// Parse Devpost hackathons JSON API
function parseDevpostJSON(data: any, category: string): any[] {
  const hackathons = data?.hackathons || []
  return hackathons
    .filter((h: any) => h.title && h.url)
    .map((h: any) => {
      const deadline = parseDate(h.submission_period_dates?.split(' - ')[1] || h.deadline || '')
      if (deadline && new Date(deadline) < new Date()) return null

      return {
        title: h.title.slice(0, 200),
        description: (h.tagline || h.title).slice(0, 500),
        url: `https://devpost.com${h.url}`,
        source_website: 'devpost.com',
        category: category.toLowerCase(),
        content_type: 'hackathon',
        organizer: h.organization_name || 'Devpost',
        location: h.displayed_location?.location || 'Online',
        deadline,
        prize_info: h.prize_amount || null,
        poster_url: h.thumbnail_url || null,
        tags: ['hackathon', 'teknologi', 'kompetisi', ...(h.themes?.map((t: any) => t.name?.toLowerCase()) || [])].slice(0, 8),
        is_active: true,
        is_manual: false,
      }
    })
    .filter(Boolean)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const body = await req.json().catch(() => ({}))
    const category: string = (body.category || 'ALL').toUpperCase()
    const now = new Date().toISOString()

    // Step 1: Auto-deactivate any items past their deadline
    await supabaseClient
      .from('scraped_content')
      .update({ is_active: false })
      .lt('deadline', now)
      .eq('is_active', true)
      .eq('is_manual', false)

    // Step 2: Remove non-manual items older than 90 days with no deadline
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    await supabaseClient
      .from('scraped_content')
      .delete()
      .lt('created_at', cutoff)
      .is('deadline', null)
      .eq('is_manual', false)

    // Step 3: Determine which categories to scrape
    const ALL_CATEGORIES = ['beasiswa', 'magang', 'lowongan_kerja', 'kompetisi', 'konferensi']
    const categoriesToScrape =
      category === 'ALL'
        ? ALL_CATEGORIES
        : [category.toLowerCase()]

    const allResults: any[] = []
    const errors: string[] = []

    for (const cat of categoriesToScrape) {
      const sources = SOURCES[cat as keyof typeof SOURCES] || []

      for (const source of sources) {
        try {
          console.log(`Fetching [${cat}]: ${source.url}`)
          const response = await fetch(source.url, {
            headers: FETCH_HEADERS,
            signal: AbortSignal.timeout(10000),
          })

          if (!response.ok) {
            errors.push(`${source.url}: HTTP ${response.status}`)
            continue
          }

          let items: any[] = []

          if (source.type === 'json_devpost') {
            const json = await response.json()
            items = parseDevpostJSON(json, cat)
          } else {
            const xml = await response.text()
            items = parseRSS(xml, source.url, cat)
          }

          allResults.push(...items)
          console.log(`  → ${items.length} items from ${source.url}`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`${source.url}: ${msg}`)
          console.error(`Error fetching ${source.url}:`, msg)
        }
      }
    }

    // Step 4: Deduplicate by URL — only insert URLs not already in DB
    let saved = 0
    if (allResults.length > 0) {
      const urls = allResults.map(r => r.url)
      const { data: existing } = await supabaseClient
        .from('scraped_content')
        .select('url')
        .in('url', urls)

      const existingUrls = new Set((existing || []).map((r: any) => r.url))
      const newItems = allResults.filter(r => !existingUrls.has(r.url))

      if (newItems.length > 0) {
        const { error } = await supabaseClient
          .from('scraped_content')
          .insert(newItems)

        if (error) throw error
        saved = newItems.length
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scraped: allResults.length,
        saved,
        skipped: allResults.length - saved,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('Web scraping error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
