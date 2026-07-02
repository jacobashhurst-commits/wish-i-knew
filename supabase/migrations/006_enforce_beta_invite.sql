-- Enforce invite-only beta at the database level.
-- The server-action check in signInWithMagicLink is UX only; this trigger is the real gate.
--
-- DROP THIS TRIGGER when opening signup to the public:
--   drop trigger if exists enforce_beta_invite on auth.users;
--   drop function if exists public.enforce_beta_invite();

create or replace function public.enforce_beta_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.beta_invites
    where email = lower(new.email)
  ) then
    raise exception 'Beta invite required for email %', new.email
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_beta_invite on auth.users;

create trigger enforce_beta_invite
  before insert on auth.users
  for each row
  execute function public.enforce_beta_invite();
