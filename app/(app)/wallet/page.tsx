"use client";

import { useEffect, useState } from "react";
import { DataTable, EmptyState, OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";

type WalletSummary = { currency: string; available: number; total_credits: number; total_debits: number; pending_withdrawals: number };
type WalletTransaction = { id: string; type: string; direction: string; amount: number; currency: string; description: string; created_at: string };
type Withdrawal = { id: string; amount: number; currency: string; payout_destination: string; status: string; created_at: string };

export default function WalletPage() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([
      apiFetch<WalletSummary>("/api/v1/wallet"),
      apiFetch<WalletTransaction[]>("/api/v1/wallet/transactions", { fallback: [] }),
      apiFetch<Withdrawal[]>("/api/v1/wallet/withdrawals", { fallback: [] })
    ])
      .then(([walletData, transactionData, withdrawalData]) => {
        setSummary(walletData);
        setTransactions(transactionData);
        setWithdrawals(withdrawalData);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load wallet."));
  }

  useEffect(load, []);

  function submitWithdrawal(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    apiFetch<Withdrawal>("/api/v1/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount: Number(amount), destination })
    })
      .then(() => {
        setAmount("");
        setDestination("");
        load();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not request withdrawal."))
      .finally(() => setSaving(false));
  }

  return (
    <>
      <OperationsTitle title="Wallet" description="Platform-held online merchant net funds available for payout." />
      {error ? <div className="panel mb-4 p-4 text-sm text-red-400">{error}</div> : null}
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Available Wallet Balance" value={summary ? money(summary.available, summary.currency) : "--"} />
        <Metric label="Total Online Credits" value={summary ? money(summary.total_credits, summary.currency) : "--"} />
        <Metric label="Pending Withdrawals" value={summary ? money(summary.pending_withdrawals, summary.currency) : "--"} />
      </section>

      <section className="panel mt-5 p-5">
        <h2 className="text-lg font-semibold text-ink">Request Withdrawal</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={submitWithdrawal}>
          <input className="field" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" required />
          <input className="field" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Payout phone or destination" required />
          <button className="btn" type="submit" disabled={saving}>{saving ? "Submitting..." : "Withdraw"}</button>
        </form>
        <p className="mt-3 text-xs text-muted">Automated provider payout is not enabled yet. Requests reserve wallet funds for manual payout processing.</p>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Wallet Transactions</h2>
        {transactions.length ? (
          <DataTable
            columns={["Type", "Direction", "Amount", "Description", "Date"]}
            rows={transactions.map((item) => ({
              Type: label(item.type),
              Direction: <StatusBadge label={label(item.direction)} />,
              Amount: money(item.amount, item.currency),
              Description: item.description,
              Date: formatDate(item.created_at)
            }))}
          />
        ) : <EmptyState title="No wallet transactions" description="Online merchant net credits and withdrawals will appear here." />}
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Withdrawals</h2>
        {withdrawals.length ? (
          <DataTable
            columns={["Amount", "Destination", "Status", "Date"]}
            rows={withdrawals.map((item) => ({
              Amount: money(item.amount, item.currency),
              Destination: item.payout_destination,
              Status: <StatusBadge label={label(item.status)} />,
              Date: formatDate(item.created_at)
            }))}
          />
        ) : <EmptyState title="No withdrawals" description="Withdrawal requests will appear here after they are submitted." />}
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function money(value: number, currency = "UGX") {
  return `${currency} ${new Intl.NumberFormat("en-UG").format(value || 0)}`;
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
