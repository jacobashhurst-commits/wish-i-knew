-- RLS tightening pass (post-review).
--
-- 1. user_card_states: the original policy only checked user_id, so a user
--    could attach card states to another user's child_id. No data leaked
--    (reads still filter by user_id) but it is an integrity hole.
-- 2. profiles.email: the weekly email cron reads profiles.email, so a user
--    must not be able to redirect digests by editing the column directly.

drop policy if exists "Users can manage own card states" on public.user_card_states;

create policy "Users can manage own card states" on public.user_card_states
  for all
  using (
    user_id = public.current_profile_id()
    and child_id in (
      select id from public.children where user_id = public.current_profile_id()
    )
  )
  with check (
    user_id = public.current_profile_id()
    and child_id in (
      select id from public.children where user_id = public.current_profile_id()
    )
  );

create or replace function public.prevent_profile_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for service-role sessions; allow those (trusted server
  -- jobs) and admins, block self-service email edits.
  if new.email is distinct from old.email
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Profile email cannot be changed directly.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_email_locked on public.profiles;

create trigger profiles_email_locked
  before update on public.profiles
  for each row execute function public.prevent_profile_email_change();
