# Wish I Knew  -  Implementation Plan (Cursor prompt)

**How to use this:** Add this file to the repo at `docs/implementation-plan.md`, then in Cursor (agent mode, Claude) say:
> "Read `docs/implementation-plan.md` and the docs it references. Do **Milestone 1 only**. When the acceptance criteria pass, stop so I can review and commit."

Work one milestone at a time. Commit between each. Do not start a later milestone until I've reviewed the previous one.

---

## Context  -  read these first, do not reinvent them

Before writing any code, read and respect what already exists:

- `docs/architecture.md`, `docs/content-model.md`, `docs/timeline-engine.md`, `docs/safety-and-sources.md`, `docs/integrations.md`, `docs/build-roadmap.md`, `docs/product-brief.md`
- `supabase/migrations/001_initial_schema.sql` (current schema, RLS, constraints)
- `src/lib/timeline/` (pure engine + tests), `src/lib/content/` (validation, demo cards), `src/types/content.ts`
- `src/app/wish-i-knew-app.tsx` (current client shell, currently `localStorage` demo mode)

The schema, RLS and timeline engine are good. Extend them; don't rewrite them.

## Non-negotiable principles

1. **Content is data, not code.** Cards live in Supabase. Never hardcode parenting advice in components.
2. **The timeline engine stays pure.** No React or Supabase imports in `src/lib/timeline`. It takes data in, returns buckets out. Every engine change ships with Vitest coverage.
3. **Passwordless auth only.** Supabase magic-link email. Never store, hash, or handle passwords in our code. Sessions persist via `@supabase/ssr` cookies so users clicking through from email are already signed in.
4. **Never expose the service role key to the browser.** Server / Edge Functions only.
5. **RLS is mandatory.** Users can only read/write their own rows. Admin actions gated by `profiles.role = 'admin'` via the existing `is_admin()` helper.
6. **Due date is the anchor.** Onboarding and all copy use *due date* (pre-birth) and *birth date* (post-birth). Never ask for "conception."
7. **Calm, never a guilt machine.** Match the existing tone and `docs/safety-and-sources.md`. Cautious wording, AU sources, no diagnosis. Assume nothing about partners, feeding, or family shape  -  partner/feeding fields are always optional and skippable.
8. **Small, reviewable commits.** One milestone per branch/commit. Keep diffs focused.

## Out of scope (do NOT build now)

- Payments / paywall / entitlements
- Native iOS/Android wrapper, web push
- AI content drafting
- Any content scope beyond pregnancy → 24 months (don't add toddler/school timelines yet)

Stub or leave alone anything in these areas.

---

## Milestone 1  -  Real auth + persistence (foundation)

**Goal:** Replace `localStorage` demo mode with Supabase as the system of record, behind magic-link auth.

**Tasks:**
- Wire Supabase magic-link (OTP email) sign-in/sign-up UI using `src/lib/supabase/client.ts` and `server.ts`.
- Add auth middleware to refresh the session on every request (`@supabase/ssr`), with a long session so email click-throughs land already authenticated.
- Add a DB trigger: on `auth.users` insert → create a `profiles` row (email, default role `user`).
- On first onboarding, write `profiles`, `children`, and `weekly_lookahead_preferences`.
- Replace `localStorage` reads/writes in `wish-i-knew-app.tsx` with Supabase queries (server actions or route handlers) for: profile/child load, published-card fetch (`status = 'published'`), and `user_card_states` upserts (save / done / snooze / not_relevant).
- It's fine to keep an unauthenticated read-only preview, but persisted state must come from Supabase once signed in.

**Acceptance criteria:**
- A new user can sign in via magic link, complete onboarding, refresh the page, and see their child + card states persisted.
- No passwords are stored anywhere in our code.
- RLS verified: a user cannot read another user's children or card states.
- `npm run build`, `npm test`, `npm run lint` all pass.

## Milestone 2  -  Schema 002: off-ramp, suggestions, overdue control

**Goal:** Add the schema this product needs but doesn't have. New migration `supabase/migrations/002_*.sql` (additive; do not edit 001).

**Tasks:**
- **Journey off-ramp:** add `children.status` enum `('active','paused','ended')` default `'active'`. Add `paused_at`, `ended_at` timestamps.
- **Re-anchoring:** confirm a born baby can update `is_born = true` + `birth_date` while keeping `due_date` (schema already allows this  -  add the update path in app code, no schema change needed beyond verifying the check constraint still holds).
- **Overdue control:** add `timeline_cards.time_critical boolean not null default false`. Only `time_critical` cards may ever appear in the overdue bucket.
- **Quiet-week content:** allow `card_type = 'quiet_week'`. These cards have no age/pregnancy window; they're served by fallback (Milestone 3).
- **User suggestions:** new table `card_suggestions` (`id`, `user_id` → profiles, `title`, `body`, `suggested_timing` text, `status` enum `('new','reviewed','accepted','declined')` default `'new'`, timestamps). RLS: users insert + read **their own**; admins read all + update status. Users may NOT edit `timeline_cards`.

**Acceptance criteria:**
- Migration applies cleanly on top of 001 and seeds still load.
- RLS: a normal user can insert a suggestion and read only their own; cannot read `card_suggestions` of others; cannot write `timeline_cards`.

## Milestone 3  -  Engine fixes (pure functions + tests)

**Goal:** Fix the three engine gaps and wire the off-ramp. All changes in `src/lib/timeline` with Vitest tests.

**Tasks:**
- **Pregnancy "coming soon":** `matchComingSoonCard` only handles born/age right now. Add a pregnancy-week branch (mirror `matchLaterCard`'s pregnancy logic) bounded to a near window (~`comingSoonDays / 7` weeks) so pregnancy cards surface in "coming soon," not jump straight from "later" to "current."
- **Tame overdue:** `matchOverdueCard` must only return cards where `card.time_critical === true`. Everything else silently drops out of the overdue bucket. Cap the bucket to a small max (e.g. 3), highest `priority` first.
- **Quiet-week fallback:** add a step in `buildTimeline` (or a helper it calls) that, when `currentCards` is empty for the user this week, returns one `quiet_week` card from the published pool. This is a fallback, not a scheduled card  -  never show a quiet-week card alongside real current cards.
- **Off-ramp suppression:** `buildTimeline` returns empty buckets for children whose `status !== 'active'`.

**Acceptance criteria:**
- New Vitest cases: pregnancy coming-soon populates; non-`time_critical` cards never appear as overdue; empty current week yields exactly one quiet-week card; paused/ended child yields no cards.
- All existing tests still pass.

## Milestone 4  -  Content Studio v1 (author unlimited cards)

**Goal:** A role-gated admin UI to create as many cards as needed without touching code. This is the priority feature.

**Tasks:**
- `/admin` route group, gated by `profiles.role = 'admin'` (server-side check, not just hidden UI).
- **Card list:** filter by `status`, `life_stage`, `card_type`; search by title/slug.
- **Card editor:** full CRUD on `timeline_cards`  -  all content fields (`wish_i_knew`, `why_it_matters`, `what_to_do_now`, `what_can_wait`, `parent_script`, `partner_prompt`, checklist/shopping JSON, etc.), timing windows (age days OR pregnancy weeks), conditions, sensitivity flags, `time_critical`, and the new `quiet_week` type.
- **Lifecycle:** draft → in_review → approved → published, plus unpublish/archive/duplicate. Surface the existing publish-validation rules from `src/lib/content/validation.ts` in the UI (block publish with clear reasons: missing image/alt, sensitive card missing sources/review dates).
- **Image upload:** to the existing `card-images` Storage bucket; set `image_url` + `image_status`. Admin write only.
- **Match debugger:** a panel that runs `buildTimeline` against a sample child profile (set due date or birth date, state, flags) and shows which bucket a card lands in and why (the engine already returns match reasons  -  surface them).
- **Bulk authoring:** support "duplicate card" and (optional) CSV import via the existing `content_import_batches` table.

**Acceptance criteria:**
- An admin can create, edit, image, validate, and publish a card end to end, and it immediately appears for a matching user.
- A non-admin gets 403/redirect on every `/admin` route and cannot mutate cards via the API.
- Publish is blocked with readable reasons when validation fails.

## Milestone 5  -  User card suggestions

**Goal:** Let users suggest cards; let admins triage them.

**Tasks:**
- A simple, calm "Suggest something I wish I'd known" form in the app → inserts into `card_suggestions` (status `new`).
- A review queue in Content Studio: list suggestions, mark reviewed/accepted/declined, and "promote to draft card" (pre-fills the card editor from a suggestion).

**Acceptance criteria:**
- A user submits a suggestion and sees a gentle confirmation; an admin sees it in the queue and can promote it to a draft card.

## Milestone 6  -  Weekly Lookahead email (the ritual)

**Goal:** The day-1 notification channel: one calm weekly email, content **in the email**, no app install required.

**Tasks:**
- Integrate Resend (`RESEND_API_KEY`, `WIK_FROM_EMAIL`). Set up SPF/DKIM later  -  leave a note.
- A scheduled job (Vercel Cron → server route using the service role, or Supabase Edge Function + pg_cron) that, for each user whose `weekly_lookahead_preferences` day/time matches now (respect `timezone`, `enabled`, quiet hours):
  - runs `buildTimeline` for their active child,
  - composes a digest of up to ~4 cards (this-week first, then coming-soon; quiet-week fallback if empty),
  - **renders the actual card content in the email body** (not "tap to open"),
  - includes deep links to the app for save/done actions, and a one-tap pause/unsubscribe that sets `enabled = false` without deleting the account,
  - logs to the `reminders` table (`status = 'sent'`).
- Skip children whose `status !== 'active'` entirely.

**Acceptance criteria:**
- A test user receives a readable weekly email containing real card content at their chosen day/time/timezone.
- Pausing from the email stops future sends; no account deletion.
- A paused/ended journey receives nothing.

---

## Cross-cutting requirements (apply in every milestone)

- Onboarding and copy use **due date / birth date**, never "conception."
- `partner_prompt` and feeding fields are optional everywhere; never block a solo parent.
- Every card render is designed for 3am, one-handed, dim screen: short, skimmable, one thing that matters first.
- Keep `npm run build`, `npm test`, `npm run lint` green at the end of every milestone.
- If a decision isn't specified here, prefer the simplest option that fits the existing architecture, and leave a short `// TODO:` note rather than expanding scope.
