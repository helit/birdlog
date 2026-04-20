# Spec: [Feature Name]

> **How to use this template:**
> Copy this file to `docs/specs/<feature-slug>.md`. Fill in every section. Delete placeholder text. Get human approval before any code is written.

**Status:** Draft | In Review | Approved | Implemented  
**Author:** [Name]  
**Date:** [YYYY-MM-DD]  
**PRD reference:** `docs/prd/[prd-filename].md`

---

## Overview

### What
[1-2 sentences: what is being built?]

### Why
[1-2 sentences: what problem does this solve? What's the business value?]

---

## User Stories

- As a [role], I want to [action] so that [outcome].
- As a [role], I want to [action] so that [outcome].

---

## Technical Approach

### Data Model

[Describe any new database tables, columns, or schema changes. Include field names, types, constraints, and relationships.]

```
Table: [table_name]
- id: uuid, primary key
- [field]: [type], [constraints]
```

### API Endpoints

[List any new or modified API endpoints.]

```
[METHOD] /api/[path]
  Request:  { [fields] }
  Response: { [fields] }
  Auth:     [required / not required]
  Errors:   [list error cases]
```

### Business Logic

[Describe any rules, calculations, validations, or state transitions. Be explicit — AI cannot infer from omission.]

### Integrations

[List any external systems, third-party APIs, or internal services involved. Reference `docs/customer/integrations.md`.]

---

## Implementation Plan

> Each task must be independently testable. Work through these in order.

- [ ] **Task 1:** [Short imperative description]
  - Test: [What test verifies this task is done?]
  - Notes: [Any constraints or gotchas]

- [ ] **Task 2:** [Short imperative description]
  - Test: [What test verifies this task is done?]
  - Notes: [Any constraints or gotchas]

- [ ] **Task 3:** [Short imperative description]
  - Test: [What test verifies this task is done?]

*(Add as many tasks as needed. Each one should take 30–60 minutes to implement.)*

---

## Acceptance Criteria

> Measurable conditions. All must be true for the feature to be considered done.

- [ ] [Condition 1 — specific and verifiable]
- [ ] [Condition 2]
- [ ] [Condition 3]
- [ ] All tests pass
- [ ] No linter errors
- [ ] Reviewed and approved by [role]

---

## Non-Goals

> Explicit exclusions. Important — AI cannot infer what's out of scope.

- This spec does **not** cover [X]
- This spec does **not** cover [Y]

---

## Security & Compliance Considerations

[Describe any auth requirements, data sensitivity, GDPR implications, or compliance constraints. Reference `docs/customer/compliance.md` if applicable.]

- [ ] Auth/authorization requirements defined
- [ ] No sensitive data logged
- [ ] [TODO: customer-specific compliance items]

---

## Risks & Open Questions

| # | Risk / Question | Owner | Status |
|---|----------------|-------|--------|
| 1 | [Risk description] | [Name] | Open |
| 2 | [Question] | [Name] | Resolved: [answer] |

---

## Review Checklist

Before approving this spec:

- [ ] Data model reviewed by [architect/lead]
- [ ] API design reviewed
- [ ] Security considerations addressed
- [ ] Implementation tasks are granular enough (each testable in isolation)
- [ ] Non-goals are explicit
- [ ] Acceptance criteria are measurable
