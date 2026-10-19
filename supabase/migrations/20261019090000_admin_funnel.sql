-- Panel funnel di Admin: dari daftar sampai berbayar, per kohort pendaftaran.
-- Hanya admin. Angka dihitung langsung dari tabel yang sama dengan yang
-- dipakai web & aplikasi, jadi tidak perlu event analitik tambahan.
create or replace function public.admin_funnel(p_hari int default null)
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

  with k as (  -- kohort: siswa yang mendaftar dalam p_hari terakhir (null = semua)
    select p.user_id, p.onboarding_done, p.career_target, p.tujuan
    from profiles p
    where p.role = 'student'
      and (p_hari is null or p.created_at > now() - make_interval(days => p_hari))
  ), tahap as (
    select
      (select count(*) from k) daftar,
      (select count(*) from k where exists (select 1 from identitas_siswa i where i.user_id = k.user_id)) tes,
      (select count(*) from k where k.career_target is not null) karier,
      (select count(*) from k where k.tujuan is not null) tujuan,
      (select count(*) from k where exists (select 1 from learning_progress l where l.user_id = k.user_id)) belajar,
      (select count(*) from k where exists (select 1 from learning_progress l where l.user_id = k.user_id and l.status = 'completed')) selesai,
      (select count(*) from k where exists (select 1 from saved_opportunities s where s.user_id = k.user_id)
                                 or exists (select 1 from peluang_dibuka d where d.user_id = k.user_id)) peluang,
      (select count(*) from k where exists (select 1 from projects pr where pr.user_id = k.user_id)) proyek,
      (select count(*) from k where k.onboarding_done) app,
      (select count(*) from k where exists (select 1 from payment_transactions t where t.user_id = k.user_id
                                              and t.status in ('completed','paid','success','settlement'))) bayar
  )
  select jsonb_build_object(
    'hari', p_hari,
    'tahap', jsonb_build_array(
      jsonb_build_object('key','daftar','label','Daftar akun','n',daftar),
      jsonb_build_object('key','tes','label','Tes RIASEC','n',tes),
      jsonb_build_object('key','karier','label','Pilih target karier','n',karier),
      jsonb_build_object('key','tujuan','label','Isi tujuan','n',tujuan),
      jsonb_build_object('key','belajar','label','Mulai belajar','n',belajar),
      jsonb_build_object('key','selesai','label','Selesai ≥1 materi','n',selesai),
      jsonb_build_object('key','peluang','label','Buka / simpan peluang','n',peluang),
      jsonb_build_object('key','proyek','label','Buat proyek','n',proyek),
      jsonb_build_object('key','app','label','Onboarding di aplikasi','n',app),
      jsonb_build_object('key','bayar','label','Bayar Plus','n',bayar)),
    'kpi', jsonb_build_object(
      'aktif_7', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
      'aktif_30', (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
      'daftar_30', (select count(*) from profiles where role = 'student' and created_at > now() - interval '30 days'),
      'notif_7', (select count(*) from notifications where created_at > now() - interval '7 days'),
      'plus_aktif', (select count(*) from profiles p where p.role = 'student' and is_premium(p.user_id)),
      'transaksi_berhasil', (select count(*) from payment_transactions where status in ('completed','paid','success','settlement')),
      'peluang_terbuka', (select count(*) from scraped_content where is_active and (deadline is null or deadline > now()))),
    'mingguan', coalesce((select jsonb_agg(jsonb_build_object('minggu', to_char(w, 'DD Mon'), 'daftar', n) order by w)
                 from (select date_trunc('week', created_at) w, count(*) n from profiles
                       where role = 'student' and created_at > now() - interval '12 weeks' group by 1) x), '[]'::jsonb)
  ) into res from tahap;
  return res;
end $function$;
revoke all on function public.admin_funnel(int) from public, anon;
grant execute on function public.admin_funnel(int) to authenticated;
revoke all on function public.batasi_proyek_free() from public, anon, authenticated;
