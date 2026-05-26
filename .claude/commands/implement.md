# /implement — Phase 3: Implement

**Usage:** `/implement <N>`

```
Skill({skill: "implement"})
```

Reads the approved Plan TL;DR and Review Plan TL;DR on issue `<N>`. It consumes the implementation-agent guidance already folded into the plan; it does not re-dispatch advisors. Claude implements by default; Codex is an optional alternative if the project has it configured. TDD enforced — failing test first, then minimal code.

**Prerequisite:** Phase 2 (Plan) and Phase 2b (Review Plan) both complete; `/review-plan` status is `Approved ✅`.
**Next:** `/clear`, then `/test <N>`
