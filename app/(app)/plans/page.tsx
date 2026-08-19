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

type Plan = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;

  upload_speed: string;
  download_speed: string;

  max_devices: number;

  data_limit_mb?: number | null;

  is_active?: boolean;

  online_vouchers_created?: number;
};

type DurationUnit =
  | "minutes"
  | "hours"
  | "weeks"
  | "months";

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
  price: "100",

  duration_value: "1",
  duration_unit: "hours",

  upload_speed: "5M",
  download_speed: "10M",

  max_devices: "1",

  data_limit_mb: "",
};

/**
 * Converts the UI duration into the duration_minutes
 * value expected by the NobliFi backend.
 *
 * Month is treated as 30 days.
 */
function durationToMinutes(
  value: number,
  unit: DurationUnit,
): number {
  switch (unit) {
    case "minutes":
      return value;

    case "hours":
      return value * 60;

    case "weeks":
      return value * 7 * 24 * 60;

    case "months":
      return value * 30 * 24 * 60;

    default:
      return value;
  }
}

/**
 * Human-readable duration for the plans list and
 * eventually the captive portal.
 */
function formatDuration(
  durationMinutes: number,
): string {
  if (!durationMinutes || durationMinutes <= 0) {
    return "-";
  }

  const monthMinutes =
    30 * 24 * 60;

  const weekMinutes =
    7 * 24 * 60;

  const hourMinutes = 60;

  if (
    durationMinutes >= monthMinutes &&
    durationMinutes % monthMinutes === 0
  ) {
    const months =
      durationMinutes / monthMinutes;

    return `${months} ${
      months === 1
        ? "month"
        : "months"
    }`;
  }

  if (
    durationMinutes >= weekMinutes &&
    durationMinutes % weekMinutes === 0
  ) {
    const weeks =
      durationMinutes / weekMinutes;

    return `${weeks} ${
      weeks === 1
        ? "week"
        : "weeks"
    }`;
  }

  if (
    durationMinutes >= hourMinutes &&
    durationMinutes % hourMinutes === 0
  ) {
    const hours =
      durationMinutes / hourMinutes;

    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    }`;
  }

  return `${durationMinutes} ${
    durationMinutes === 1
      ? "minute"
      : "minutes"
  }`;
}

function formatPrice(
  price: number,
): string {
  return new Intl.NumberFormat(
    "en-UG",
    {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    },
  ).format(price);
}

function formatDataCap(
  value?: number | null,
): string {
  if (!value || value <= 0) {
    return "Unlimited";
  }

  if (value >= 1024) {
    const gb = value / 1024;

    return `${Number.isInteger(gb)
      ? gb
      : gb.toFixed(1)} GB`;
  }

  return `${value} MB`;
}

function formatSpeed(
  value?: string,
): string {
  const speed =
    value?.trim();

  if (!speed) {
    return "Unlimited";
  }

  return speed;
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
      initialForm,
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
          },
        );

      setPlans(data);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  function updateForm<
    K extends keyof PlanForm,
  >(
    key: K,
    value: PlanForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const durationValue =
      Number(
        form.duration_value,
      );

    if (
      !Number.isFinite(
        durationValue,
      ) ||
      durationValue <= 0
    ) {
      setError(
        "Duration must be greater than zero.",
      );

      return;
    }

    const durationMinutes =
      durationToMinutes(
        durationValue,
        form.duration_unit,
      );

    const price =
      Number(form.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Enter a valid plan price.",
      );

      return;
    }

    const maxDevices =
      Number(
        form.max_devices,
      );

    if (
      !Number.isInteger(
        maxDevices,
      ) ||
      maxDevices < 1
    ) {
      setError(
        "Max devices must be at least 1.",
      );

      return;
    }

    let dataLimitMB:
      | number
      | null = null;

    if (
      form.data_limit_mb.trim() !==
      ""
    ) {
      const parsedDataLimit =
        Number(
          form.data_limit_mb,
        );

      if (
        !Number.isFinite(
          parsedDataLimit,
        ) ||
        parsedDataLimit <= 0
      ) {
        setError(
          "Data cap must be greater than zero or left blank for unlimited data.",
        );

        return;
      }

      dataLimitMB =
        parsedDataLimit;
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
            },

            credentials:
              "include",

            body: JSON.stringify({
              name:
                form.name.trim(),

              price,

              duration_minutes:
                durationMinutes,

              /**
               * Blank speed =
               * no speed cap.
               */
              upload_speed:
                form.upload_speed.trim(),

              download_speed:
                form.download_speed.trim(),

              max_devices:
                maxDevices,

              /**
               * null =
               * unlimited data.
               */
              data_limit_mb:
                dataLimitMB,

              /**
               * New plans should
               * immediately be available
               * for captive portal sales.
               */
              is_active: true,
            }),
          },
        );

      if (!response.ok) {
        let message =
          "Could not create plan.";

        try {
          const body =
            (await response.json()) as {
              error?: string;
              message?: string;
            };

          message =
            body.error ||
            body.message ||
            message;
        } catch {
          // Keep fallback message.
        }

        throw new Error(
          message,
        );
      }

      const created =
        (await response.json()) as Plan;

      setPlans(
        (current) => [
          ...current,
          created,
        ],
      );

      setMessage(
        `${created.name} was created successfully.`,
      );

      setForm((current) => ({
        ...current,

        name: "",

        duration_value: "1",

        data_limit_mb: "",
      }));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create plan.",
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
          Create the packages customers
          will use on your hotspot.
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
        {/* NAME */}

        <label className="text-sm font-medium text-ink">
          Plan name

          <input
            className="field mt-2"
            type="text"
            value={form.name}
            onChange={(event) =>
              updateForm(
                "name",
                event.target.value,
              )
            }
            placeholder="e.g. 1 Hour WiFi"
            required
          />
        </label>

        {/* PRICE */}

        <label className="text-sm font-medium text-ink">
          Price (UGX)

          <input
            className="field mt-2"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(event) =>
              updateForm(
                "price",
                event.target.value,
              )
            }
            placeholder="1000"
            required
          />
        </label>

        {/* MAX DEVICES */}

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
            onChange={(event) =>
              updateForm(
                "max_devices",
                event.target.value,
              )
            }
            required
          />
        </label>

        {/* DURATION */}

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
              onChange={(event) =>
                updateForm(
                  "duration_value",
                  event.target.value,
                )
              }
              required
            />

            <select
              className="field"
              value={
                form.duration_unit
              }
              onChange={(event) =>
                updateForm(
                  "duration_unit",
                  event.target
                    .value as DurationUnit,
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

          <p className="mt-2 text-xs text-muted">
            This plan will last{" "}
            <span className="font-medium text-ink">
              {formatDuration(
                durationToMinutes(
                  Number(
                    form.duration_value ||
                      0,
                  ),
                  form.duration_unit,
                ),
              )}
            </span>
            .
          </p>
        </div>

        {/* DATA CAP */}

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
            onChange={(event) =>
              updateForm(
                "data_limit_mb",
                event.target.value,
              )
            }
            placeholder="Unlimited"
          />

          <span className="mt-2 block text-xs text-muted">
            MB. Leave blank for
            unlimited data.
          </span>
        </label>

        {/* UPLOAD SPEED */}

        <label className="text-sm font-medium text-ink">
          Upload speed

          <input
            className="field mt-2"
            type="text"
            value={
              form.upload_speed
            }
            onChange={(event) =>
              updateForm(
                "upload_speed",
                event.target.value,
              )
            }
            placeholder="e.g. 5M"
          />

          <span className="mt-2 block text-xs text-muted">
            Leave blank for no
            upload speed cap.
          </span>
        </label>

        {/* DOWNLOAD SPEED */}

        <label className="text-sm font-medium text-ink">
          Download speed

          <input
            className="field mt-2"
            type="text"
            value={
              form.download_speed
            }
            onChange={(event) =>
              updateForm(
                "download_speed",
                event.target.value,
              )
            }
            placeholder="e.g. 10M"
          />

          <span className="mt-2 block text-xs text-muted">
            Leave blank for no
            download speed cap.
          </span>
        </label>

        {/* PREVIEW */}

        <div className="rounded-lg border border-line bg-soft/40 p-4 md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Package preview
          </p>

          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="font-semibold text-ink">
              {form.name.trim() ||
                "Plan name"}
            </span>

            <span className="text-muted">
              {formatPrice(
                Number(
                  form.price ||
                    0,
                ),
              )}
            </span>

            <span className="text-muted">
              {formatDuration(
                durationToMinutes(
                  Number(
                    form.duration_value ||
                      0,
                  ),
                  form.duration_unit,
                ),
              )}
            </span>

            <span className="text-muted">
              ↑{" "}
              {formatSpeed(
                form.upload_speed,
              )}
            </span>

            <span className="text-muted">
              ↓{" "}
              {formatSpeed(
                form.download_speed,
              )}
            </span>

            <span className="text-muted">
              {form.data_limit_mb
                ? formatDataCap(
                    Number(
                      form.data_limit_mb,
                    ),
                  )
                : "Unlimited data"}
            </span>
          </div>
        </div>

        {/* CREATE */}

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

      {/* EXISTING PLANS */}

      <div className="panel mt-6 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted">
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
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
                  <div>
                    <span className="font-semibold text-ink">
                      {
                        plan.name
                      }
                    </span>
                  </div>

                  <span className="text-muted">
                    {formatPrice(
                      plan.price,
                    )}
                  </span>

                  <span className="text-muted">
                    {formatDuration(
                      plan.duration_minutes,
                    )}
                  </span>

                  <span className="text-muted">
                    Up{" "}
                    {formatSpeed(
                      plan.upload_speed,
                    )}
                  </span>

                  <span className="text-muted">
                    Down{" "}
                    {formatSpeed(
                      plan.download_speed,
                    )}
                  </span>

                  <span className="text-muted">
                    {formatDataCap(
                      plan.data_limit_mb,
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
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}