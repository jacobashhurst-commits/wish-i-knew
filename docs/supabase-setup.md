# Supabase setup

Apply this once to your Supabase project before testing auth and persistence.

## 1. Environment variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tnqaybxosuggyzimygmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
```

Use the project URL **without** `/rest/v1` on the end.

## 2. Run migrations

In the Supabase SQL editor (or Supabase CLI), run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_profile_trigger.sql`
3. `supabase/migrations/003_off_ramp_suggestions_overdue.sql`  -  journey status, card suggestions, `time_critical` flag
4. `supabase/migrations/004_card_image_storage_policies.sql`  -  admin upload to the `card-images` bucket
5. `supabase/seed.sql` (optional  -  loads the original six demo cards)
6. `supabase/seed_content_library.sql` (optional  -  loads the first batch of pregnancy to 24 months cards, ~30 including quiet-week fallbacks; safe to re-run, upserts by slug)
7. `supabase/seed_content_library_batch2.sql` (optional  -  50 more cards; safe to re-run, upserts by slug)
8. `supabase/migrations/005_beta_launch.sql` (beta invites, email idempotency, paywall stub)

Re-running a migration that already applied will error (e.g. `type "user_role" already exists` on 001). That is expected  -  each file runs once only.

## 2a. Beta invites (friends-and-family launch)

After migration 005, add invited emails in the SQL editor:

```sql
insert into public.beta_invites (email, note) values
  ('you@example.com', 'founder'),
  ('friend@example.com', 'F&F beta')
on conflict (email) do nothing;
```

Set `WIK_BETA_INVITE_ONLY=true` in Vercel. Only invited emails can request a magic link.

See `docs/soft-launch.md` for the full deploy checklist.

## 2b. Grant yourself admin (for the Content Studio)

The Content Studio lives at `/admin` and is only visible to admin profiles. Run once in the SQL editor, with your own email:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## 3. Auth redirect URLs

In Supabase Dashboard → Authentication → URL configuration, add:

- **Site URL:** `http://127.0.0.1:3000` (and your production URL later)
- **Redirect URLs:**
  - `http://127.0.0.1:3000/auth/callback`
  - `http://localhost:3000/auth/callback`

Enable **Email** provider with magic link / OTP (passwordless). Do not enable password auth.

## 4. Smoke test

1. `npm run dev`
2. Open `http://127.0.0.1:3000`
3. Enter email → receive magic link → complete onboarding
4. Save a card → refresh → card state persists
5. Sign out → sign in again → data still there

## 5. RLS verification

Run as an authenticated user in the SQL editor (or via two test accounts):

| Check | Expected |
|-------|----------|
| User A reads own `children` | Allowed |
| User A reads User B's `children` | Denied (empty / error) |
| User A reads User B's `user_card_states` | Denied |
| Any signed-in user reads `timeline_cards` where `status = 'published'` | Allowed |
| Normal user inserts into `timeline_cards` | Denied |

Policies are defined in `001_initial_schema.sql`. The trigger in `002_auth_profile_trigger.sql` creates a `profiles` row on signup. Migration `003` adds `card_suggestions` RLS and journey fields on `children`.

## 6. Weekly Lookahead email (Milestone 6)

The weekly email is sent by a Vercel Cron job (`vercel.json` schedules `/api/cron/weekly-lookahead` hourly; each run only emails users whose chosen local day + hour matches).

Extra environment variables (server-side only  -  set in Vercel, never exposed to the browser):

```bash
SUPABASE_SERVICE_ROLE_KEY=...   # Supabase Dashboard → Settings → API
RESEND_API_KEY=...              # resend.com
WIK_FROM_EMAIL="Wish I Knew <hello@yourdomain.com>"
CRON_SECRET=any_long_random_string
```

Notes:

- Vercel automatically sends `Authorization: Bearer $CRON_SECRET` to cron routes when `CRON_SECRET` is set in the project.
- The email contains the actual card content plus a one-tap pause link (`/api/lookahead/pause`) that sets `enabled = false` without touching the account.
- One send per child per local day is enforced via the `reminders` table.
- TODO: set up SPF/DKIM for the sending domain in Resend before real users receive these.

To test locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/weekly-lookahead
```

(Your lookahead preference day/time must match the current local hour to trigger a send.)

## 7. Full-stack smoke test (after loading content)

Once migrations 001–004 and the content seed files are applied:

| Feature | How to verify |
|---------|----------------|
| **Timeline engine** | Sign in, onboard with a due date or birth date, open Timeline  -  cards should appear in This week / Coming soon / Later buckets |
| **Quiet week** | In `/admin/debugger`, set a profile date with no matching cards  -  exactly one quiet-week card should appear in This week |
| **Overdue** | Set birth date so a `time_critical` immunisation window has passed  -  card appears in Overdue (max 3) |
| **Journey off-ramp** | Settings → Pause timeline → timeline empties; Resume brings cards back |
| **Suggestions** | Settings → submit a suggestion; as admin, `/admin/suggestions` → Promote to draft |
| **Content Studio** | `/admin` → filter cards → edit → publish (validation blocks bad cards) |
| **Match debugger** | `/admin/debugger` → change profile → see bucket + match reasons |
| **Weekly email** | Set `CRON_SECRET` + Resend keys, curl the cron route at your chosen lookahead hour |

Card count after full seed: **~86 published cards** (6 from `seed.sql` + 30 from batch 1 + 50 from batch 2, merged by slug).
