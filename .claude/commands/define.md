# /define — Phase 1: Define

**Usage:** `/define <epic#>`

```
Skill({skill: "define"})
```

Epic-scoped task entry. Reads the epic, picks the next task to start, sizes it (small / medium / large), creates a child task issue linked to the epic via `**Part of:** #<epic#>`. Lean — no Socratic interview (that moves to `/plan`).

**Prerequisite:** An epic issue exists (from `/plan-epics`). `docs/PRD.md` populated.
**Next:** `/clear`, then `/plan <N>` (where `<N>` is the new child task issue)
