-- Beta launch: invite list, email idempotency, future paywall stub.

create table if not exists public.beta_invites (
  email text primary key,
  invited_at timestamptz not null default now(),
  invited_by text,
  note text
);

comment on table public.beta_invites is 'Closed beta allowlist. Lowercase emails only.';

alter table public.beta_invites enable row level security;

-- No client access; server uses service role for invite checks.
create policy "beta_invites service only"
  on public.beta_invites
  for all
  using (false)
  with check (false);

create unique index if not exists reminders_one_per_child_day
  on public.reminders (user_id, child_id, reminder_type, reminder_date);

create table if not exists public.user_entitlements (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_entitlements is 'Future paywall hook. All beta users stay on plan=free.';

alter table public.user_entitlements enable row level security;

create policy "users read own entitlements"
  on public.user_entitlements
  for select
  using (user_id = (select id from public.profiles where auth_user_id = auth.uid()));

create policy "admins manage entitlements"
  on public.user_entitlements
  for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.ensure_free_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_entitlements (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_free_entitlement on public.profiles;
create trigger profiles_free_entitlement
  after insert on public.profiles
  for each row
  execute function public.ensure_free_entitlement();
