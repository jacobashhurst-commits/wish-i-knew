-- Track which cards appeared in weekly digest emails so wide-window reminders
-- are not repeated every week until the parent acts on them.

create table if not exists public.digest_card_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  card_id uuid not null references public.timeline_cards(id) on delete cascade,
  sent_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, child_id, card_id, sent_on)
);

create index if not exists digest_card_sends_lookup
  on public.digest_card_sends (user_id, child_id, card_id);

alter table public.digest_card_sends enable row level security;

create policy "Users can read own digest sends" on public.digest_card_sends
  for select using (user_id = public.current_profile_id());

create policy "Admins can read digest sends" on public.digest_card_sends
  for select using (public.is_admin());

-- Inserts happen from the service-role cron job only (no user insert policy).
