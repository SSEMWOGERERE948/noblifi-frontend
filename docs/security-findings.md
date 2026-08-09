# Frontend advisory finding catalog

| Finding | Failing test | Remediation completion condition |
| --- | --- | --- |
| NS-007 | `tests/known-findings.security.test.ts` | Authentication uses `HttpOnly`, `Secure`, `SameSite` cookies with CSRF defenses; JavaScript cannot read the session credential; a passing regression test verifies the behavior. |

The test remains advisory and intentionally fails until the application is actually remediated. Do not suppress it by altering the report or test exclusion.
