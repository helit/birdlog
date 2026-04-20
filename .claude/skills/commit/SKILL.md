---
name: commit
description: Phase 6 of the SDD workflow — reads the review state from the issue tracker, runs a final verification pass, creates the PR with spec link and test plan, posts a TL;DR comment, and updates the issue.
allowed-tools: Read, Bash
---

# Commit Skill — Phase 6 of 6

You are running **Phase 6: Commit & PR** of the Spec-Driven Development workflow.

## Fresh Context Check

This phase is designed to run in a fresh context. If you have prior conversation history in this session unrelated to this phase, ask the user to run `/clear` and then re-run `/commit <issue-number>`.

## Anti-Rationalization Guards

- "The review just ran — no need for a final verification" → No. Always run a final fresh verification before the PR. Sessions are isolated; what passed earlier may have changed.
- "I'll note the open review finding in the PR and fix it post-merge" → No. All Critical findings must be resolved before the PR is created.
- "I'll force-push to main to include the final commits" → No. Never force-push to main. Create the PR from the feature branch.

---

## Step 1 — Load State from Issue Tracker

Ask the user for the issue number if not provided as an argument.

> **Platform note:** Commands below use `gh` (GitHub CLI). Check the **Version Control** section in `.claude/CLAUDE.md` for your project's platform and substitute accordingly (e.g. `glab issue view` for GitLab, `glab mr create` for PRs).

Run:
```bash
gh issue view <N> --json number,title,body,comments
```

From the output:
- Extract the spec path, branch name, and review summary from the prior TL;DR comments

**Verify gate:** Check that Phase 5 is marked `[x]` in the Workflow Progress checklist. Also confirm the Phase 5 TL;DR shows "Status: Complete ✅". If Phase 5 is not complete, stop and tell the user to complete `/review <N>` first.

**Critical findings gate:** Check the Phase 5 TL;DR for any unresolved Critical findings. If any remain, stop and tell the user to resolve them before running `/commit`.

---

## Step 2 — Final Verification

Invoke the `verification-before-completion` skill one final time.

Run the full test suite: `[TODO: insert test command]`
Run the linter: `[TODO: insert lint command]`

**Hard gate:** Do not proceed if any tests fail or if there are lint errors.

---

## Step 3 — Commit Uncommitted Changes

Use the `git-commit-helper` skill for any uncommitted changes. Commit messages must follow Conventional Commits.

Check for uncommitted changes:
```bash
git status
git diff --staged
```

If there are uncommitted changes, commit them using conventional commit format before creating the PR.

---

## Step 4 — Create the PR

```bash
gh pr create \
  --title "feat: <feature-name>" \
  --body "$(cat <<'EOF'
## Summary

<1-2 sentence description of what was built>

- [bullet: key thing 1]
- [bullet: key thing 2]
- [bullet: key thing 3]

## Spec

`docs/specs/<feature-slug>.md`

## Test Plan

- [ ] All unit tests pass (`[TODO: test command]`)
- [ ] Linter clean (`[TODO: lint command]`)
- [ ] [Key manual test scenario 1 from the spec's acceptance criteria]
- [ ] [Key manual test scenario 2]

## Review

Complexity: SIMPLE / COMPLEX — [N] criteria met
Reviewers: [list]
Critical findings: [N found, all resolved]

Closes #<N>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" \
  --base main \
  --head feat/<feature-slug>
```

Capture the PR URL from the output.

---

## Step 5 — Post TL;DR Comment and Update Issue

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 6 TL;DR: Commit & PR
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### What was done
- Final verification passed (tests + lint clean)
- All uncommitted changes committed with conventional messages
- PR created

### Key artifacts
- PR: <pr-url>
- Spec: docs/specs/<feature-slug>.md

### Next step
Waiting for human review and merge. The issue will be closed when the PR merges.
EOF
)"
```

Update the issue body to mark Phase 6 complete and add the PR link:

```bash
gh issue edit <N> --body "$(cat <<'EOF'
## Feature: <feature-name>

<description>

## Workflow Progress
- [x] Phase 1: Define — <date>
- [x] Phase 2: Spec — <date>
- [x] Phase 3: Implement — <date>
- [x] Phase 4: Test — <date>
- [x] Phase 5: Review — <date>
- [x] Phase 6: Commit & PR — <YYYY-MM-DD>

## Links
- PRD: <path or "none">
- Spec: docs/specs/<feature-slug>.md
- Branch: feat/<feature-slug>
- PR: <pr-url>
EOF
)"
```

---

## Handoff

Tell the user:

> **Phase 6: Commit & PR — Complete ✅**
> PR ready for human review: <pr-url>
>
> **Do not merge.** Human final review and merge is required.
> The issue (#N) will be automatically closed when the PR merges (via "Closes #N" in the PR body).
