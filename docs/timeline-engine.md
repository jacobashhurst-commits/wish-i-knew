# Timeline Engine

Timeline logic must stay separate from UI components.

Phase 1 lives in `src/lib/timeline`.

## Inputs

- child birth date or due date
- current date
- born/unborn state
- state/territory
- first child flag
- childcare intention
- published cards
- user card states

## Outputs

- current cards
- coming soon cards
- later cards
- overdue cards
- saved cards
- snoozed cards due again

## Matching Rules

Phase 1 supports:

- age range matching
- pregnancy week matching
- state-specific filtering
- simple conditions such as `born_only`, `unborn_only`, `first_child_only`, `childcare_yes` and `childcare_yes_or_unsure`
- done/dismissed/not relevant suppression
- saved card grouping
- snoozed card due grouping

The engine returns match reasons so a later admin debug view can explain why a card did or did not match.
