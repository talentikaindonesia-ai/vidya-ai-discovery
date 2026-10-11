-- Hasil assessment app = hasil web. Tes RIASEC web adalah acuan.
--
-- Sebelumnya app menurunkan "tipe talenta" dari 5 sumbu Talent DNA, dan sumbu
-- itu dikonversi dari skor RIASEC dengan rumus yang tidak menjaga peringkat:
-- 16 dari 103 siswa mendapat tipe yang berbeda dari hasil tes web-nya
-- (mis. Konvensional → Leadership, Investigatif → Creative).
--
-- Sekarang:
--  * Modul "personality" di app ADALAH tes RIASEC web (soal, bobot, pemutus
--    seri, dan baris assessment_results yang sama persis).
--  * Bila siswa punya hasil RIASEC, sumbu Talent DNA diturunkan darinya dan
--    sumbu milik tipe utama dijamin tertinggi. Modul app lain hanya
--    memperhalus (bobot 40%), tidak pernah membalik tipe utama.
--  * my_talent_dna & ringkasan untuk orang tua/mentor/profil publik ikut
--    membawa identitas RIASEC (label + kode Holland), bukan tebakan dari sumbu.

-- ── Ringkasan identitas RIASEC (dari view kanonik identitas_siswa) ─────────
create or replace function public.riasec_ringkas(p_uid uuid, p_lengkap boolean default false)
returns jsonb
language sql
stable
set search_path to 'public'
as $$
  select case when i.tipe_utama is null then null
    when p_lengkap then jsonb_build_object(
      'tipe_utama', i.tipe_utama, 'tipe_kedua', i.tipe_kedua, 'tipe_ketiga', i.tipe_ketiga,
      'holland_code', i.holland_code, 'margin', i.margin, 'keyakinan', coalesce(i.keyakinan, 'kuat'),
      'score_breakdown', i.score_breakdown, 'career_recommendations', i.career_recommendations,
      'diperbarui_pada', i.diperbarui_pada, 'jumlah_tes', i.jumlah_tes)
    else jsonb_build_object(
      'tipe_utama', i.tipe_utama, 'tipe_kedua', i.tipe_kedua, 'tipe_ketiga', i.tipe_ketiga,
      'holland_code', i.holland_code, 'keyakinan', coalesce(i.keyakinan, 'kuat'))
  end
  from identitas_siswa i where i.user_id = p_uid
$$;
-- hanya dipanggil dari fungsi SECURITY DEFINER lain (yang sudah memeriksa hak akses)
revoke all on function public.riasec_ringkas(uuid, boolean) from public, anon, authenticated;

-- ── Sumbu Talent DNA: RIASEC web sebagai acuan ─────────────────────────────
create or replace function public.dna_axes_for(p_uid uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  a jsonb; sb jsonb; tu text; res jsonb; prim text; lain numeric;
  mx numeric; r numeric; i numeric; ar numeric; s numeric; e numeric; c numeric;
begin
  -- rata-rata modul app (tanpa "personality": modul itu = tes RIASEC di bawah)
  select jsonb_build_object(
    'analytical', avg((axes->>'analytical')::numeric),
    'creative', avg((axes->>'creative')::numeric),
    'leadership', avg((axes->>'leadership')::numeric),
    'technology', avg((axes->>'technology')::numeric),
    'communication', avg((axes->>'communication')::numeric))
  into a from talent_dna_modules_done where user_id = p_uid and module_key <> 'personality';
  if a->>'analytical' is null then a := null; end if;

  select score_breakdown, tipe_utama into sb, tu from identitas_siswa where user_id = p_uid;
  if sb is null or jsonb_typeof(sb) <> 'object' then
    if a is null then return null; end if;
    return (select jsonb_object_agg(key, round(value::numeric)) from jsonb_each_text(a));
  end if;

  r := coalesce((sb->>'realistic')::numeric,0);  i := coalesce((sb->>'investigative')::numeric,0);
  ar := coalesce((sb->>'artistic')::numeric,0);  s := coalesce((sb->>'social')::numeric,0);
  e := coalesce((sb->>'enterprising')::numeric,0); c := coalesce((sb->>'conventional')::numeric,0);
  mx := greatest(r,i,ar,s,e,c,1);
  -- greatest(): sumbu gabungan tidak boleh lebih rendah dari huruf terkuatnya,
  -- kalau tidak Konvensional murni bisa kalah oleh Enterprising yang lebih kecil.
  res := jsonb_build_object(
    'analytical',    40 + 55*greatest(i,c)/mx,
    'creative',      40 + 55*ar/mx,
    'leadership',    40 + 55*e/mx,
    'technology',    40 + 55*greatest(r, r*0.6 + i*0.4)/mx,
    'communication', 40 + 55*s/mx);

  if a is not null then
    res := (select jsonb_object_agg(k.key, 0.6*k.value::numeric + 0.4*coalesce((a->>k.key)::numeric, k.value::numeric))
            from jsonb_each_text(res) k);
  end if;
  res := (select jsonb_object_agg(key, round(value::numeric)) from jsonb_each_text(res));

  -- tipe utama web harus tetap jadi sumbu teratas (seri diputus ke tipe utama)
  prim := case tu
    when 'realistic' then 'technology' when 'investigative' then 'analytical'
    when 'artistic' then 'creative' when 'social' then 'communication'
    when 'enterprising' then 'leadership' when 'conventional' then 'analytical' end;
  if prim is not null then
    select max(value::numeric) into lain from jsonb_each_text(res) where key <> prim;
    if (res->>prim)::numeric <= lain then
      res := jsonb_set(res, array[prim], to_jsonb(least(100, lain + 1)));
    end if;
  end if;
  return res;
exception when others then return null;
end $function$;

-- ── my_talent_dna: + identitas RIASEC; modul personality = tes RIASEC ─────
create or replace function public.my_talent_dna()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare uid uuid := auth.uid(); res jsonb; rs jsonb; ada boolean;
begin
  if uid is null then return null; end if;
  rs := riasec_ringkas(uid, true);
  ada := rs is not null;
  select jsonb_build_object(
    'modules', coalesce((select jsonb_agg(jsonb_build_object(
        'key', m.module_key,
        -- personality = 8 soal tes RIASEC web (soal pemutus tidak dihitung)
        'total', case when m.module_key = 'personality' then 8 else m.total end,
        'answered', case when m.module_key = 'personality' then case when ada then 8 else 0 end
                    else coalesce((select count(*) from talent_dna_answers a where a.user_id = uid and a.module_key = m.module_key),0) end,
        'done', case when m.module_key = 'personality' then ada
                else exists(select 1 from talent_dna_modules_done d where d.user_id = uid and d.module_key = m.module_key) end,
        'free', modul_dna_gratis(m.module_key)) order by m.ord)
      from (select module_key, count(*) total,
              array_position(array['personality','interest','strength','aptitude','learning_style','career_interest','future_skills','values'], module_key) ord
            from talent_dna_items group by module_key) m), '[]'::jsonb),
    'axes', dna_axes_for(uid),
    'riasec', rs,
    'legacy_riasec', ada,
    'projects', (select count(*) from projects where user_id = uid),
    'updated_at', greatest((select max(completed_at) from talent_dna_modules_done where user_id = uid), (rs->>'diperbarui_pada')::timestamptz)
  ) into res;
  return res;
end $function$;

-- ── Orang tua: ringkasan anak ikut membawa identitas RIASEC ────────────────
create or replace function public.ringkasan_anak(p_student uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare uid uuid := auth.uid(); sh jsonb; res jsonb; r jsonb;
begin
  if not exists (select 1 from parent_links where parent_user_id = uid and student_user_id = p_student and status = 'active') then
    raise exception 'tidak terhubung' using errcode='42501';
  end if;
  select parent into sh from sharing_settings where user_id = p_student;
  sh := coalesce(sh, '{"dna":true,"ach":true,"proj":true,"opps":true,"learn":true}'::jsonb);
  r := readiness_for(p_student);
  res := jsonb_build_object(
    'name', (select full_name from profiles where user_id = p_student),
    'school', (select school_name from profiles where user_id = p_student),
    'career_target', (select career_target from profiles where user_id = p_student),
    'readiness', r->'score',
    'shared', sh);
  if (sh->>'dna')::boolean then res := res || jsonb_build_object('axes', dna_axes_for(p_student), 'riasec', riasec_ringkas(p_student)); end if;
  if (sh->>'learn')::boolean then res := res || jsonb_build_object('learning_active',
      (select count(*) from learning_progress where user_id = p_student and status <> 'completed'),
      'learning_done', (select count(*) from learning_progress where user_id = p_student and status = 'completed')); end if;
  if (sh->>'proj')::boolean then res := res || jsonb_build_object('projects', (select count(*) from projects where user_id = p_student)); end if;
  if (sh->>'ach')::boolean then res := res || jsonb_build_object('achievements', coalesce((select jsonb_agg(jsonb_build_object('title',title,'event',event,'year',year,'medal',medal,'verified',verified) order by year desc, created_at desc) from user_achievements where user_id = p_student), '[]'::jsonb)); end if;
  if (sh->>'opps')::boolean then res := res || jsonb_build_object('opportunities', coalesce((select jsonb_agg(jsonb_build_object('title',opportunity_title,'deadline',deadline,'status',status) order by deadline nulls last) from saved_opportunities where user_id = p_student and status not in ('accepted','completed','rejected')), '[]'::jsonb)); end if;
  return res;
end $function$;

-- ── Profil talenta publik ──────────────────────────────────────────────────
create or replace function public.public_talent_profile(p_username text)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare p record; sh jsonb; res jsonb; boleh boolean;
begin
  select pr.user_id, pr.full_name, pr.bio, pr.school_name, pr.avatar_url, pr.usia,
         coalesce(c.name, pr.career_target) as career_target
    into p
  from profiles pr left join careers c on c.id = pr.career_target
  where lower(pr.username) = lower(p_username);
  if p.user_id is null then return null; end if;

  boleh := auth.uid() = p.user_id
        or coalesce(p.usia, 0) >= 18
        or exists (select 1 from parent_links pl where pl.student_user_id = p.user_id and pl.status = 'active');
  if not boleh then return null; end if;

  select public into sh from sharing_settings where user_id = p.user_id;
  sh := coalesce(sh, '{"dna":false,"ach":false,"proj":false,"opps":false,"learn":false}'::jsonb);
  res := jsonb_build_object('name', p.full_name, 'bio', p.bio, 'school', p.school_name, 'career_target', p.career_target,
    'avatar_url', p.avatar_url, 'shared', sh,
    'skills', coalesce((select jsonb_agg(jsonb_build_object('n',skill,'v',level) order by level desc) from user_skills where user_id = p.user_id), '[]'::jsonb));
  if (sh->>'dna')::boolean then res := res || jsonb_build_object('axes', dna_axes_for(p.user_id), 'riasec', riasec_ringkas(p.user_id)); end if;
  if (sh->>'proj')::boolean then
    res := res || jsonb_build_object('projects', coalesce((select jsonb_agg(jsonb_build_object('title',title,'solution',solution,'skills',skills,'status',status) order by updated_at desc) from projects where user_id = p.user_id and is_public), '[]'::jsonb));
  end if;
  if (sh->>'ach')::boolean then
    res := res || jsonb_build_object(
      'achievements', coalesce((select jsonb_agg(jsonb_build_object('title',title,'event',event,'year',year,'medal',medal,'verified',verified)) from user_achievements where user_id = p.user_id), '[]'::jsonb),
      'certificates', coalesce((select jsonb_agg(jsonb_build_object('title',title,'issuer',issuer,'year',extract(year from issue_date),'code',verification_code)) from certificates where user_id = p.user_id and coalesce(is_active,true)), '[]'::jsonb));
  end if;
  return res;
end $function$;

-- ── Mentor: permintaan sesi + identitas RIASEC siswa ───────────────────────
drop function if exists public.permintaan_mentor_saya();
create function public.permintaan_mentor_saya()
returns table(id uuid, session_date timestamptz, duration_minutes integer, status text, topic text,
              student_name text, student_kelas text, student_axes jsonb, student_target text, student_riasec jsonb)
language sql
stable security definer
set search_path to 'public'
as $function$
  select mb.id, mb.session_date, mb.duration_minutes, mb.status, coalesce(mb.topic, mb.notes),
         p.full_name, p.kelas,
         case when coalesce((ss.school->>'dna')::boolean, true) then dna_axes_for(mb.user_id) else null end,
         p.career_target,
         case when coalesce((ss.school->>'dna')::boolean, true) then riasec_ringkas(mb.user_id) else null end
  from mentor_bookings mb
  join mentors m on m.id = mb.mentor_id and m.user_id = auth.uid()
  left join profiles p on p.user_id = mb.user_id
  left join sharing_settings ss on ss.user_id = mb.user_id
  order by (mb.status = 'pending') desc, mb.session_date asc
  limit 100;
$function$;
revoke all on function public.permintaan_mentor_saya() from public, anon;
grant execute on function public.permintaan_mentor_saya() to authenticated;
