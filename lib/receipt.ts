export function formatUsageBytes(bytes: number) {
  const safeBytes = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  const units = ["B", "KB", "MB", "GB", "TB"];

  if (safeBytes === 0) {
    return "0 B";
  }

  let value = safeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value = value / 1024;
    unitIndex += 1;
  }

  const precision = value < 10 ? 1 : 0;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function buildWithdrawalReceipt({
  amount,
  currency,
  destination,
  accountName,
  reference
}: {
  amount: number;
  currency: string;
  destination: string;
  accountName?: string;
  reference?: string;
}) {
  const formattedAmount = new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 0
  }).format(amount || 0);

  return [
    "NobliFi Withdrawal Receipt",
    `Amount: ${currency} ${formattedAmount}`,
    `Recipient: ${accountName || "Unknown recipient"}`,
    `Destination: ${destination}`,
    `Reference: ${reference || "NOBLIFI-WD"}`
  ].join("\n");
}
