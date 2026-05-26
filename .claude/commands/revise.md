# /revise — Phase 5b: Revise (fix review findings)

**Usage:** `/revise <N>`

```
Skill({skill: "revise"})
```

Reads the latest Phase 5 or Phase 5b TL;DR on issue `<N>`, fixes unresolved Critical findings TDD-style, re-runs Phase 4 verification, then re-reviews with `tech-lead` plus the original non-tech Critical finder only. Posts a Phase 5b TL;DR. Capped at 2 iterations before escalating to human review.

**Prerequisite:** Phase 5 (Review) complete with unresolved Critical findings.
**Next (clean):** `/clear`, then `/commit <N>`
**Next (iteration 1 findings remain):** `/clear`, then `/revise <N>` again
**Next (escalated):** human review — do not run `/commit <N>`
