-- Sisa era scraper: peluang aktif yang tautannya ke situs agregator (melanggar kebijakan sumber resmi).
-- Kini tampil publik di /peluang dengan "penyelenggara" berisi nama penulis agregator.
create table if not exists public.arsip_nonaktif_agregator_20261105 as
  select * from public.scraped_content
  where is_active and not coalesce(is_manual, false)
    and source_website in ('scholarshipscorner.website', 'www.opportunitiescircle.com', 'opportunitydesk.org');
alter table public.arsip_nonaktif_agregator_20261105 enable row level security;
revoke all on public.arsip_nonaktif_agregator_20261105 from anon, authenticated;

update public.scraped_content set is_active = false
where id in (select id from public.arsip_nonaktif_agregator_20261105);
