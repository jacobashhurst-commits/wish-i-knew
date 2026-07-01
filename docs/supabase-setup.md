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
3. `supabase/migrations/003_off_ramp_suggestions_overdue.sql` — journey status, card suggestions, `time_critical` flag
4. `supabase/migrations/004_card_image_storage_policies.sql` — admin upload to the `card-images` bucket
5. `supabase/seed.sql` (optional — loads the original six demo cards)
6. `supabase/seed_content_library.sql` (optional — loads the full pregnancy → 24 months card library, ~30 cards including quiet-week fallbacks; safe to re-run, upserts by slug)

Re-running a migration that already applied will error (e.g. `type "user_role" already exists` on 001). That is expected — each file runs once only.

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

Extra environment variables (server-side only — set in Vercel, never exposed to the browser):

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
