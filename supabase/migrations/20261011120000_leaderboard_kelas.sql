-- Peringkat XP hanya untuk teman sekelas (sekolah + kelas yang sama).
-- Nama ditampilkan "Depan B." saja; siswa yang memilih disembunyikan
-- (profiles.app_prefs->>'hide_leaderboard' = 'true') tidak terlihat oleh orang lain.
create or replace function public.leaderboard_kelas(p_limit int default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_school text;
  v_class text;
  v_rows jsonb;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select sm.school_code, sm.class_label into v_school, v_class
  from school_members sm
  where sm.student_user_id = v_uid and coalesce(sm.status, 'active') = 'active'
  order by sm.joined_at desc nulls last
  limit 1;

  if v_school is null then
    return jsonb_build_object('status', 'no_school');
  end if;
  if v_class is null or btrim(v_class) = '' then
    return jsonb_build_object('status', 'no_class');
  end if;

  with kelas as (
    select sm.student_user_id as uid,
           coalesce(ux.total_xp_earned, 0) as xp,
           coalesce(nullif(split_part(btrim(p.full_name), ' ', 1), ''), 'Siswa')
             || coalesce(' ' || left(nullif(split_part(btrim(p.full_name), ' ', 2), ''), 1) || '.', '') as nama
    from school_members sm
    join profiles p on p.user_id = sm.student_user_id
    left join user_xp ux on ux.user_id = sm.student_user_id
    where upper(sm.school_code) = upper(v_school)
      and sm.class_label = v_class
      and coalesce(sm.status, 'active') = 'active'
      and (sm.student_user_id = v_uid or coalesce(p.app_prefs->>'hide_leaderboard', 'false') <> 'true')
  ), ranked as (
    select *, rank() over (order by xp desc) as rnk from kelas
  )
  select jsonb_agg(jsonb_build_object('rank', rnk, 'name', nama, 'xp', xp, 'is_me', uid = v_uid) order by rnk)
    into v_rows
  from ranked
  where rnk <= greatest(1, least(p_limit, 50)) or uid = v_uid;

  return jsonb_build_object('status', 'ok', 'class', v_class, 'rows', coalesce(v_rows, '[]'::jsonb));
end;
$$;

revoke all on function public.leaderboard_kelas(int) from public, anon;
grant execute on function public.leaderboard_kelas(int) to authenticated;
