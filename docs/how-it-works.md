# How Wish I Knew works (as built)

The living operational doc. `architecture.md` is the original design; this file
describes what is actually running. Update it when behaviour changes.

Stack: **Next.js (App Router) on Vercel Hobby · Supabase (Auth + Postgres/RLS +
Storage) · Resend** for the weekly email. No other moving parts.

## System overview

```mermaid
flowchart TB
  subgraph vercel [Vercel Hobby]
    MW[middleware.ts<br/>session refresh + auth wall]
    App[App pages<br/>src/app]
    AdminUI[Content Studio<br/>/admin - role gated]
    CronLA[api/cron/weekly-lookahead<br/>daily 22:00 UTC / weekday match]
    CronKA[api/cron/keepalive<br/>daily 12:00 UTC]
    Pause[api/lookahead/pause<br/>HMAC-signed one-tap pause]
  end

  subgraph supabase [Supabase]
    Auth[Auth: magic links]
    DB[(Postgres + RLS)]
    Trigger[auth.users triggers:<br/>invite gate + profile create]
    Storage[Storage: card-images<br/>public read, admin write]
  end

  Resend[Resend REST API]

  Browser((Parent's browser)) --> MW --> App
  App -- anon key + user session --> Auth
  App -- RLS-scoped queries --> DB
  AdminUI -- role=admin via RLS --> DB
  AdminUI -- upload --> Storage
  Auth --> Trigger --> DB
  CronLA -- service role, bypasses RLS --> DB
  CronLA -- send digest --> Resend
  CronKA -- head count ping --> DB
  Pause -- service role --> DB
```

Three trust levels, three clients:

| Client | Key | Sees |
|---|---|---|
| Browser / app pages | anon key + user session | Only what RLS allows for that user |
| Admin pages | same, but `profiles.role = 'admin'` | Everything RLS grants admins |
| Cron + pause routes | `SUPABASE_SERVICE_ROLE_KEY` | Everything (bypasses RLS) - server-only, never imported client-side |

## Auth wall and invite-only signup

```mermaid
sequenceDiagram
  participant P as Parent
  participant S as Server action
  participant DB as beta_invites
  participant SB as Supabase Auth
  P->>S: signInWithMagicLink(email)
  S->>DB: invited? (service role)
  alt not invited
    S-->>P: friendly "invite-only" error
  else invited
    S->>SB: signInWithOtp(shouldCreateUser)
    SB-->>P: magic link email
    P->>SB: click link -> /auth/callback
    Note over SB: BEFORE INSERT trigger re-checks<br/>beta_invites (migration 006) -<br/>the real gate, can't be bypassed<br/>with the public anon key
    SB->>DB: handle_new_user creates profile (role=user)
  end
```

- The server-action check is **UX only** (friendly error). The database trigger
  `enforce_beta_invite` is the enforcement - it fires even if someone calls
  Supabase's `/auth/v1/otp` directly with the public anon key.
- **Going public:** drop the trigger (`006_enforce_beta_invite.sql` has the
  exact statements in its header comment).
- The middleware (`src/middleware.ts` → `lib/supabase/middleware.ts`) refreshes
  the session cookie and redirects signed-out users to `/login` unless the path
  is in `PUBLIC_PATH_PREFIXES` (`lib/launch/config.ts`). **API routes are not
  public by default** - each public API path is listed explicitly and carries
  its own auth (CRON_SECRET header or signed token).

## Data model

```mermaid
erDiagram
  auth_users ||--|| profiles : "trigger creates"
  profiles ||--o{ children : has
  profiles ||--o| user_entitlements : "free plan stub"
  children ||--o{ user_card_states : "per card"
  timeline_cards ||--o{ user_card_states : ""
  profiles ||--o{ weekly_lookahead_preferences : ""
  children ||--o{ weekly_lookahead_preferences : "one per child"
  profiles ||--o{ reminders : "email idempotency"
  profiles ||--o{ card_suggestions : submits
  beta_invites }o--|| profiles : "gates signup"
```

RLS in one breath: users see and edit **their own** rows (children, card
states, preferences, reminders, suggestions) via `current_profile_id()`;
everyone reads **published** cards only; admins (`is_admin()`) manage cards and
read user data; `beta_invites` is service-role only. Both helper functions are
`security definer` with pinned `search_path`. Migration 007 additionally locks
`user_card_states.child_id` to the user's own children and blocks self-service
`profiles.email` edits (the cron reads that column to address digests).

## Card content pipeline

```mermaid
flowchart LR
  Seeds[seed SQL files<br/>seed.sql + batches 1-3] -->|run in Supabase| DB[(timeline_cards)]
  Seeds -->|scripts/export-card-library.mjs<br/>parses each file's own column list| JSON[library-cards.json<br/>bundled]
  JSON -->|preview mode ONLY<br/>no Supabase configured| AppPreview[Local preview]
  DB -->|status = published| AppProd[Production app + email]
  Suggestion[Parent suggestion] -->|promote| Draft
  subgraph studio [Content Studio /admin]
    Draft --> InReview[in_review] --> Approved --> Published
    Published -->|unpublish| Approved
    Draft & Published -->|archive| Archived
  end
  studio --> DB
```

- **Production truth is the database.** The bundled JSON is used only when
  Supabase is not configured (local preview) or for anonymous non-auth-required
  browsing. Archiving a card in the admin removes it everywhere that matters.
- The export script reads each seed file's own INSERT column list - the files
  genuinely differ (seed.sql predates `time_critical`/`allergy_sensitivity`),
  and a hardcoded list silently corrupts every value after a missing column.
- Publish gates (enforced in UI validation **and** DB constraints): image +
  alt text required; sensitivity-flagged cards also need sources, a
  last-reviewed date and a review-due date.
- Card workflow for a new idea: suggestion arrives → *Promote to draft card* →
  fill content → *Copy prompt* → generate pixel art externally → upload (alt
  text auto-fills) → publish when checks pass.

## Timeline engine

Pure TypeScript, no I/O (`src/lib/timeline/`). Input: profile (birth/due date,
state, conditions) + published cards + per-card user state. Output buckets:

```mermaid
flowchart LR
  Cards[Published cards] --> M{match by<br/>age window or<br/>pregnancy week<br/>+ state + conditions}
  M --> Now[currentCards]
  M --> Soon[comingSoonCards<br/>next 30-45d]
  M --> Later[laterCards]
  M --> Past[recentPastCards<br/>ended within 30d]
  M --> Overdue[overdueCards<br/>time_critical only, max 3]
  UserState[saved / snoozed / done<br/>dismissed / not relevant] --> M
  Now -.->|empty week| Quiet[quiet_week card<br/>deterministic weekly rotation]
```

Only `time_critical` cards may nag from the past; everything else quietly drops
away. Paused/ended journeys return an empty timeline. The same engine powers
the app UI and the weekly email digest (max 4 cards, current before soon).

## Weekly email (day + hour matching)

```mermaid
sequenceDiagram
  participant V as Vercel cron (daily 22:00 UTC)
  participant R as weekly-lookahead route
  participant DB as Supabase (service role)
  participant Re as Resend
  V->>R: GET + Bearer CRON_SECRET
  R->>DB: enabled email preferences + published cards
  loop each preference
    R->>R: local weekday == chosen day?
    R->>DB: claim reminder row (unique index = idempotent)
    R->>R: build timeline -> digest (skip if empty)
    R->>Re: send (retry once in-run on failure)
    Note over Re: List-Unsubscribe + one-click POST headers
    R->>DB: mark sent / release claim on failure
  end
```

Design decisions that matter:

- **Daily cron, weekday matching.** `vercel.json` schedules `/api/cron/weekly-lookahead`
  once per day at `0 22 * * *` UTC (~8am Australia/Sydney). The route matches the
  user's chosen *weekday* in their *timezone*; preferred clock time is stored but
  not used for send gating.
- The `reminders` unique index `(user, child, type, date)` makes sends
  idempotent; a failed send releases the claim so a manual re-run the same local
  day can retry.
- The pause link is HMAC-signed (`WIK_EMAIL_TOKEN_SECRET`, falls back to
  `CRON_SECRET`). GET shows a confirm page (mail scanners prefetch GETs);
  POST pauses - and doubles as the RFC 8058 one-click unsubscribe endpoint.
- `keepalive` pings the DB daily so free-tier Supabase doesn't pause.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase connection (anon key is public by design; RLS is the security) |
| `NEXT_PUBLIC_SITE_URL` | server | Absolute links in emails + auth redirects |
| `WIK_REQUIRE_AUTH` | server | Auth wall; defaults **on** in production |
| `WIK_BETA_INVITE_ONLY` | server | Friendly invite check in the sign-in action |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Cron + pause + invite check; bypasses RLS |
| `CRON_SECRET` | server only | Bearer auth for cron routes |
| `WIK_EMAIL_TOKEN_SECRET` | server only | Signs pause links (optional; falls back to CRON_SECRET) |
| `RESEND_API_KEY` / `WIK_FROM_EMAIL` | server only | Weekly email |

## Runbook

- **New admin:** `update public.profiles set role='admin' where email='...';`
- **Invite someone:** `insert into public.beta_invites (email) values ('lower@case');`
- **Test the cron locally:** `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/weekly-lookahead`
- **Card won't publish:** the readiness panel lists why; sensitive cards need sources + review dates + image.
- **Rotate CRON_SECRET safely:** set `WIK_EMAIL_TOKEN_SECRET` first (old pause links die otherwise).
- **Going public:** drop the invite trigger (see 006), revisit the privacy
  policy (deletion contact, overseas disclosure), add real unsubscribe copy,
  and turn `WIK_BETA_INVITE_ONLY` off.
