---
name: revise
description: Phase 5b of the Stage 3 feature workflow — reads unresolved Critical findings from the latest Phase 5 (or 5b) TL;DR (or synthesizes them from free-form human comments posted after that TL;DR), applies TDD-style fixes, re-runs Phase 4 verification and a targeted re-review on the updated diff, and either hands off to /commit or escalates to human review after a 2-iteration cap.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# Revise Skill — Phase 5b of 6 (Stage 3)

You are running **Phase 5b: Revise** of the Stage 3 feature workflow. This is the fix loop between Review and Commit. `/review` surfaces findings but does not fix them; `/commit` refuses while any Critical remains — `/revise` owns the fix-and-retest work.

## Fresh Context Check

This phase is designed to run in a fresh context. If prior conversation history is unrelated, ask the user to run `/clear` and then re-run `/revise <N>`.

## Anti-Rationalization Guards

- "Iteration 2 is close enough, let me try one more pass" → No. Hard cap at 2. Post the Escalation TL;DR and halt.
- "The fix is obvious, no failing test needed" → No. TDD applies — write the failing test that encodes the finding first, then fix.
- "I'll skip re-running the reviewer, the fix is surgical" → No. Re-review is required; a fix can introduce new Criticals.
- "Major or Minor findings are also blockers, I should fix them too" → No. Only Critical blocks `/commit`. Majors can be deferred with rationale; Minors are advisory.
- "No Phase 5 TL;DR yet — I'll just run the review inline" → No. Stop and tell the user to run `/review <N>` first.
- "The latest TL;DR already shows Critical = 0, I'll verify just to be safe" → No. Stop and tell the user to run `/commit <N>`.

---

## Step 1 — Load State from Issue Tracker

Ask for the issue number if not provided.

> **Platform note:** commands below use `gh`. Substitute per `.claude/CLAUDE.md` §Per-project config.

```bash
gh issue view <N> --json number,title,body,comments
```

- Extract parent epic ID from `**Part of:** #<epic#>`
- Extract branch name and Task PR strategy context (read `.claude/CLAUDE.md` §Per-project config)
- Read the latest Plan TL;DR (for test strategy context)
- Read the parent epic body (for acceptance criteria)
- Read relevant `docs/ARCHITECTURE.md` sections only if a finding or fix needs architecture context

**Locate the source-of-truth TL;DR.** Scan comments in chronological order and pick the **most recent** comment whose header matches either:

- `## Phase 5 TL;DR: Review`, OR
- `## Phase 5b TL;DR: Revise`

This is the current state of findings on `<N>`.

**Count prior revise iterations.** Count comments whose header matches `## Phase 5b TL;DR: Revise`. Call this `prior_iterations`. The iteration about to run is `prior_iterations + 1`.

**Verify gates:**

- Phase 5 must be `[x]` in `## Task Workflow Progress`. If not, run `/review <N>` first.
- The source-of-truth TL;DR's `### Findings summary` must show `Critical:` with unresolved items. **Evaluate this check after Step 1b — human feedback intake may replace the source-of-truth with a freshly synthesized one.** If Critical is still 0 after intake, stop and tell the user to run `/commit <N>`.
- If `prior_iterations >= 2`, skip to **Step 7c — Escalation** without running any fixes.

Do **not** read `docs/PRD.md` or `docs/GLOSSARY.md` by default in this phase. Use the latest Plan TL;DR, source-of-truth findings, parent epic, current diff, and relevant ARCHITECTURE excerpts.

## Token Budget Caps

- Reviewer brief: ≤150 words, excluding required pasted artifacts such as the diff, Plan TL;DR, or quoted architecture excerpt.
- Reviewer report: ≤200 words total.
- Per-finding rationale: ≤50 words.
- If the cap is tight, include all Critical findings first and collapse Major/Minor findings to counts plus the highest-signal examples.

---

## Step 1b — Intake free-form human feedback (if any)

Humans should not have to hand-write the structured Phase 5 TL;DR template just to push a change into the fix loop. Translate plain-English comments into the same format the rest of this skill consumes.

### Scan

List all comments on `<N>` posted **after** the source-of-truth TL;DR identified in Step 1. Filter to comments whose first non-blank line does **not** start with `## Phase` — these are free-form human-review notes. (Comments authored by the GitHub Actions / bot account, if any, are also skipped; treat anything authored by a human user as candidate feedback.)

If no candidate comments exist, skip the rest of this step.

### Synthesize

For each candidate comment, translate the content into one or more findings:

- **Default severity is Critical.** The user is asking for a change before the PR ships.
- **Demote to Major only on explicit cues** in the comment: leading `nit:`, `minor:`, `non-blocking:`, `advisory:`, or trailing parentheticals like `(not blocking)` / `(optional)`. Major findings appear in the intake TL;DR but do not block `/commit`.
- **Demote to Minor only when the user says so** (`minor:` / "for a future PR"). Minors are advisory only.
- **Ambiguous content** (questions, unrelated chat with no actionable change) → log as Major with rationale "ambiguous — confirm with author". Do not silently drop.

When the comment names a file/line, copy that into the finding's path. Otherwise infer the most likely file from the comment + current diff, or use `"see comment"` if no inference is safe.

### Post intake comment

Post one comment summarising the intake. **Header must be `## Phase 5b TL;DR: Human feedback intake`** — distinct from `## Phase 5b TL;DR: Revise` so the Step 3 iteration counter does not count this as a fix attempt.

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 5b TL;DR: Human feedback intake
**Date:** YYYY-MM-DD
**Status:** Findings remain ⚠️

### Source comments
- <comment-url-1> — @<author>: "<short paraphrase>"
- <comment-url-2> — @<author>: "<short paraphrase>"

### Findings summary
- Critical: <K> found, 0 fixed
- Major:    <K> found
- Minor:    <K> noted

### Unresolved Critical findings
- **[Critical][human-review] <path or "see comment">** — <one-line paraphrase>. Rationale: <copy or paraphrase user's reason; default "human review of the open PR">. Suggested fix: <best-guess concrete change, or "see source comment">.
- [repeat per Critical]

### Major findings (advisory)
- **[Major][human-review] <path>** — <description>. (Demoted because: <cue>.)

### Minor findings (noted)
- **[Minor][human-review] <path>** — <description>.

### Next step
Continue Phase 5b — apply fixes per TDD, re-verify, re-review.
EOF
)"
```

### Re-point source-of-truth

For the rest of this skill run, treat the newly posted intake comment as the source-of-truth TL;DR. Re-evaluate the "Critical ≥ 1" gate against this comment. The Step 3 iteration counter is unchanged (it regex-matches `## Phase 5b TL;DR: Revise`, which the intake header deliberately does not).

### Safety check before proceeding

If the intake comment paraphrases or infers in a way that is hard to verify (e.g., low-confidence file path, ambiguous change), **stop here and ask the user to confirm the synthesised findings before running fixes**. Do not enter Step 2 with low-confidence Criticals.

---

## Step 2 — Parse Unresolved Critical Findings

From the source-of-truth TL;DR, extract the list of unresolved Critical findings (under `### Unresolved findings` or `### Unresolved Critical findings`). Each should have file path, source reviewer if tagged (`[tech-lead]`, `[security-reviewer]`, `[product-reviewer]`), description, rationale, and suggested fix.

If the TL;DR lacks enough detail to act on, **regenerate the finding list**: dispatch the reviewer agents in read-only mode on the current diff (see Step 6 for the roster logic and diff ranges). Use the Token Budget Caps above. Do not apply fixes yet.

---

## Step 3 — Iteration Budget Gate (re-affirm)

- `prior_iterations == 0` → iteration 1. Proceed to Step 4.
- `prior_iterations == 1` → iteration 2. Proceed to Step 4. This is the last fix attempt.
- `prior_iterations >= 2` → budget exhausted. Go to **Step 7c — Escalation**. Do not fix.

---

## Step 4 — Apply Fixes (TDD per finding)

For each Critical finding:

1. Invoke the `test-driven-development` skill.
2. **Write a failing test** that encodes the finding. State explicitly what the test asserts and why it fails on the current code.
3. Run the test; confirm it fails for the right reason.
4. **Apply the minimal fix** to make the test pass. No "while I'm here" cleanup, no surrounding refactors.
5. Run the test; confirm it now passes.

For findings that are not meaningfully testable (e.g. naming, doc-link fix, config comment), apply the fix directly and record in the TL;DR why no test was added (one-line rationale per such finding).

**Hard gate:** Do not proceed until every Critical has a passing test proving the fix, or an explicit rationale for why no test applies.

---

## Step 5 — Full Verification

Invoke the `verification-before-completion` skill.

Run the full test suite and linter. **Hard gate:** no proceeding on any failure. If a fix caused a regression, fix the regression (TDD) and re-verify.

---

## Step 6 — Targeted Re-review

Do not re-run the full original reviewer roster. Build the targeted re-review roster from:

- Always dispatch `tech-lead`.
- Identify the **original Critical finder** from the source reviewer tag on unresolved Critical findings.
- If multiple non-tech reviewers found unresolved Criticals, choose one original Critical finder by priority:
  1. `security-reviewer` for security/auth/data/schema findings
  2. `product-reviewer` for acceptance/product-scope findings
  3. `tech-lead`
- If the source tag is missing, infer the finder from the finding content using the same priority. If still unclear, use `tech-lead` only and note `original Critical finder: unknown`.
- Dispatch the original Critical finder only if it is not `tech-lead`.

Dispatch **in parallel** when 2 agents run. Keep any unselected reviewer lens in advisory mode during synthesis; do not dispatch it.

Synthesise findings; resolve conflicts explicitly. Count **any** Critical in the targeted re-review (including newly introduced ones) toward the still-blocking total.

Each reviewer receives only:

- The updated diff
- The latest Plan TL;DR
- The parent epic body
- The Phase 4 verification results from this revise pass
- Relevant `docs/ARCHITECTURE.md` excerpts, if needed

Instruction: _"Re-review the updated diff using your role rubric. Report ≤200 words total; each rationale ≤50 words. Do not read PRD/GLOSSARY unless the orchestrator included a specific excerpt."_

Diff range (from `.claude/CLAUDE.md` §Per-project config):

- Task PR strategy `trunk`: `git diff main...feat/<feature-slug>/<task-slug>`
- Task PR strategy `feature-branch`: `git diff feat/<feature-slug>...feat/<feature-slug>/<task-slug>`

---

## Step 7 — Commit Intermediate Changes

Before posting the TL;DR, commit this iteration's changes on the current feature branch via the `git-commit-helper` skill. One or two commits per iteration:

1. **Fix commit** — format: `fix(review): address critical findings from revise iteration <N>`. Body: bullet list of Criticals addressed, referencing finding IDs or file paths.
2. **Doc commit (if docs changed)** — if a fix also updated `docs/ARCHITECTURE.md`, `docs/GLOSSARY.md`, or `docs/PRD.md`, stage those separately and commit as `docs: update from revise iteration <N>`.

---

## Step 7a/7b/7c — Post TL;DR and Decide Handoff

### 7a — Clean (Critical = 0 after re-review)

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 5b TL;DR: Revise (Iteration <N>)
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### Findings addressed this iteration
- [bullet per Critical fixed — source reviewer, file path, short description, test reference or "no test: <rationale>"]

### Re-verification
- Tests: `<test command>` — PASS (X passed, 0 failed)
- Lint: `<lint command>` — PASS (0 errors, 0 warnings)

### Re-review
- Roster: [list]
- Original Critical finder: [reviewer or "unknown"]
- Critical: 0 remaining
- Major: [N found, N fixed/deferred]
- Minor: [N noted]

### Next step
Run `/clear`, then `/commit <N>` in a fresh session.
EOF
)"
```

### 7b — Findings remain, iteration 1 only

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 5b TL;DR: Revise (Iteration 1)
**Date:** YYYY-MM-DD
**Status:** Findings remain ⚠️

### Findings addressed this iteration
- [list of what was fixed — include source reviewer and file path]

### Re-verification
- Tests: PASS
- Lint: PASS

### Unresolved Critical findings (carry into iteration 2)
- **[Critical][<reviewer>] <path>:<line>** — <description>. Rationale: <≤50 words>. Suggested fix: <…>.

### Next step
Run `/clear`, then `/revise <N>` again. One iteration remaining before escalation.
EOF
)"
```

### 7c — Escalation

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 5b TL;DR: Revise — Escalation 🛑
**Date:** YYYY-MM-DD
**Status:** Escalated to human

### Why
Iteration budget (2) exhausted with unresolved Critical findings.

### Iterations run
- Iteration 1: [short summary]
- Iteration 2: [short summary]

### Unresolved Critical findings
- **[Critical][<reviewer>] <path>:<line>** — <description>. Rationale: <≤50 words>. Why attempts failed: <…>.

### Recommended human actions
- Re-scope the plan to drop or defer the blocked requirement, OR
- Manually resolve the findings (human author/reviewer pairing), OR
- Accept a finding with explicit rationale and update the plan to reflect acceptance (re-run `/plan <N>`).

### Next step
Human review required. Do not run `/commit <N>` until Critical findings are zero.
EOF
)"
```

### Issue body update (all outcomes)

Update the Phase 5 row in `## Task Workflow Progress`:

```
- [x] Phase 5: Review — YYYY-MM-DD (+ <N> revise pass<es>[, escalated])
```

Examples:

- `- [x] Phase 5: Review — 2026-04-22 (+ 1 revise pass)`
- `- [x] Phase 5: Review — 2026-04-22 (+ 2 revise passes, escalated)`

Do not touch Phase 6.

---

## Handoff

**7a (Clean):**

> **Phase 5b: Revise — Complete ✅**
> Critical findings resolved after iteration `<N>`. Full verification and re-review passed.
>
> Next: Run `/clear`, then:
>
> ```
> /commit <N>
> ```

**7b (Iteration 1 findings remain):**

> **Phase 5b: Revise (Iteration 1) — Findings remain ⚠️** > `<K>` Critical findings still open. One iteration remaining before escalation.
>
> Next: Run `/clear`, then:
>
> ```
> /revise <N>
> ```

**7c (Escalation):**

> **Phase 5b: Revise — Escalated 🛑**
> Iteration budget exhausted with `<K>` Critical findings still open. See the Escalation TL;DR on issue `<N>`.
>
> Do not run `/commit <N>` until Criticals are zero.
