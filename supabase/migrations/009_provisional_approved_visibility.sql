-- Allow authenticated users to read provisionally approved cards (friends testing)
-- as well as fully published cards. Final beta remains a wife → published step.

drop policy if exists "Users can read published cards" on public.timeline_cards;

create policy "Users can read live cards" on public.timeline_cards
  for select using (
    status in ('approved', 'published')
    or public.is_admin()
  );
