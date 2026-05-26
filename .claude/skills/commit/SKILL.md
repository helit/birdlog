---
name: commit
description: Phase 6 of the Stage 3 feature workflow — reads review state from the task issue, runs a final verification pass, creates the PR with Plan-comment link + epic link + test plan (PR base depends on per-project Task PR strategy), posts a TL;DR comment, and updates the issue.
allowed-tools: Read, Bash
---

# Commit Skill — Phase 6 of 6 (Stage 3)

You are running **Phase 6: Commit & PR** of the Stage 3 feature workflow.

## Fresh Context Check

This phase is designed to run in a fresh context. If prior conversation history is unrelated, ask the user to run `/clear` and then re-run `/commit <N>`.

## Scope of this phase

Every `/commit <N>` runs against a child task issue. PR closes the child; epic closes separately.

## Anti-Rationalization Guards

- "The review just ran — no need for final verification" → No. Always run a final fresh verification before the PR.
- "I'll note an open review finding in the PR and fix it post-merge" → No. All Critical findings must be resolved first. Send the user to `/revise <N>`.
- "The latest TL;DR is a Phase 5b Escalation, but the fixes look mostly done — I'll just verify and proceed" → No. Escalation means human review required. Do not run this phase.
- "I'll force-push to main to include final commits" → No. Never force-push to main.
- "The epic can be closed as part of this child's PR" → No. Child PRs close only the child via `Closes #<N>`. Epics close separately.

---

## Step 1 — Load State from Issue Tracker

Ask for the issue number if not provided.

> **Platform note:** commands below use `gh`. Substitute per `.claude/CLAUDE.md` §Per-project config.

```bash
gh issue view <N> --json number,title,body,comments
```

- Extract parent epic ID from `**Part of:** #<epic#>`
- Extract branch name from `**Branch:**`
- Read the latest Plan TL;DR (URL or comment anchor for PR body)
- Read `.claude/CLAUDE.md` §Per-project config to extract `**Task PR strategy:**` (`trunk` or `feature-branch`)

**Verify gates:**

- Phase 5 must be `[x]` in `## Task Workflow Progress`.
- At least one `## Phase 5 TL;DR: Review` comment must exist.
- If either fails, stop and tell the user to complete `/review <N>` first.

**Findings source of truth.** Identify the latest comment on `<N>` whose header is `## Phase 5 TL;DR: Review` OR `## Phase 5b TL;DR: Revise`. Read its Status line and Findings block.

**Critical findings gate:**

- `Critical: 0` (or `0 remaining` in a 5b Complete ✅) → proceed.
- `Critical ≥ 1` with `Status: Findings remain ⚠️` → stop, run `/revise <N>`.
- Phase 5b Escalation 🛑 → stop, human must resolve.

Count prior `## Phase 5b TL;DR: Revise` comments; record as `revise_iterations` for the PR body.

---

## Step 2 — Final Verification

Invoke the `verification-before-completion` skill — it reads the test/lint commands from `.claude/CLAUDE.md` §Per-project config and runs them fresh.

**Hard gate:** no proceeding on any failure.

---

## Step 3 — Commit Uncommitted Changes

Use `git-commit-helper` for any uncommitted changes. Check:

```bash
git status
git diff --staged
```

Commit with Conventional Commits format before the PR.

---

## Step 4 — Create the PR

Derive the task summary from the child issue title (strip the `feat(<feature-slug>):` prefix if present).

Pick PR base by Task PR strategy:

- **`trunk`:** `--base main --head feat/<feature-slug>/<task-slug>`
- **`feature-branch`:** `--base feat/<feature-slug> --head feat/<feature-slug>/<task-slug>`

Fetch the Plan TL;DR comment URL:

```bash
gh issue view <N> --json comments --jq '.comments[] | select(.body | startswith("## Phase 2 TL;DR: Plan")) | .url' | tail -1
```

```bash
gh pr create \
  --title "feat(<feature-slug>): <task summary>" \
  --body "$(cat <<'EOF'
## Summary

<1-2 sentence description of what was built>

- [key thing 1]
- [key thing 2]
- [key thing 3]

## Plan

See the Plan TL;DR on the task issue: <plan-comment-url>

## Epic

Part of #<epic#> — <epic title>

## Test Plan

- [ ] All unit tests pass (`<test command from CLAUDE.md §Per-project config>`)
- [ ] Linter clean (`<lint command from CLAUDE.md §Per-project config>`)
- [ ] [Key manual test scenario 1 from acceptance]
- [ ] [Key manual test scenario 2]

## Review

Complexity: [N] criteria met
Reviewers: [list]
Critical findings: [N found, all resolved]
Revise iterations: [revise_iterations — omit if 0]

Closes #<N>
Part of #<epic#>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" \
  --base <main | feat/<feature-slug>> \
  --head feat/<feature-slug>/<task-slug>
```

Capture the PR URL.

### Rollup check (epic completion)

After creating the PR, check whether this is the last open child of its epic:

```bash
gh issue list --search "\"Part of: #<epic#>\"" --state open --json number,title
```

If this PR's child is the only remaining open child:

- **Task PR strategy = `trunk`:** tell the user:

  > _"This is the last open task for epic #<epic#>. When this PR merges, no children remain. Close the epic manually once the work is verified shipped: `gh issue close <epic#> --comment \"All tasks merged to main.\"`"_

- **Task PR strategy = `feature-branch`:** offer the rollup PR:
  > _"This is the last open task for epic #<epic#>. Once this PR merges into `feat/<feature-slug>`, the branch is ready to ship. Create the rollup PR now? (y/n)"_
  > If yes:
  ```bash
  gh pr create \
    --title "feat: <epic title> (rollup)" \
    --body "Rollup of all task PRs for <epic title>. Closes #<epic#>." \
    --base main \
    --head feat/<feature-slug>
  ```

---

## Step 5 — Post TL;DR and Update Issue

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 6 TL;DR: Commit & PR
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### What was done
- Final verification passed (tests + lint clean)
- Uncommitted changes committed with conventional messages
- PR created

### Key artifacts
- PR: <pr-url>
- Plan: <plan-comment-url>
- Epic: #<epic#>

### Doc updates
- ARCHITECTURE.md: <final reconciliation, e.g. "pruned obsolete component X" or "none">
- GLOSSARY.md: <or "none">

### Next step
Waiting for human review and merge. Issue will close when PR merges.
[feature-branch, last open child] A rollup PR from feat/<feature-slug> → main has been drafted: <rollup-pr-url>. Epic #<epic#> closes when the rollup merges.
[trunk, last open child] Manually close epic #<epic#> after the work is verified shipped.
EOF
)"
```

Update the child body: set `- [x] Phase 6: Commit & PR — <YYYY-MM-DD>` in `## Task Workflow Progress`, and add the PR URL to Links.

---

## Step 6 — Living Doc Final Reconciliation

This is the last chance to prune stale entries from `docs/ARCHITECTURE.md` or `docs/GLOSSARY.md` based on what the PR actually shipped (vs. what the plan expected). Typical prunes:

- Component removed in this PR still in ARCHITECTURE §Components
- Term no longer used in code still in GLOSSARY
- Obsolete integration in ARCHITECTURE §External Integrations

Apply surgical edits, then commit and push them to the PR branch via `git-commit-helper`. Format: `docs: final reconciliation for #<N>`. Note the same list in the Doc updates section above.

> **Note:** this runs _after_ Step 4 (PR creation). Pushing the follow-up commit adds it to the open PR automatically.

---

## Handoff

> **Phase 6: Commit & PR — Complete ✅**
> PR ready for human review: <pr-url>
>
> **Do not merge.** Human final review and merge is required.
> Issue #<N> will auto-close when the PR merges (via `Closes #<N>`).
> [last child] Epic #<epic#> next steps are in the TL;DR comment above.
