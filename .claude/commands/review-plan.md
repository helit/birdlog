# /review-plan — Phase 2b: Review Plan

```
Skill({skill: "review-plan"})
```

Dispatches the `plan-reviewer` agent on the latest Plan TL;DR. If Critical findings surface, loop back to `/plan`. If clean, proceed to `/implement`.

**Next (clean):** `/clear`, then `/implement <N>`
**Next (findings):** `/clear`, then `/plan <N>` (revise), then `/review-plan <N>` again
