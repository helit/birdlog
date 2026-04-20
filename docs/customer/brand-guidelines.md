# Brand & Code Style Guidelines — BirdLog

## Philosophy

**Field guide, not fitness tracker.** No streaks, no gamification, no engagement hooks. Focus on helping the user understand birds — rarity, migration, seasonal context. Every design decision should ask: "Does this help a birder in the field?"

---

## UI Language

- All user-facing text in **Swedish** — labels, buttons, error messages, placeholders
- Scientific names always in *italics* when displayed
- Swedish common names take precedence over English names in the UI

## Naming Conventions

- **UI labels:** Use bird-domain terms from `GLOSSARY.md` (e.g. "Fynd" not "Sighting", "Observationer" not "Reports")
- **API / GraphQL fields:** camelCase (e.g. `rarityLevel`, `swedishName`)
- **Database columns:** snake_case via Prisma conventions
- **Code:** camelCase variables/functions, PascalCase components/types

## UX Patterns

- Mobile-first — design for portrait phone, then scale up
- Bottom sheets for contextual option selection (not modals)
- Hero card at top of IdentifyPage for the rarest nearby bird
- Loading states must use Swedish text
- Error messages must use Swedish text and be actionable

## Component Library

- shadcn/ui components as base — extend, don't replace
- TailwindCSS 4 for styling — no inline styles, no CSS modules
- `clsx` + `tailwind-merge` for conditional classes
- Icons from `lucide-react`

## Code Style Preferences

- Named exports only — no default exports
- Async/await over `.then()` chains
- Explicit TypeScript types at module boundaries — no `any`
- No comments explaining *what* — only *why* (non-obvious constraints, workarounds)

## Things to Avoid

- Streaks, badges, scores, gamification of any kind
- "Push" notifications or re-engagement patterns
- Logging or displaying individual bird counts (report count only)
- English UI text (except in developer-facing code and logs)
