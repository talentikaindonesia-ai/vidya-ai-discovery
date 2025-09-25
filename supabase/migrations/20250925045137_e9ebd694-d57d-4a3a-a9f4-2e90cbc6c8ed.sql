-- Update Individual plan features to match front page (using JSONB format)
UPDATE subscription_packages 
SET features = '[
  "Tes minat & bakat untuk kenali potensi",
  "Rekomendasi jalur studi sesuai hasil assestment", 
  "Kursus online dasar untuk mulai belajar skill yang sesuai minatmu",
  "Progress tracking agar tahu perkembangan diri",
  "Akses kepada Peluang Mengembangkan diri (Beasiswa, Kompetisi, Karier, dll)",
  "Akses forum komunitas untuk sharing & belajar bareng"
]'::jsonb
WHERE name = 'Individual';

-- Update Premium plan features to match front page (using JSONB format)
UPDATE subscription_packages
SET features = '[
  "Semua fitur Individual",
  "Analisis potensi & skill lebih lengkap",
  "Konsultasi dengan mentor berpengalaman", 
  "Akses kursus & program premium",
  "Portofolio builder untuk beasiswa/magang",
  "Networking dengan profesional & industri",
  "Akses lengkap kepada Peluang Mengembangkan diri (Beasiswa, Kompetisi, Karier, dll)",
  "Sertifikat & pencatatan skill"
]'::jsonb
WHERE name = 'Premium';