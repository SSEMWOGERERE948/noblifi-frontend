import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "vitest";

const authSource = () => readFileSync(resolve(process.cwd(), "lib/auth.ts"), "utf8");

describe("known security findings (intentionally failing)", () => {
  it("NS-007: browser bearer token is persisted in localStorage", () => {
    if (authSource().includes("localStorage.setItem(tokenKey, session.token)")) {
      throw new Error(
        "NS-007 CONFIRMED: bearer JWT is stored in localStorage and can be stolen after XSS. REMEDIATION: use Secure, HttpOnly, SameSite cookies with CSRF defenses, then replace this advisory with a passing regression test."
      );
    }
  });
});
