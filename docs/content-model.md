# Content Model

Cards are the core content object. They live in Supabase, not React components.

## Card Lifecycle

- idea
- draft
- in_review
- approved
- published
- needs_review
- archived

Only `published` cards are visible to normal users.

## Required Publish Fields

Published cards require:

- title
- slug
- card type
- category
- life stage or timing window
- short summary
- Wish I Knew insight
- image URL
- image alt text
- image status of `approved`, `uploaded` or `published`

Sensitive cards also require source information, last reviewed date and review due date.

## Core Tables

- `profiles`
- `children`
- `timeline_cards`
- `user_card_states`
- `weekly_lookahead_preferences`
- `reminders`
- `content_import_batches`
- `content_audit_log`

## Admin Direction

The admin workflow should eventually support create, edit, duplicate, preview, publish, unpublish, archive, import, image upload, source review and match debugging.
