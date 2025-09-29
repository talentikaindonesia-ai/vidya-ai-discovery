-- Create articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  category TEXT DEFAULT 'karir'::text,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 5,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Articles are publicly readable when published" 
ON public.articles 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage all articles" 
ON public.articles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_article_slug(article_title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  counter INTEGER := 0;
  final_slug TEXT;
BEGIN
  -- Convert title to slug format
  base_slug := lower(trim(regexp_replace(article_title, '[^a-zA-Z0-9\s]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Check if slug already exists
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.articles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Create trigger for auto-updating timestamps
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_article_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_article_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_article_slug_trigger
BEFORE INSERT ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_article_slug();

-- Insert sample articles related to Talentika theme
INSERT INTO public.articles (title, content, excerpt, category, tags, is_published, is_featured, reading_time_minutes, seo_title, seo_description) VALUES 
('Tips Membangun Personal Branding untuk Karir yang Cemerlang', 
'# Tips Membangun Personal Branding untuk Karir yang Cemerlang

Personal branding adalah cara Anda mempresentasikan diri di dunia profesional. Ini bukan hanya tentang CV atau LinkedIn profile, tetapi tentang bagaimana orang mengingat dan memandang Anda sebagai profesional.

## Mengapa Personal Branding Penting?

Dalam era digital ini, personal branding menjadi kunci untuk:
- Membedakan diri dari kompetitor
- Membangun kredibilitas dan kepercayaan
- Menarik peluang karir yang lebih baik
- Mengembangkan network profesional

## Langkah-Langkah Membangun Personal Branding

### 1. Kenali Diri Sendiri
Sebelum membangun brand, Anda perlu memahami:
- Kekuatan dan keahlian unik Anda
- Nilai-nilai yang Anda pegang
- Visi karir jangka panjang

### 2. Tentukan Target Audience
Siapa yang ingin Anda jangkau? Apakah:
- Recruiter di industri tertentu
- Klien potensial
- Kolega di bidang yang sama
- Leader industri

### 3. Ciptakan Konsistensi
Pastikan pesan Anda konsisten di semua platform:
- LinkedIn profile
- Portfolio website
- Media sosial profesional
- Networking events

### 4. Bagikan Konten Berkualitas
Mulai berbagi insight dan pengalaman melalui:
- Artikel LinkedIn
- Blog posts
- Presentasi di webinar
- Diskusi di forum profesional

### 5. Network Secara Aktif
Bangun relasi yang meaningful dengan:
- Menghadiri industry events
- Bergabung dengan komunitas profesional
- Berpartisipasi dalam diskusi online
- Mentoring atau menjadi mentor

## Tips Praktis

- **Authentic**: Tetap jadi diri sendiri, jangan meniru orang lain
- **Consistent**: Posting secara teratur dan konsisten
- **Value-driven**: Selalu berikan value kepada audience
- **Professional**: Jaga profesionalisme di semua interaksi

Personal branding adalah investasi jangka panjang untuk karir Anda. Mulailah hari ini dan lihat bagaimana pintu-pintu peluang mulai terbuka!',

'Pelajari strategi efektif untuk membangun personal branding yang kuat dan membedakan diri Anda di dunia profesional.',
'karir',
ARRAY['personal-branding', 'karir', 'profesional', 'networking'],
true,
true,
7,
'Tips Personal Branding untuk Karir - Talentika',
'Pelajari cara membangun personal branding yang efektif untuk mengembangkan karir. Tips praktis dan strategi terbukti dari Talentika.'
),

('Panduan Lengkap Interview Kerja: Dari Persiapan hingga Follow-up', 
'# Panduan Lengkap Interview Kerja: Dari Persiapan hingga Follow-up

Interview kerja adalah momen krusial dalam perjalanan karir. Persiapan yang matang akan menentukan kesuksesan Anda mendapatkan posisi yang diinginkan.

## Fase Persiapan Interview

### Riset Perusahaan
Sebelum interview, pastikan Anda memahami:
- Sejarah dan visi misi perusahaan
- Produk atau layanan yang ditawarkan
- Kultur perusahaan
- Recent news atau achievement
- Kompetitor utama

### Analisis Job Description
Pelajari dengan detail:
- Requirements yang diminta
- Tanggung jawab utama
- Skills yang dibutuhkan
- Kualifikasi pendidikan/pengalaman

### Persiapan Pertanyaan
Siapkan jawaban untuk pertanyaan umum seperti:
- "Ceritakan tentang diri Anda"
- "Mengapa tertarik dengan posisi ini?"
- "Apa kekuatan dan kelemahan Anda?"
- "Mengapa ingin bergabung dengan perusahaan ini?"

## Hari Interview

### Dress Code
- Business formal untuk corporate
- Business casual untuk startup
- Pastikan penampilan rapi dan profesional

### Punctuality
- Datang 10-15 menit lebih awal
- Konfirmasi lokasi sebelumnya
- Siapkan backup transportasi

### Body Language
- Jabat tangan yang firm
- Eye contact yang natural
- Postur tubuh yang confident
- Senyum yang tulus

## Teknik Menjawab Pertanyaan

### Metode STAR
Untuk pertanyaan behavioral, gunakan:
- **S**ituation: Jelaskan situasinya
- **T**ask: Apa tugas yang harus diselesaikan
- **A**ction: Tindakan yang Anda ambil
- **R**esult: Hasil yang dicapai

### Tips Menjawab
- Berikan contoh konkret
- Fokus pada achievement
- Jujur tentang pengalaman
- Tunjukkan enthusiasm

## Pertanyaan untuk Interviewer

Siapkan pertanyaan berkualitas seperti:
- "Bagaimana kultur kerja di tim ini?"
- "Apa tantangan terbesar untuk posisi ini?"
- "Bagaimana peluang pengembangan karir di sini?"
- "Apa yang Anda sukai dari bekerja di perusahaan ini?"

## Follow-up Setelah Interview

### Thank You Email
Kirim dalam 24 jam setelah interview:
- Ucapkan terima kasih atas waktu dan kesempatan
- Reaffirm interest Anda terhadap posisi
- Highlight key points yang mungkin terlewat

### Timeline Follow-up
- Tunggu sesuai timeline yang diberikan
- Follow-up dengan sopan jika belum ada kabar
- Tetap professional meskipun mendapat rejection

## Red Flags yang Harus Dihindari

- Datang terlambat tanpa konfirmasi
- Tidak melakukan riset perusahaan
- Badmouthing employer sebelumnya
- Fokus hanya pada salary/benefit
- Tidak memiliki pertanyaan untuk interviewer

Interview adalah two-way process. Anda juga sedang mengevaluasi apakah perusahaan cocok untuk Anda. Percaya diri, authentic, dan tunjukkan value yang Anda bisa berikan!',

'Panduan komprehensif untuk sukses interview kerja, mulai dari persiapan hingga follow-up yang efektif.',
'karir',
ARRAY['interview', 'tips-karir', 'job-search', 'profesional'],
true,
true,
10,
'Panduan Interview Kerja Sukses - Talentika',
'Pelajari tips interview kerja yang efektif. Panduan lengkap dari persiapan hingga follow-up untuk meningkatkan peluang sukses.'
),

('Strategi Effective Networking untuk Fresh Graduate', 
'# Strategi Effective Networking untuk Fresh Graduate

Sebagai fresh graduate, networking mungkin terasa menakutkan. Namun, 85% lowongan kerja tidak dipublikasikan secara terbuka dan diisi melalui referral. Inilah mengapa networking menjadi sangat penting.

## Mengapa Networking Penting?

### Hidden Job Market
- 85% lowongan tidak dipublikasikan
- Filled through internal referrals
- Early access to opportunities
- Less competition

### Career Development
- Mentorship opportunities
- Industry insights
- Skill development guidance
- Career advice dari professionals

## Cara Memulai Networking

### 1. Mulai dari Lingkaran Terdekat
- Alumni kampus
- Teman sekelas yang sudah bekerja
- Dosen atau pembimbing
- Family friends di industry

### 2. Online Networking
- **LinkedIn**: Platform utama untuk professional networking
- **Industry forums**: Bergabung dengan grup diskusi
- **Twitter**: Follow dan engage dengan industry leaders
- **Clubhouse**: Participate in industry rooms

### 3. Offline Opportunities
- Industry conferences
- Meetup groups
- Workshop dan seminar
- Company events atau open house

## Strategi LinkedIn untuk Fresh Graduate

### Optimize Profile
- Professional photo
- Compelling headline
- Detailed summary
- Relevant skills dan endorsements
- Education dan project highlights

### Content Strategy
- Share industry articles dengan insight
- Post tentang learning journey
- Celebrate others'' achievements
- Ask thoughtful questions

### Networking Approach
- Personalized connection requests
- Engage dengan posts orang lain
- Share valuable content
- Offer help sebelum meminta bantuan

## Etika Networking yang Benar

### Do''s:
- **Give first**: Tawarkan bantuan sebelum meminta
- **Be genuine**: Authentic dalam interaksi
- **Follow up**: Maintain relationship yang sudah dibangun
- **Show gratitude**: Selalu ucapkan terima kasih
- **Add value**: Berikan insight atau informasi berguna

### Don''ts:
- **Don''t be pushy**: Jangan terlalu aggressive
- **Avoid one-way relationship**: Networking bukan hanya tentang taking
- **Don''t neglect**: Jaga relationship yang sudah ada
- **Avoid fake persona**: Tetap jadi diri sendiri

## Conversation Starters untuk Fresh Graduate

### Di Events
- "Hi, saya [nama]. Boleh tahu lebih tentang pekerjaan Anda di [company]?"
- "Saya fresh graduate dari [jurusan]. Boleh minta advice untuk enter industry ini?"
- "Interesting presentation tadi. Boleh diskusi lebih lanjut?"

### Online
- "Hi [nama], saya fresh graduate yang tertarik dengan [industry]. Would love to connect and learn from your experience."
- "Saya mengikuti content Anda tentang [topic]. Very insightful! Boleh connect?"

## Building Long-term Relationships

### Stay in Touch
- Check in secara berkala
- Share relevant opportunities atau articles
- Congratulate achievements
- Invite untuk coffee chat

### Provide Value
- Share job postings yang mungkin cocok
- Introduce people yang bisa saling benefit
- Offer skills atau bantuan yang Anda bisa berikan
- Share insights dari perspective fresh graduate

## Networking Events untuk Fresh Graduate

### Types of Events
- **Job fairs**: Direct access ke recruiters
- **Industry meetups**: Casual networking environment  
- **Alumni events**: Leverage kampus network
- **Webinars**: Learn sekaligus network online
- **Volunteer opportunities**: Network sambil berbuat baik

### Preparation Tips
- Set goals untuk setiap event
- Prepare elevator pitch (30-60 detik)
- Bring business cards atau contact info
- Research attendees jika memungkinkan
- Follow up dalam 48 jam

## Measuring Networking Success

### Quality vs Quantity
- Focus pada meaningful connections
- Aim for quality relationships
- Track interaction frequency
- Monitor mutual value exchange

### Long-term Thinking
- Networking adalah marathon, bukan sprint
- Relationship building takes time
- Consistency is key
- ROI mungkin tidak immediate tapi pasti ada

Remember: Networking bukanlah tentang menggunakan orang, tetapi tentang membangun relationship yang mutually beneficial. Mulai hari ini, dan lihat bagaimana network Anda bisa membuka pintu-pintu peluang yang tidak pernah Anda bayangkan!',

'Pelajari strategi networking yang efektif untuk fresh graduate. Tips membangun koneksi profesional dan memanfaatkan peluang karir.',
'karir',
ARRAY['networking', 'fresh-graduate', 'karir', 'linkedin'],
true,
false,
8,
'Strategi Networking Fresh Graduate - Talentika',
'Tips networking efektif untuk fresh graduate. Pelajari cara membangun koneksi profesional dan membuka peluang karir.'
);