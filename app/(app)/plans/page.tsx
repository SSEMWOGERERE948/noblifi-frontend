"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  API_BASE_URL,
  apiFetch,
} from "@/lib/api";

import {
  getToken,
} from "@/lib/auth";

type DurationUnit =
  | "minutes"
  | "hours"
  | "weeks"
  | "months";

type Plan = {
  id: string;
  name: string;
  price: number;

  duration_value: number;
  duration_unit: DurationUnit;
  duration_minutes: number;

  upload_speed: string;
  download_speed: string;

  max_devices: number;

  data_limit_mb?: number | null;

  is_active?: boolean;

  online_vouchers_created?: number;
};

type PlanForm = {
  name: string;
  price: string;

  duration_value: string;
  duration_unit: DurationUnit;

  upload_speed: string;
  download_speed: string;

  max_devices: string;

  data_limit_mb: string;
};

const initialForm: PlanForm = {
  name: "",
  price: "1000",

  duration_value: "1",
  duration_unit: "hours",

  upload_speed: "5M",
  download_speed: "10M",

  max_devices: "1",

  data_limit_mb: "",
};

function formatDuration(
  plan: Pick<
    Plan,
    | "duration_value"
    | "duration_unit"
    | "duration_minutes"
  >
): string {
  if (
    plan.duration_value > 0 &&
    plan.duration_unit
  ) {
    const unit =
      plan.duration_value === 1
        ? plan.duration_unit.replace(
            /s$/,
            ""
          )
        : plan.duration_unit;

    return `${plan.duration_value} ${unit}`;
  }

  return `${plan.duration_minutes} min`;
}

function formatPrice(
  price: number
): string {
  return new Intl.NumberFormat(
    "en-UG",
    {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }
  ).format(price);
}

function formatDataCap(
  value?: number | null
): string {
  if (!value || value <= 0) {
    return "Unlimited data";
  }

  if (value >= 1024) {
    const gb =
      value / 1024;

    return `${
      Number.isInteger(gb)
        ? gb
        : gb.toFixed(1)
    } GB`;
  }

  return `${value} MB`;
}

function formatSpeed(
  value?: string
): string {
  const speed =
    String(value || "").trim();

  return speed || "Unlimited";
}

export default function PlansPage() {
  const [plans, setPlans] =
    useState<Plan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState<PlanForm>(
      initialForm
    );

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);

    try {
      const data =
        await apiFetch<Plan[]>(
          "/api/v1/plans",
          {
            fallback: [],
          }
        );

      setPlans(data);
    } catch (err) {
      console.error(
        "Failed to load plans:",
        err
      );

      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  function updateForm<
    K extends keyof PlanForm,
  >(
    key: K,
    value: PlanForm[K]
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    const token =
      getToken();

    if (!token) {
      setError(
        "Your login session is missing or has expired. Please sign in again."
      );

      return;
    }

    const price =
      Number(form.price);

    const durationValue =
      Number(
        form.duration_value
      );

    const maxDevices =
      Number(
        form.max_devices
      );

    if (
      !form.name.trim()
    ) {
      setError(
        "Plan name is required."
      );

      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Enter a valid price."
      );

      return;
    }

    if (
      !Number.isInteger(
        durationValue
      ) ||
      durationValue <= 0
    ) {
      setError(
        "Duration must be greater than zero."
      );

      return;
    }

    if (
      !Number.isInteger(
        maxDevices
      ) ||
      maxDevices < 1
    ) {
      setError(
        "Max devices must be at least 1."
      );

      return;
    }

    let dataLimitMB:
      | number
      | null = null;

    if (
      form.data_limit_mb
        .trim() !== ""
    ) {
      const parsed =
        Number(
          form.data_limit_mb
        );

      if (
        !Number.isFinite(
          parsed
        ) ||
        parsed <= 0
      ) {
        setError(
          "Data cap must be greater than zero, or leave it blank for unlimited data."
        );

        return;
      }

      dataLimitMB =
        parsed;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/v1/plans`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            /*
             * IMPORTANT:
             *
             * Do NOT add:
             *
             * credentials: "include"
             *
             * Your backend currently uses Bearer-token
             * authentication and wildcard CORS.
             */

            body:
              JSON.stringify({
                name:
                  form.name.trim(),

                price,

                duration_value:
                  durationValue,

                duration_unit:
                  form.duration_unit,

                /*
                 * Do NOT calculate duration_minutes
                 * in the browser anymore.
                 *
                 * The Go backend calculates the
                 * canonical value.
                 */

                upload_speed:
                  form.upload_speed.trim(),

                download_speed:
                  form.download_speed.trim(),

                max_devices:
                  maxDevices,

                data_limit_mb:
                  dataLimitMB,

                is_active:
                  true,
              }),
          }
        );

      const body =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        response.status === 401
      ) {
        throw new Error(
          body?.error ||
            body?.message ||
            "Your login session has expired. Please sign in again."
        );
      }

      if (
        response.status === 403
      ) {
        throw new Error(
          body?.error ||
            body?.message ||
            "You are not allowed to create plans."
        );
      }

      if (!response.ok) {
        console.error(
          "Create plan failed:",
          {
            status:
              response.status,
            body,
          }
        );

        throw new Error(
          body?.error ||
            body?.message ||
            `Could not create plan. Server returned ${response.status}.`
        );
      }

      const created =
        body as Plan;

      setPlans(
        (current) => [
          created,
          ...current,
        ]
      );

      setMessage(
        `${created.name} was created successfully.`
      );

      setForm(
        (current) => ({
          ...current,

          name: "",

          duration_value:
            "1",

          duration_unit:
            "hours",

          data_limit_mb:
            "",
        })
      );
    } catch (err) {
      console.error(
        "Plan creation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not create plan."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          Plans
        </h1>

        <p className="mt-2 text-sm text-muted">
          Create the packages
          customers can use and
          purchase on your hotspot.
        </p>
      </div>

      {message ? (
        <div className="mt-5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={submit}
        className="panel mt-6 grid gap-5 p-5 md:grid-cols-3"
      >
        <label className="text-sm font-medium text-ink">
          Plan name

          <input
            className="field mt-2"
            value={form.name}
            onChange={(
              event
            ) =>
              updateForm(
                "name",
                event.target.value
              )
            }
            placeholder="e.g. 2 Hour WiFi"
            required
          />
        </label>

        <label className="text-sm font-medium text-ink">
          Price (UGX)

          <input
            className="field mt-2"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(
              event
            ) =>
              updateForm(
                "price",
                event.target.value
              )
            }
            required
          />
        </label>

        <label className="text-sm font-medium text-ink">
          Max devices

          <input
            className="field mt-2"
            type="number"
            min="1"
            step="1"
            value={
              form.max_devices
            }
            onChange={(
              event
            ) =>
              updateForm(
                "max_devices",
                event.target.value
              )
            }
            required
          />
        </label>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-ink">
            Duration
          </label>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <input
              className="field"
              type="number"
              min="1"
              step="1"
              value={
                form.duration_value
              }
              onChange={(
                event
              ) =>
                updateForm(
                  "duration_value",
                  event.target.value
                )
              }
              required
            />

            <select
              className="field"
              value={
                form.duration_unit
              }
              onChange={(
                event
              ) =>
                updateForm(
                  "duration_unit",
                  event.target
                    .value as DurationUnit
                )
              }
            >
              <option value="minutes">
                Minutes
              </option>

              <option value="hours">
                Hours
              </option>

              <option value="weeks">
                Weeks
              </option>

              <option value="months">
                Months
              </option>
            </select>
          </div>
        </div>

        <label className="text-sm font-medium text-ink">
          Data cap

          <input
            className="field mt-2"
            type="number"
            min="1"
            step="1"
            value={
              form.data_limit_mb
            }
            onChange={(
              event
            ) =>
              updateForm(
                "data_limit_mb",
                event.target.value
              )
            }
            placeholder="Unlimited"
          />

          <span className="mt-2 block text-xs text-muted">
            MB. Leave blank for
            unlimited data.
          </span>
        </label>

        <label className="text-sm font-medium text-ink">
          Upload speed

          <input
            className="field mt-2"
            value={
              form.upload_speed
            }
            onChange={(
              event
            ) =>
              updateForm(
                "upload_speed",
                event.target.value
              )
            }
            placeholder="e.g. 5M"
          />

          <span className="mt-2 block text-xs text-muted">
            Leave blank for no
            upload speed cap.
          </span>
        </label>

        <label className="text-sm font-medium text-ink">
          Download speed

          <input
            className="field mt-2"
            value={
              form.download_speed
            }
            onChange={(
              event
            ) =>
              updateForm(
                "download_speed",
                event.target.value
              )
            }
            placeholder="e.g. 10M"
          />

          <span className="mt-2 block text-xs text-muted">
            Leave blank for no
            download speed cap.
          </span>
        </label>

        <div className="md:col-span-3">
          <button
            className="btn"
            type="submit"
            disabled={
              submitting
            }
          >
            {submitting
              ? "Creating..."
              : "Create plan"}
          </button>
        </div>
      </form>

      <div className="panel mt-6 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted">
            Loading plans...
          </div>
        ) : plans.length ===
          0 ? (
          <div className="p-6 text-sm text-muted">
            No plans created yet.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {plans.map(
              (plan) => (
                <div
                  key={
                    plan.id
                  }
                  className="grid gap-4 p-4 text-sm md:grid-cols-7 md:items-center"
                >
                  <span className="font-semibold text-ink">
                    {
                      plan.name
                    }
                  </span>

                  <span className="text-muted">
                    {formatPrice(
                      plan.price
                    )}
                  </span>

                  <span className="text-muted">
                    {formatDuration(
                      plan
                    )}
                  </span>

                  <span className="text-muted">
                    Up{" "}
                    {formatSpeed(
                      plan.upload_speed
                    )}
                  </span>

                  <span className="text-muted">
                    Down{" "}
                    {formatSpeed(
                      plan.download_speed
                    )}
                  </span>

                  <span className="text-muted">
                    {formatDataCap(
                      plan.data_limit_mb
                    )}
                  </span>

                  <span className="text-muted">
                    {
                      plan.max_devices
                    }{" "}
                    {plan.max_devices ===
                    1
                      ? "device"
                      : "devices"}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}