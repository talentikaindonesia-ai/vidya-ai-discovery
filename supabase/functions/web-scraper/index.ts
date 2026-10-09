// ⚠ TIDAK LAGI DI-DEPLOY (sejak 2026-09-07).
//
// Yang berjalan di produksi sekarang adalah versi stub yang mengembalikan
// { disabled: true } tanpa mengambil apa pun. Alasannya: SEMUA feed di bawah
// adalah situs internasional — hasilnya 468 peluang aktif dengan 443 berlokasi
// "Internasional" dan hanya 6 Indonesia, metadata tipis, dan satu feed pernah
// dibajak jadi spam judi. Peluang sekarang dikurasi manual lewat CMS Admin.
//
// Cron 'scrape-fast-categories' + 'scrape-daily-all' sudah di-unschedule.
// File ini disimpan sebagai rujukan kalau nanti ada sumber Indonesia terverifikasi.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS feeds and JSON APIs — structured data only, no fragile HTML scraping
const SOURCES = {
  beasiswa: [
    // ── International ──────────────────────────────────────────
    { url: 'https://www.scholars4dev.com/feed/', type: 'rss' },
    { url: 'https://opportunitydesk.org/category/scholarships/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/scholarships/feed/', type: 'rss' },
    // DIHAPUS 2026-07-18: worldscholarshipforum.com ternyata dibajak — 72 dari
    // 72 itemnya adalah spam kasino/judi dan konten telanjang AI (DeepNude,
    // Undresser), semuanya masuk sebagai "beasiswa". Nol peluang sah.
    { url: 'https://scholarshipscorner.website/feed/', type: 'rss' },
    { url: 'https://scholarships360.org/feed/', type: 'rss' },
    { url: 'https://www.afterschoolafrica.com/category/scholarships/feed/', type: 'rss' },
    // ── Indonesia-relevant (English-language coverage) ─────────
    { url: 'https://www.chevening.org/feed/', type: 'rss' },
    { url: 'https://www.daad.de/en/rss/scholarships/', type: 'rss' },
    { url: 'https://opportunitydesk.org/tag/indonesia/feed/', type: 'rss' },
    { url: 'https://youthop.com/tag/indonesia/feed/', type: 'rss' },
  ],
  magang: [
    { url: 'https://opportunitydesk.org/category/internships/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/internships/feed/', type: 'rss' },
    { url: 'https://www.afterschoolafrica.com/category/internships/feed/', type: 'rss' },
    { url: 'https://internships.com/feed/', type: 'rss' },
    { url: 'https://www.opportunitiescircle.com/category/internships/feed/', type: 'rss' }, // probed: 10 items, global
  ],
  lowongan_kerja: [
    { url: 'https://opportunitydesk.org/category/fellowships/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/opportunities/feed/', type: 'rss' },
    // NOTE: un.org/en/rss.xml removed — it is a general NEWS feed (photo cards
    // like "#UNGA78 - Wrap Day 4"), not vacancies. careers.un.org is the jobs one.
    { url: 'https://careers.un.org/lc/en/rss/jobs', type: 'rss' },
  ],
  kompetisi: [
    { url: 'https://devpost.com/hackathons.json?status[]=upcoming&per_page=20', type: 'json_devpost' },
    { url: 'https://opportunitydesk.org/category/competitions/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/competitions/feed/', type: 'rss' },
    { url: 'https://www.topcoder.com/blog/feed/', type: 'rss' },
    { url: 'https://challenges.openideo.com/feed.rss', type: 'rss' },
    { url: 'https://www.opportunitiescircle.com/category/competitions/feed/', type: 'rss' }, // probed: 5 items, global
  ],
  konferensi: [
    { url: 'https://opportunitydesk.org/category/conferences/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/events/feed/', type: 'rss' },
    { url: 'https://opportunitydesk.org/category/workshops/feed/', type: 'rss' },
    // NOTE: ted.com/feeds/talks.rss removed — TED talks are VIDEOS, not
    // opportunities students can apply to. It was polluting 11% of the board.
  ],
  volunteer: [
    { url: 'https://opportunitydesk.org/category/volunteer/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/volunteer/feed/', type: 'rss' },
    { url: 'https://www.goabroad.com/rss/volunteer', type: 'rss' },
  ],
  program: [
    { url: 'https://opportunitydesk.org/category/fellowships/feed/', type: 'rss' },
    { url: 'https://youthop.com/category/training/feed/', type: 'rss' },
    { url: 'https://opportunitydesk.org/category/exchange-programs/feed/', type: 'rss' },
    { url: 'https://www.opportunitiescircle.com/category/fellowships/feed/', type: 'rss' }, // probed: 10 items, global
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

// Month name → 0-based index. Covers English (full + 3-letter abbrev) and
// Indonesian (full + common abbrev), since many feeds mix languages.
const MONTHS: Record<string, number> = {
  jan: 0, january: 0, januari: 0,
  feb: 1, february: 1, februari: 1, pebruari: 1,
  mar: 2, march: 2, maret: 2,
  apr: 3, april: 3,
  may: 4, mei: 4,
  jun: 5, june: 5, juni: 5,
  jul: 6, july: 6, juli: 6,
  aug: 7, august: 7, agu: 7, agustus: 7, agt: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, okt: 9, oktober: 9,
  nov: 10, november: 10, nopember: 10,
  dec: 11, december: 11, des: 11, desember: 11,
}
const MONTH_ALT = Object.keys(MONTHS).join('|')

// Words that signal a real submission/application deadline (EN + ID). Dates
// appearing near these are strongly preferred over publish/event dates.
const DEADLINE_CUES = /(deadline|dead\s*line|apply\s*(?:by|before)?|application[s]?\s*(?:close|deadline|due)|closing\s*date|closes?\s*on|due\s*(?:date|on|by)?|last\s*date|submit\s*by|register\s*by|batas\s*(?:akhir|waktu|pendaftaran)?|paling\s*lambat|ditutup|penutupan|hingga|sampai\s*(?:dengan|tgl)?|s\.?d\.?)/gi

function mkDate(y: number, m: number, d: number): Date | null {
  if (m < 0 || m > 11 || d < 1 || d > 31) return null
  // Year sanity: feeds sometimes carry 2-digit or garbage years
  if (y < 100) y += 2000
  if (y < 2000 || y > 2100) return null
  const dt = new Date(Date.UTC(y, m, d, 23, 59, 0)) // end-of-day: deadline valid all day
  return isNaN(dt.getTime()) ? null : dt
}

// Collect every plausible date in the text with its character position.
function collectDates(text: string): { date: Date; pos: number }[] {
  const found: { date: Date; pos: number }[] = []
  const push = (date: Date | null, pos: number) => { if (date) found.push({ date, pos }) }

  // "31 December 2025" / "31st Dec 2025" / "31 Desember 2025"
  const reDMY = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_ALT})[a-z]*\\.?,?\\s+(\\d{4})\\b`, 'gi')
  // "December 31, 2025" / "Dec 31 2025"
  const reMDY = new RegExp(`\\b(${MONTH_ALT})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'gi')
  // ISO "2025-12-31"
  const reISO = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g
  // Numeric day-first "31/12/2025", "31-12-2025", "31.12.2025" (ID/EU convention)
  const reNum = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g

  const monthIdx = (w: string): number => {
    const k = w.toLowerCase()
    return MONTHS[k] ?? MONTHS[k.slice(0, 3)] ?? -1
  }

  let m: RegExpExecArray | null
  while ((m = reDMY.exec(text)) !== null)
    push(mkDate(+m[3], monthIdx(m[2]), +m[1]), m.index)
  while ((m = reMDY.exec(text)) !== null)
    push(mkDate(+m[3], monthIdx(m[1]), +m[2]), m.index)
  while ((m = reISO.exec(text)) !== null)
    push(mkDate(+m[1], +m[2] - 1, +m[3]), m.index)
  while ((m = reNum.exec(text)) !== null) {
    // day-first; if first number > 12 it must be the day, which confirms DD/MM
    const day = +m[1], mon = +m[2]
    if (day <= 31 && mon <= 12) push(mkDate(+m[3], mon - 1, day), m.index)
  }

  return found
}

// Find the best deadline in text: prefer a future date near a deadline cue,
// else the earliest future date, else null.
function extractDeadlineFromText(text: string): string | null {
  if (!text) return null
  const now = Date.now()
  const dates = collectDates(text).filter(d => d.date.getTime() > now)
  if (dates.length === 0) return null

  // Positions of deadline cue words
  const cuePositions: number[] = []
  let c: RegExpExecArray | null
  DEADLINE_CUES.lastIndex = 0
  while ((c = DEADLINE_CUES.exec(text)) !== null) cuePositions.push(c.index)

  // Score each date: closest to a cue within 60 chars wins big
  let best = dates[0]
  let bestScore = -Infinity
  for (const cand of dates) {
    let score = 0
    if (cuePositions.length > 0) {
      const nearest = Math.min(...cuePositions.map(p => Math.abs(p - cand.pos)))
      if (nearest <= 60) score += 1000 - nearest // strong preference for cue-adjacent
    }
    // Tie-break: earlier future deadline is more likely the real one
    score -= cand.date.getTime() / 1e12
    if (score > bestScore) { bestScore = score; best = cand }
  }
  return best.date.toISOString()
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
// Penyaring keamanan: tolak judi & konten dewasa SEBELUM masuk database.
// Dipicu oleh insiden worldscholarshipforum.com — feed beasiswa yang dibajak
// menyuntikkan 72 item kasino + konten telanjang AI ke papan peluang siswa.
// Sumber mana pun bisa dibajak, jadi penyaringan dilakukan per item.
const SPAM_RE = /(1win|casino|kasino|kazino|casinos|judi|poker|gambl|betting|bookmaker|mostbet|melbet|riobet|22bet|jojobet|bahis|slot machine|free spins|welcome bonus|deposit bonus|taruhan)/i
const ADULT_RE = /(deepnude|nudify|\bai nudes?\b|undress|\bporn|\bxxx\b|escort|sex ?cam|onlyfans)/i

function isSpamOrAdult(title: string, description: string): boolean {
  const t = `${title} ${description}`
  return SPAM_RE.test(t) || ADULT_RE.test(t)
}

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

    const organizer =
      extractTag(block, 'dc:creator') ||
      extractTag(block, 'author') || hostname

    // Skip very short or meaningless titles
    if (title.length < 8) continue

    // Tolak judi / konten dewasa dari feed yang dibajak
    if (isSpamOrAdult(title, description)) continue

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

    // ── Backfill mode: re-run the improved parser over existing active rows
    // that never got a deadline, so the parser upgrade helps historical data
    // (not just newly-scraped items). Trigger with { mode: 'backfill' }.
    if (body.mode === 'backfill') {
      const { data: rows, error: fetchErr } = await supabaseClient
        .from('scraped_content')
        .select('id, title, description')
        .is('deadline', null)
        .eq('is_active', true)
        .eq('is_manual', false)
        .limit(2000)
      if (fetchErr) throw fetchErr

      let updated = 0
      for (const row of rows || []) {
        const dl = extractDeadlineFromText(row.description || '') || extractDeadlineFromText(row.title || '')
        if (dl) {
          await supabaseClient.from('scraped_content').update({ deadline: dl }).eq('id', row.id)
          updated++
        }
      }
      return new Response(
        JSON.stringify({ success: true, mode: 'backfill', scanned: (rows || []).length, updated }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

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
    const ALL_CATEGORIES = ['beasiswa', 'magang', 'lowongan_kerja', 'kompetisi', 'konferensi', 'volunteer', 'program']
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

          // Cap per feed so a single large source (e.g. UN careers) can't
          // flood the board and dilute curation.
          const capped = items.slice(0, 25)
          allResults.push(...capped)
          console.log(`  → ${capped.length}/${items.length} items from ${source.url}`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`${source.url}: ${msg}`)
          console.error(`Error fetching ${source.url}:`, msg)
        }
      }
    }

    // Step 4: Deduplicate by URL — only insert URLs not already in DB.
    // The existing-URL lookup is CHUNKED: a single .in() with thousands of
    // URLs silently returns nothing (URL length limit) → dedup fails → every
    // item re-inserts. Chunking keeps each query small and reliable. We also
    // dedupe within this batch itself so one run can't insert intra-batch dups.
    let saved = 0
    if (allResults.length > 0) {
      const uniqueUrls = [...new Set(allResults.map(r => r.url))]
      const existingUrls = new Set<string>()
      const CHUNK = 200
      for (let i = 0; i < uniqueUrls.length; i += CHUNK) {
        const { data: existing } = await supabaseClient
          .from('scraped_content')
          .select('url')
          .in('url', uniqueUrls.slice(i, i + CHUNK))
        for (const r of existing || []) existingUrls.add((r as any).url)
      }

      const seen = new Set<string>()
      const newItems = allResults.filter(r => {
        if (existingUrls.has(r.url) || seen.has(r.url)) return false
        seen.add(r.url)
        return true
      })

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
