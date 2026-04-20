---
name: initiate-project
description: Run once at the start of a new engagement to choose the tech stack, scaffold the project, and configure the boilerplate. Covers language, framework, database, testing, and tooling decisions with per-category human approval before any code is generated.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# Initiate Project Skill

You are running the **Project Initiation** workflow. This runs once per engagement, before any `/define` or `/spec` calls.

## Anti-Rationalization Guards

- "The stack is obvious — I'll just scaffold it" → No. Every category requires explicit human approval before scaffolding begins.
- "I'll use our standard stack since it usually works" → No. Recommendations must be justified for this specific project with alternatives listed.
- "The project structure looks mostly empty — I'll proceed anyway" → If a package.json, src/, or equivalent exists, stop. Do not re-initialize an existing project.

---

## Step 1 — Check for Existing Project Structure

Before doing anything else, check whether the project is already initialized:

```bash
ls -la
```

Look for any of: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `src/`, `app/`, `lib/`. If any are present, **stop immediately** and tell the user:

> "A project structure already exists. `/initiate-project` is a one-time setup skill — it should not be run on an existing project. If you need to change the tech stack, update `CLAUDE.md` and `docs/architecture/system-overview.md` directly."

---

## Step 2 — Gather Project Context

Ask the user the following questions. Collect all answers before proceeding to Step 3.

1. **What are we building?** (e.g. web app, REST API, CLI tool, data pipeline, mobile app — be specific)
2. **Any hard constraints?** (e.g. "must use Python", "client is on AWS", "team only knows React", "no paid dependencies")
3. **Expected scale at launch?** (e.g. prototype, small internal tool, production app serving thousands of users)
4. **Are there existing systems this must integrate with?** (Check `docs/customer/integrations.md` if it exists — ask the user to confirm or add to what's there)
5. **Any compliance or security requirements?** (Check `docs/customer/compliance.md` if it exists)
6. **Which Git hosting platform?** (GitHub / GitLab / Bitbucket / Azure DevOps / other — this determines the issue tracker CLI used throughout the workflow)

---

## Step 3 — Tech Stack Recommendation

Dispatch the `senior-developer` agent. Pass it:
- The answers from Step 2
- The contents of `docs/customer/integrations.md` (if it exists)
- The contents of `docs/customer/compliance.md` (if it exists)
- The instruction: *"Generate tech stack recommendations for a greenfield project. Cover all six categories below. For each item in every category, provide: name, version/minimum version, rationale for this specific project, alternatives considered with reasons for not choosing them, and risk level (Low/Medium/High)."*

Categories to cover:
1. **Language & Runtime** (e.g. TypeScript/Node.js 20, Python 3.12)
2. **Frontend framework** (e.g. Next.js 14, React + Vite, Vue — or "none" for backend-only)
3. **Backend framework** (e.g. Express, Fastify, FastAPI — or "built-in to frontend framework")
4. **Database & data layer** (e.g. PostgreSQL + Prisma, SQLite + Drizzle, MongoDB)
5. **Test framework** (e.g. Vitest, Jest, pytest, Go test)
6. **Tooling** (linter, formatter, bundler — e.g. ESLint + Prettier + Turbopack)

Wait for the agent to complete before proceeding.

---

## Step 4 — Per-Category Approval

Present each category to the user one at a time. **Do not advance to the next category until the current one is approved.** Each item within a category is a numbered line item — the user may approve, reject (with or without proposing an alternative), or defer each one individually.

**Category 1 — Language & Runtime**
**Category 2 — Frontend Framework**
**Category 3 — Backend Framework**
**Category 4 — Database & Data Layer**
**Category 5 — Test Framework**
**Category 6 — Tooling**

After all six categories are approved, present the full stack as a summary table and ask for final confirmation before any code is generated:

```
Final Stack Summary:
- Language/Runtime: [approved choice]
- Frontend: [approved choice or "none"]
- Backend: [approved choice]
- Database: [approved choice]
- Tests: [approved choice]
- Tooling: [approved choices]
```

**Hard gate:** Do not run any scaffold commands until the user explicitly confirms the full stack summary.

---

## Step 5 — Scaffold the Project

Based on the approved stack, generate and show the scaffold commands to the user before running them:

> "I'll now run the following commands to scaffold the project. Review them and confirm."

Show the commands, wait for explicit confirmation, then run them. Examples (adapt to the approved stack):

```bash
# Example for Next.js + TypeScript + Prisma
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install prisma @prisma/client
npx prisma init
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

After scaffolding, verify the structure looks correct:
```bash
ls -la
```

---

## Step 6 — Update Project Configuration Files

Update the `[TODO]` sections in the boilerplate files to reflect the approved stack.

### Update `.claude/CLAUDE.md`

Replace the Version Control section's `[TODO]` placeholder with the platform chosen in Step 2:

```
- **Platform:** [chosen platform]
- **Issue CLI:** [e.g. `gh issue` for GitHub, `glab issue` for GitLab]
- **PR CLI:** [e.g. `gh pr create` for GitHub, `glab mr create` for GitLab]
```

Then replace the Tech Stack section's `[TODO]` placeholders:

```
- **Language / Framework:** [approved language/framework]
- **Database:** [approved database + ORM]
- **Test framework:** [approved test framework]
- **Build:** [actual build command, e.g. `npm run build`]
- **Test:** [actual test command, e.g. `npm test` or `npx vitest`]
- **Lint:** [actual lint command, e.g. `npm run lint`]
```

Also update the `[TODO: insert test command]` and `[TODO: insert lint command]` placeholders in the phase skills if they exist (grep for them):

```bash
grep -r "TODO: insert test command\|TODO: insert lint command" .claude/skills/
```

Update any matches with the real commands.

### Update `AGENTS.md`

Replace the Tech Stack `[TODO]` section with the actual stack summary.

### Create/Update `docs/architecture/system-overview.md`

If the file is a stub or doesn't have tech stack information, add a Tech Stack section:

```markdown
## Tech Stack

| Layer | Technology |
|---|---|
| Language / Runtime | [approved] |
| Frontend | [approved or "none"] |
| Backend | [approved] |
| Database | [approved] |
| ORM / Query layer | [approved] |
| Test framework | [approved] |
| Linter | [approved] |
| Formatter | [approved] |

### Key decisions
- [Why this language/runtime was chosen]
- [Why this framework was chosen]
- [Any notable tradeoffs accepted]
```

---

## Step 7 — Verify the Setup

Run the test and lint commands to confirm the scaffold is working:

```bash
[test command]
[lint command]
```

If anything fails, diagnose and fix before reporting success.

---

## Handoff

Tell the user:

> **Project Initialized ✅**
>
> Stack configured:
> - [one-line summary of approved stack]
>
> Config files updated:
> - `.claude/CLAUDE.md` — tech stack filled in
> - `AGENTS.md` — tech stack filled in
> - `docs/architecture/system-overview.md` — stack documented
>
> Next: Fill in `docs/customer/` files if not already done (glossary, integrations, compliance), then run `/define` to start your first feature.
