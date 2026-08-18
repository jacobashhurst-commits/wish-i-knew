# Soft launch checklist

Use this when moving from local dev to a friends-and-family beta.

## Plan sanity check

Your sequence is sound:

1. Finish app + email + registration wall locally
2. Push to GitHub
3. Separate review pass → rework doc
4. Deploy with minimal spend (Vercel + Supabase free tiers)
5. Add domain when ready
6. Invite friends/family for quiet QA

**Holes to watch:**

| Risk | Mitigation |
|------|------------|
| Anyone can sign up | Keep `WIK_BETA_INVITE_ONLY=true` and add emails to `beta_invites` |
| Preview mode bypass | Set `WIK_REQUIRE_AUTH=true` in production |
| Emails land in spam | Configure Resend SPF/DKIM before relying on weekly email |
| Vercel Hobby cron | Hourly cron needs Vercel Pro, or trigger manually / use external cron |
| Medical trust | Sensitive cards show in-app disclaimer; `/disclaimer` is linked |
| No monitoring yet | Acceptable for tiny beta; add Sentry before wider launch |

## 1. Supabase (production project)

Run migrations in order through `007_rls_tightening.sql`, then seeds:

1. `001_initial_schema.sql`
2. `002_auth_profile_trigger.sql`
3. `003_off_ramp_suggestions_overdue.sql`
4. `004_card_image_storage_policies.sql`
5. `supabase/migrations/005_beta_launch.sql`
6. `supabase/migrations/006_enforce_beta_invite.sql`
7. `supabase/migrations/007_rls_tightening.sql`
8. `supabase/seed.sql`
9. `supabase/seed_content_library.sql`
10. `supabase/seed_content_library_batch2.sql`
11. `supabase/seed_content_library_batch3.sql`
12. `supabase/seed_content_library_batch4.sql`
13. `supabase/seed_content_library_batch5.sql`

**Important:** once 006 runs, signups are blocked for anyone not in
`beta_invites` - add your own email to the invite list before you try to sign
up, or sign up first and run 006 after.

Grant yourself admin:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Add beta testers (lowercase emails):

```sql
insert into public.beta_invites (email, note) values
  ('friend@example.com', 'F&F beta'),
  ('you@example.com', 'founder')
on conflict (email) do nothing;
```

Auth redirect URLs (Dashboard → Authentication → URL configuration):

- Site URL: your production URL
- Redirect URLs: `https://your-domain.com/auth/callback`

## 2. Vercel

Import the GitHub repo and set environment variables from `.env.example`:

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |
| `WIK_REQUIRE_AUTH` | `true` |
| `WIK_BETA_INVITE_ONLY` | `true` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only) |
| `RESEND_API_KEY` | Resend API key |
| `WIK_FROM_EMAIL` | Verified sender in Resend |
| `CRON_SECRET` | Long random string |

Deploy from `main`. `vercel.json` schedules:

- **Daily keepalive** (`/api/cron/keepalive` at 12:00 UTC) — pings Supabase so free-tier projects do not pause
- **Weekly email** (`/api/cron/weekly-lookahead` Friday 22:00 UTC ≈ Saturday morning Sydney)

Both are Hobby-safe (at most once per day). Keepalive needs `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` only.

**Manual test:**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/keepalive
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/weekly-lookahead
```

## 3. Email (Resend)

1. Add and verify your sending domain in Resend
2. Set SPF/DKIM records (Resend dashboard walks you through this)
3. Set `WIK_FROM_EMAIL` to that domain
4. Test magic-link auth and weekly email separately

Weekly email only sends when **all** of these are true:

- User opted in (`delivery_channel = email`, `enabled = true`)
- Child journey is `active`
- Local day + hour matches preference (hourly cron, on the hour)
- Not already sent that local day (idempotency via `reminders`)

Users can pause from the email link or turn email back on in **Settings → Weekly email**.

## 4. Local dev vs production

| Setting | Local | Production |
|---------|-------|------------|
| `WIK_REQUIRE_AUTH` | `false` (preview OK) | `true` |
| `WIK_BETA_INVITE_ONLY` | `true` or `false` | `true` |
| `NEXT_PUBLIC_SITE_URL` | `http://127.0.0.1:3000` | production URL |

## 5. Paywall later

Migration `005` adds `user_entitlements` with `plan = free` for every new profile. No paywall UI yet - ready for a future Stripe/Zuora hook without schema churn.

## 6. Pre-invite smoke test

- [ ] Sign in with invited email → onboarding → timeline loads
- [ ] Uninvited email gets friendly rejection
- [ ] Unauthenticated visit to `/` redirects to `/login`
- [ ] Weekly email toggle in Settings saves
- [ ] Cron route returns `{ sent: N }` at a matching hour (or manual curl)
- [ ] Pause link in email disables sends; Settings can re-enable
- [ ] `/privacy`, `/terms`, `/disclaimer` render
- [ ] `robots.txt` disallows indexing

## 7. GitHub

Push the repo, then run your separate review agent. Typical review focus:

- Auth/RLS boundaries
- Email idempotency
- Legal copy adequacy (not legal advice - flag for your lawyer before public launch)
- Content medical review flags in seed SQL

## 8. Public launch (later)

When opening signup beyond the invite list, run in Supabase:

```sql
drop trigger if exists enforce_beta_invite on auth.users;
drop function if exists public.enforce_beta_invite();
```

Then set `WIK_BETA_INVITE_ONLY=false` in Vercel.
