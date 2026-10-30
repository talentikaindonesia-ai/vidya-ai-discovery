-- Fondasi commerce (PRD Monetization, Fase 1).
--
-- Dipetakan ke stack Supabase, bukan disalin dari PRD: pengguna tetap
-- auth.users/profiles, payment_transactions tetap menjadi "percobaan bayar",
-- subscription_packages tetap dibaca halaman harga. Tabel baru di bawah mencatat
-- apa yang dijual (products), harga berversi (product_prices), apa yang dibeli
-- pada harga berapa (orders + order_items), apa yang boleh diakses (entitlements),
-- dan notifikasi gateway yang sudah diterima (webhook_events).

-- ── Katalog ────────────────────────────────────────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text,
  product_type text not null check (product_type in ('subscription', 'one_time', 'class')),
  billing_interval text check (billing_interval in ('month', 'year')),
  feature_codes text[] not null default '{}',
  package_id uuid references public.subscription_packages(id),
  content_id uuid unique references public.learning_content(id) on delete set null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((product_type = 'subscription') = (billing_interval is not null))
);
create trigger update_products_updated_at before update on public.products
  for each row execute function public.update_updated_at_column();

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  amount integer not null check (amount >= 0),
  currency text not null default 'IDR',
  valid_from timestamptz not null default now(),
  valid_to timestamptz
);
create unique index product_prices_satu_aktif on public.product_prices (product_id) where valid_to is null;

-- ── Order: harga dibekukan saat checkout ───────────────────────────────────
-- user_id tanpa FK (seperti payment_transactions): catatan keuangan tetap ada
-- walau akun dihapus.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default 'TK-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  user_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'held', 'refunded', 'partially_refunded')),
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  currency text not null default 'IDR',
  voucher_id uuid references public.voucher_codes(id),
  idempotency_key text not null,
  provider text not null default 'mayar',
  provider_payment_id text,
  transaction_id uuid references public.payment_transactions(id),
  checkout_url text,
  paid_amount integer,
  paid_at timestamptz,
  hold_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index orders_user_dibuat on public.orders (user_id, created_at desc);
create index orders_transaksi on public.orders (transaction_id);
create trigger update_orders_updated_at before update on public.orders
  for each row execute function public.update_updated_at_column();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_kind text not null check (item_kind in ('subscription', 'one_time', 'class', 'bootcamp', 'playbook')),
  product_id uuid references public.products(id),
  product_price_id uuid references public.product_prices(id),
  item_ref uuid,
  sku text not null,
  name text not null,
  billing_interval text check (billing_interval in ('month', 'year')),
  feature_codes text[] not null default '{}',
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0)
);
create index order_items_order on public.order_items (order_id);

-- ── Hak akses ──────────────────────────────────────────────────────────────
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_code text not null,
  source_type text not null check (source_type in ('purchase', 'subscription', 'institution', 'admin_grant')),
  source_id uuid,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  note text,
  created_at timestamptz not null default now()
);
create index entitlements_user_fitur on public.entitlements (user_id, feature_code);
create unique index entitlements_satu_per_sumber on public.entitlements (user_id, feature_code, source_type, source_id)
  where source_id is not null;

-- ── Notifikasi gateway ─────────────────────────────────────────────────────
-- Hanya pengenal & status yang disimpan; nama, email, dan HP pembeli di isi
-- notifikasi Mayar tidak ikut tersimpan.
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text,
  provider_payment_id text,
  status text not null default 'received' check (status in ('received', 'processed', 'failed')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);

-- ── RLS: klien hanya membaca miliknya; semua tulisan lewat server ──────────
alter table public.products enable row level security;
alter table public.product_prices enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.entitlements enable row level security;
alter table public.webhook_events enable row level security;

create policy products_baca on public.products for select using (is_active or public.has_role(auth.uid(), 'admin'));
create policy product_prices_baca on public.product_prices for select using (
  public.has_role(auth.uid(), 'admin')
  or exists (select 1 from public.products p where p.id = product_id and p.is_active)
);
create policy orders_baca on public.orders for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy order_items_baca on public.order_items for select using (
  public.has_role(auth.uid(), 'admin')
  or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy entitlements_baca on public.entitlements for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy webhook_events_admin on public.webhook_events for select using (public.has_role(auth.uid(), 'admin'));

revoke all on public.products, public.product_prices, public.orders, public.order_items, public.entitlements, public.webhook_events from anon, authenticated;
grant select on public.products, public.product_prices, public.orders, public.order_items, public.entitlements, public.webhook_events to authenticated;

-- ── Seed katalog ───────────────────────────────────────────────────────────
-- Starter Kit & kelas premium disimpan nonaktif: materi Starter Kit belum ada
-- dan harga per kelas belum ditentukan.
insert into public.products (sku, name, description, product_type, feature_codes, is_active) values
  ('CAREER_DISCOVERY_STARTER_KIT', 'Career Discovery Starter Kit', 'Pembelian sekali bayar, akses permanen, tidak bergantung pada langganan.',
   'one_time', array['career_discovery_starter_kit'], false);

insert into public.products (sku, name, product_type, billing_interval, feature_codes, package_id, is_active)
select v.sku, v.nama, 'subscription', v.interval_, array['plus_access'], sp.id, true
from public.subscription_packages sp
cross join (values
  ('TALENTIKA_PLUS_MONTHLY', 'Talentika Plus Bulanan', 'month'),
  ('TALENTIKA_PLUS_ANNUAL', 'Talentika Plus Tahunan', 'year')
) as v(sku, nama, interval_)
where sp.tier = 'plus' and sp.is_active;

insert into public.products (sku, name, product_type, feature_codes, content_id, is_active)
select 'CLASS_' || replace(lc.id::text, '-', ''), lc.title, 'class', array['class:' || lc.id::text], lc.id, false
from public.learning_content lc where lc.is_premium;

insert into public.product_prices (product_id, amount)
select p.id, case p.sku
  when 'CAREER_DISCOVERY_STARTER_KIT' then 49000
  when 'TALENTIKA_PLUS_MONTHLY' then 49000
  when 'TALENTIKA_PLUS_ANNUAL' then 499000 end
from public.products p where p.product_type <> 'class';

-- Kelas yang baru ditandai premium otomatis punya SKU (nonaktif sampai diberi harga).
create function public.buat_sku_kelas() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.is_premium then
    insert into public.products (sku, name, product_type, feature_codes, content_id, is_active)
    values ('CLASS_' || replace(new.id::text, '-', ''), new.title, 'class', array['class:' || new.id::text], new.id, false)
    on conflict (sku) do nothing;
  end if;
  return new;
end;
$$;
create trigger learning_content_sku_kelas after insert or update of is_premium on public.learning_content
  for each row execute function public.buat_sku_kelas();

-- Admin tetap mengubah harga lewat subscription_packages; tiap perubahan
-- menjadi versi baru di product_prices sehingga riwayat harga tidak hilang.
create function public.selaraskan_harga_paket() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare r record; v_harga integer;
begin
  for r in select id, billing_interval from public.products where package_id = new.id loop
    v_harga := round(case when r.billing_interval = 'year' then new.price_yearly else new.price_monthly end);
    if not exists (select 1 from public.product_prices where product_id = r.id and valid_to is null and amount = v_harga) then
      update public.product_prices set valid_to = now() where product_id = r.id and valid_to is null;
      insert into public.product_prices (product_id, amount) values (r.id, v_harga);
    end if;
  end loop;
  return new;
end;
$$;
create trigger subscription_packages_harga after update of price_monthly, price_yearly on public.subscription_packages
  for each row execute function public.selaraskan_harga_paket();

-- Harga baru sesuai PRD.
update public.subscription_packages set price_monthly = 49000, price_yearly = 499000 where tier = 'plus' and is_active;

-- ── Akses ──────────────────────────────────────────────────────────────────
create or replace function public.is_premium(uid uuid) returns boolean
language sql stable security definer set search_path to 'public' as $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = uid
        AND p.subscription_status IN ('active', 'trial')
        AND coalesce(p.subscription_type, '') <> 'free'
        AND (p.subscription_end_date IS NULL OR p.subscription_end_date > now())
    )
    OR EXISTS (
      SELECT 1 FROM public.entitlements e
      WHERE e.user_id = uid AND e.feature_code = 'plus_access'
        AND e.revoked_at IS NULL AND e.starts_at <= now()
        AND (e.expires_at IS NULL OR e.expires_at > now())
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

-- Kelas premium tidak termasuk Plus. Terbuka untuk pembeli kelas, siswa sekolah
-- mitra (akses institusi), dan admin.
create function public.kelas_terbuka() returns uuid[]
language sql stable security definer set search_path to 'public' as $$
  select coalesce(array_agg(lc.id), '{}')
  from public.learning_content lc
  where lc.is_premium and (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'::user_role)
    or exists (
      select 1 from public.school_members sm
      where sm.student_user_id = auth.uid() and sm.status = 'active'
        and exists (select 1 from public.profiles sa
                    where sa.role = 'school_admin'
                      and upper(sa.school_code) = upper(sm.school_code)
                      and coalesce(sa.account_verified, false))
    )
    or exists (
      select 1 from public.entitlements e
      where e.user_id = auth.uid() and e.feature_code = 'class:' || lc.id::text
        and e.revoked_at is null and e.starts_at <= now()
        and (e.expires_at is null or e.expires_at > now())
    )
  );
$$;
grant execute on function public.kelas_terbuka() to authenticated;

-- Dipakai RLS learning_progress. Kelas yang dibeli tidak memakan kuota 3 materi Free.
create function public.boleh_mulai_materi(p_content uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select case
    when coalesce((select is_premium from public.learning_content where id = p_content), false)
      then p_content = any(public.kelas_terbuka())
    else public.is_premium(auth.uid()) or public.learning_slots_used(auth.uid()) < 3
  end;
$$;
grant execute on function public.boleh_mulai_materi(uuid) to authenticated;

drop policy learning_progress_insert_quota on public.learning_progress;
create policy learning_progress_insert_quota on public.learning_progress for insert
  with check ((select auth.uid()) = user_id and public.boleh_mulai_materi(content_id));

-- Siswa yang sudah memulai kelas premium sebelum aturan ini tetap punya akses.
insert into public.entitlements (user_id, feature_code, source_type, note)
select distinct lp.user_id, 'class:' || lp.content_id::text, 'admin_grant', 'Sudah memulai sebelum kelas premium dijual terpisah (2026-10-30)'
from public.learning_progress lp
join public.learning_content lc on lc.id = lp.content_id and lc.is_premium;

-- ── Aktivasi: satu transaksi database, aman dipanggil berulang ─────────────
create function public.aktifkan_order(p_order_id uuid, p_dibayar integer) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  v_order public.orders;
  v_item public.order_items;
  v_kode text;
  v_mulai timestamptz;
  v_akhir timestamptz;
  v_sekarang timestamptz := now();
  v_status text;
  v_akhir_lama timestamptz;
  v_sub uuid;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order tidak ditemukan: %', p_order_id; end if;
  if v_order.status = 'paid' then return jsonb_build_object('status', 'sudah'); end if;
  if p_dibayar < v_order.total then
    raise exception 'Nominal kurang: dibayar %, total %', p_dibayar, v_order.total;
  end if;

  for v_item in select * from public.order_items where order_id = p_order_id loop
    v_mulai := v_sekarang;
    v_akhir := null;

    if v_item.item_kind = 'subscription' then
      select subscription_status, subscription_end_date into v_status, v_akhir_lama
        from public.profiles where user_id = v_order.user_id;
      if v_status = 'active' and v_akhir_lama > v_sekarang then v_mulai := v_akhir_lama; end if;
      v_akhir := v_mulai + case when v_item.billing_interval = 'year' then interval '1 year' else interval '1 month' end;

      select id into v_sub from public.user_subscriptions
        where user_id = v_order.user_id order by created_at desc limit 1;
      if v_sub is null then
        insert into public.user_subscriptions (user_id, package_id, status, billing_cycle, amount_paid, starts_at, expires_at, auto_renew)
        values (v_order.user_id, v_item.item_ref, 'active', case when v_item.billing_interval = 'year' then 'yearly' else 'monthly' end, p_dibayar, v_sekarang, v_akhir, false);
      else
        update public.user_subscriptions
           set package_id = v_item.item_ref, status = 'active',
               billing_cycle = case when v_item.billing_interval = 'year' then 'yearly' else 'monthly' end,
               amount_paid = p_dibayar, starts_at = v_sekarang, expires_at = v_akhir, auto_renew = false
         where id = v_sub;
      end if;

      update public.profiles
         set subscription_status = 'active', subscription_type = 'premium', subscription_end_date = v_akhir
       where user_id = v_order.user_id;

    elsif v_item.item_kind = 'bootcamp' then
      insert into public.bootcamp_enrollments (user_id, bootcamp_id, transaction_id, amount_paid, source)
      values (v_order.user_id, v_item.item_ref, v_order.transaction_id, p_dibayar, 'purchase')
      on conflict (user_id, bootcamp_id) do nothing;

    elsif v_item.item_kind = 'playbook' then
      insert into public.playbook_purchases (user_id, playbook_id, transaction_id)
      values (v_order.user_id, v_item.item_ref, v_order.transaction_id)
      on conflict (user_id, playbook_id) do nothing;
    end if;

    foreach v_kode in array v_item.feature_codes loop
      insert into public.entitlements (user_id, feature_code, source_type, source_id, starts_at, expires_at)
      values (v_order.user_id, v_kode,
              case when v_item.item_kind = 'subscription' then 'subscription' else 'purchase' end,
              v_order.id, v_mulai, v_akhir)
      on conflict (user_id, feature_code, source_type, source_id) where source_id is not null do nothing;
    end loop;
  end loop;

  if v_order.voucher_id is not null then
    insert into public.voucher_usage (voucher_id, user_id, transaction_id, discount_applied)
    values (v_order.voucher_id, v_order.user_id, v_order.transaction_id, v_order.discount)
    on conflict do nothing;
    update public.voucher_codes set current_uses = coalesce(current_uses, 0) + 1 where id = v_order.voucher_id;
  end if;

  update public.orders set status = 'paid', paid_amount = p_dibayar, paid_at = v_sekarang, hold_reason = null where id = p_order_id;
  if v_order.transaction_id is not null then
    update public.payment_transactions set status = 'completed' where id = v_order.transaction_id;
  end if;

  return jsonb_build_object('status', 'aktif', 'berakhir', v_akhir);
end;
$$;
revoke execute on function public.aktifkan_order(uuid, integer) from public, anon, authenticated;
grant execute on function public.aktifkan_order(uuid, integer) to service_role;

-- Transaksi gagal/kedaluwarsa (webhook atau cron) ikut menutup order-nya.
create function public.selaraskan_status_order() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.status in ('failed', 'expired', 'cancelled') and new.status is distinct from old.status then
    update public.orders
       set status = case when new.status = 'expired' then 'expired' else 'failed' end
     where transaction_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;
create trigger payment_transactions_status_order after update of status on public.payment_transactions
  for each row execute function public.selaraskan_status_order();

revoke execute on function public.buat_sku_kelas() from public, anon, authenticated;
revoke execute on function public.selaraskan_harga_paket() from public, anon, authenticated;
revoke execute on function public.selaraskan_status_order() from public, anon, authenticated;

-- ── Halaman "Pembelian saya" (web & app) ───────────────────────────────────
create function public.pembelian_saya() returns jsonb
language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'nomor', o.order_number, 'status', o.status, 'total', o.total,
        'diskon', o.discount, 'dibuat', o.created_at, 'dibayar', o.paid_at,
        'lanjut_url', case when o.status = 'pending' then o.checkout_url end,
        'item', (select coalesce(jsonb_agg(i.name), '[]'::jsonb) from public.order_items i where i.order_id = o.id)
      ) order by o.created_at desc)
      from public.orders o where o.user_id = auth.uid()
    ), '[]'::jsonb),
    'hak', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kode', e.feature_code, 'sumber', e.source_type, 'mulai', e.starts_at, 'berakhir', e.expires_at,
        'nama', coalesce(
          (select p.name from public.products p where e.feature_code = any(p.feature_codes) and p.product_type <> 'subscription' limit 1),
          (select i.name from public.order_items i where i.order_id = e.source_id and e.feature_code = any(i.feature_codes) limit 1),
          case when e.feature_code = 'plus_access' then 'Talentika Plus' else e.feature_code end
        )
      ) order by e.created_at desc)
      from public.entitlements e
      where e.user_id = auth.uid() and e.revoked_at is null and (e.expires_at is null or e.expires_at > now())
    ), '[]'::jsonb)
  );
$$;
revoke execute on function public.pembelian_saya() from public, anon;
grant execute on function public.pembelian_saya() to authenticated;
