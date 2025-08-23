import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 20+ trusted Indonesian and international sources for opportunities
const SOURCES = {
  SCHOLARSHIP: [
    // Indonesian Government
    'https://knb.kemdiktisaintek.go.id',
    'https://www.lpdp.kemenkeu.go.id',
    'https://www.beasiswa.kemdikbud.go.id',
    'https://apply.darmasiswa.kemdikbud.go.id',
    'https://darmasiswa.kemdikbud.go.id',
    // International Education
    'https://edupass.org',
    'https://bigfuture.collegeboard.org',
    'https://fulbrightscholars.org',
    'https://www.daad.de',
    // Study Abroad & Opportunities
    'https://international.undana.ac.id',
    'https://edwardconsulting.org',
    'https://indooceanproject.org',
    'https://ceastudyabroad.com'
  ],
  JOB: [
    // Indonesian Job Portals
    'https://www.jobstreet.co.id',
    'https://glints.com/id',
    'https://karir.com',
    'https://www.urbanhire.com',
    'https://jobs.id',
    // International Internships
    'https://baliinternships.com',
    'https://www.aiesec.org',
    'https://careers.goto.com',
    'https://www.techinasia.com/jobs'
  ],
  COMPETITION: [
    // Competition Platforms
    'https://lomba.co',
    'https://eventori.id',
    'https://kompetisi.id',
    'https://www.globalschoolnet.org',
    // STEM & Academic
    'https://www.globalchangemakers.net',
    'https://osn.kemdikbud.go.id'
  ],
  CONFERENCE: [
    // Academic & Professional Events
    'https://eventori.id',
    'https://www.globalchangemakers.net',
    'https://international.undana.ac.id'
  ]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { category, sources } = await req.json()

    console.log(`Starting web scraping for category: ${category}`)

    const results: any[] = []
    const sourcesToScrape = sources || SOURCES[category as keyof typeof SOURCES] || []

    for (const url of sourcesToScrape) {
      try {
        console.log(`Scraping: ${url}`)
        
        // Simple fetch to get webpage content
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          const html = await response.text()
          
          // Basic HTML parsing to extract titles and links
          const titleMatches = html.match(/<title[^>]*>([^<]+)<\/title>/gi) || []
          const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi) || []
          
          // Enhanced content extraction with better filtering
          const opportunities = linkMatches
            .filter(link => {
              const lowercaseLink = link.toLowerCase()
              const text = link.match(/>([^<]+)<\/a>/)?.[1]?.toLowerCase() || ''
              
              // More comprehensive filtering based on keywords
              const scholarshipKeywords = ['beasiswa', 'scholarship', 'grant', 'funding', 'fellowship']
              const jobKeywords = ['kerja', 'magang', 'internship', 'job', 'karir', 'career', 'lowongan']
              const competitionKeywords = ['lomba', 'kompetisi', 'competition', 'contest', 'challenge']
              const eventKeywords = ['conference', 'konferensi', 'event', 'seminar', 'workshop']
              
              const allKeywords = [...scholarshipKeywords, ...jobKeywords, ...competitionKeywords, ...eventKeywords]
              
              return allKeywords.some(keyword => 
                lowercaseLink.includes(keyword) || text.includes(keyword)
              )
            })
            .slice(0, 10) // Increased limit per source
            .map(link => {
              const hrefMatch = link.match(/href=["']([^"']+)["']/)
              const textMatch = link.match(/>([^<]+)<\/a>/)
              const hostname = new URL(url).hostname
              
              // Enhanced title and description extraction
              const title = textMatch ? textMatch[1].trim() : 'Peluang Menarik'
              const cleanTitle = title.replace(/[^\w\s-]/g, '').trim()
              
              // Generate better tags based on content
              const baseTags = [category.toLowerCase()]
              const additionalTags = []
              
              // Add location tags
              if (hostname.includes('.id') || hostname.includes('indonesia')) {
                additionalTags.push('indonesia')
              } else {
                additionalTags.push('internasional')
              }
              
              // Add type-specific tags
              const titleLower = title.toLowerCase()
              if (titleLower.includes('s1') || titleLower.includes('s2') || titleLower.includes('s3')) {
                additionalTags.push('pendidikan-tinggi')
              }
              if (titleLower.includes('full') || titleLower.includes('penuh')) {
                additionalTags.push('beasiswa-penuh')
              }
              if (titleLower.includes('stem') || titleLower.includes('teknologi') || titleLower.includes('sains')) {
                additionalTags.push('STEM')
              }
              
              // Extract potential deadline from title/description
              const deadlineMatch = title.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/)
              let deadline = null
              if (deadlineMatch) {
                try {
                  deadline = new Date(deadlineMatch[0]).toISOString()
                } catch (e) {
                  deadline = null
                }
              }
              
              return {
                title: cleanTitle.length > 5 ? cleanTitle : `Peluang ${category} dari ${hostname}`,
                description: `Peluang ${category.toLowerCase()} terbaru dari ${hostname}. Klik untuk melihat detail lengkap dan persyaratan.`,
                url: hrefMatch ? new URL(hrefMatch[1], url).href : url,
                source_website: hostname,
                category: category.toLowerCase(),
                content_type: category.toLowerCase(),
                tags: [...baseTags, ...additionalTags],
                location: hostname.includes('.id') ? 'Indonesia' : 'Internasional',
                deadline: deadline,
                is_active: true
              }
            })
            
          results.push(...opportunities)
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error)
      }
    }

    // Save results to database
    if (results.length > 0) {
      const { error } = await supabaseClient
        .from('scraped_content')
        .insert(results)

      if (error) {
        console.error('Error saving scraped content:', error)
        throw error
      }
    }

    console.log(`Scraped ${results.length} items for category: ${category}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully scraped ${results.length} items`,
        data: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Web scraping error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})