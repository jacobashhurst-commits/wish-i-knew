# Build Roadmap

## Phase 1: Foundation

- Next.js, TypeScript and Tailwind project setup
- Supabase clients
- core schema and RLS
- card image fields and publish constraints
- six seed cards
- basic timeline engine
- timeline/date/content validation tests
- initial documentation

## Phase 2: User App Shell

- mobile-first onboarding demo
- local child profile setup
- first home screen
- Weekly Lookahead panel
- current and coming-soon card sections
- card detail panel
- frontend save, done, snooze and not relevant states

Phase 2 currently uses local demo content from `src/lib/content/demo-cards.ts` while Supabase credentials and real data access are not connected.

Visual direction is now a strong second pass: a painterly NSW coastal hero illustration, cute 8-bit pixel-art "item" card images, Fraunces display type on a warm cream base, and a continuous scrolling Timeline (Heads up → This week → Coming soon → Later). See `docs/design-direction.md` and `docs/card-image-guidelines.md`.

## Phase 3: Timeline And Cards

- timeline view
- card components
- card detail
- save, done, snooze and not relevant actions

## Phase 4: Weekly Lookahead

- preference editing
- weekly card selection
- in-app lookahead screen

## Phase 5: Admin V1

- card list
- card editor
- preview
- publish validation UI

## Later

- image upload workflow
- JSON/CSV import
- payments
- partner mode
- AI-assisted drafting
- native wrapper

## Notifications (to design)

The Weekly Lookahead ritual depends on a reliable nudge. Mobile-first, layered by what we can ship soonest:

- **Email + web (MVP-friendly):** transactional email for the weekly Lookahead and any time-sensitive "heads up" cards. Works on every device, no app store needed. Likely first to ship.
- **Web push (PWA):** browser/installed-PWA push for the weekly nudge on mobile and desktop. Good middle step before native.
- **Native push (later):** iOS/Android push once a native wrapper exists, for the most reliable mobile delivery.
- Respect quiet hours and the user's chosen Lookahead day/time; never spammy. One calm weekly nudge plus rare urgent heads-ups.
- Store delivery preferences per user (channel, day, time, opt-outs) alongside the existing `reminders` table.
