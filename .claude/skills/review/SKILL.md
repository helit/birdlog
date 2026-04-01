---
name: review
description: Address PR review comments and prepare the branch for merge.
---

Usage: /review PR_NUMBER

This skill runs in a fresh context. It reads all context from artifacts — no prior conversation history required.

Bootstrap sequence:
1. `gh pr view PR_NUMBER` — read PR title, description, and linked issue number.
2. `gh pr diff PR_NUMBER` — read the full diff.
3. `gh issue view ISSUE_NUMBER` — read the linked issue body.
4. Note the PRD slug from the issue. Read `docs/prd/FEATURE_SLUG.md`.
5. Read `CLAUDE.md`.
6. `gh pr comments PR_NUMBER` — read all review comments (or use `gh api` if needed).

For each review comment:
- **Code change requested**: make the change, explain briefly in a commit message.
- **Question asked**: answer it by replying to the comment thread via `gh api repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies -f body="ANSWER"`.
- **Conflict with PRD or acceptance criteria**: flag it explicitly to the user before making any change. Do not resolve PRD conflicts silently.

After addressing all comments:
1. Push the changes.
2. Reply to each resolved comment thread confirming what was changed.
3. Run `npm run test` and `npm run typecheck` and `npm run lint` — all must pass before declaring ready.

CHECKPOINT: Tell the user — "All review comments addressed. Tests, typecheck, and lint are passing. The PR is ready to merge. Merging is your call — merge = done for this issue."

Do not merge. Stop here and wait for the user.
