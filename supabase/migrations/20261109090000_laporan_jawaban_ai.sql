-- Kebijakan konten AI Google Play: pengguna harus bisa melaporkan jawaban AI dari dalam aplikasi.
-- Jawaban Tika AI bisa belum punya id (baru di-stream) atau dihapus pengguna, jadi laporan menyimpan salinannya.
alter table public.content_reports drop constraint if exists content_reports_target_type_check;
alter table public.content_reports add constraint content_reports_target_type_check
  check (target_type = any (array['post', 'reply', 'user', 'ai_message']));
alter table public.content_reports add column if not exists cuplikan text;
alter table public.content_reports drop constraint if exists content_reports_cuplikan_panjang;
alter table public.content_reports add constraint content_reports_cuplikan_panjang
  check (cuplikan is null or char_length(cuplikan) <= 4000);
