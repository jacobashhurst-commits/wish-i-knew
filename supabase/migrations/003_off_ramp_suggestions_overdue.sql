-- Milestone 2: journey off-ramp, overdue control, user suggestions.

create type public.child_journey_status as enum ('active', 'paused', 'ended');
create type public.suggestion_status as enum ('new', 'reviewed', 'accepted', 'declined');

alter table public.children
  add column if not exists status public.child_journey_status not null default 'active',
  add column if not exists paused_at timestamptz,
  add column if not exists ended_at timestamptz;

alter table public.timeline_cards
  add column if not exists time_critical boolean not null default false;

create table if not exists public.card_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  suggested_timing text,
  status public.suggestion_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger card_suggestions_set_updated_at
  before update on public.card_suggestions
  for each row execute function public.set_updated_at();

alter table public.card_suggestions enable row level security;

create policy "Users can insert own suggestions" on public.card_suggestions
  for insert with check (user_id = public.current_profile_id());

create policy "Users can read own suggestions" on public.card_suggestions
  for select using (user_id = public.current_profile_id() or public.is_admin());

create policy "Admins can update suggestions" on public.card_suggestions
  for update using (public.is_admin()) with check (public.is_admin());

-- Re-anchoring: born children may keep due_date alongside birth_date.
alter table public.children drop constraint if exists children_birth_or_due_date_required;

alter table public.children add constraint children_birth_or_due_date_required check (
  (is_born and birth_date is not null) or
  (not is_born and due_date is not null)
);

comment on column public.timeline_cards.time_critical is
  'Only time_critical cards may appear in the overdue bucket (engine enforced in M3).';

comment on column public.children.status is
  'Journey off-ramp: active timelines receive cards; paused/ended suppress matching (M3).';
