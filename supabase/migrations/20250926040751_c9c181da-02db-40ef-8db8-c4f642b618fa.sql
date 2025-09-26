-- Insert Free package with proper JSONB format
INSERT INTO public.subscription_packages (
  name,
  type,
  price_monthly,
  price_yearly,
  features,
  max_courses,
  max_opportunities,
  max_users,
  is_active
) VALUES (
  'Free',
  'free',
  0,
  0,
  '["Akses dasar ke dashboard pembelajaran", "Tes minat & bakat (terbatas)", "Lihat kursus gratis (maksimal 3)", "Lihat peluang terbatas (maksimal 5)", "Forum komunitas (read-only)", "Progress tracking dasar"]'::jsonb,
  3,
  5,
  1,
  true
);