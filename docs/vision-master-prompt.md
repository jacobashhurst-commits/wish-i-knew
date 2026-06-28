# Wish I Knew Product Constitution

Wish I Knew is an Australian-first parenting timeline app for expecting and new parents.

Tagline: **Know what's coming next.**

The product promise is to help Australian parents know what is coming next before it blindsides them.

## Product Focus

Wish I Knew is a playful, visual, card-based timeline and weekly lookahead product. It helps parents anticipate practical milestones, admin traps, health moments, childcare planning, feeding shifts, sleep changes, gear transitions, return-to-work planning and family life.

The MVP focuses on Australia, pregnancy and children from birth to 24 months.

Wish I Knew is not a feed tracker, nappy tracker, sleep tracker, contraction timer, generic article app, social network, forum, ad-filled media site, medical diagnosis tool or replacement for professional advice.

## Core Experience

The timeline is the main mental model. Parents should quickly understand:

- where they are now
- what matters this week
- what is coming soon
- what can wait
- what they have saved, snoozed, done or dismissed

The Weekly Lookahead is central. It should feel like a calm Saturday morning ritual with coffee, not a fear-based notification system.

Cards are the unit of value. Meaningful content must be represented as visual cards, not long article pages.

## Australian Requirements

The product is Australian-first. Use Australian English and parenting language: mum, nappy, pram, cot, dummy, GP, childcare, solids, personalised.

Australian context matters for Medicare, Services Australia, Child Care Subsidy, parental leave, birth registration, immunisations, child and family health nurses, GP visits, public/private hospital pathways, state and territory differences, childcare waitlists, safe sleep, allergy and feeding guidance.

Do not globalise the product unless explicitly directed.

## Content Principles

Cards are data, not code. Do not hardcode card content in React components.

Every published card must have an image or illustration.

Rule: **No picture, no published card.**

Sensitive cards covering medical, feeding, allergy, immunisation, safety, government, subsidy or legal/admin topics require reputable Australian sources, review dates and safe wording.

Preferred source hierarchy includes health.gov.au, Services Australia, Pregnancy Birth and Baby, Raising Children Network, state and territory health departments, ASCIA, Red Nose and the Australian Breastfeeding Association.

## Technical Direction

Use Next.js, TypeScript, Tailwind CSS, Supabase, Supabase Auth, Supabase Postgres, Supabase Storage, RLS and Vercel later.

Build mobile-first. Do not start with native apps, microservices, payments, AI helper, complex notifications or social/community features.

Timeline/date logic must live outside UI components and be tested.

## Business Principles

No traditional banner ads.

The business model is freemium later, with affordable premium plans. Keep payment infrastructure deferred until the product proves useful.

Trust matters more than monetisation.
