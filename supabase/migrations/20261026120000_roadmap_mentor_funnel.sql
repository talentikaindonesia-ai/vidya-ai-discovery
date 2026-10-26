-- Roadmap lanjutan (2026-10-26):
--  1) Mentor mengunggah roadmap sendiri dari dashboard mentor — hanya sebagai
--     draf / ditinjau. TERBIT tetap keputusan admin (kebijakan di bawah tidak
--     mengizinkan mentor menyetel status 'terbit' atau mengubah roadmap terbit).
--  2) Funnel per roadmap: dilihat → dimulai → ≥50% → selesai, + umpan balik.

-- ── 1. Mentor sebagai penulis ──────────────────────────────────────────────
create or replace function public.mentor_milik(p_mentor uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$ select exists (select 1 from mentors m where m.id = p_mentor and m.user_id = auth.uid()) $$;
revoke all on function public.mentor_milik(uuid) from public, anon;
grant execute on function public.mentor_milik(uuid) to authenticated;

drop policy if exists roadmaps_mentor_baca on public.roadmaps;
drop policy if exists roadmaps_mentor_tambah on public.roadmaps;
drop policy if exists roadmaps_mentor_ubah on public.roadmaps;
drop policy if exists roadmaps_mentor_hapus on public.roadmaps;
create policy roadmaps_mentor_baca on public.roadmaps for select to authenticated using (mentor_milik(mentor_id));
create policy roadmaps_mentor_tambah on public.roadmaps for insert to authenticated
  with check (mentor_milik(mentor_id) and status in ('draf','tinjau'));
create policy roadmaps_mentor_ubah on public.roadmaps for update to authenticated
  using (mentor_milik(mentor_id) and status <> 'terbit')
  with check (mentor_milik(mentor_id) and status in ('draf','tinjau'));
create policy roadmaps_mentor_hapus on public.roadmaps for delete to authenticated
  using (mentor_milik(mentor_id) and status <> 'terbit');

drop policy if exists roadmap_langkah_mentor on public.roadmap_langkah;
create policy roadmap_langkah_mentor on public.roadmap_langkah for all to authenticated
  using (exists (select 1 from roadmaps r where r.id = roadmap_id and mentor_milik(r.mentor_id) and r.status <> 'terbit'))
  with check (exists (select 1 from roadmaps r where r.id = roadmap_id and mentor_milik(r.mentor_id) and r.status <> 'terbit'));

-- ── 2. Kunjungan & umpan balik ─────────────────────────────────────────────
create table if not exists public.roadmap_kunjungan (
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  dilihat_pada timestamptz not null default now(),
  primary key (user_id, roadmap_id)
);
alter table public.roadmap_kunjungan enable row level security;
-- tidak ada kebijakan baca/tulis langsung: hanya lewat catat_lihat_roadmap() & admin_funnel_roadmap()

create or replace function public.catat_lihat_roadmap(p_roadmap uuid)
returns void
language sql
security definer
set search_path to 'public'
as $$
  insert into roadmap_kunjungan (user_id, roadmap_id)
  select auth.uid(), p_roadmap where auth.uid() is not null
    and exists (select 1 from roadmaps where id = p_roadmap and status = 'terbit')
  on conflict do nothing
$$;
revoke all on function public.catat_lihat_roadmap(uuid) from public, anon;
grant execute on function public.catat_lihat_roadmap(uuid) to authenticated;

create table if not exists public.roadmap_umpan_balik (
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  relevan boolean not null,
  dibuat_pada timestamptz not null default now(),
  primary key (user_id, roadmap_id)
);
alter table public.roadmap_umpan_balik enable row level security;
drop policy if exists rub_own_select on public.roadmap_umpan_balik;
drop policy if exists rub_own_insert on public.roadmap_umpan_balik;
drop policy if exists rub_own_update on public.roadmap_umpan_balik;
create policy rub_own_select on public.roadmap_umpan_balik for select to authenticated using (user_id = auth.uid());
create policy rub_own_insert on public.roadmap_umpan_balik for insert to authenticated with check (user_id = auth.uid());
create policy rub_own_update on public.roadmap_umpan_balik for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Funnel per roadmap — admin melihat semua, mentor melihat roadmap miliknya
create or replace function public.admin_funnel_roadmap()
returns table(roadmap_id uuid, dilihat int, dimulai int, separuh int, selesai int, relevan int, tidak_relevan int)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
begin
  return query
  with r as (
    select rm.id, (select count(*) from roadmap_langkah l where l.roadmap_id = rm.id) n
    from roadmaps rm
    where has_role(auth.uid(), 'admin'::user_role) or mentor_milik(rm.mentor_id)
  ), per as (
    select l.roadmap_id, p.user_id, count(*) d
    from roadmap_progres p join roadmap_langkah l on l.id = p.langkah_id
    group by 1, 2
  )
  select r.id,
    (select count(*)::int from roadmap_kunjungan k where k.roadmap_id = r.id),
    (select count(*)::int from per where per.roadmap_id = r.id),
    (select count(*)::int from per where per.roadmap_id = r.id and r.n > 0 and per.d * 2 >= r.n),
    (select count(*)::int from per where per.roadmap_id = r.id and r.n > 0 and per.d >= r.n),
    (select count(*)::int from roadmap_umpan_balik u where u.roadmap_id = r.id and u.relevan),
    (select count(*)::int from roadmap_umpan_balik u where u.roadmap_id = r.id and not u.relevan)
  from r;
end $function$;
revoke all on function public.admin_funnel_roadmap() from public, anon;
grant execute on function public.admin_funnel_roadmap() to authenticated;
