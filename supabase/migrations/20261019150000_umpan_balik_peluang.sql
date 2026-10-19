-- Umpan balik "Relevan / Tidak relevan" untuk rekomendasi peluang (web & app).
-- Satu jawaban per siswa per peluang (bisa diubah). Siswa hanya melihat
-- jawabannya sendiri; admin melihat ringkasan lewat admin_kesenjangan_peluang().
create table if not exists public.umpan_balik_peluang (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.scraped_content(id) on delete cascade,
  relevan boolean not null,
  skor int,
  dibuat_pada timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);
alter table public.umpan_balik_peluang enable row level security;
drop policy if exists ubp_select_own on public.umpan_balik_peluang;
drop policy if exists ubp_insert_own on public.umpan_balik_peluang;
drop policy if exists ubp_update_own on public.umpan_balik_peluang;
drop policy if exists ubp_delete_own on public.umpan_balik_peluang;
create policy ubp_select_own on public.umpan_balik_peluang for select to authenticated using (user_id = auth.uid());
create policy ubp_insert_own on public.umpan_balik_peluang for insert to authenticated with check (user_id = auth.uid());
create policy ubp_update_own on public.umpan_balik_peluang for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ubp_delete_own on public.umpan_balik_peluang for delete to authenticated using (user_id = auth.uid());

-- Kesenjangan katalog + ringkasan umpan balik per tipe RIASEC siswa
create or replace function public.admin_kesenjangan_peluang()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare res jsonb;
begin
  if not has_role(auth.uid(), 'admin'::user_role) then
    raise exception 'khusus admin' using errcode = '42501';
  end if;
  with h(huruf, tipe, ord) as (values ('R','realistic',1),('I','investigative',2),('A','artistic',3),('S','social',4),('E','enterprising',5),('C','conventional',6)),
  j(jenjang) as (values ('smp'),('sma_smk'),('kuliah'),('lulusan')),
  o as (
    select upper(coalesce(riasec,'')) kode, coalesce(jenjang_target, '{}') jt
    from scraped_content
    where is_active and (deadline is null or deadline > now()) and coalesce(wilayah_peserta,'') <> 'terbatas'
  ),
  s as (
    select i.user_id, i.tipe_utama, case p.jenjang when 'smk' then 'sma_smk' else p.jenjang end jenjang
    from identitas_siswa i left join profiles p on p.user_id = i.user_id
  ),
  ub as (
    select s.tipe_utama, u.relevan from umpan_balik_peluang u join s on s.user_id = u.user_id
  )
  select jsonb_build_object(
    'baris', (select jsonb_agg(jsonb_build_object(
        'huruf', h.huruf, 'tipe', h.tipe,
        'siswa', (select count(*) from s where s.tipe_utama = h.tipe),
        'peluang', (select count(*) from o where position(h.huruf in left(o.kode, 2)) > 0),
        'relevan', (select count(*) from ub where ub.tipe_utama = h.tipe and ub.relevan),
        'tidak_relevan', (select count(*) from ub where ub.tipe_utama = h.tipe and not ub.relevan),
        'per_jenjang', (select jsonb_object_agg(j.jenjang, jsonb_build_object(
            'siswa', (select count(*) from s where s.tipe_utama = h.tipe and s.jenjang = j.jenjang),
            'peluang', (select count(*) from o where position(h.huruf in left(o.kode, 2)) > 0
                                                and (cardinality(o.jt) = 0 or j.jenjang = any(o.jt))))) from j)
      ) order by h.ord) from h),
    'umum', (select count(*) from o where o.kode = ''),
    'tanpa_jenjang_siswa', (select count(*) from s where s.jenjang is null),
    'total_peluang', (select count(*) from o),
    'total_siswa', (select count(*) from s),
    'umpan_balik', jsonb_build_object(
      'relevan', (select count(*) from umpan_balik_peluang where relevan),
      'tidak_relevan', (select count(*) from umpan_balik_peluang where not relevan),
      'paling_tidak_relevan', coalesce((select jsonb_agg(x) from (
          select jsonb_build_object('judul', sc.title, 'tidak', count(*)) x
          from umpan_balik_peluang u join scraped_content sc on sc.id = u.opportunity_id
          where not u.relevan group by sc.title order by count(*) desc limit 5) q), '[]'::jsonb))
  ) into res;
  return res;
end $function$;
revoke all on function public.admin_kesenjangan_peluang() from public, anon;
grant execute on function public.admin_kesenjangan_peluang() to authenticated;
