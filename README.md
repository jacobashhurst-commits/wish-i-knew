# Wish I Knew

Know what's coming next.

Wish I Knew is an Australian-first, mobile-first parenting timeline app for expecting and new parents. Calm, playful, practical  -  not a tracker, not a guilt machine.

## What’s in this repo

- **Next.js 16** app (TypeScript, Tailwind v4, App Router)
- **Timeline engine**  -  age/pregnancy matching, overdue / current / coming soon / later buckets
- **Demo app**  -  onboarding, Home, scrollable Timeline, Saved, Settings, Content Studio preview
- **Supabase**  -  schema, RLS, magic-link auth, persisted child/card state (Milestone 1)
- **Assets**  -  painterly hero + cute 8-bit pixel card art
- **Tests**  -  Vitest for dates, matching and publish validation
- **Docs**  -  product, architecture, integrations, content and design guides

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Copy `.env.example` to `.env.local` and add Supabase credentials. Then follow **[Supabase setup](docs/supabase-setup.md)** to run migrations, configure auth redirects, and seed cards.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Run Vitest |
| `npm run lint` | ESLint |

## Architecture & integrations

- **[Architecture](docs/architecture.md)**  -  system design, layers, data flow, deployment, security
- **[Integrations](docs/integrations.md)**  -  Supabase, Vercel, email, push, AI, payments (phased)
- **[Timeline engine](docs/timeline-engine.md)**  -  matching rules
- **[Content model](docs/content-model.md)**  -  cards as data, lifecycle, tables
- **[Build roadmap](docs/build-roadmap.md)**  -  phased delivery

## Design

- **[Design direction](docs/design-direction.md)**  -  NSW coastal + neo-bank polish
- **[Card image guidelines](docs/card-image-guidelines.md)**  -  8-bit card items + painterly heroes

## License

Private  -  All rights reserved (until you choose otherwise).
