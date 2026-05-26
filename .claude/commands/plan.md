# /plan — Phase 2: Plan

```
Skill({skill: "plan"})
```

Produces a lightweight per-task implementation plan: compact Red-Green-Refactor sub-tasks, one failing test name per sub-task, touched files, implementation-agent roster, and ≤30-word risks. Advisors are default-off and dispatch only for a Critical review-plan loop or explicit external-knowledge gap. Writes the plan as a TL;DR comment on the task issue. **Replaces the old `/spec`.**

**Next:** `/clear`, then `/review-plan <N>`
