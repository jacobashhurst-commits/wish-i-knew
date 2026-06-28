# Admin Workflow

Phase 1 prepares the database and validation foundations for admin workflows. It does not build the admin UI yet.

## Target Workflow

1. Capture a rough card idea.
2. Save it as `idea` or `draft`.
3. Refine structured fields.
4. Add source notes where required.
5. Add or approve an image.
6. Preview timeline/card presentation.
7. Publish when validation passes.

## Future Admin Features

- card list
- card editor
- duplicate card
- preview card
- publish/unpublish/archive
- missing image filters
- source review filters
- Supabase Storage image upload
- JSON/CSV import
- match debug view explaining why a card appears for a sample child

Admin permissions should rely on Supabase RLS and `profiles.role = 'admin'`, not frontend checks alone.
