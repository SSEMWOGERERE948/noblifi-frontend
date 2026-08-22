"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DataTable,
  EmptyState,
  OperationsTitle,
  StatusBadge
} from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

type PlatformSummary = {
  currency: string;
  online_token_purchases: number;
  online_token_gross: number;
  online_token_fees: number;
  subscription_payments: number;
  subscription_revenue: number;
  total_platform_revenue: number;
};

type TokenFeeRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  customer_name: string;
  phone: string;
  package: string;
  router: string;
  gross_amount: number;
  platform_fee_amount: number;
  merchant_net_amount: number;
  currency: string;
  payment_reference: string;
  sold_at: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  merchant_reference: string;
  provider_reference: string;
  paid_at?: string;
  created_at: string;
};

type AccountSummary = {
  user_id: string;
  user_name: string;
  user_email: string;
  online_token_gross: number;
  online_token_fees: number;
  merchant_net_sales: number;
  subscription_revenue: number;
  wallet_credits: number;
  wallet_debits: number;
  wallet_available: number;
  pending_withdrawals: number;
  paid_withdrawals: number;
  failed_withdrawals: number;
};

type Statement = {
  user_id: string;
  user_name: string;
  user_email: string;
  currency: string;
  summary: AccountSummary;
  entries: StatementEntry[];
};

type StatementEntry = {
  id: string;
  date: string;
  source: string;
  type: string;
  description: string;
  debit: number;
  credit: number;
  currency: string;
  reference: string;
  provider: string;
  status: string;
};

const emptySummary: PlatformSummary = {
  currency: "UGX",
  online_token_purchases: 0,
  online_token_gross: 0,
  online_token_fees: 0,
  subscription_payments: 0,
  subscription_revenue: 0,
  total_platform_revenue: 0
};

export default function BillingPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PlatformSummary>(emptySummary);
  const [tokenFees, setTokenFees] = useState<TokenFeeRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedUserID, setSelectedUserID] = useState("");
  const [statement, setStatement] = useState<Statement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { user } = await apiFetch<{ user: AuthUser }>("/api/v1/auth/me");
      if (user.role !== "superadmin") {
        setAllowed(false);
        setError("Only superadmins can view system books of accounts.");
        return;
      }

      setAllowed(true);
      const [summaryData, tokenFeeData, subscriptionData, accountData] =
        await Promise.all([
          apiFetch<PlatformSummary>("/api/v1/admin/revenue/platform-summary"),
          apiFetch<TokenFeeRow[]>("/api/v1/admin/revenue/online-token-fees?limit=100", {
            fallback: []
          }),
          apiFetch<SubscriptionRow[]>("/api/v1/admin/revenue/subscriptions?limit=100", {
            fallback: []
          }),
          apiFetch<AccountSummary[]>("/api/v1/admin/revenue/accounts", {
            fallback: []
          })
        ]);

      setSummary(summaryData);
      setTokenFees(tokenFeeData);
      setSubscriptions(subscriptionData);
      setAccounts(accountData);
      setSelectedUserID((current) => current || accountData[0]?.user_id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load billing records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.user_id === selectedUserID),
    [accounts, selectedUserID]
  );

  const loadStatement = useCallback(async () => {
    if (!selectedUserID) return;
    setStatementLoading(true);
    setError("");

    try {
      setStatement(
        await apiFetch<Statement>(
          `/api/v1/admin/revenue/accounts/${selectedUserID}/statement?limit=500`
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load user statement.");
    } finally {
      setStatementLoading(false);
    }
  }, [selectedUserID]);

  useEffect(() => {
    setStatement(null);
  }, [selectedUserID]);

  return (
    <>
      <OperationsTitle
        title="Books of Accounts"
        description="Superadmin view of platform income, subscription payments, and per-user account statements."
        action={
          <button className="btn-secondary" type="button" onClick={() => void load()}>
            Refresh
          </button>
        }
      />

      {loading ? <p className="text-sm text-muted">Loading books...</p> : null}
      {error ? (
        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {!loading && allowed ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Platform Revenue" value={money(summary.total_platform_revenue, summary.currency)} />
            <Metric label="Online Token Fees" value={money(summary.online_token_fees, summary.currency)} detail={`${summary.online_token_purchases} paid token purchases`} />
            <Metric label="Subscription Money" value={money(summary.subscription_revenue, summary.currency)} detail={`${summary.subscription_payments} paid subscriptions`} />
            <Metric label="Online Token Gross" value={money(summary.online_token_gross, summary.currency)} />
          </section>

          <section className="mt-5">
            <h2 className="mb-3 text-lg font-semibold text-ink">Money Received From Online Tokens</h2>
            {tokenFees.length ? (
              <DataTable
                columns={["User", "Package", "Customer", "Gross", "NobliFi Fee", "Merchant Net", "Reference", "Date"]}
                rows={tokenFees.map((row) => ({
                  User: userLabel(row.user_name, row.user_email),
                  Package: row.package || "-",
                  Customer: row.customer_name || row.phone || "-",
                  Gross: money(row.gross_amount, row.currency),
                  "NobliFi Fee": money(row.platform_fee_amount, row.currency),
                  "Merchant Net": money(row.merchant_net_amount, row.currency),
                  Reference: row.payment_reference || "-",
                  Date: formatDate(row.sold_at)
                }))}
              />
            ) : (
              <EmptyState title="No online token fees" description="Paid online token purchases will appear here." />
            )}
          </section>

          <section className="mt-5">
            <h2 className="mb-3 text-lg font-semibold text-ink">Subscription Money</h2>
            {subscriptions.length ? (
              <DataTable
                columns={["User", "Amount", "Provider", "Status", "Reference", "Paid"]}
                rows={subscriptions.map((row) => ({
                  User: userLabel(row.user_name, row.user_email),
                  Amount: money(row.amount, row.currency),
                  Provider: row.provider || "-",
                  Status: <StatusBadge label={row.status || "paid"} />,
                  Reference: row.merchant_reference || row.provider_reference || "-",
                  Paid: formatDate(row.paid_at || row.created_at)
                }))}
              />
            ) : (
              <EmptyState title="No subscription payments" description="Paid NobliFi subscriptions will appear here." />
            )}
          </section>

          <section className="mt-5">
            <h2 className="mb-3 text-lg font-semibold text-ink">Accounts Per User</h2>
            {accounts.length ? (
              <DataTable
                columns={["User", "Token Gross", "NobliFi Fees", "Subscriptions", "Wallet Available", "Pending Withdrawals", "Paid Withdrawals"]}
                rows={accounts.map((row) => ({
                  User: userLabel(row.user_name, row.user_email),
                  "Token Gross": money(row.online_token_gross),
                  "NobliFi Fees": money(row.online_token_fees),
                  Subscriptions: money(row.subscription_revenue),
                  "Wallet Available": money(row.wallet_available),
                  "Pending Withdrawals": money(row.pending_withdrawals),
                  "Paid Withdrawals": money(row.paid_withdrawals)
                }))}
              />
            ) : (
              <EmptyState title="No user accounts" description="No user account records were returned." />
            )}
          </section>

          <section className="mt-5 panel p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">User Statement</h2>
                <p className="mt-1 text-sm text-muted">
                  Select a user and generate the account statement to provide when requested.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(16rem,1fr)_auto_auto]">
                <select
                  className="field"
                  value={selectedUserID}
                  onChange={(event) => setSelectedUserID(event.target.value)}
                >
                  {accounts.map((account) => (
                    <option key={account.user_id} value={account.user_id}>
                      {account.user_name || account.user_email || account.user_id}
                    </option>
                  ))}
                </select>
                <button className="btn-secondary" type="button" onClick={() => void loadStatement()} disabled={!selectedUserID || statementLoading}>
                  {statementLoading ? "Loading..." : "Load Statement"}
                </button>
                <button className="btn-secondary" type="button" onClick={() => window.print()} disabled={!statement}>
                  Print
                </button>
              </div>
            </div>

            {selectedAccount ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <MiniMetric label="Merchant Net Sales" value={money(selectedAccount.merchant_net_sales)} />
                <MiniMetric label="Wallet Available" value={money(selectedAccount.wallet_available)} />
                <MiniMetric label="Subscriptions Paid" value={money(selectedAccount.subscription_revenue)} />
              </div>
            ) : null}

            {statement ? (
              <div className="mt-5">
                <div className="mb-3">
                  <p className="font-semibold text-ink">{userLabel(statement.user_name, statement.user_email)}</p>
                  <p className="text-xs text-muted">Statement entries: {statement.entries.length}</p>
                </div>
                {statement.entries.length ? (
                  <DataTable
                    columns={["Date", "Source", "Type", "Description", "Debit", "Credit", "Reference", "Status"]}
                    rows={statement.entries.map((entry) => ({
                      Date: formatDate(entry.date),
                      Source: label(entry.source),
                      Type: label(entry.type),
                      Description: entry.description,
                      Debit: entry.debit ? money(entry.debit, entry.currency) : "-",
                      Credit: entry.credit ? money(entry.credit, entry.currency) : "-",
                      Reference: entry.reference || "-",
                      Status: <StatusBadge label={entry.status || "posted"} />
                    }))}
                  />
                ) : (
                  <EmptyState title="No statement entries" description="This user has no statement entries for the selected period." />
                )}
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
      {detail ? <p className="mt-2 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-soft/40 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function money(value: number, currency = "UGX") {
  return `${currency} ${new Intl.NumberFormat("en-UG").format(value || 0)}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function userLabel(name: string, email: string) {
  if (name && email) return `${name} (${email})`;
  return name || email || "-";
}

function label(value: string) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
