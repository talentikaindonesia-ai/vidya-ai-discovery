-- Satu mesin pencocokan peluang untuk web DAN aplikasi.
--
-- Dulu web (OpportunityBoard: kata kunci + bidang) dan app (oppMatch: sumbu
-- Talent DNA + bidang karier) menghitung kecocokan dengan cara berbeda,
-- sehingga siswa yang sama melihat urutan & "% cocok" berbeda. Sekarang
-- keduanya membaca peluang_untukku().
--
--   RIASEC   40  kode Holland siswa × kode Holland peluang (BOBOT_HURUF web)
--   Jenjang  20  cocok = 20, peluang tanpa jenjang = 10, tidak cocok = −30;
--                siswa belum isi jenjang → dianggap pelajar (khusus kuliah/lulusan −15)
--   Tujuan   15  jenis peluang sesuai jenis_peluang_untuk_tujuan()
--   Wilayah  15  program Indonesia 15, internasional 10; 'terbatas' disembunyikan
--   Tenggat  10  ≤30 hari 10, ≤90 hari 7, lainnya 4

alter table public.scraped_content
  add column if not exists riasec text,
  add column if not exists wilayah_peserta text
    check (wilayah_peserta is null or wilayah_peserta in ('indonesia','internasional','terbatas'));
comment on column public.scraped_content.riasec is 'Kode Holland peluang (1–3 huruf, mis. "IR"); null = umum, cocok untuk semua tipe';
comment on column public.scraped_content.wilayah_peserta is 'indonesia = khusus pelajar Indonesia; internasional = terbuka termasuk Indonesia; terbatas = tidak terbuka untuk pelajar Indonesia (tidak direkomendasikan)';

create or replace function public.peluang_untukku()
returns table(id uuid, skor int, alasan text[], cocok_tipe boolean)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  huruf text[] := '{}';            -- huruf Holland siswa, urut kekuatan
  label text[] := '{}';
  jen text; tuj text; jenis text[];
  bobot numeric[] := array[1, 0.6, 0.35];
begin
  if uid is not null then
    select array_remove(array[upper(left(i.tipe_utama,1)), upper(left(i.tipe_kedua,1)), upper(left(i.tipe_ketiga,1))], null),
           array_remove(array[i.tipe_utama, i.tipe_kedua, i.tipe_ketiga], null)
      into huruf, label
      from identitas_siswa i where i.user_id = uid;
    select case p.jenjang when 'smk' then 'sma_smk' else p.jenjang end, p.tujuan into jen, tuj
      from profiles p where p.user_id = uid;
  end if;
  huruf := coalesce(huruf, '{}'); label := coalesce(label, '{}');
  jenis := jenis_peluang_untuk_tujuan(tuj);

  return query
  with o as (
    select s.id, s.opportunity_type, s.jenjang_target, s.wilayah_peserta, s.deadline,
           upper(coalesce(nullif(trim(s.riasec), ''), '')) as kode,
           case when s.deadline is null then null else greatest(0, (s.deadline::date - (now() at time zone 'Asia/Jakarta')::date)) end as hari
    from scraped_content s
    where s.is_active and (s.deadline is null or s.deadline > now())
      and coalesce(s.wilayah_peserta, '') <> 'terbatas'
  ), r as (
    -- kecocokan RIASEC: Σ bobot huruf siswa × bobot posisi huruf peluang (maks 1)
    select o.id,
      (select least(1, coalesce(sum(bobot[array_position(huruf, substr(o.kode, j, 1))] * bobot[j]), 0))
         from generate_series(1, least(length(o.kode), 3)) j
         where array_position(huruf, substr(o.kode, j, 1)) is not null) as m,
      (select label[min(array_position(huruf, substr(o.kode, j, 1)))]
         from generate_series(1, least(length(o.kode), 3)) j
         where array_position(huruf, substr(o.kode, j, 1)) is not null) as tipe_cocok
    from o
  )
  select o.id,
    greatest(5, least(99,
        (case when o.kode = '' or cardinality(huruf) = 0 then 15 else round(40 * r.m) end)
      + (case when coalesce(cardinality(o.jenjang_target), 0) = 0 then 10
              -- jenjang belum diisi: pengguna Talentika umumnya pelajar, jadi
              -- peluang khusus mahasiswa/lulusan diturunkan sampai jenjang diisi
              when jen is null then (case when o.jenjang_target && array['smp','sma_smk'] then 10 else -15 end)
              when jen = any(o.jenjang_target) then 20 else -30 end)
      + (case when cardinality(jenis) = 0 then 7 when o.opportunity_type = any(jenis) then 15 else 3 end)
      + (case o.wilayah_peserta when 'indonesia' then 15 when 'internasional' then 10 else 8 end)
      + (case when o.hari is null then 4 when o.hari <= 30 then 10 when o.hari <= 90 then 7 else 4 end)
    ))::int as skor,
    (array_remove(array[
      case when r.m >= 0.6 and r.tipe_cocok is not null then 'tipe:' || r.tipe_cocok end,
      case when jen is not null and jen = any(o.jenjang_target) then 'jenjang:' || jen end,
      case when cardinality(jenis) > 0 and o.opportunity_type = any(jenis) then 'tujuan:' || tuj end,
      case when o.wilayah_peserta = 'indonesia' then 'wilayah:indonesia' end,
      case when o.hari is not null and o.hari <= 30 then 'tenggat:' || o.hari end
    ], null))[1:3] as alasan,
    coalesce(r.m >= 0.6, false) as cocok_tipe
  from o join r on r.id = o.id
  order by 2 desc;
end $function$;
revoke all on function public.peluang_untukku() from public;
grant execute on function public.peluang_untukku() to anon, authenticated;

-- Kesenjangan katalog: peluang per huruf RIASEC × jenjang dibanding jumlah siswa
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
    select i.tipe_utama, case p.jenjang when 'smk' then 'sma_smk' else p.jenjang end jenjang
    from identitas_siswa i left join profiles p on p.user_id = i.user_id
  )
  select jsonb_build_object(
    'baris', (select jsonb_agg(jsonb_build_object(
        'huruf', h.huruf, 'tipe', h.tipe,
        'siswa', (select count(*) from s where s.tipe_utama = h.tipe),
        'peluang', (select count(*) from o where position(h.huruf in left(o.kode, 2)) > 0),
        'per_jenjang', (select jsonb_object_agg(j.jenjang, jsonb_build_object(
            'siswa', (select count(*) from s where s.tipe_utama = h.tipe and s.jenjang = j.jenjang),
            'peluang', (select count(*) from o where position(h.huruf in left(o.kode, 2)) > 0
                                                and (cardinality(o.jt) = 0 or j.jenjang = any(o.jt))))) from j)
      ) order by h.ord) from h),
    'umum', (select count(*) from o where o.kode = ''),
    'tanpa_jenjang_siswa', (select count(*) from s where s.jenjang is null),
    'total_peluang', (select count(*) from o),
    'total_siswa', (select count(*) from s)
  ) into res;
  return res;
end $function$;
revoke all on function public.admin_kesenjangan_peluang() from public, anon;
grant execute on function public.admin_kesenjangan_peluang() to authenticated;
