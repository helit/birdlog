# Code Review Checklist

Use this checklist when reviewing PRs. Run `/review` (Week 2) to get an AI-assisted review first.

---

## Spec Alignment

- [ ] Implementation matches the spec in `docs/specs/`
- [ ] All acceptance criteria are met
- [ ] Nothing out of scope was added

## Correctness

- [ ] Logic handles edge cases described in the spec
- [ ] No obvious bugs in the happy path
- [ ] Error cases are handled as specified

## Security

- [ ] No hardcoded secrets or credentials
- [ ] Auth/authorisation enforced as per spec
- [ ] User input is validated and sanitised
- [ ] No SQL injection, XSS, or other OWASP Top 10 issues
- [ ] Sensitive data is not logged

## Tests

- [ ] Tests cover the acceptance criteria
- [ ] All tests pass
- [ ] No tests were deleted without a documented reason

## Code Quality

- [ ] Follows existing patterns in the codebase
- [ ] No unnecessary abstractions or complexity
- [ ] No dead code

## Compliance

- [ ] Meets requirements in `docs/customer/compliance.md`
- [ ] [TODO: project-specific compliance items]
