# NobliFi Frontend Security Audit

The dashboard is a Next.js client that authenticates to the Go API using bearer JWTs, displays payment and router data, and exposes router provisioning scripts to authorized dashboard users. The browser/API boundary, browser storage, and user-controlled router/network inputs are the main frontend trust boundaries.

## Confirmed finding

| ID | Severity | Component | Evidence | Test | Remediation |
| --- | --- | --- | --- | --- | --- |
| NS-007 | Medium (CWE-922, OWASP A07) | `lib/auth.ts` | `saveSession` stores the bearer JWT in `localStorage`; any successful XSS in this origin can exfiltrate it. | `tests/known-findings.security.test.ts` | Move session material to `HttpOnly`, `Secure`, `SameSite` cookies; add CSRF protection, CSP, and passing regression coverage. |

## Observations and boundaries

The frontend defaults to an HTTPS API URL and does not use raw HTML rendering in the reviewed API helper. This does not compensate for backend CORS, authentication, payment, provisioning, or network-control weaknesses; see the canonical backend audit report. Sensitive browser-visible data includes JWTs, account identity, payment metadata, claim tokens shown during router setup, and generated RouterOS configuration commands.

CI uses static checks, dependency audit, secret scanning, and deterministic source-level tests. It never runs payment, MITM, Wi-Fi, router, or external scans. The known finding is not fixed by this baseline.
