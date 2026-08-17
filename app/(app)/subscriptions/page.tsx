"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { EmptyState, OperationsTitle } from "@/components/OperationsUI";
import { getStoredUser, getToken, type AuthUser } from "@/lib/auth";

type PaymentConfig = {
  provider: string;
  configured: boolean;
  currency: string;
};

type StartOrderResponse = {
  merchant_reference: string;
  order_tracking_id: string;
  redirect_url: string;
};

type PaymentStatus = {
  success: boolean;
  status: string;
  raw_status: string;
  merchant_reference: string;
  order_tracking_id: string;
  voucher?: string;
};

type SubscriptionStatus =
  | "trial"
  | "subscribed"
  | "expired"
  | "past_due"
  | "cancelled";

type SubscriptionUser = Omit<
  AuthUser,
  "subscription_status" | "subscription_starts_at" | "subscription_ends_at"
> & {
  subscription_status?: SubscriptionStatus | "active" | string | null;
  subscription_starts_at?: string | null;
  subscription_ends_at?: string | null;
};

const trackingKey = "noblifi_subscription_tracking";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0
  }).format(value);
}

function getRemainingDays(endAt?: string | null) {
  if (!endAt) {
    return null;
  }

  const endDate = new Date(endAt);

  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  const diffMs = endDate.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

function formatDate(value?: string | null) {
  if (!value) return "No end date set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-UG", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function normalizeSubscriptionStatus(
  value?: string | null
): SubscriptionStatus {
  const status = String(value || "trial").trim().toLowerCase();

  // Backward compatibility with the previous paid status.
  if (status === "active") return "subscribed";

  switch (status) {
    case "subscribed":
    case "expired":
    case "past_due":
    case "cancelled":
    case "trial":
      return status;
    default:
      return "trial";
  }
}

export default function SubscriptionsPage() {
  const [user, setUser] = useState<SubscriptionUser | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  /*
   * Load authenticated user.
   */
  useEffect(() => {
    async function loadUser() {
      const token = getToken();

      if (!token) {
        const storedUser = getStoredUser() as SubscriptionUser | null;
        setUser(storedUser);

        if (storedUser?.email) {
          setEmail(storedUser.email);
        }

        return;
      }

      try {
        const response = await apiFetch<{ user: SubscriptionUser }>(
          "/api/v1/auth/me"
        );

        const authenticatedUser = response.user;

        localStorage.setItem(
          "noblifi_user",
          JSON.stringify(authenticatedUser)
        );

        setUser(authenticatedUser);

        if (authenticatedUser.email) {
          setEmail(authenticatedUser.email);
        }
      } catch (err) {
        console.error("Could not refresh authenticated user:", err);

        const storedUser = getStoredUser() as SubscriptionUser | null;
        setUser(storedUser);

        if (storedUser?.email) {
          setEmail(storedUser.email);
        }
      }
    }

    loadUser();
  }, []);

  /*
   * Load public payment provider configuration.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadPaymentConfig() {
      try {
        const configResponse = await fetch(
          `${API_BASE_URL}/api/v1/payments/config`,
          {
            method: "GET",
            cache: "no-store"
          }
        );

        const paymentConfig = (await configResponse
          .json()
          .catch(() => null)) as PaymentConfig | null;

        if (cancelled) {
          return;
        }

        if (!configResponse.ok || !paymentConfig) {
          throw new Error(
            (
              paymentConfig as {
                message?: string;
                error?: string;
              } | null
            )?.message ||
              (
                paymentConfig as {
                  message?: string;
                  error?: string;
                } | null
              )?.error ||
              "Payment configuration could not be loaded."
          );
        }

        setConfig(paymentConfig);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load payment configuration."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPaymentConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Check whether the payment provider redirected back
   * with an order tracking ID.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const trackingId =
      params.get("OrderTrackingId") ||
      params.get("orderTrackingId") ||
      params.get("order_tracking_id") ||
      window.sessionStorage.getItem(trackingKey);

    if (trackingId) {
      window.sessionStorage.setItem(trackingKey, trackingId);

      checkPayment(trackingId);

      setShowPayment(true);
    }
  }, []);

  /*
   * Start subscription payment.
   *
   * IMPORTANT:
   * /api/v1/payments/orders is protected by backend authentication.
   * We MUST send the JWT as:
   *
   * Authorization: Bearer <token>
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      /*
       * Retrieve JWT saved during login.
       */
      const token = getToken();

      if (!token) {
        throw new Error(
          "Your login session is missing or has expired. Please sign in again."
        );
      }

      /*
       * Use the entered email, otherwise use the authenticated
       * user's email.
       */
      const normalizedEmail =
        email.trim() || user?.email?.trim() || "";

      const normalizedPhone = phone.trim();

      if (!normalizedPhone) {
        throw new Error("Please enter your mobile money phone number.");
      }

      if (!normalizedEmail) {
        throw new Error(
          "Your account does not have an email address. Please sign in again."
        );
      }

      /*
       * Protected payment request.
       *
       * This Authorization header is what was missing before.
       */
      const response = await fetch(
        `${API_BASE_URL}/api/v1/payments/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            plan_id: "subscription",
            phone: normalizedPhone,
            email: normalizedEmail
          })
        }
      );

      const body = await response.json().catch(() => null);

      /*
       * Authentication failure.
       */
      if (response.status === 401) {
        console.error("Payment authentication failed:", body);

        throw new Error(
          body?.message ||
            body?.error ||
            "Your session has expired. Please sign out and sign in again."
        );
      }

      /*
       * Other backend/payment errors.
       */
      if (!response.ok) {
        console.error("Payment order failed:", body);

        throw new Error(
          body?.message ||
            body?.error ||
            `Could not start payment. Server returned ${response.status}.`
        );
      }

      const order = body as StartOrderResponse;

      if (!order?.order_tracking_id) {
        console.error(
          "Payment provider returned invalid order response:",
          body
        );

        throw new Error(
          "Payment provider did not return an order tracking ID."
        );
      }

      /*
       * Save transaction ID so payment status can continue
       * being checked after redirects/page reloads.
       */
      window.sessionStorage.setItem(
        trackingKey,
        order.order_tracking_id
      );

      setStatus({
        success: false,
        status: "pending",
        raw_status:
          "Approve the mobile money prompt on your phone.",
        merchant_reference: order.merchant_reference,
        order_tracking_id: order.order_tracking_id
      });

      /*
       * Begin polling payment status.
       */
      checkPayment(order.order_tracking_id, 20);

      /*
       * Some payment providers may return an external redirect URL.
       * We are intentionally NOT automatically redirecting here
       * because the current mobile-money flow waits for the prompt.
       *
       * If ioTec requires redirecting later, this can be enabled:
       *
       * if (order.redirect_url) {
       *   window.location.href = order.redirect_url;
       * }
       */
    } catch (err) {
      console.error("Could not start subscription payment:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not start payment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * Poll payment status.
   */
  async function checkPayment(
    trackingId?: string,
    tries = 20
  ) {
    const id =
      trackingId ||
      window.sessionStorage.getItem(trackingKey);

    if (!id) {
      setError(
        "No payment transaction ID was found for this checkout."
      );
      return;
    }

    setError(null);
    setChecking(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/payments/orders/${encodeURIComponent(
          id
        )}/status`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.message ||
            body?.error ||
            "Could not verify payment."
        );
      }

      const result = body as PaymentStatus;

      setStatus(result);

      /*
       * Successful payment.
       */
      if (result.success) {
        window.sessionStorage.removeItem(trackingKey);

        /*
         * Reload user after payment so updated subscription
         * information comes from the backend.
         */
        setTimeout(() => {
          window.location.reload();
        }, 2000);

        return;
      }

      /*
       * Continue polling while the transaction remains pending.
       */
      if (
        result.status !== "failed" &&
        tries > 0
      ) {
        window.setTimeout(() => {
          checkPayment(id, tries - 1);
        }, 3000);
      }
    } catch (err) {
      console.error("Payment status check failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not verify payment."
      );
    } finally {
      setChecking(false);
    }
  }

  const storedStatus = normalizeSubscriptionStatus(
    user?.subscription_status
  );

  const trialRemainingDays = useMemo(
    () => getRemainingDays(user?.trial_ends_at),
    [user?.trial_ends_at]
  );

  const subscriptionRemainingDays = useMemo(
    () => getRemainingDays(user?.subscription_ends_at),
    [user?.subscription_ends_at]
  );

  const trialHasActuallyExpired =
    storedStatus === "trial" &&
    user?.trial_ends_at != null &&
    trialRemainingDays === 0;

  const paidSubscriptionHasActuallyExpired =
    storedStatus === "subscribed" &&
    user?.subscription_ends_at != null &&
    subscriptionRemainingDays === 0;

  const effectiveStatus: SubscriptionStatus =
    trialHasActuallyExpired || paidSubscriptionHasActuallyExpired
      ? "expired"
      : storedStatus;

  const isTrial = effectiveStatus === "trial";
  const isSubscribed = effectiveStatus === "subscribed";
  const isExpired = effectiveStatus === "expired";
  const isPastDue = effectiveStatus === "past_due";
  const isCancelled = effectiveStatus === "cancelled";

  const currentEndDate = isSubscribed
    ? user?.subscription_ends_at
    : isTrial
      ? user?.trial_ends_at
      : user?.subscription_ends_at || user?.trial_ends_at;

  const remainingDays = useMemo(
    () => getRemainingDays(currentEndDate),
    [currentEndDate]
  );

  const activePlan =
    user?.billing_plan || "NobliFi Monthly";

  const monthlyPrice =
    user?.monthly_price_ugx && user.monthly_price_ugx > 0
      ? user.monthly_price_ugx
      : 25000;

  const billedAmount = formatCurrency(monthlyPrice);
  const endDateText = formatDate(currentEndDate);
  const subscriptionStartText = formatDate(user?.subscription_starts_at);
  const subscriptionEndText = formatDate(user?.subscription_ends_at);
  const trialEndText = formatDate(user?.trial_ends_at);

  /*
   * No authenticated user.
   */
  if (!user) {
    return (
      <>
        <OperationsTitle
          title="Subscriptions"
          description="Review your active plan, your free-trial countdown, and your renewal status."
        />

        <EmptyState
          title="No subscription data available"
          description="Sign in again or complete your trial setup to see your subscription status here."
        />
      </>
    );
  }

  const statusText = isSubscribed
    ? "Subscribed"
    : isTrial
      ? "Free trial"
      : isExpired
        ? "Expired"
        : isPastDue
          ? "Payment due"
          : isCancelled
            ? "Cancelled"
            : "Unknown";

  const periodLabel = isSubscribed
    ? "Subscription ends"
    : isTrial
      ? "Trial ends"
      : "Access ended";

  const daysCaption = isSubscribed
    ? (remainingDays ?? 0) === 1
      ? "subscription day left"
      : "subscription days left"
    : isTrial
      ? (remainingDays ?? 0) === 1
        ? "trial day left"
        : "trial days left"
      : "days remaining";

  const paymentButtonLabel = showPayment
    ? "Hide payment form"
    : isSubscribed
      ? "Renew subscription"
      : isTrial
        ? "Subscribe now"
        : "Renew subscription";

  const paymentHeading = isSubscribed
    ? "Renew subscription"
    : "Subscribe to NobliFi";

  const paymentDescription = isSubscribed
    ? "Renew your NobliFi subscription for another month securely with ioTec Pay."
    : "Activate your NobliFi monthly subscription securely with ioTec Pay.";

  return (
    <>
      <OperationsTitle
        title="Subscriptions"
        description="Review your active plan, subscription period, and renewal status."
      />

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Current subscription */}
        <div className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Current plan
              </p>

              <h2 className="mt-3 text-3xl font-semibold text-ink">
                {activePlan}
              </h2>
            </div>

            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-accent">
              {statusText}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {/* Days remaining */}
            <div className="rounded-md border border-line bg-soft/50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Days remaining
              </p>

              <p className="mt-3 text-4xl font-bold text-ink">
                {remainingDays ?? 0}
              </p>

              <p className="mt-1 text-sm text-muted">
                {daysCaption}
              </p>
            </div>

            {/* Monthly price */}
            <div className="rounded-md border border-line bg-soft/50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Monthly price
              </p>

              <p className="mt-3 text-2xl font-bold text-ink">
                {billedAmount}
              </p>

              <p className="mt-1 text-sm text-muted">
                billed monthly
              </p>
            </div>

            {/* Current access period end */}
            <div className="rounded-md border border-line bg-soft/50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {periodLabel}
              </p>

              <p className="mt-3 text-lg font-bold text-ink">
                {endDateText}
              </p>

              <p className="mt-1 text-sm text-muted">
                {isSubscribed
                  ? "renewal date"
                  : isTrial
                    ? "trial expiry date"
                    : "last access date"}
              </p>
            </div>
          </div>

          {/* Subscription information */}
          <div className="mt-6 rounded-md border border-accent/30 bg-emerald-500/5 p-4">
            <p className="text-sm text-ink">
              {isSubscribed
                ? `Your NobliFi subscription is active. You have ${
                    remainingDays ?? 0
                  } ${
                    (remainingDays ?? 0) === 1 ? "day" : "days"
                  } remaining before renewal.`
                : isTrial
                  ? `You are currently on the free trial with ${
                      remainingDays ?? 0
                    } ${
                      (remainingDays ?? 0) === 1 ? "day" : "days"
                    } remaining. You can subscribe at any time.`
                  : isPastDue
                    ? "Your subscription payment is due. Complete payment to restore full subscribed access."
                    : isCancelled
                      ? "Your subscription has been cancelled. You can subscribe again to restore access."
                      : "Your NobliFi access period has expired. Renew your subscription to continue using the service."}
            </p>
          </div>

          {/* Payment / renewal action */}
          {!isSubscribed && !isTrial ? (
            <div className="mt-5 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                Subscription required
              </p>

              <p className="mt-3 text-xl font-semibold text-amber-50">
                {isPastDue
                  ? "Your subscription payment is due"
                  : isCancelled
                    ? "Your subscription is cancelled"
                    : "Your subscription access has expired"}
              </p>

              <p className="mt-2 text-sm text-amber-100/90">
                Complete a monthly subscription payment to
                continue using NobliFi.
              </p>

              <button
                type="button"
                className="btn mt-4 w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
                onClick={() =>
                  setShowPayment(!showPayment)
                }
              >
                {showPayment
                  ? "Hide payment"
                  : "Pay to subscribe"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn mt-4 w-full"
              onClick={() =>
                setShowPayment(!showPayment)
              }
            >
              {paymentButtonLabel}
            </button>
          )}
        </div>

        {/* Plan details */}
        <div className="panel p-6">
          <h3 className="text-lg font-semibold text-ink">
            Plan details
          </h3>

          <ul className="mt-5 space-y-4 text-sm text-muted">
            <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <span>Workspace</span>

              <span className="font-semibold text-ink">
                {user.hotspot_name}
              </span>
            </li>

            <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <span>Owner</span>

              <span className="font-semibold text-ink">
                {user.name}
              </span>
            </li>

            <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <span>Email</span>

              <span className="font-semibold text-ink">
                {user.email}
              </span>
            </li>

            <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <span>Status</span>

              <span className="font-semibold text-ink">
                {statusText}
              </span>
            </li>

            {isSubscribed ? (
              <>
                <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <span>Subscription started</span>

                  <span className="text-right font-semibold text-ink">
                    {subscriptionStartText}
                  </span>
                </li>

                <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <span>Subscription ends</span>

                  <span className="text-right font-semibold text-ink">
                    {subscriptionEndText}
                  </span>
                </li>
              </>
            ) : null}

            {isTrial ? (
              <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
                <span>Trial ends</span>

                <span className="text-right font-semibold text-ink">
                  {trialEndText}
                </span>
              </li>
            ) : null}

            <li className="flex items-center justify-between gap-3">
              <span>Access role</span>

              <span className="font-semibold text-ink">
                {user.role}
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Errors */}
      {error ? (
        <div className="mt-5 panel border-red-400/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {/* Payment section */}
      {showPayment && (
        <section className="mt-5">
          {status ? (
            /*
             * Existing transaction
             */
            <div className="panel p-5">
              <p className="text-sm text-muted">
                Payment status
              </p>

              <p className="mt-1 text-lg font-semibold capitalize">
                {status.status}
              </p>

              {status.raw_status ? (
                <p className="mt-1 text-sm text-muted">
                  {status.raw_status}
                </p>
              ) : null}

              {status.success ? (
                <div className="mt-4 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-4">
                  <p className="text-sm text-emerald-200">
                    Subscription activated successfully!
                  </p>

                  <p className="mt-2 text-sm text-emerald-100">
                    Your account is now subscribed for one
                    month. The page will refresh shortly to
                    display your new subscription period.
                  </p>
                </div>
              ) : (
                <button
                  className="btn-secondary mt-4"
                  type="button"
                  onClick={() => checkPayment()}
                  disabled={checking}
                >
                  {checking
                    ? "Checking..."
                    : "Check again"}
                </button>
              )}
            </div>
          ) : (
            /*
             * New payment
             */
            <div className="panel p-6">
              <h3 className="text-lg font-semibold text-ink">
                {paymentHeading}
              </h3>

              <p className="mt-2 text-sm text-muted">
                {paymentDescription}
              </p>

              {loading ? (
                <p className="mt-4 text-sm text-muted">
                  Loading payment options...
                </p>
              ) : !config?.configured ? (
                <p className="mt-4 text-sm text-red-300">
                  Payment processing is not available at this
                  time.
                </p>
              ) : (
                <form
                  onSubmit={submit}
                  className="mt-5 space-y-4"
                >
                  {/* Product */}
                  <div className="rounded-md border border-line bg-soft/30 p-4">
                    <p className="text-sm font-semibold text-ink">
                      NobliFi Monthly Subscription
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      One month of NobliFi subscription access
                    </p>

                    <p className="mt-3 text-2xl font-bold text-brand">
                      {formatCurrency(monthlyPrice)}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium">
                      Phone

                      <input
                        className="field mt-2"
                        required
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(event.target.value)
                        }
                        placeholder="0772123456"
                      />
                    </label>

                    <label className="text-sm font-medium">
                      Email

                      <input
                        className="field mt-2"
                        type="email"
                        required
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder={
                          user.email ||
                          "your@email.com"
                        }
                      />
                    </label>
                  </div>

                  <button
                    className="btn w-full"
                    type="submit"
                    disabled={
                      !config?.configured ||
                      submitting
                    }
                  >
                    {submitting
                      ? "Processing..."
                      : isSubscribed
                        ? "Renew with ioTec"
                        : "Pay with ioTec"}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
}