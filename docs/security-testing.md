# Frontend security testing

Run the passing browser/dashboard baseline locally with:

```powershell
npm.cmd ci
npm.cmd run test:security -- --exclude tests/known-findings.security.test.ts
npm.cmd run build
```

The known-findings test is intentionally non-zero until its vulnerability is remediated:

```powershell
npm.cmd run test:security -- tests/known-findings.security.test.ts
```

It reports the finding ID and remediation instead of hiding the vulnerable behavior. CI also runs `npm audit`, Semgrep, and Gitleaks. No test contacts the production API or writes tokens/secrets.
