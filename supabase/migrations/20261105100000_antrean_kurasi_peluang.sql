-- Antrean kurasi peluang: peluang aktif yang belum lengkap (tenggat, kode RIASEC,
-- bidang, poster), diurutkan dari yang paling sering dilihat siswa.

alter table public.scraped_content
  add column if not exists tanpa_tenggat boolean not null default false;
comment on column public.scraped_content.tanpa_tenggat is
  'Admin sudah memeriksa: peluang ini memang tidak punya tenggat (dibuka sepanjang tahun / bergulir).';

create or replace function public.antrean_kurasi_peluang()
returns table (
  id uuid, title text, organizer text, url text, opportunity_type text, opportunity_field text,
  riasec text, deadline timestamptz, tanpa_tenggat boolean, poster_url text, created_at timestamptz,
  dilihat_30h bigint, diklik_30h bigint, disimpan bigint, kurang text[]
)
language plpgsql stable security definer set search_path to 'public' as $$
#variable_conflict use_column
begin
  if not exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'::user_role) then
    raise exception 'Khusus admin' using errcode = '42501';
  end if;
  return query
  with ev as (
    select oe.opportunity_id,
           count(*) filter (where oe.event_type = 'viewed') as v,
           count(*) filter (where oe.event_type = 'clicked') as k
    from public.opportunity_events oe
    where oe.created_at > now() - interval '30 days'
    group by 1
  ), sv as (
    select so.opportunity_id::text as oid, count(*) as n from public.saved_opportunities so group by 1
  ), dasar as (
    select sc.*, coalesce(ev.v, 0) as v, coalesce(ev.k, 0) as k, coalesce(sv.n, 0) as s,
      array_remove(array[
        case when sc.deadline is null and not sc.tanpa_tenggat then 'tenggat' end,
        case when nullif(btrim(sc.riasec), '') is null then 'riasec' end,
        case when coalesce(sc.opportunity_field, 'umum') = 'umum' then 'bidang' end,
        case when nullif(btrim(sc.poster_url), '') is null then 'poster' end
      ], null) as kurang
    from public.scraped_content sc
    left join ev on ev.opportunity_id = sc.id
    left join sv on sv.oid = sc.id::text
    where sc.is_active
  )
  select d.id, d.title, d.organizer, d.url, d.opportunity_type, d.opportunity_field, d.riasec, d.deadline,
         d.tanpa_tenggat, d.poster_url, d.created_at, d.v, d.k, d.s, d.kurang
  from dasar d
  where cardinality(d.kurang) > 0
  order by (d.v + 3 * d.k + 5 * d.s) desc, cardinality(d.kurang) desc, d.created_at desc;
end;
$$;

revoke all on function public.antrean_kurasi_peluang() from public, anon;
grant execute on function public.antrean_kurasi_peluang() to authenticated;
