-- SEC-01/02 (docs/REJA-YOL-XARITASI-2026-10-18.md, 1.5)
-- Sharh yozish formasi saytda yo'q (oxirgi sharh 2026-04-24); ochiq INSERT soxta baho uchun yo'l edi.
-- Supabase → SQL Editor'da bir marta ishga tushiriladi. Qayta ishga tushirish xavfsiz.

begin;

drop policy if exists "Anyone can insert review" on public.reviews;

revoke all on public.reviews from anon, authenticated;

-- submitter_ip hech kimga (anon/authenticated) ko'rinmaydi; qolgan ustunlar o'qiladi.
grant select (id, user_id, rating, comment, page, created_at) on public.reviews to anon, authenticated;

-- "Users can delete own review" va admin policy uchun.
grant delete on public.reviews to authenticated;
grant update (rating, comment, page) on public.reviews to authenticated;

commit;

-- Tekshiruv: faqat SELECT (6 ustun), DELETE va UPDATE (3 ustun) qolishi kerak, submitter_ip yo'q.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'reviews' and grantee in ('anon', 'authenticated')
order by grantee, privilege_type, column_name;
