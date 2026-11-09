-- Banyak tabel data pribadi tidak punya FK ON DELETE CASCADE ke auth.users, sehingga
-- penghapusan akun (fungsi hapus-akun → auth.admin.deleteUser) meninggalkan hasil tes,
-- postingan, progres belajar, notifikasi, dll. Trigger ini menghapusnya setiap kali
-- baris auth.users dihapus (dari aplikasi maupun dari dashboard admin).
-- DISIMPAN (kewajiban pajak/hukum & bukti): orders, payment_transactions, voucher_usage,
-- audit_logs, account_deletion_requests.
create or replace function public.hapus_data_pengguna(p_uid uuid) returns void
language plpgsql security definer set search_path to 'public' as $$
declare t text; kol text;
begin
  foreach t in array array[
    'assessment_results','content_ratings','event_participants','forum_post_likes','forum_replies','forum_posts',
    'funnel_events','learning_progress','mentor_bookings','notifications','opportunity_events','opportunity_reports',
    'quiz_attempts','quiz_leaderboard','referral_codes','study_group_members','user_challenges','user_quests',
    'user_rewards','user_roles','user_streaks','user_subscriptions','user_xp','xp_ledger'
  ] loop
    if to_regclass('public.' || t) is null then continue; end if;
    foreach kol in array array['user_id', 'author_id'] loop
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = kol) then
        execute format('delete from public.%I where %I = $1', t, kol) using p_uid;
      end if;
    end loop;
  end loop;
end;
$$;
revoke all on function public.hapus_data_pengguna(uuid) from public, anon, authenticated;

create or replace function public.hapus_data_pengguna_trg() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.hapus_data_pengguna(old.id);
  return old;
end;
$$;
revoke all on function public.hapus_data_pengguna_trg() from public, anon, authenticated;

drop trigger if exists hapus_data_pengguna on auth.users;
create trigger hapus_data_pengguna after delete on auth.users
  for each row execute function public.hapus_data_pengguna_trg();
