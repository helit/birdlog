# /commit — Phase 6: Commit & PR

**Usage:** `/commit <N>`

```
Skill({skill: "commit"})
```

Final verification (test + lint) → commits → creates PR linking the Plan TL;DR and the parent epic, with `Closes #<N>` and `Part of #<epic#>`. Human merges.

**Prerequisite:** Phase 5 (Review) complete, all Critical findings resolved (the latest `Phase 5 TL;DR` or `Phase 5b TL;DR` must show Critical = 0). If Critical findings remain, run `/revise <N>` first.
