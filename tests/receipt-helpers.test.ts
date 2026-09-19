import { describe, expect, it } from "vitest";

import { buildWithdrawalReceipt, formatUsageBytes } from "../lib/receipt";

describe("receipt helpers", () => {
  it("formats dashboard data usage into readable units", () => {
    expect(formatUsageBytes(0)).toBe("0 B");
    expect(formatUsageBytes(1024)).toBe("1.0 KB");
    expect(formatUsageBytes(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });

  it("builds a withdrawal receipt summary with the payee name", () => {
    const receipt = buildWithdrawalReceipt({
      amount: 250000,
      currency: "UGX",
      destination: "256778123456",
      accountName: "Mary Namubiru"
    });

    expect(receipt).toContain("Mary Namubiru");
    expect(receipt).toContain("UGX 250,000");
    expect(receipt).toContain("256778123456");
  });
});
