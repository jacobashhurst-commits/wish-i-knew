create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.australian_state as enum ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA');
create type public.childcare_intention as enum ('yes', 'no', 'unsure');
create type public.card_status as enum ('idea', 'draft', 'in_review', 'approved', 'published', 'needs_review', 'archived');
create type public.image_status as enum ('needed', 'prompt_ready', 'generated', 'approved', 'uploaded', 'published');
create type public.user_card_status as enum ('unseen', 'viewed', 'saved', 'done', 'snoozed', 'dismissed', 'not_relevant');
create type public.lookahead_day as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
create type public.delivery_channel as enum ('in_app', 'email', 'push_later', 'manual_only');
create type public.reminder_status as enum ('pending', 'sent', 'dismissed', 'completed');
create type public.import_status as enum ('pending', 'processing', 'completed', 'failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role public.user_role not null default 'user',
  state public.australian_state,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
  )
$$;

create table public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null,
  birth_date date,
  due_date date,
  is_born boolean not null,
  state public.australian_state not null,
  first_child boolean not null,
  childcare_intention public.childcare_intention not null,
  feeding_preference text,
  return_to_work_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint children_birth_or_due_date_required check (
    (is_born and birth_date is not null) or
    (not is_born and due_date is not null)
  )
);

create table public.timeline_cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  card_type text not null,
  category text not null,
  life_stage text not null,
  start_age_days integer,
  end_age_days integer,
  pregnancy_week_start integer,
  pregnancy_week_end integer,
  priority integer not null default 0,
  emotional_tone text,
  short_summary text not null,
  wish_i_knew text not null,
  why_it_matters text,
  what_to_do_now text,
  what_can_wait text,
  checklist_items jsonb not null default '[]'::jsonb,
  parent_script text,
  partner_prompt text,
  shopping_items jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb,
  source_notes text,
  medical_sensitivity boolean not null default false,
  government_sensitivity boolean not null default false,
  safety_sensitivity boolean not null default false,
  allergy_sensitivity boolean not null default false,
  feeding_sensitivity boolean not null default false,
  state_specific boolean not null default false,
  states jsonb not null default '[]'::jsonb,
  conditions jsonb not null default '{}'::jsonb,
  illustration_prompt text,
  image_url text,
  thumbnail_url text,
  hero_image_url text,
  image_alt text,
  image_style text,
  image_status public.image_status not null default 'needed',
  status public.card_status not null default 'draft',
  version integer not null default 1,
  review_due_date date,
  last_reviewed_at date,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  constraint timeline_cards_age_window_valid check (
    start_age_days is null or end_age_days is null or start_age_days <= end_age_days
  ),
  constraint timeline_cards_pregnancy_window_valid check (
    pregnancy_week_start is null or pregnancy_week_end is null or pregnancy_week_start <= pregnancy_week_end
  ),
  constraint timeline_cards_published_requires_image check (
    status <> 'published' or (
      nullif(trim(image_url), '') is not null and
      nullif(trim(image_alt), '') is not null and
      image_status in ('approved', 'uploaded', 'published')
    )
  ),
  constraint timeline_cards_published_sensitive_requires_sources check (
    status <> 'published' or
    not (
      medical_sensitivity or government_sensitivity or safety_sensitivity or allergy_sensitivity or feeding_sensitivity
    ) or (
      (jsonb_array_length(source_urls) > 0 or nullif(trim(source_notes), '') is not null) and
      last_reviewed_at is not null and
      review_due_date is not null
    )
  )
);

create table public.user_card_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  card_id uuid not null references public.timeline_cards(id) on delete cascade,
  status public.user_card_status not null default 'unseen',
  snoozed_until date,
  viewed_at timestamptz,
  saved_at timestamptz,
  completed_at timestamptz,
  dismissed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, child_id, card_id)
);

create table public.weekly_lookahead_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  day_of_week public.lookahead_day not null default 'saturday',
  time_of_day time not null default '08:00',
  timezone text not null default 'Australia/Sydney',
  delivery_channel public.delivery_channel not null default 'in_app',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, child_id)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  card_id uuid references public.timeline_cards(id) on delete set null,
  reminder_date date not null,
  reminder_type text not null,
  status public.reminder_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_import_batches (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  filename text not null,
  import_type text not null,
  status public.import_status not null default 'pending',
  total_rows integer not null default 0,
  successful_rows integer not null default 0,
  failed_rows integer not null default 0,
  error_summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.content_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger children_set_updated_at before update on public.children
  for each row execute function public.set_updated_at();
create trigger timeline_cards_set_updated_at before update on public.timeline_cards
  for each row execute function public.set_updated_at();
create trigger user_card_states_set_updated_at before update on public.user_card_states
  for each row execute function public.set_updated_at();
create trigger weekly_lookahead_preferences_set_updated_at before update on public.weekly_lookahead_preferences
  for each row execute function public.set_updated_at();
create trigger reminders_set_updated_at before update on public.reminders
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.timeline_cards enable row level security;
alter table public.user_card_states enable row level security;
alter table public.weekly_lookahead_preferences enable row level security;
alter table public.reminders enable row level security;
alter table public.content_import_batches enable row level security;
alter table public.content_audit_log enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth_user_id = auth.uid() or public.is_admin());
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth_user_id = auth.uid());
create policy "Users can update own profile except role" on public.profiles
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid() and role = 'user');
create policy "Admins can manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users can manage own children" on public.children
  for all using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "Admins can manage children" on public.children
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users can read published cards" on public.timeline_cards
  for select using (status = 'published' or public.is_admin());
create policy "Admins can manage cards" on public.timeline_cards
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users can manage own card states" on public.user_card_states
  for all using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "Admins can read card states" on public.user_card_states
  for select using (public.is_admin());

create policy "Users can manage own lookahead preferences" on public.weekly_lookahead_preferences
  for all using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "Admins can read lookahead preferences" on public.weekly_lookahead_preferences
  for select using (public.is_admin());

create policy "Users can manage own reminders" on public.reminders
  for all using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "Admins can read reminders" on public.reminders
  for select using (public.is_admin());

create policy "Admins can manage import batches" on public.content_import_batches
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can read audit log" on public.content_audit_log
  for select using (public.is_admin());
create policy "Admins can insert audit log" on public.content_audit_log
  for insert with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;
