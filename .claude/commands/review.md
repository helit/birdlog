# /review — Phase 5: Review

**Usage:** `/review <N>`

```
Skill({skill: "review"})
```

Complexity gate (six criteria) decides the reviewer roster:

- Always dispatch `tech-lead`
- Add `security-reviewer` only when auth/payments/data security or schema is touched
- Add `product-reviewer` when the product lens is triggered (2+ criteria, public API change, or 4+ criteria) and the task is not security-sensitive
- Run all three only when 4+ criteria, security-sensitive, and product-lens triggers are all present

Findings are **Critical / Major / Minor**. Only Critical blocks `/commit`.

**Prerequisite:** Phase 4 (Test) complete with a clean test run.
**Next (clean):** `/clear`, then `/commit <N>`
**Next (Critical findings remain):** `/clear`, then `/revise <N>` (Phase 5b — fix loop, max 2 iterations)
