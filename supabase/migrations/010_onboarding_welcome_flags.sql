-- First-run popup flags on profiles so wipe + re-invite still shows welcome
-- dialogs (localStorage alone sticks across accounts on the same browser).

alter table public.profiles
  add column if not exists seen_product_welcome boolean not null default false,
  add column if not exists seen_home_tour boolean not null default false;

comment on column public.profiles.seen_product_welcome is
  'User dismissed the pre-onboarding product welcome dialog.';
comment on column public.profiles.seen_home_tour is
  'User dismissed the first-visit home tour dialog.';
