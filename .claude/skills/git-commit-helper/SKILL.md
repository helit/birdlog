---
name: git-commit-helper
description: Generate conventional commit messages. Triggers on git commit, staged changes, or commit message requests.
allowed-tools: Bash, Read
---

# Git Commit Helper

Generate a conventional commit message from staged changes.

## When to activate

- User runs `git commit` without a message
- User asks for a commit message
- Staged changes exist

## Format

```
<type>(<scope>): <subject>   ← max 50 chars, imperative mood, no period

<body>                        ← what + why; wrap at 72 chars

<footer>                      ← BREAKING CHANGE: … | Closes #N
```

## Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring, no behavior change |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `perf` | Performance improvement |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration |
| `chore` | Maintenance, tooling |

## Process

1. `git diff --staged --name-only` — see what's staged
2. `git diff --staged` — read the diff
3. Pick type from the table; scope = module or component name
4. Subject: imperative mood ("add", not "added"), lowercase after type
5. Body: explain why, not how; omit if subject is self-explanatory
6. Footer: `Closes #N` if linked to an issue; `BREAKING CHANGE:` if applicable
