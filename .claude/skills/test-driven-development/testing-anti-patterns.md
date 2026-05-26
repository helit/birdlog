# Testing Anti-Patterns

Reference document for the `test-driven-development` skill. These are patterns that produce tests that pass but don't actually protect against regressions.

---

## Anti-Pattern 1: Testing Implementation Details

**What it looks like:**

```js
// ❌ Tests that the internal function was called, not that behaviour was correct
expect(mockEncryptPassword).toHaveBeenCalledWith('secret123');

// ✅ Tests the observable outcome
expect(await login('user', 'secret123')).toEqual({ success: true });
```

**Why it's harmful:** Refactoring the implementation (e.g. inlining `encryptPassword`) breaks the test even though behaviour didn't change.

---

## Anti-Pattern 2: Mocking Everything

**What it looks like:**

```js
// ❌ Mocked so heavily it only tests the test itself
const mockDb = { findUser: jest.fn().mockResolvedValue({ id: 1 }) };
const mockCache = { get: jest.fn().mockReturnValue(null) };
const mockLogger = { info: jest.fn() };
const result = await getUser(1, mockDb, mockCache, mockLogger);
```

**Why it's harmful:** The test passes even if the real database query is broken. Mock/prod divergence is a major source of "tests pass but prod is broken."

**Guideline:** Mock at system boundaries (external APIs, email providers, payment gateways). Do not mock your own code or your own database layer.

---

## Anti-Pattern 3: Writing Tests After Code

**What it looks like:**

```
1. Write 200 lines of production code
2. Write tests that match what the code already does
```

**Why it's harmful:** Tests written after the fact tend to confirm what the code does, not what it should do. They often miss edge cases and error paths.

**Guideline:** Follow Red → Green → Refactor. If you catch yourself writing tests after code, delete the production code and start over with a failing test.

---

## Anti-Pattern 4: Tests That Always Pass

**What it looks like:**

```js
// ❌ No assertion — always passes
it('should process the order', async () => {
  await processOrder(order);
});

// ❌ Assertion that can never fail
expect(result).toBeDefined();

// ❌ Empty test
it('should handle errors', () => {});
```

**Why it's harmful:** These tests inflate your test count without providing any protection.

**Check:** Delete the production code being tested. Does the test fail? If not, the test is not testing anything.

---

## Anti-Pattern 5: Snapshot Tests as Regression Tests

**What it looks like:**

```js
// ❌ Snapshot that gets updated every time
expect(renderComponent(<UserCard user={user} />)).toMatchSnapshot();
```

**Why it's harmful:** Developers habitually run `--updateSnapshot` when snapshots fail rather than investigating. This turns snapshot tests into approval tests with no actual assertions.

**Guideline:** Test specific properties you care about, not an entire rendered output:

```js
// ✅
expect(screen.getByText(user.name)).toBeInTheDocument();
expect(screen.getByRole('img', { name: /avatar/i })).toHaveAttribute('src', user.avatarUrl);
```

---

## Anti-Pattern 6: Shared Mutable State Between Tests

**What it looks like:**

```js
// ❌ Tests depend on execution order
let userId;
it('creates a user', async () => {
  userId = await createUser({ name: 'Alice' });
});
it('fetches the created user', async () => {
  const user = await getUser(userId); // fails if previous test didn't run
});
```

**Why it's harmful:** Tests pass in isolation, fail in suite, or vice versa. Order-dependent tests are fragile and hard to debug.

**Guideline:** Each test should create its own fixtures and clean up after itself.

---

## Anti-Pattern 7: Asserting the Wrong Thing on Errors

**What it looks like:**

```js
// ❌ Only checks that an error was thrown, not which one
await expect(createUser({})).rejects.toThrow();

// ✅ Checks the specific error
await expect(createUser({})).rejects.toThrow('name is required');
```

**Why it's harmful:** The test passes for any error, including ones thrown by infrastructure failures (database down, import error) rather than the expected validation.

---

## Anti-Pattern 8: Test Coverage as a Goal

**What it looks like:**

- Adding tests to hit a coverage percentage target
- Writing trivial getter/setter tests to inflate the number
- Measuring success by "90% coverage" rather than "critical paths are tested"

**Why it's harmful:** Coverage measures which lines were executed, not whether they were tested meaningfully. 100% coverage with bad assertions is worse than 60% coverage with good ones.

**Guideline:** Test behaviour and business rules. Prioritise paths that handle money, auth, data mutations, and external integrations. Don't test framework code or simple getters.
