import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Indonesian websites to scrape for opportunities
const SOURCES = {
  SCHOLARSHIP: [
    'https://www.beasiswa.kemdikbud.go.id',
    'https://www.lpdp.kemenkeu.go.id',
    'https://beasiswapendidikan.com'
  ],
  JOB: [
    'https://www.jobstreet.co.id',
    'https://glints.com/id',
    'https://karir.com'
  ],
  COMPETITION: [
    'https://lomba.co',
    'https://eventori.id',
    'https://kompetisi.id'
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
          
          // Extract opportunity-related content
          const opportunities = linkMatches
            .filter(link => {
              const lowercaseLink = link.toLowerCase()
              return lowercaseLink.includes('beasiswa') || 
                     lowercaseLink.includes('lomba') || 
                     lowercaseLink.includes('kompetisi') ||
                     lowercaseLink.includes('kerja') ||
                     lowercaseLink.includes('magang') ||
                     lowercaseLink.includes('scholarship') ||
                     lowercaseLink.includes('internship')
            })
            .slice(0, 5) // Limit to 5 per source
            .map(link => {
              const hrefMatch = link.match(/href=["']([^"']+)["']/)
              const textMatch = link.match(/>([^<]+)<\/a>/)
              
              return {
                title: textMatch ? textMatch[1].trim() : 'Peluang Menarik',
                description: `Peluang dari ${new URL(url).hostname}`,
                url: hrefMatch ? new URL(hrefMatch[1], url).href : url,
                source_website: new URL(url).hostname,
                category: category.toLowerCase(),
                content_type: category.toLowerCase(),
                tags: [category.toLowerCase(), 'indonesia'],
                location: 'Indonesia'
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