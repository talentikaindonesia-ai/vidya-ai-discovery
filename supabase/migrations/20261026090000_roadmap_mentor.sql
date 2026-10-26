-- Roadmap dari praktisi/mentor (MVP, keputusan produk 2026-10-26).
--
--  • Roadmap = langkah terstruktur (bisa dicentang siswa) + lampiran PDF opsional.
--  • Diunggah ADMIN atas nama mentor (mentor_id) atau penulis tamu (penulis_*).
--    Alur: draf → tinjau → terbit. Hanya yang terbit yang terlihat siswa.
--  • Label sama dengan peluang: karier, kode RIASEC, jenjang, topik → disorot
--    lewat roadmap_untukku() dengan rumus kecocokan yang sama.
--  • Free: pratinjau 2 langkah pertama. Plus: semua langkah + PDF.
--    Ditegakkan server: tabel langkah TIDAK bisa dibaca langsung oleh siswa.

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  judul text not null,
  ringkasan text,
  mentor_id uuid references public.mentors(id) on delete set null,
  penulis_nama text,
  penulis_peran text,
  penulis_foto text,
  career_id text references public.careers(id) on delete set null,
  riasec text,
  jenjang_target text[] not null default '{}',
  topik text,
  durasi text,
  cover_url text,
  pdf_path text,
  status text not null default 'draf' check (status in ('draf','tinjau','terbit')),
  sort int not null default 0,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

create table if not exists public.roadmap_langkah (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  urut int not null,
  judul text not null,
  isi text,
  perkiraan text,
  tautan_tipe text check (tautan_tipe is null or tautan_tipe in ('materi','peluang','karier','url')),
  tautan_id text
);
create index if not exists roadmap_langkah_rm on public.roadmap_langkah(roadmap_id, urut);

create table if not exists public.roadmap_progres (
  user_id uuid not null references auth.users(id) on delete cascade,
  langkah_id uuid not null references public.roadmap_langkah(id) on delete cascade,
  selesai_pada timestamptz not null default now(),
  primary key (user_id, langkah_id)
);

alter table public.roadmaps enable row level security;
alter table public.roadmap_langkah enable row level security;
alter table public.roadmap_progres enable row level security;

drop policy if exists roadmaps_baca_terbit on public.roadmaps;
drop policy if exists roadmaps_admin on public.roadmaps;
create policy roadmaps_baca_terbit on public.roadmaps for select to anon, authenticated using (status = 'terbit');
create policy roadmaps_admin on public.roadmaps for all to authenticated using (has_role(auth.uid(), 'admin'::user_role)) with check (has_role(auth.uid(), 'admin'::user_role));

-- langkah: hanya admin langsung; siswa lewat roadmap_detail() (gating Free/Plus di server)
drop policy if exists roadmap_langkah_admin on public.roadmap_langkah;
create policy roadmap_langkah_admin on public.roadmap_langkah for all to authenticated using (has_role(auth.uid(), 'admin'::user_role)) with check (has_role(auth.uid(), 'admin'::user_role));

drop policy if exists roadmap_progres_baca on public.roadmap_progres;
create policy roadmap_progres_baca on public.roadmap_progres for select to authenticated using (user_id = auth.uid());
-- tulis progres hanya lewat tandai_langkah()

-- ── Daftar roadmap yang cocok untuk siswa ──────────────────────────────────
create or replace function public.roadmap_untukku(p_career text default null, p_limit int default 20)
returns table(id uuid, slug text, judul text, ringkasan text, penulis_nama text, penulis_peran text, penulis_foto text,
              terverifikasi boolean, career_id text, career_nama text, durasi text, topik text,
              jumlah_langkah int, selesai int, skor int, alasan text[])
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  huruf text[] := '{}'; label text[] := '{}';
  jen text; target text;
  bobot numeric[] := array[1, 0.6, 0.35];
begin
  if uid is not null then
    select array_remove(array[upper(left(i.tipe_utama,1)), upper(left(i.tipe_kedua,1)), upper(left(i.tipe_ketiga,1))], null),
           array_remove(array[i.tipe_utama, i.tipe_kedua, i.tipe_ketiga], null)
      into huruf, label from identitas_siswa i where i.user_id = uid;
    select case p.jenjang when 'smk' then 'sma_smk' else p.jenjang end, p.career_target into jen, target
      from profiles p where p.user_id = uid;
  end if;
  huruf := coalesce(huruf, '{}'); label := coalesce(label, '{}');

  return query
  with r as (
    select rm.*, upper(coalesce(nullif(trim(rm.riasec), ''), '')) kode,
           coalesce(m.name, rm.penulis_nama) nama, coalesce(nullif(concat_ws(' · ', m.title, m.company), ''), rm.penulis_peran) peran,
           coalesce(m.avatar_url, rm.penulis_foto) foto, coalesce(m.is_verified, false) verif, c.name cnama
    from roadmaps rm
    left join mentors m on m.id = rm.mentor_id
    left join careers c on c.id = rm.career_id
    where rm.status = 'terbit' and (p_career is null or rm.career_id = p_career)
  ), s as (
    select r.*,
      (select least(1, coalesce(sum(bobot[array_position(huruf, substr(r.kode, j, 1))] * bobot[j]), 0))
         from generate_series(1, least(length(r.kode), 3)) j
         where array_position(huruf, substr(r.kode, j, 1)) is not null) m,
      (select label[min(array_position(huruf, substr(r.kode, j, 1)))]
         from generate_series(1, least(length(r.kode), 3)) j
         where array_position(huruf, substr(r.kode, j, 1)) is not null) tipe_cocok,
      (select count(*)::int from roadmap_langkah l where l.roadmap_id = r.id) n,
      (select count(*)::int from roadmap_progres pg join roadmap_langkah l on l.id = pg.langkah_id where l.roadmap_id = r.id and pg.user_id = uid) d
    from r
  )
  select s.id, s.slug, s.judul, s.ringkasan, s.nama, s.peran, s.foto, s.verif, s.career_id, s.cnama, s.durasi, s.topik, s.n, s.d,
    greatest(5, least(99,
        (case when s.kode = '' or cardinality(huruf) = 0 then 15 else round(40 * s.m) end)
      + (case when cardinality(s.jenjang_target) = 0 then 10
              when jen is null then (case when s.jenjang_target && array['smp','sma_smk'] then 10 else -15 end)
              when jen = any(s.jenjang_target) then 20 else -30 end)
      + (case when target is not null and s.career_id = target then 25 else 0 end)
      + (case when s.d > 0 then 10 else 0 end)
    ))::int,
    (array_remove(array[
      case when target is not null and s.career_id = target then 'karier:' || coalesce(s.cnama, s.career_id) end,
      case when s.m >= 0.6 and s.tipe_cocok is not null then 'tipe:' || s.tipe_cocok end,
      case when jen is not null and jen = any(s.jenjang_target) then 'jenjang:' || jen end
    ], null))[1:2]
  from s
  order by 15 desc, s.sort, s.diperbarui_pada desc
  limit greatest(1, least(p_limit, 50));
end $function$;
revoke all on function public.roadmap_untukku(text, int) from public;
grant execute on function public.roadmap_untukku(text, int) to anon, authenticated;

-- ── Detail roadmap (Free: 2 langkah pertama; Plus: semua) ──────────────────
create or replace function public.roadmap_detail(p_slug text)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare uid uuid := auth.uid(); rm record; plus boolean; res jsonb; bebas int := 2;
begin
  select r.*, coalesce(m.name, r.penulis_nama) nama, coalesce(nullif(concat_ws(' · ', m.title, m.company), ''), r.penulis_peran) peran,
         coalesce(m.avatar_url, r.penulis_foto) foto, coalesce(m.is_verified, false) verif, m.id mid, c.name cnama
    into rm
  from roadmaps r left join mentors m on m.id = r.mentor_id left join careers c on c.id = r.career_id
  where r.slug = p_slug and (r.status = 'terbit' or has_role(uid, 'admin'::user_role));
  if rm.id is null then return null; end if;
  plus := uid is not null and (is_premium(uid) or has_role(uid, 'admin'::user_role));
  select jsonb_build_object(
    'id', rm.id, 'slug', rm.slug, 'judul', rm.judul, 'ringkasan', rm.ringkasan, 'topik', rm.topik, 'durasi', rm.durasi,
    'cover_url', rm.cover_url, 'career_id', rm.career_id, 'career_nama', rm.cnama, 'riasec', rm.riasec, 'jenjang_target', rm.jenjang_target,
    'penulis', jsonb_build_object('nama', rm.nama, 'peran', rm.peran, 'foto', rm.foto, 'terverifikasi', rm.verif, 'mentor_id', rm.mid),
    'plus', plus, 'ada_pdf', rm.pdf_path is not null, 'pdf_path', case when plus then rm.pdf_path end, 'status', rm.status,
    'jumlah_langkah', (select count(*) from roadmap_langkah where roadmap_id = rm.id),
    'terkunci', case when plus then 0 else greatest(0, (select count(*) from roadmap_langkah where roadmap_id = rm.id) - bebas) end,
    'langkah', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'urut', l.urut, 'judul', l.judul, 'isi', l.isi, 'perkiraan', l.perkiraan,
                 'tautan_tipe', l.tautan_tipe, 'tautan_id', l.tautan_id,
                 'selesai', exists(select 1 from roadmap_progres p where p.langkah_id = l.id and p.user_id = uid)) order by l.urut)
               from (select * from roadmap_langkah where roadmap_id = rm.id order by urut limit case when plus then 1000 else bebas end) l), '[]'::jsonb)
  ) into res;
  return res;
end $function$;
revoke all on function public.roadmap_detail(text) from public;
grant execute on function public.roadmap_detail(text) to anon, authenticated;

-- ── Centang langkah (hanya langkah yang boleh dilihat) ─────────────────────
create or replace function public.tandai_langkah(p_langkah uuid, p_selesai boolean)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare uid uuid := auth.uid(); l record; posisi int;
begin
  if uid is null then raise exception 'auth required' using errcode = '42501'; end if;
  select rl.*, r.status into l from roadmap_langkah rl join roadmaps r on r.id = rl.roadmap_id where rl.id = p_langkah;
  if l.id is null or l.status <> 'terbit' then raise exception 'langkah tidak ditemukan'; end if;
  select count(*) into posisi from roadmap_langkah where roadmap_id = l.roadmap_id and urut <= l.urut;
  if posisi > 2 and not is_premium(uid) then
    raise exception 'KUOTA_ROADMAP: Langkah lengkap roadmap tersedia di Talentika Plus.' using errcode = 'P0001';
  end if;
  if p_selesai then
    insert into roadmap_progres (user_id, langkah_id) values (uid, p_langkah) on conflict do nothing;
  else
    delete from roadmap_progres where user_id = uid and langkah_id = p_langkah;
  end if;
  return p_selesai;
end $function$;
revoke all on function public.tandai_langkah(uuid, boolean) from public, anon;
grant execute on function public.tandai_langkah(uuid, boolean) to authenticated;

-- ── PDF lampiran: bucket privat, hanya Plus (dan admin) yang bisa membuka ──
insert into storage.buckets (id, name, public) values ('roadmap', 'roadmap', false) on conflict (id) do nothing;
drop policy if exists roadmap_pdf_baca_plus on storage.objects;
drop policy if exists roadmap_pdf_admin on storage.objects;
create policy roadmap_pdf_baca_plus on storage.objects for select to authenticated
  using (bucket_id = 'roadmap' and (is_premium(auth.uid()) or has_role(auth.uid(), 'admin'::user_role)));
create policy roadmap_pdf_admin on storage.objects for all to authenticated
  using (bucket_id = 'roadmap' and has_role(auth.uid(), 'admin'::user_role))
  with check (bucket_id = 'roadmap' and has_role(auth.uid(), 'admin'::user_role));

-- admin dapat melihat progres (jumlah siswa yang memulai roadmap)
drop policy if exists roadmap_progres_admin on public.roadmap_progres;
create policy roadmap_progres_admin on public.roadmap_progres for select to authenticated using (has_role(auth.uid(), 'admin'::user_role));
