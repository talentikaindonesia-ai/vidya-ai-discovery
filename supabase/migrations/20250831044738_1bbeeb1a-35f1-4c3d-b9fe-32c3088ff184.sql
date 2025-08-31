-- Insert sample quiz data for testing
INSERT INTO public.quizzes (
  title, description, category_id, difficulty, question_type, question, 
  options, correct_answer, explanation, clue_location, points_reward
) 
SELECT 
  'Partikel Bermuatan Negatif',
  'Quiz tentang partikel dasar atom yang dapat ditemukan di zona fisika ISC',
  c.id,
  'easy',
  'multiple_choice',
  'Di zona Fisika ISC, ada percobaan tentang listrik statis. Apa nama partikel yang bermuatan negatif?',
  '["Elektron", "Proton", "Neutron", "Positron"]'::jsonb,
  'Elektron',
  'Elektron adalah partikel subatomik yang bermuatan listrik negatif.',
  'Zona Fisika - Eksperimen Listrik Statis',
  10
FROM public.quiz_categories c 
WHERE c.name = 'Physics' 
LIMIT 1;

INSERT INTO public.quizzes (
  title, description, category_id, difficulty, question_type, question, 
  options, correct_answer, explanation, clue_location, points_reward
) 
SELECT 
  'Planet dengan Cincin Terbesar',
  'Quiz astronomi tentang tata surya yang dapat dijelajahi di ruang astronomi ISC',
  c.id,
  'medium',
  'multiple_choice',
  'Di ruang Astronomi ISC, ada replika tata surya. Planet apa yang memiliki cincin terbesar?',
  '["Jupiter", "Saturnus", "Uranus", "Neptunus"]'::jsonb,
  'Saturnus',
  'Saturnus memiliki sistem cincin yang paling menonjol dan terbesar di tata surya.',
  'Ruang Astronomi - Replika Tata Surya',
  15
FROM public.quiz_categories c 
WHERE c.name = 'Astronomy' 
LIMIT 1;

INSERT INTO public.quizzes (
  title, description, category_id, difficulty, question_type, question, 
  options, correct_answer, explanation, clue_location, points_reward
) 
SELECT 
  'Proses Fotosintesis',
  'Quiz biologi tentang proses penting dalam kehidupan tumbuhan',
  c.id,
  'easy',
  'true_false',
  'Proses fotosintesis menghasilkan oksigen sebagai produk sampingan.',
  '[]'::jsonb,
  'True',
  'Fotosintesis mengubah CO2 dan air menjadi glukosa dengan bantuan sinar matahari, dan menghasilkan oksigen sebagai produk sampingan.',
  'Zona Biologi - Ekosistem Tumbuhan',
  10
FROM public.quiz_categories c 
WHERE c.name = 'Biology' 
LIMIT 1;

INSERT INTO public.quizzes (
  title, description, category_id, difficulty, question_type, question, 
  options, correct_answer, explanation, clue_location, points_reward
) 
SELECT 
  'Rumus Kimia Air',
  'Quiz kimia dasar tentang rumus molekul air',
  c.id,
  'easy',
  'short_answer',
  'Apa rumus kimia dari air?',
  '[]'::jsonb,
  'H2O',
  'Air terdiri dari 2 atom hidrogen dan 1 atom oksigen, sehingga rumus kimianya adalah H2O.',
  'Laboratorium Kimia - Eksperimen Molekul',
  10
FROM public.quiz_categories c 
WHERE c.name = 'Chemistry' 
LIMIT 1;

INSERT INTO public.quizzes (
  title, description, category_id, difficulty, question_type, question, 
  options, correct_answer, explanation, clue_location, points_reward
) 
SELECT 
  'Teknologi AI',
  'Quiz tentang perkembangan teknologi kecerdasan buatan',
  c.id,
  'hard',
  'multiple_choice',
  'Apa kepanjangan dari AI dalam teknologi modern?',
  '["Artificial Intelligence", "Automated Intelligence", "Advanced Information", "Applied Innovation"]'::jsonb,
  'Artificial Intelligence',
  'AI adalah singkatan dari Artificial Intelligence atau Kecerdasan Buatan, teknologi yang memungkinkan mesin untuk belajar dan membuat keputusan.',
  'Zona Teknologi - Pameran AI dan Robotika',
  20
FROM public.quiz_categories c 
WHERE c.name = 'Technology' 
LIMIT 1;