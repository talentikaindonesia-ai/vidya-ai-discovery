-- Commerce Fase 2: masa tenggang 3 hari, status langganan, pengingat perpanjangan,
-- dan perlindungan URL materi kelas premium.

-- ── 1. Status langganan Plus ────────────────────────────────────────────
-- Perpanjangan manual: setelah masa aktif habis, akses tetap jalan 3 hari
-- (masa tenggang) supaya pengguna sempat membayar. Tidak berlaku untuk
-- langganan yang dibatalkan sendiri atau masa coba.

create or replace function public.tenggang_plus() returns interval
language sql immutable as $$ select interval '3 days' $$;

create or replace function public.langganan_dibatalkan(uid uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select coalesce((
    select us.status = 'cancelled' from public.user_subscriptions us
    where us.user_id = uid order by us.created_at desc limit 1
  ), false);
$$;

-- active | grace | trial | paused | cancelled (masih aktif, tak diperpanjang) | expired | none
create or replace function public.status_plus(uid uuid) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare
  p record;
  v_batal boolean := public.langganan_dibatalkan(uid);
  v_jeda boolean;
  v_state text;
  v_tenggang timestamptz;
begin
  select subscription_status, subscription_type, subscription_end_date into p
    from public.profiles where user_id = uid;
  select exists (select 1 from public.user_subscriptions where user_id = uid and paused_at is not null) into v_jeda;

  if v_jeda then v_state := 'paused';
  elsif p.subscription_status = 'trial' and (p.subscription_end_date is null or p.subscription_end_date > now()) then v_state := 'trial';
  elsif p.subscription_status = 'active' and coalesce(p.subscription_type, '') <> 'free' then
    if p.subscription_end_date is null or p.subscription_end_date > now() then
      v_state := case when v_batal then 'cancelled' else 'active' end;
    elsif not v_batal and p.subscription_end_date + public.tenggang_plus() > now() then
      v_state := 'grace';
      v_tenggang := p.subscription_end_date + public.tenggang_plus();
    else v_state := 'expired';
    end if;
  elsif p.subscription_end_date is not null then v_state := 'expired';
  else v_state := 'none';
  end if;

  return jsonb_build_object('state', v_state, 'berakhir', p.subscription_end_date, 'tenggang_sampai', v_tenggang);
end;
$$;

create or replace function public.is_premium(uid uuid)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = uid
        AND coalesce(p.subscription_type, '') <> 'free'
        AND (
          (p.subscription_status = 'trial' AND (p.subscription_end_date IS NULL OR p.subscription_end_date > now()))
          OR (p.subscription_status = 'active' AND (
                p.subscription_end_date IS NULL OR p.subscription_end_date > now()
                OR (p.subscription_end_date + public.tenggang_plus() > now() AND NOT public.langganan_dibatalkan(uid))))
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.entitlements e
      WHERE e.user_id = uid AND e.feature_code = 'plus_access'
        AND e.revoked_at IS NULL AND e.starts_at <= now()
        AND (e.expires_at IS NULL OR e.expires_at > now()
             OR (e.source_type = 'subscription' AND e.expires_at + public.tenggang_plus() > now()
                 AND NOT public.langganan_dibatalkan(uid)))
    )
    OR EXISTS (
      SELECT 1 FROM public.school_members sm
      WHERE sm.student_user_id = uid AND sm.status = 'active'
        AND EXISTS (SELECT 1 FROM public.profiles sa
                    WHERE sa.role = 'school_admin'
                      AND upper(sa.school_code) = upper(sm.school_code)
                      AND coalesce(sa.account_verified, false))
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = uid AND ur.role = 'admin'::user_role
    );
$function$;

create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path to 'public' as $function$
  WITH s AS (SELECT public.status_plus(auth.uid()) AS j)
  SELECT jsonb_build_object(
    'is_premium', public.is_premium(auth.uid()),
    'source', CASE
      WHEN EXISTS (SELECT 1 FROM public.user_roles ur
                   WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role) THEN 'admin'
      WHEN (SELECT j->>'state' FROM s) IN ('active', 'grace', 'cancelled') THEN 'paid'
      WHEN (SELECT j->>'state' FROM s) = 'trial' THEN 'trial'
      WHEN EXISTS (SELECT 1 FROM public.school_members sm
                   WHERE sm.student_user_id = auth.uid() AND sm.status = 'active'
                     AND EXISTS (SELECT 1 FROM public.profiles sa
                                 WHERE sa.role = 'school_admin'
                                   AND upper(sa.school_code) = upper(sm.school_code)
                                   AND coalesce(sa.account_verified, false))) THEN 'school'
      ELSE NULL
    END,
    'state', (SELECT j->>'state' FROM s),
    'grace_until', (SELECT j->'tenggang_sampai' FROM s),
    'expires_at', (SELECT p.subscription_end_date FROM public.profiles p WHERE p.user_id = auth.uid()),
    'type', (SELECT p.subscription_type FROM public.profiles p WHERE p.user_id = auth.uid())
  );
$function$;

-- Turunkan setelah masa tenggang (atau langsung saat masa aktif habis bila dibatalkan).
create or replace function public.akhiri_langganan_habis() returns integer
language plpgsql security definer set search_path to 'public' as $$
declare n int;
begin
  with turun as (
    update public.profiles p set subscription_status = 'inactive'
     where p.subscription_end_date is not null
       and ((p.subscription_status = 'trial' and p.subscription_end_date < now())
         or (p.subscription_status = 'active' and (
               p.subscription_end_date + public.tenggang_plus() < now()
               or (p.subscription_end_date < now() and public.langganan_dibatalkan(p.user_id)))))
    returning p.user_id
  )
  select count(*) into n from turun;

  update public.user_subscriptions us set status = 'expired', updated_at = now()
   where us.status in ('active', 'cancelled') and us.paused_at is null
     and us.expires_at is not null
     and exists (select 1 from public.profiles p where p.user_id = us.user_id and p.subscription_status = 'inactive');
  return n;
end;
$$;

-- ── 2. Pengingat perpanjangan (notifikasi in-app + push) ────────────────
create or replace function public.ingatkan_perpanjangan() returns integer
language plpgsql security definer set search_path to 'public' as $$
declare n int;
begin
  with kandidat as (
    select p.user_id, p.subscription_end_date as akhir,
           ((p.subscription_end_date at time zone 'Asia/Jakarta')::date
             - (now() at time zone 'Asia/Jakarta')::date) as sisa
    from public.profiles p
    where p.subscription_status = 'active' and p.subscription_end_date is not null
      and coalesce(p.subscription_type, '') <> 'free'
      and not public.langganan_dibatalkan(p.user_id)
      and not exists (select 1 from public.user_subscriptions us where us.user_id = p.user_id and us.paused_at is not null)
  ), jatuh as (
    select k.*, case
      when k.akhir > now() and k.sisa in (7, 3, 1) then 'h' || k.sisa
      when k.akhir <= now() and k.akhir + public.tenggang_plus() > now() then 'tenggang'
    end as kunci
    from kandidat k
  ), baru as (
    select j.* from jatuh j
    where j.kunci is not null
      and not exists (
        select 1 from public.notifications n
        where n.user_id = j.user_id and n.metadata->>'jenis' = 'perpanjang_plus'
          and n.metadata->>'kunci' = j.kunci and n.metadata->>'akhir' = j.akhir::text)
  ), ins as (
    insert into public.notifications (user_id, title, message, type, priority, is_read, action_url, metadata)
    select b.user_id,
      case when b.kunci = 'tenggang' then 'Talentika Plus sudah berakhir'
           when b.kunci = 'h1' then 'Talentika Plus berakhir besok'
           else 'Talentika Plus berakhir ' || b.sisa || ' hari lagi' end,
      case when b.kunci = 'tenggang' then
             'Akses Plus masih aktif sampai ' || to_char((b.akhir + public.tenggang_plus()) at time zone 'Asia/Jakarta', 'DD-MM-YYYY')
             || ' (masa tenggang). Perpanjang supaya progres dan fitur Plus tidak terputus.'
           else 'Masa aktif Plus berakhir ' || to_char(b.akhir at time zone 'Asia/Jakarta', 'DD-MM-YYYY')
             || '. Perpanjangan tidak otomatis, jadi perpanjang sendiri bila ingin lanjut.' end,
      'subscription', case when b.kunci in ('h1', 'tenggang') then 'high' else 'medium' end, false,
      '/subscription',
      jsonb_build_object('jenis', 'perpanjang_plus', 'kunci', b.kunci, 'akhir', b.akhir::text)
    from baru b
    returning 1
  )
  select count(*) into n from ins;
  return n;
end;
$$;

revoke all on function public.status_plus(uuid), public.langganan_dibatalkan(uuid),
  public.akhiri_langganan_habis(), public.ingatkan_perpanjangan() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('downgrade-expired-subscriptions');
exception when others then null;
end $$;
select cron.schedule('akhiri-langganan-habis', '5 0 * * *', 'select public.akhiri_langganan_habis()');
select cron.schedule('ingatkan-perpanjangan-plus', '20 0 * * *', 'select public.ingatkan_perpanjangan()');

-- ── 3. URL materi kelas premium tidak lagi terbaca publik ───────────────
-- learning_content terbaca publik (katalog). URL materi kelas premium
-- dipindah ke tabel terkunci; trigger memindahkannya otomatis setiap kali
-- admin menyimpan, jadi CMS tetap menulis ke content_url seperti biasa.

create table if not exists public.materi_premium (
  content_id uuid primary key,
  content_url text not null,
  updated_at timestamptz not null default now()
);
alter table public.materi_premium enable row level security;
revoke all on public.materi_premium from anon, authenticated;
grant select on public.materi_premium to authenticated;

drop policy if exists materi_premium_baca on public.materi_premium;
create policy materi_premium_baca on public.materi_premium for select to authenticated
  using (content_id = any (public.kelas_terbuka()));

create or replace function public.pisahkan_url_premium() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.is_premium then
    if nullif(btrim(new.content_url), '') is not null then
      insert into public.materi_premium (content_id, content_url) values (new.id, btrim(new.content_url))
      on conflict (content_id) do update set content_url = excluded.content_url, updated_at = now();
    end if;
    new.content_url := null;
  elsif tg_op = 'UPDATE' then
    -- Kelas tidak lagi premium: kembalikan URL-nya ke katalog
    if nullif(btrim(new.content_url), '') is null then
      select content_url into new.content_url from public.materi_premium where content_id = new.id;
    end if;
    delete from public.materi_premium where content_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists pisahkan_url_premium on public.learning_content;
create trigger pisahkan_url_premium before insert or update of content_url, is_premium on public.learning_content
  for each row execute function public.pisahkan_url_premium();

create or replace function public.hapus_materi_premium() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  delete from public.materi_premium where content_id = old.id;
  return old;
end;
$$;
drop trigger if exists hapus_materi_premium on public.learning_content;
create trigger hapus_materi_premium after delete on public.learning_content
  for each row execute function public.hapus_materi_premium();

-- URL materi untuk ditampilkan: kelas biasa langsung, kelas premium hanya bila terbuka.
create or replace function public.url_materi(p_content_id uuid) returns text
language sql stable security definer set search_path to 'public' as $$
  select case
    when not lc.is_premium then lc.content_url
    when p_content_id = any (public.kelas_terbuka()) then
      (select mp.content_url from public.materi_premium mp where mp.content_id = lc.id)
  end
  from public.learning_content lc where lc.id = p_content_id;
$$;
revoke all on function public.url_materi(uuid) from public, anon;
grant execute on function public.url_materi(uuid) to authenticated;

-- Pindahkan URL kelas premium yang sudah ada
update public.learning_content set content_url = content_url where is_premium and content_url is not null;
