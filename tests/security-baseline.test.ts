import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), "utf8");

describe("frontend security baseline", () => {
  it("uses an HTTPS production API default to resist downgrade/MITM exposure", () => {
    const source = read("lib/api.ts");
    expect(source).toContain('"https://noblifi.uc.r.appspot.com"');
    expect(source).toContain('if (url.startsWith("https://")) return "https"');
  });

  it("does not render server errors as raw HTML", () => {
    const source = read("lib/api.ts");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("does not disable TLS certificate validation in browser requests", () => {
    const source = read("lib/api.ts");
    expect(source).not.toContain("rejectUnauthorized: false");
    expect(source).not.toContain("InsecureSkipVerify");
  });
});
