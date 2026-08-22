"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  DataTable,
  EmptyState,
  OperationsTitle,
  StatusBadge
} from "@/components/OperationsUI";

import { apiFetch } from "@/lib/api";

/* =========================================================
 * TYPES
 * ========================================================= */

type WalletSummary = {
  currency: string;
  available: number;
  total_credits: number;
  total_debits: number;
  pending_withdrawals: number;
};

type WalletTransaction = {
  id: string;
  type: string;
  direction: string;
  amount: number;
  currency: string;
  description: string;
  created_at: string;
};

type Withdrawal = {
  id: string;

  amount: number;
  currency: string;

  payout_destination: string;
  payout_account_name?: string;

  /*
   * ioTec/mobile-money recipient-name state.
   *
   * Examples:
   * Fetched
   * Matched
   * Pending
   * Failed
   * NotFound
   * NotMatched
   * Barred
   */
  payee_name_status?: string;

  /*
   * NobliFi state:
   *
   * requested
   * processing
   * paid
   * failed
   */
  status: string;

  provider?: string;

  merchant_reference?: string;
  provider_reference?: string;

  /*
   * Raw provider payout state.
   */
  provider_status?: string;
  provider_status_code?: string;
  provider_status_message?: string;

  vendor?: string;
  vendor_transaction_id?: string;

  failure_reason?: string;

  processed_at?: string;
  paid_at?: string;

  created_at: string;
  updated_at?: string;
};

type WithdrawalCodeResponse = {
  sent: boolean;
  dev_code?: string;
  message: string;
  expires_at: string;
};

/* =========================================================
 * API PATHS
 * ========================================================= */

function withdrawalStatusEndpoint(
  id: string
) {
  return `/api/v1/wallet/withdrawals/${id}/status`;
}

/* =========================================================
 * PAGE
 * ========================================================= */

export default function WalletPage() {
  const [
    summary,
    setSummary
  ] = useState<WalletSummary | null>(
    null
  );

  const [
    transactions,
    setTransactions
  ] = useState<
    WalletTransaction[]
  >([]);

  const [
    withdrawals,
    setWithdrawals
  ] = useState<Withdrawal[]>([]);

  const [
    amount,
    setAmount
  ] = useState("");

  const [
    destination,
    setDestination
  ] = useState("");

  const [
    code,
    setCode
  ] = useState("");

  const [
    confirmationMessage,
    setConfirmationMessage
  ] = useState("");

  const [
    error,
    setError
  ] = useState("");

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    sendingCode,
    setSendingCode
  ] = useState(false);

  const [
    codeRequested,
    setCodeRequested
  ] = useState(false);

  const [
    refreshingWithdrawalId,
    setRefreshingWithdrawalId
  ] = useState<string | null>(
    null
  );

  /* =======================================================
   * LOAD WALLET
   * ======================================================= */

  const load =
    useCallback(async () => {
      try {
        const [
          walletData,
          transactionData,
          withdrawalData
        ] = await Promise.all([
          apiFetch<WalletSummary>(
            "/api/v1/wallet"
          ),

          apiFetch<
            WalletTransaction[]
          >(
            "/api/v1/wallet/transactions",
            {
              fallback: []
            }
          ),

          apiFetch<Withdrawal[]>(
            "/api/v1/wallet/withdrawals",
            {
              fallback: []
            }
          )
        ]);

        setSummary(walletData);

        setTransactions(
          transactionData
        );

        setWithdrawals(
          withdrawalData
        );

        setError("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load wallet."
        );
      }
    }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* =======================================================
   * REFRESH WITHDRAWAL STATUS
   * ======================================================= */

  const refreshWithdrawal =
    useCallback(
      async (
        withdrawalId: string,
        silent = false
      ) => {
        if (!silent) {
          setRefreshingWithdrawalId(
            withdrawalId
          );

          setError("");
        }

        try {
          const latest =
            await apiFetch<Withdrawal>(
              withdrawalStatusEndpoint(
                withdrawalId
              )
            );

          setWithdrawals(
            (current) =>
              current.map(
                (item) =>
                  item.id ===
                  latest.id
                    ? latest
                    : item
              )
          );

          /*
           * Terminal provider state:
           * reload wallet totals and ledger.
           */
          if (
            isTerminalWithdrawalStatus(
              latest.status
            )
          ) {
            if (
              !silent &&
              normalizeStatus(
                latest.status
              ) === "paid"
            ) {
              setConfirmationMessage(
                `${money(
                  latest.amount,
                  latest.currency
                )} was successfully sent to ${withdrawalReceiver(
                  latest
                )}.`
              );
            }

            const [
              walletData,
              transactionData
            ] =
              await Promise.all([
                apiFetch<WalletSummary>(
                  "/api/v1/wallet"
                ),

                apiFetch<
                  WalletTransaction[]
                >(
                  "/api/v1/wallet/transactions",
                  {
                    fallback: []
                  }
                )
              ]);

            setSummary(
              walletData
            );

            setTransactions(
              transactionData
            );
          }

          return latest;
        } catch (err) {
          if (!silent) {
            setError(
              err instanceof Error
                ? err.message
                : "Could not refresh withdrawal."
            );
          }

          return null;
        } finally {
          if (!silent) {
            setRefreshingWithdrawalId(
              null
            );
          }
        }
      },
      []
    );

  /* =======================================================
   * AUTO POLL PROCESSING WITHDRAWALS
   * ======================================================= */

  useEffect(() => {
    const active =
      withdrawals.filter(
        (item) =>
          shouldPollWithdrawal(
            item.status
          )
      );

    if (!active.length) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          for (
            const item of active
          ) {
            void refreshWithdrawal(
              item.id,
              true
            );
          }
        },
        5000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    withdrawals,
    refreshWithdrawal
  ]);

  /* =======================================================
   * REQUEST CONFIRMATION CODE
   * ======================================================= */

  async function requestCode(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setConfirmationMessage("");

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter a valid withdrawal amount."
      );

      return;
    }

    if (
      numericAmount < 500
    ) {
      setError(
        "The minimum withdrawal amount is UGX 500."
      );

      return;
    }

    if (
      summary &&
      numericAmount >
        summary.available
    ) {
      setError(
        "The withdrawal amount is greater than your available wallet balance."
      );

      return;
    }

    if (
      !destination.trim()
    ) {
      setError(
        "Enter the Mobile Money phone number."
      );

      return;
    }

    setSendingCode(true);

    try {
      const response =
        await apiFetch<WithdrawalCodeResponse>(
          "/api/v1/wallet/withdraw/code",
          {
            method: "POST",

            body: JSON.stringify(
              {
                amount:
                  numericAmount,

                destination:
                  destination.trim()
              }
            )
          }
        );

      setCodeRequested(
        true
      );

      setConfirmationMessage(
        response.dev_code
          ? `${response.message} Code: ${response.dev_code}`
          : response.message
      );
    } catch (err) {
      setCodeRequested(
        false
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not send withdrawal code."
      );
    } finally {
      setSendingCode(
        false
      );
    }
  }

  /* =======================================================
   * SUBMIT WITHDRAWAL
   * ======================================================= */

  async function submitWithdrawal(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setConfirmationMessage("");

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter a valid withdrawal amount."
      );

      return;
    }

    if (
      numericAmount < 500
    ) {
      setError(
        "The minimum withdrawal amount is UGX 500."
      );

      return;
    }

    if (
      !destination.trim()
    ) {
      setError(
        "Enter the Mobile Money phone number."
      );

      return;
    }

    if (!codeRequested) {
      setError(
        "Request a confirmation code first."
      );

      return;
    }

    if (!code.trim()) {
      setError(
        "Enter your withdrawal confirmation code."
      );

      return;
    }

    setSaving(true);

    try {
      const withdrawal =
        await apiFetch<Withdrawal>(
          "/api/v1/wallet/withdraw",
          {
            method: "POST",

            body: JSON.stringify(
              {
                amount:
                  numericAmount,

                destination:
                  destination.trim(),

                code:
                  code.trim()
              }
            )
          }
        );

      /*
       * HTTP success does NOT mean payout success.
       */
      if (
        normalizeStatus(
          withdrawal.status
        ) === "paid"
      ) {
        const receiver =
          withdrawalReceiver(
            withdrawal
          );

        setConfirmationMessage(
          `${money(
            withdrawal.amount,
            withdrawal.currency
          )} was successfully sent to ${receiver}.`
        );
      } else if (
        normalizeStatus(
          withdrawal.status
        ) === "failed"
      ) {
        setError(
          withdrawal.failure_reason ||
            withdrawal.provider_status_message ||
            "The withdrawal could not be completed."
        );
      } else {
        const providerText =
          withdrawal.provider_status
            ? ` Provider status: ${label(
                withdrawal.provider_status
              )}.`
            : "";

        setConfirmationMessage(
          `Withdrawal to ${formatPhone(
            withdrawal.payout_destination
          )} was submitted for processing.${providerText}`
        );
      }

      setAmount("");
      setDestination("");
      setCode("");

      setCodeRequested(
        false
      );

      setWithdrawals(
        (current) => [
          withdrawal,
          ...current.filter(
            (item) =>
              item.id !==
              withdrawal.id
          )
        ]
      );

      await load();

      if (
        shouldPollWithdrawal(
          withdrawal.status
        )
      ) {
        void refreshWithdrawal(
          withdrawal.id,
          true
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not request withdrawal."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
   * RENDER
   * ======================================================= */

  return (
    <>
      <OperationsTitle
        title="Wallet"
        description="Online merchant net funds available for withdrawal."
      />

      {error ? (
        <div className="panel mb-4 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {confirmationMessage ? (
        <div className="panel mb-4 p-4 text-sm text-accent">
          {confirmationMessage}
        </div>
      ) : null}

      {/* ===================================================
       * WALLET SUMMARY
       * =================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Available Wallet Balance"
          value={
            summary
              ? money(
                  summary.available,
                  summary.currency
                )
              : "--"
          }
        />

        <Metric
          label="Total Online Credits"
          value={
            summary
              ? money(
                  summary.total_credits,
                  summary.currency
                )
              : "--"
          }
        />

        <Metric
          label="Total Debits"
          value={
            summary
              ? money(
                  summary.total_debits,
                  summary.currency
                )
              : "--"
          }
        />

        <Metric
          label="Pending Withdrawals"
          value={
            summary
              ? money(
                  summary.pending_withdrawals,
                  summary.currency
                )
              : "--"
          }
        />
      </section>

      {/* ===================================================
       * REQUEST WITHDRAWAL
       * =================================================== */}

      <section className="panel mt-5 p-5">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Request Withdrawal
          </h2>

          <p className="mt-1 text-sm text-muted">
            Withdraw your available
            NobliFi merchant balance to
            an MTN or Airtel Mobile Money
            account.
          </p>
        </div>

        <form
          className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto]"
          onSubmit={requestCode}
        >
          <input
            className="field"
            type="number"
            inputMode="numeric"
            min="500"
            step="1"
            value={amount}
            onChange={(event) => {
              setAmount(
                event.target.value
              );

              setCode("");

              setCodeRequested(
                false
              );

              setConfirmationMessage(
                ""
              );
            }}
            placeholder="Amount in UGX"
            required
          />

          <input
            className="field"
            type="tel"
            inputMode="tel"
            value={destination}
            onChange={(event) => {
              setDestination(
                event.target.value
              );

              setCode("");

              setCodeRequested(
                false
              );

              setConfirmationMessage(
                ""
              );

            }}
            placeholder="Mobile Money phone number"
            required
          />

          <button
            className="btn"
            type="submit"
            disabled={
              sendingCode ||
              saving
            }
          >
            {sendingCode
              ? "Sending..."
              : "Send Code"}
          </button>
        </form>

        <div className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/5 p-4">
          <p className="text-sm font-semibold text-amber-300">
            Confirm the phone number before sending.
          </p>

          <p className="mt-1 text-sm text-muted">
            NobliFi will send money to the
            Mobile Money number you enter.
            ioTec returns the receiver name
            after the payout is submitted,
            and that name appears on the
            withdrawal receipt.
          </p>
        </div>

        {/* =================================================
         * CONFIRMATION CODE
         * ================================================= */}

        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
          onSubmit={
            submitWithdrawal
          }
        >
          <input
            className="field"
            inputMode="numeric"
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value
              )
            }
            placeholder="Email confirmation code"
            required
            disabled={
              !codeRequested ||
              saving
            }
          />

          <button
            className="btn"
            type="submit"
            disabled={
              saving ||
              !codeRequested
            }
          >
            {saving
              ? "Submitting..."
              : "Confirm Withdrawal"}
          </button>
        </form>

        <div className="mt-4 rounded-md border border-line bg-soft/40 p-4">
          <p className="text-xs leading-5 text-muted">
            Always confirm the phone
            number before sending. After
            confirmation, funds are
            reserved while ioTec
            processes the payout. The
            withdrawal is only marked Paid
            when the provider confirms the
            transfer succeeded, and the
            receiver name is shown once
            ioTec returns it.
          </p>
        </div>
      </section>

      {/* ===================================================
       * WALLET TRANSACTIONS
       * =================================================== */}

      <section className="mt-5">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-ink">
            Wallet Transactions
          </h2>

          <p className="mt-1 text-xs text-muted">
            Merchant online credits,
            withdrawal reservations,
            completed debits and reversals.
          </p>
        </div>

        {transactions.length ? (
          <DataTable
            columns={[
              "Type",
              "Direction",
              "Amount",
              "Description",
              "Date"
            ]}
            rows={transactions.map(
              (item) => ({
                Type:
                  label(item.type),

                Direction: (
                  <StatusBadge
                    label={label(
                      item.direction
                    )}
                  />
                ),

                Amount:
                  money(
                    item.amount,
                    item.currency
                  ),

                Description:
                  item.description,

                Date:
                  formatDate(
                    item.created_at
                  )
              })
            )}
          />
        ) : (
          <EmptyState
            title="No wallet transactions"
            description="Online merchant net credits and withdrawals will appear here."
          />
        )}
      </section>

      {/* ===================================================
       * WITHDRAWALS
       * =================================================== */}

      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Withdrawals
            </h2>

            <p className="mt-1 text-xs text-muted">
              Track payout status and
              Mobile Money recipient
              information.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              void load()
            }
          >
            Refresh
          </button>
        </div>

        {withdrawals.length ? (
          <DataTable
            columns={[
              "Amount",
              "Recipient",
              "Status",
              "ioTec Status",
              "Reference",
              "Date",
              "Action"
            ]}
            rows={withdrawals.map(
              (item) => ({
                Amount:
                  money(
                    item.amount,
                    item.currency
                  ),

                Recipient: (
                  <WithdrawalRecipientCell
                    withdrawal={
                      item
                    }
                  />
                ),

                Status: (
                  <StatusBadge
                    label={withdrawalStatusLabel(
                      item
                    )}
                  />
                ),

                "ioTec Status": (
                  <ProviderStatusCell
                    withdrawal={
                      item
                    }
                  />
                ),

                Reference: (
                  <div className="max-w-[220px]">
                    <p className="break-all text-xs text-ink">
                      {item.merchant_reference ||
                        item.provider_reference ||
                        "-"}
                    </p>

                    {item.vendor_transaction_id ? (
                      <p className="mt-1 break-all text-xs text-muted">
                        Vendor:{" "}
                        {
                          item.vendor_transaction_id
                        }
                      </p>
                    ) : null}
                  </div>
                ),

                Date:
                  formatDate(
                    item.created_at
                  ),

                Action:
                  shouldPollWithdrawal(
                    item.status
                  ) ? (
                    <button
                      type="button"
                      className="btn-secondary whitespace-nowrap"
                      disabled={
                        refreshingWithdrawalId ===
                        item.id
                      }
                      onClick={() =>
                        void refreshWithdrawal(
                          item.id
                        )
                      }
                    >
                      {refreshingWithdrawalId ===
                      item.id
                        ? "Checking..."
                        : "Check Status"}
                    </button>
                  ) : (
                    <span className="text-xs text-muted">
                      {normalizeStatus(
                        item.status
                      ) === "paid"
                        ? "Completed"
                        : normalizeStatus(
                              item.status
                            ) ===
                            "failed"
                          ? "Closed"
                          : "-"}
                    </span>
                  )
              })
            )}
          />
        ) : (
          <EmptyState
            title="No withdrawals"
            description="Withdrawal requests will appear here after they are submitted."
          />
        )}
      </section>
    </>
  );
}

/* =========================================================
 * WITHDRAWAL RECIPIENT CELL
 * ========================================================= */

function WithdrawalRecipientCell({
  withdrawal
}: {
  withdrawal: Withdrawal;
}) {
  const verified =
    isVerifiedPayeeNameStatus(
      withdrawal.payee_name_status
    );

  return (
    <div>
      {withdrawal.payout_account_name ? (
        <p className="font-medium text-ink">
          {
            withdrawal.payout_account_name
          }
        </p>
      ) : (
        <p className="text-sm text-muted">
          Name pending
        </p>
      )}

      <p className="mt-1 text-xs text-muted">
        {formatPhone(
          withdrawal.payout_destination
        )}
      </p>

      {verified ? (
        <p className="mt-1 text-xs font-medium text-accent">
          âœ“ ioTec verified
        </p>
      ) : withdrawal.payee_name_status ? (
        <p className="mt-1 text-xs text-muted">
          Name status:{" "}
          {label(
            withdrawal.payee_name_status
          )}
        </p>
      ) : null}
    </div>
  );
}

/* =========================================================
 * PROVIDER STATUS
 * ========================================================= */

function ProviderStatusCell({
  withdrawal
}: {
  withdrawal: Withdrawal;
}) {
  if (
    normalizeStatus(
      withdrawal.status
    ) === "failed"
  ) {
    return (
      <div className="max-w-xs">
        <p className="text-sm font-medium text-red-400">
          {withdrawal.provider_status
            ? label(
                withdrawal.provider_status
              )
            : "Failed"}
        </p>

        {withdrawal.failure_reason ? (
          <p className="mt-1 text-xs text-muted">
            {
              withdrawal.failure_reason
            }
          </p>
        ) : withdrawal.provider_status_message ? (
          <p className="mt-1 text-xs text-muted">
            {
              withdrawal.provider_status_message
            }
          </p>
        ) : null}
      </div>
    );
  }

  if (
    withdrawal.provider_status
  ) {
    return (
      <div className="max-w-xs">
        <p className="text-sm text-ink">
          {label(
            withdrawal.provider_status
          )}
        </p>

        {withdrawal.provider_status_message ? (
          <p className="mt-1 text-xs text-muted">
            {
              withdrawal.provider_status_message
            }
          </p>
        ) : null}

        {withdrawal.vendor ? (
          <p className="mt-1 text-xs text-muted">
            Provider:{" "}
            {
              withdrawal.vendor
            }
          </p>
        ) : null}
      </div>
    );
  }

  if (
    shouldPollWithdrawal(
      withdrawal.status
    )
  ) {
    return (
      <span className="text-sm text-muted">
        Waiting for ioTec
      </span>
    );
  }

  return (
    <span className="text-muted">
      -
    </span>
  );
}

/* =========================================================
 * STATUS HELPERS
 * ========================================================= */

function withdrawalStatusLabel(
  withdrawal: Withdrawal
) {
  switch (
    normalizeStatus(
      withdrawal.status
    )
  ) {
    case "paid":
      return "Paid";

    case "failed":
      return "Failed";

    case "requested":
      return "Requested";

    case "processing":
    case "pending":
      switch (
        normalizeStatus(
          withdrawal.provider_status
        )
      ) {
        case "awaitingapproval":
          return "Awaiting Approval";

        case "senttovendor":
          return "Sending to Mobile Money";

        case "scheduled":
          return "Scheduled";

        case "pending":
          return "Processing";

        case "success":
          return "Completing";

        default:
          return "Processing";
      }

    default:
      return label(
        withdrawal.status ||
          "Processing"
      );
  }
}

function shouldPollWithdrawal(
  status: string
) {
  const normalized =
    normalizeStatus(status);

  return [
    "requested",
    "processing",
    "pending"
  ].includes(normalized);
}

function isTerminalWithdrawalStatus(
  status: string
) {
  const normalized =
    normalizeStatus(status);

  return (
    normalized === "paid" ||
    normalized === "failed"
  );
}

function isVerifiedPayeeNameStatus(
  status?: string
) {
  const normalized =
    normalizeStatus(status);

  return (
    normalized === "fetched" ||
    normalized === "matched"
  );
}

function withdrawalReceiver(
  withdrawal: Withdrawal
) {
  return (
    withdrawal.payout_account_name ||
    formatPhone(
      withdrawal.payout_destination
    )
  );
}

/* =========================================================
 * METRIC
 * ========================================================= */

function Metric({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold text-ink">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
 * GENERAL HELPERS
 * ========================================================= */

function normalizeStatus(
  value?: string
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );
}

function money(
  value: number,
  currency = "UGX"
) {
  return `${currency} ${new Intl.NumberFormat(
    "en-UG"
  ).format(value || 0)}`;
}

function label(
  value: string
) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

function formatPhone(
  value?: string
) {
  if (!value) {
    return "-";
  }

  const digits =
    String(value).replace(
      /\D/g,
      ""
    );

  if (
    digits.length === 12 &&
    digits.startsWith("256")
  ) {
    return `+${digits}`;
  }

  if (
    digits.length === 10 &&
    digits.startsWith("0")
  ) {
    return digits;
  }

  return value;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );
}
