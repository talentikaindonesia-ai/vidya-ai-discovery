-- Talentika hanya dua paket: Free dan Plus (keputusan produk 2026-10-12).
-- Web dan aplikasi membaca batas yang sama dari sini, jadi tidak bisa berbeda.
--
--   Materi/kursus aktif   Free 3          Plus tanpa batas   (learning_progress, RLS)
--   Peluang dibuka        Free 5/bulan    Plus tanpa batas   (buka_peluang)
--   Proyek Talent Passport Free 3         Plus tanpa batas   (trigger)
--   Ringkasan orang tua   Free terbatas   Plus lengkap       (ringkasan_anak)
--   Mentoring             tidak termasuk di paket mana pun — program terpisah

-- ── 1. Paket ─────────────────────────────────────────────────────────────
-- Pro tidak pernah punya pelanggan (cek 2026-10-12); create-mayar-payment
-- sudah menolak paket yang tidak aktif.
update subscription_packages set is_active = false, is_popular = false, updated_at = now()
 where tier = 'pro' or name = 'Pro';

update subscription_packages set
  tagline = 'Kenali dirimu',
  description = 'Untuk mengenal Talentika dan merasakan manfaat intinya.',
  features = to_jsonb(array[
    'Asesmen dasar & 1 profil hasil (tipe RIASEC)',
    'Maks. 3 materi atau kursus aktif',
    'Maks. 5 peluang dibuka per bulan',
    'Talent Passport dasar, maks. 3 proyek',
    'Progress tracking dasar',
    'Akses komunitas dasar']),
  max_courses = 3, max_opportunities = 5, cta_label = 'Mulai Gratis', sort_order = 0, updated_at = now()
 where type = 'free' and name = 'Free';

update subscription_packages set
  tagline = 'Kembangkan potensimu',
  description = 'Pengalaman pengembangan yang lebih mendalam, personal, dan berkelanjutan.',
  features = to_jsonb(array[
    'Asesmen lengkap & eksplorasi lanjutan',
    'Seluruh katalog belajar yang termasuk paket',
    'AI Talent Coach',
    'Rekomendasi peluang sesuai profil',
    'Jalur studi & karier personal',
    'Talent Passport lengkap',
    'Progress tracking lanjutan',
    'Sertifikat yang memenuhi syarat']),
  price_monthly = 99000, price_yearly = 990000,
  max_courses = -1, max_opportunities = -1, is_popular = true,
  cta_label = 'Berlangganan Plus', sort_order = 1, updated_at = now()
 where tier = 'plus' or name = 'Plus';

-- ── 2. Materi: yang dihitung materi AKTIF (belum selesai), bukan seumur hidup ──
create or replace function public.learning_slots_used(uid uuid)
returns integer
language sql
stable security definer
set search_path to 'public'
as $function$
  select count(*)::int from public.learning_progress
  where user_id = uid
    and coalesce(status, '') <> 'completed'
    and (uid = auth.uid() or public.has_role(auth.uid(), 'admin'::user_role));
$function$;

-- ── 3. Peluang: 5 peluang berbeda per bulan untuk akun Free ────────────────
create table if not exists public.peluang_dibuka (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null,
  bulan date not null default date_trunc('month', now() at time zone 'Asia/Jakarta')::date,
  dibuka_pada timestamptz not null default now(),
  primary key (user_id, opportunity_id, bulan)
);
alter table public.peluang_dibuka enable row level security;
drop policy if exists peluang_dibuka_select_own on public.peluang_dibuka;
create policy peluang_dibuka_select_own on public.peluang_dibuka for select to authenticated using (user_id = auth.uid());
-- tidak ada kebijakan insert: pencatatan hanya lewat buka_peluang()

create or replace function public.buka_peluang(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare uid uuid := auth.uid(); bln date := date_trunc('month', now() at time zone 'Asia/Jakarta')::date; dipakai int;
begin
  if uid is null then raise exception 'auth required' using errcode = '42501'; end if;
  if is_premium(uid) then return jsonb_build_object('allowed', true, 'plus', true); end if;
  if exists (select 1 from peluang_dibuka where user_id = uid and opportunity_id = p_id and bulan = bln) then
    select count(*) into dipakai from peluang_dibuka where user_id = uid and bulan = bln;
    return jsonb_build_object('allowed', true, 'plus', false, 'used', dipakai, 'limit', 5);
  end if;
  select count(*) into dipakai from peluang_dibuka where user_id = uid and bulan = bln;
  if dipakai >= 5 then
    return jsonb_build_object('allowed', false, 'plus', false, 'used', dipakai, 'limit', 5);
  end if;
  insert into peluang_dibuka (user_id, opportunity_id, bulan) values (uid, p_id, bln) on conflict do nothing;
  return jsonb_build_object('allowed', true, 'plus', false, 'used', dipakai + 1, 'limit', 5);
end $function$;
revoke all on function public.buka_peluang(uuid) from public, anon;
grant execute on function public.buka_peluang(uuid) to authenticated;

-- ── 4. Proyek Talent Passport: maks. 3 untuk akun Free ─────────────────────
-- Proyek aplikasi (projects) + proyek web (portfolio_items item_type='project').
-- Proyek aplikasi yang diterbitkan juga membuat portfolio_items berjudul sama,
-- jadi yang itu tidak dihitung dua kali.
create or replace function public.jumlah_proyek(uid uuid)
returns integer
language sql
stable security definer
set search_path to 'public'
as $function$
  select (select count(*) from projects where user_id = uid)::int
       + (select count(*) from portfolio_items pi where pi.user_id = uid and pi.item_type = 'project'
            and not exists (select 1 from projects p where p.user_id = uid and p.title = pi.title))::int
$function$;
revoke all on function public.jumlah_proyek(uuid) from public, anon, authenticated;

create or replace function public.batasi_proyek_free()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if tg_table_name = 'portfolio_items' then
    if new.item_type is distinct from 'project' then return new; end if;
    if exists (select 1 from projects p where p.user_id = new.user_id and p.title = new.title) then return new; end if;
  end if;
  if not is_premium(new.user_id) and jumlah_proyek(new.user_id) >= 3 then
    raise exception 'KUOTA_PROYEK: Akun Free bisa menyimpan maksimal 3 proyek. Upgrade ke Plus untuk Talent Passport lengkap.'
      using errcode = 'P0001';
  end if;
  return new;
end $function$;

drop trigger if exists batasi_proyek_free on public.projects;
create trigger batasi_proyek_free before insert on public.projects for each row execute function public.batasi_proyek_free();
drop trigger if exists batasi_proyek_free on public.portfolio_items;
create trigger batasi_proyek_free before insert on public.portfolio_items for each row execute function public.batasi_proyek_free();

-- ── 5. Kuota saya — satu sumber untuk banner kuota di web & aplikasi ──────
create or replace function public.kuota_saya()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare uid uuid := auth.uid(); bln date := date_trunc('month', now() at time zone 'Asia/Jakarta')::date;
begin
  if uid is null then return null; end if;
  return jsonb_build_object(
    'plus', is_premium(uid),
    'materi_aktif', (select count(*) from learning_progress where user_id = uid and coalesce(status, '') <> 'completed'),
    'materi_batas', 3,
    'peluang_dipakai', (select count(*) from peluang_dibuka where user_id = uid and bulan = bln),
    'peluang_batas', 5,
    'peluang_dibuka', coalesce((select jsonb_agg(opportunity_id) from peluang_dibuka where user_id = uid and bulan = bln), '[]'::jsonb),
    'proyek', jumlah_proyek(uid),
    'proyek_batas', 3);
end $function$;
revoke all on function public.kuota_saya() from public, anon;
grant execute on function public.kuota_saya() to authenticated;

-- ── 6. Orang tua: ringkasan terbatas untuk Free, lengkap untuk Plus ────────
create or replace function public.ringkasan_anak(p_student uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare uid uuid := auth.uid(); sh jsonb; res jsonb; r jsonb; plus boolean;
begin
  if not exists (select 1 from parent_links where parent_user_id = uid and student_user_id = p_student and status = 'active') then
    raise exception 'tidak terhubung' using errcode='42501';
  end if;
  select parent into sh from sharing_settings where user_id = p_student;
  sh := coalesce(sh, '{"dna":true,"ach":true,"proj":true,"opps":true,"learn":true}'::jsonb);
  plus := is_premium(p_student) or is_premium(uid);
  r := readiness_for(p_student);
  res := jsonb_build_object(
    'name', (select full_name from profiles where user_id = p_student),
    'school', (select school_name from profiles where user_id = p_student),
    'career_target', (select career_target from profiles where user_id = p_student),
    'readiness', r->'score',
    'shared', sh,
    'plus', plus);
  if (sh->>'dna')::boolean then res := res || jsonb_build_object('axes', dna_axes_for(p_student), 'riasec', riasec_ringkas(p_student)); end if;
  if (sh->>'learn')::boolean then res := res || jsonb_build_object('learning_active',
      (select count(*) from learning_progress where user_id = p_student and status <> 'completed'),
      'learning_done', (select count(*) from learning_progress where user_id = p_student and status = 'completed')); end if;
  if (sh->>'proj')::boolean then res := res || jsonb_build_object('projects', (select count(*) from projects where user_id = p_student)); end if;
  -- rincian (daftar prestasi & peluang yang sedang diikuti) hanya untuk Plus
  if plus and (sh->>'ach')::boolean then res := res || jsonb_build_object('achievements', coalesce((select jsonb_agg(jsonb_build_object('title',title,'event',event,'year',year,'medal',medal,'verified',verified) order by year desc, created_at desc) from user_achievements where user_id = p_student), '[]'::jsonb)); end if;
  if plus and (sh->>'opps')::boolean then res := res || jsonb_build_object('opportunities', coalesce((select jsonb_agg(jsonb_build_object('title',opportunity_title,'deadline',deadline,'status',status) order by deadline nulls last) from saved_opportunities where user_id = p_student and status not in ('accepted','completed','rejected')), '[]'::jsonb)); end if;
  return res;
end $function$;
