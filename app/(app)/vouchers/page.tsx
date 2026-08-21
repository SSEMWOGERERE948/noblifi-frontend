"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  DataTable,
  EmptyState,
  OperationsTitle,
  StatusBadge
} from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";
import {
  getStoredUser,
  type AuthUser
} from "@/lib/auth";
import {
  downloadVoucherPdf,
  VOUCHER_PDF_TEMPLATES,
  type PrintableVoucher,
  type VoucherPdfTemplate
} from "@/lib/voucher-pdf";

type Voucher = {
  id: string;
  code: string;
  status: string;
  plan_id: string;
  plan_name?: string;
  channel?: string;
  batch_id?: string | null;
  template?: string | null;
  pattern?: string | null;
  payer?: string;
  payer_name?: string;
  use_case?: string;
  provider_reference?: string;
  merchant_reference?: string;
  first_login?: string;
  expires_at?: string;
  created_at?: string;
};

type Plan = {
  id: string;
  name: string;
  price?: number;
  duration_minutes?: number;
};

type GenerationTemplateValue =
  | "compact"
  | "receipt"
  | "scratch_card";

const generationTemplates: {
  value: GenerationTemplateValue;
  label: string;
  detail: string;
}[] = [
  {
    value: "compact",
    label: "Compact cards",
    detail:
      "Small counter cards with plan, code, duration, and hotspot branding."
  },
  {
    value: "receipt",
    label: "Receipt slips",
    detail:
      "Narrow POS-style voucher slips with a clear access token and plan details."
  },
  {
    value: "scratch_card",
    label: "Scratch cards",
    detail:
      "Larger branded cards with a protected voucher-token area for resale."
  }
];

type CodeType =
  | "alphanumeric"
  | "alphabetic"
  | "numeric";

const codeTypes: {
  value: CodeType;
  label: string;
  example: string;
}[] = [
  {
    value: "alphanumeric",
    label: "Letters + Numbers",
    example: "K7Q29M4X"
  },
  {
    value: "alphabetic",
    label: "Letters only",
    example: "KQMPXZTA"
  },
  {
    value: "numeric",
    label: "Numbers only",
    example: "58372916"
  }
];

const codeLengths = [4, 5, 6, 7, 8, 9] as const;
const vouchersPerPage = 100;

function formatDuration(minutes?: number) {
  if (!minutes || minutes <= 0) {
    return undefined;
  }

  if (minutes % (24 * 60) === 0) {
    const days = minutes / (24 * 60);
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${minutes} minutes`;
}

function formatPrice(price?: number) {
  if (!price || price <= 0) {
    return undefined;
  }

  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0
  }).format(price);
}

function formatOptionalDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatPhone(value?: string) {
  if (!value) {
    return "-";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("256")) {
    return `+${digits}`;
  }

  return value;
}

function randomVoucherPreviewCode(maxLength = 9) {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const safeMaxLength = Math.max(
    6,
    Math.min(maxLength, 9)
  );

  const length =
    Math.floor(
      Math.random() * (safeMaxLength - 5)
    ) + 6;

  return Array.from(
    { length },
    () =>
      characters[
        Math.floor(
          Math.random() * characters.length
        )
      ]
  ).join("");
}

function buildPreviewCodes(count: number) {
  return Array.from({ length: count }, () =>
    randomVoucherPreviewCode(9)
  );
}

const INITIAL_PREVIEW_CODES: Record<
  GenerationTemplateValue,
  string[]
> = {
  compact: [
    "7K4P9X2A",
    "48372915",
    "Q7M28K9",
    "92845173",
    "B4X7M29P",
    "73184629"
  ],
  receipt: [
    "K7Q29M4",
    "58421693",
    "P9X4A72K",
    "81734925"
  ],
  scratch_card: [
    "Q8M42K7P",
    "64928175",
    "A7X29M4"
  ]
};

function CompactVoucherSample({
  code
}: {
  code: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-emerald-400" />

      <div className="p-2">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[7px] font-bold uppercase tracking-[0.12em] text-slate-700">
            NobliFi WiFi
          </span>

          <span className="rounded bg-emerald-50 px-1 py-0.5 text-[6px] font-semibold text-emerald-700">
            1 HR
          </span>
        </div>

        <div className="mt-1.5 rounded bg-slate-50 px-1 py-1 text-center font-mono text-[9px] font-black tracking-wide text-slate-950">
          {code}
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-1 text-[6px] text-slate-500">
          <span>UGX 1,000</span>
          <span>WiFi Voucher</span>
        </div>
      </div>
    </div>
  );
}

function ReceiptVoucherSample({
  code
}: {
  code: string;
}) {
  return (
    <div className="rounded border border-slate-300 bg-white px-2 py-1.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-300 pb-1">
        <span className="text-[7px] font-bold uppercase tracking-wide text-slate-800">
          NobliFi WiFi
        </span>

        <span className="text-[6px] text-slate-500">
          POS
        </span>
      </div>

      <div className="mt-1 flex items-end justify-between gap-2">
        <div>
          <p className="text-[6px] uppercase text-slate-400">
            Access token
          </p>

          <p className="font-mono text-[10px] font-black tracking-wide text-slate-950">
            {code}
          </p>
        </div>

        <div className="text-right text-[6px] text-slate-500">
          <p>1 Hour</p>
          <p>UGX 1,000</p>
        </div>
      </div>
    </div>
  );
}

function ScratchVoucherSample({
  code
}: {
  code: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-emerald-300/70 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-slate-950 px-2 py-1.5">
        <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-emerald-300">
          NobliFi WiFi
        </span>

        <span className="text-[6px] text-slate-300">
          1 Hour
        </span>
      </div>

      <div className="p-2">
        <p className="text-[6px] uppercase tracking-wide text-slate-400">
          Voucher token
        </p>

        <div className="mt-1 rounded border border-dashed border-emerald-300 bg-emerald-50 px-2 py-1.5 text-center">
          <p className="font-mono text-[10px] font-black tracking-widest text-slate-950">
            {code}
          </p>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[6px] text-slate-500">
          <span>Scratch / reveal</span>
          <span>UGX 1,000</span>
        </div>
      </div>
    </div>
  );
}

function VoucherFormatPreview({
  variant,
  codes
}: {
  variant: GenerationTemplateValue;
  codes: string[];
}) {
  if (variant === "compact") {
    return (
      <div className="rounded-lg border border-line bg-app p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Sample print layout
          </span>

          <span className="text-[9px] text-accent">
            Compact
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {codes.slice(0, 6).map((code) => (
            <CompactVoucherSample
              key={code}
              code={code}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "receipt") {
    return (
      <div className="rounded-lg border border-line bg-app p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Sample print layout
          </span>

          <span className="text-[9px] text-accent">
            POS Slips
          </span>
        </div>

        <div className="space-y-1.5">
          {codes.slice(0, 4).map((code) => (
            <ReceiptVoucherSample
              key={code}
              code={code}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-app p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Sample print layout
        </span>

        <span className="text-[9px] text-accent">
          Scratch
        </span>
      </div>

      <div className="grid gap-1.5">
        {codes.slice(0, 3).map((code) => (
          <ScratchVoucherSample
            key={code}
            code={code}
          />
        ))}
      </div>
    </div>
  );
}

function PdfTemplatePreview({
  template
}: {
  template: VoucherPdfTemplate;
}) {
  const cells =
    template === "modern_qr" ? 12 : 15;

  const columns =
    template === "modern_qr"
      ? "grid-cols-4"
      : "grid-cols-5";

  return (
    <div className="rounded-lg border border-line bg-white p-2 shadow-inner">
      <div className={`grid ${columns} gap-1`}>
        {Array.from({ length: cells }).map((_, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-[3px] border border-slate-200 ${
              template === "modern_qr"
                ? "h-8"
                : "h-7"
            }`}
          >
            {template === "modern_qr" ? (
              <>
                <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" />
                <div className="absolute left-2 top-1 h-4 w-4 border border-slate-300 bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%,transparent_50%,#0f172a_50%,#0f172a_75%,transparent_75%)] bg-[length:4px_4px]" />
                <div className="absolute left-7 right-1 top-1 h-1 bg-emerald-300" />
                <div className="absolute left-7 right-2 top-3 h-1 bg-slate-400" />
                <div className="absolute bottom-1 left-7 right-1 h-1 bg-slate-200" />
              </>
            ) : template === "classic" ? (
              <>
                <div className="absolute left-1 right-1 top-1 h-[2px] bg-slate-700" />
                <div className="absolute left-1 right-1 top-3 h-[2px] bg-slate-300" />
                <div className="absolute left-1 right-1 top-[14px] h-[3px] bg-slate-900" />
                <div className="absolute bottom-1 left-1 right-1 h-[2px] bg-slate-300" />
              </>
            ) : (
              <>
                <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400" />
                <div className="absolute left-1 right-1 top-2 h-[2px] bg-emerald-300" />
                <div className="absolute left-1 right-1 top-[10px] h-2 rounded-sm bg-emerald-50" />
                <div className="absolute bottom-1 left-1 right-1 h-[2px] bg-slate-200" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VouchersPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("500");
  const [template, setTemplate] =
    useState<GenerationTemplateValue>("compact");

  const [codeType, setCodeType] =
    useState<CodeType>("alphanumeric");

  const [codeLength, setCodeLength] =
    useState<number>(8);

  const [previewCodes, setPreviewCodes] =
    useState<
      Record<GenerationTemplateValue, string[]>
    >(INITIAL_PREVIEW_CODES);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const [accountUser, setAccountUser] =
    useState<AuthUser | null>(null);

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(new Set());

  const [pdfModalOpen, setPdfModalOpen] =
    useState(false);

  const [pdfTemplate, setPdfTemplate] =
    useState<VoucherPdfTemplate>(
      "branded_business"
    );

  const [downloadingPdf, setDownloadingPdf] =
    useState(false);
  const [voucherSearch, setVoucherSearch] =
    useState("");
  const [voucherStatusFilter, setVoucherStatusFilter] =
    useState("");
  const [voucherPlanFilter, setVoucherPlanFilter] =
    useState("");
  const [voucherChannelFilter, setVoucherChannelFilter] =
    useState("");
  const [voucherPage, setVoucherPage] =
    useState(1);

  useEffect(() => {
    // Randomize the visual voucher samples after the component
    // mounts. These sample codes are independent of the real
    // voucher code pattern selected below.
    setPreviewCodes({
      compact: buildPreviewCodes(6),
      receipt: buildPreviewCodes(4),
      scratch_card: buildPreviewCodes(3)
    });
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    setAccountUser(storedUser);

    Promise.all([
      apiFetch<Plan[]>("/api/v1/plans", {
        fallback: []
      }),
      apiFetch<Voucher[]>("/api/v1/vouchers", {
        fallback: []
      })
    ])
      .then(
        ([planData, voucherData]: [
          Plan[],
          Voucher[]
        ]) => {
          setPlans(planData);
          setPlanId(planData[0]?.id ?? "");
          setVouchers(voucherData);
        }
      )
      .catch(() => {
        setPlans([]);
        setVouchers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!pdfModalOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [pdfModalOpen]);

  const plansById = useMemo(() => {
    return new Map(
      plans.map((plan) => [plan.id, plan])
    );
  }, [plans]);

  const selectedVouchers = useMemo(
    () =>
      vouchers.filter((voucher) =>
        selectedIds.has(voucher.id)
      ),
    [vouchers, selectedIds]
  );

  const filteredVouchers = useMemo(() => {
    const search = voucherSearch.trim().toLowerCase();

    return vouchers.filter((voucher) => {
      if (
        voucherStatusFilter &&
        (voucher.status ?? "").toLowerCase() !==
          voucherStatusFilter
      ) {
        return false;
      }

      if (
        voucherChannelFilter &&
        (voucher.channel ?? "physical").toLowerCase() !==
          voucherChannelFilter
      ) {
        return false;
      }

      if (
        voucherPlanFilter &&
        voucher.plan_id !== voucherPlanFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        voucher.code,
        voucher.plan_name,
        plansById.get(voucher.plan_id)?.name,
        voucher.channel,
        voucher.status,
        voucher.payer,
        voucher.payer_name,
        voucher.use_case,
        voucher.provider_reference,
        voucher.merchant_reference,
        voucher.batch_id
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [
    plansById,
    voucherChannelFilter,
    voucherPlanFilter,
    voucherSearch,
    voucherStatusFilter,
    vouchers
  ]);

  const voucherPageCount = Math.max(
    1,
    Math.ceil(filteredVouchers.length / vouchersPerPage)
  );

  const pagedVouchers = filteredVouchers.slice(
    (voucherPage - 1) * vouchersPerPage,
    voucherPage * vouchersPerPage
  );

  const allSelected =
    pagedVouchers.length > 0 &&
    pagedVouchers.every((voucher) =>
      selectedIds.has(voucher.id)
    );

  useEffect(() => {
    setVoucherPage(1);
  }, [
    voucherChannelFilter,
    voucherPlanFilter,
    voucherSearch,
    voucherStatusFilter
  ]);

  useEffect(() => {
    if (voucherPage > voucherPageCount) {
      setVoucherPage(voucherPageCount);
    }
  }, [voucherPage, voucherPageCount]);

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setGenerating(true);

    try {
      const generated =
        await apiFetch<Voucher[]>(
          "/api/v1/vouchers/generate",
          {
            method: "POST",
            body: JSON.stringify({
              plan_id: planId,
              quantity: Number(quantity),
              template,
              pattern: codeType,
              code_length: codeLength
            })
          }
        );

      setVouchers((current) => [
        ...generated,
        ...current
      ]);

      setSelectedIds(
        new Set(generated.map((voucher) => voucher.id))
      );

      setMessage(
        `${generated.length} voucher${
          generated.length === 1 ? "" : "s"
        } generated successfully. They are selected and ready for PDF download.`
      );
    } catch (error) {
      const fallbackMessage =
        "Your free trial has expired. Please subscribe to continue.";

      setMessage(
        error instanceof Error
          ? error.message
          : fallbackMessage
      );
    } finally {
      setGenerating(false);
    }
  }

  function toggleVoucher(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((current) => {
        const next = new Set(current);
        pagedVouchers.forEach((voucher) =>
          next.delete(voucher.id)
        );
        return next;
      });
      return;
    }

    setSelectedIds(
      new Set([
        ...selectedIds,
        ...pagedVouchers.map((voucher) => voucher.id)
      ])
    );
  }

  function openPdfModal() {
    if (!selectedVouchers.length) {
      setMessage(
        "Select at least one voucher before downloading a PDF."
      );
      return;
    }

    setMessage("");
    setPdfModalOpen(true);
  }

  function printableVoucher(
    voucher: Voucher
  ): PrintableVoucher {
    const plan = plansById.get(voucher.plan_id);

    return {
      code: voucher.code,
      planName: plan?.name || "NobliFi Plan",
      hotspotName:
        accountUser?.hotspot_name ||
        "NobliFi WiFi",
      supportContact:
        accountUser?.email || undefined,
      durationLabel: formatDuration(
        plan?.duration_minutes
      ),
      priceLabel: formatPrice(plan?.price)
    };
  }

  async function handleDownloadPdf() {
    if (!selectedVouchers.length) {
      return;
    }

    setDownloadingPdf(true);
    setMessage("");

    try {
      await downloadVoucherPdf(
        selectedVouchers.map(printableVoucher),
        pdfTemplate
      );

      setPdfModalOpen(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not generate the voucher PDF."
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <>
      <OperationsTitle
        title="Vouchers"
        description="Mobile money online vouchers are generated automatically when a package is created. Use this page to create printable physical voucher batches."
        action={
          <div className="flex flex-wrap gap-2">
            {selectedVouchers.length > 0 ? (
              <button
                className="btn-secondary"
                type="button"
                onClick={openPdfModal}
              >
                Download selected (
                {selectedVouchers.length})
              </button>
            ) : null}

            <button
              className="btn"
              type="submit"
              form="voucher-form"
              disabled={generating}
            >
              {generating
                ? "Generating..."
                : "Generate physical vouchers"}
            </button>
          </div>
        }
      />

      {message ? (
        <div className="mb-5 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-4">
          <p className="text-sm font-semibold text-ink">
            Voucher update
          </p>

          <p className="mt-2 text-sm text-muted">
            {message}
          </p>

          {message.toLowerCase().includes("trial") ? (
            <button
              type="button"
              className="btn mt-4"
              onClick={() =>
                router.push("/subscriptions")
              }
            >
              Go to subscriptions
            </button>
          ) : null}
        </div>
      ) : null}

      <form
        id="voucher-form"
        onSubmit={submit}
        className="panel grid gap-5 p-5"
      >
        <div>
          <p className="mb-1 text-sm font-semibold text-ink">
            Voucher generation format
          </p>

          <p className="mb-4 text-xs text-muted">
            Choose how your physical vouchers should be
            prepared. The examples below are visual samples
            only. Real voucher codes use the character type and
            4–9 character length you choose below.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {generationTemplates.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setTemplate(option.value)
                }
                className={`rounded-lg border p-4 text-left transition ${
                  template === option.value
                    ? "border-accent bg-emerald-400/10"
                    : "border-line bg-panel hover:bg-soft"
                }`}
              >
                <div className="mb-4">
                  <VoucherFormatPreview
                    variant={option.value}
                    codes={
                      previewCodes[option.value]
                    }
                  />
                </div>

                <h2 className="font-semibold text-ink">
                  {option.label}
                </h2>

                <p className="mt-1 text-xs text-muted">
                  {option.detail}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <label className="text-sm font-medium text-ink md:col-span-2">
            Plan

            <select
              className="field mt-2"
              value={planId}
              onChange={(event) =>
                setPlanId(event.target.value)
              }
            >
              {plans.map((plan) => (
                <option
                  key={plan.id}
                  value={plan.id}
                >
                  {plan.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-ink">
            Code characters

            <select
              className="field mt-2"
              value={codeType}
              onChange={(event) =>
                setCodeType(
                  event.target.value as CodeType
                )
              }
            >
              {codeTypes.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-muted">
              Example: {" "}
              {
                codeTypes.find(
                  (item) =>
                    item.value === codeType
                )?.example
              }
            </p>
          </label>

          <label className="text-sm font-medium text-ink">
            Code length

            <select
              className="field mt-2"
              value={codeLength}
              onChange={(event) =>
                setCodeLength(
                  Number(event.target.value)
                )
              }
            >
              {codeLengths.map((length) => (
                <option
                  key={length}
                  value={length}
                >
                  {length} characters
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-muted">
              Choose from 4 to 9 characters.
            </p>
          </label>

          <label className="text-sm font-medium text-ink">
            Tokens

            <input
              className="field mt-2"
              type="number"
              min="1"
              max="500"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
            />

            <p className="mt-2 text-xs text-muted">
              Maximum 500 per batch.
            </p>
          </label>
        </div>

        <div className="rounded-lg border border-line bg-app p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Selected code format
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-accent/30 bg-emerald-400/10 px-3 py-2 font-mono text-lg font-bold text-ink">
              {codeType === "numeric"
                ? "5".repeat(codeLength)
                : codeType === "alphabetic"
                  ? "K".repeat(codeLength)
                  : Array.from(
                      { length: codeLength },
                      (_, index) =>
                        index % 2 === 0 ? "K" : "7"
                    ).join("")}
            </span>

            <span className="text-sm text-muted">
              {codeTypes.find(
                (item) => item.value === codeType
              )?.label}{" "}
              · {codeLength} characters
            </span>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs text-muted">
            Physical voucher batches are capped at 500
            tokens.
          </p>

          <button
            className="btn"
            type="submit"
            disabled={!planId || generating}
          >
            {generating
              ? "Generating physical batch..."
              : "Generate physical batch"}
          </button>
        </div>
      </form>

      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Current vouchers
            </h2>

            <p className="mt-1 text-xs text-muted">
              Select vouchers, then choose a printable PDF
              template.
            </p>
          </div>

          {filteredVouchers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={toggleAll}
              >
                {allSelected
                  ? "Clear selection"
                  : "Select all"}
              </button>

              <button
                type="button"
                className="btn"
                disabled={!selectedVouchers.length}
                onClick={openPdfModal}
              >
                Download PDF
                {selectedVouchers.length
                  ? ` (${selectedVouchers.length})`
                  : ""}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <input
            className="field"
            value={voucherSearch}
            onChange={(event) =>
              setVoucherSearch(event.target.value)
            }
            placeholder="Search voucher, payer, name, batch..."
          />

          <select
            className="field"
            value={voucherStatusFilter}
            onChange={(event) =>
              setVoucherStatusFilter(event.target.value)
            }
          >
            <option value="">All statuses</option>
            <option value="unused">Not used</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
            <option value="exhausted">Exhausted</option>
          </select>

          <select
            className="field"
            value={voucherChannelFilter}
            onChange={(event) =>
              setVoucherChannelFilter(event.target.value)
            }
          >
            <option value="">All tokens</option>
            <option value="online">Online tokens</option>
            <option value="physical">Physical vouchers</option>
          </select>

          <select
            className="field"
            value={voucherPlanFilter}
            onChange={(event) =>
              setVoucherPlanFilter(event.target.value)
            }
          >
            <option value="">All packages</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-muted">
            Loading vouchers...
          </p>
        ) : null}

        {!loading && filteredVouchers.length ? (
          <DataTable
            columns={[
              "Select",
              "Voucher Code",
              "Channel",
              "Package",
              "Payer",
              "Payer Name",
              "Status",
              "First Login",
              "Expires On",
              "Use Case",
              "Created On"
            ]}
            rows={pagedVouchers.map((voucher) => {
              const plan = plansById.get(
                voucher.plan_id
              );

              return {
                Select: (
                  <input
                    type="checkbox"
                    aria-label={`Select voucher ${voucher.code}`}
                    checked={selectedIds.has(
                      voucher.id
                    )}
                    onChange={() =>
                      toggleVoucher(voucher.id)
                    }
                    className="h-4 w-4 cursor-pointer accent-emerald-400"
                  />
                ),
                "Voucher Code": (
                  <span className="font-mono font-semibold text-ink">
                    {voucher.code}
                  </span>
                ),
                Package:
                  voucher.plan_name || plan?.name || voucher.plan_id,
                Channel:
                  voucher.channel ?? "physical",
                Payer: voucher.payer ? formatPhone(voucher.payer) : "-",
                "Payer Name": voucher.payer_name || "-",
                Status: (
                  <StatusBadge
                    label={voucher.status}
                  />
                ),
                "First Login": formatOptionalDate(voucher.first_login),
                "Expires On": formatOptionalDate(voucher.expires_at),
                "Use Case": voucher.use_case || (voucher.channel === "online" ? "Mobile Money Sale" : "Physical Voucher"),
                "Created On": formatOptionalDate(voucher.created_at)
              };
            })}
          />
        ) : null}

        {!loading && !vouchers.length ? (
          <EmptyState
            title="No vouchers yet"
            description="Generate a voucher batch after creating a plan."
          />
        ) : null}

        {!loading && vouchers.length > 0 && !filteredVouchers.length ? (
          <EmptyState
            title="No matching vouchers"
            description="Adjust search, status, token type, or package filters."
          />
        ) : null}

        {!loading && filteredVouchers.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing{" "}
              {(voucherPage - 1) * vouchersPerPage + 1}
              -
              {Math.min(
                voucherPage * vouchersPerPage,
                filteredVouchers.length
              )}{" "}
              of {filteredVouchers.length} vouchers
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={voucherPage <= 1}
                onClick={() =>
                  setVoucherPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
              >
                Previous
              </button>

              <span className="rounded-md border border-line px-3 py-2 text-ink">
                Page {voucherPage} of {voucherPageCount}
              </span>

              <button
                type="button"
                className="btn-secondary"
                disabled={voucherPage >= voucherPageCount}
                onClick={() =>
                  setVoucherPage((current) =>
                    Math.min(voucherPageCount, current + 1)
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {pdfModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !downloadingPdf
            ) {
              setPdfModalOpen(false);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-line bg-app shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-app/95 px-6 py-5 backdrop-blur">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  Download{" "}
                  {selectedVouchers.length} Selected{" "}
                  {selectedVouchers.length === 1
                    ? "Voucher"
                    : "Vouchers"}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <span className="rounded-full border border-accent/30 bg-emerald-400/10 px-2.5 py-0.5 font-semibold text-accent">
                    {selectedVouchers.length}
                  </span>

                  <span>
                    {selectedVouchers.length === 1
                      ? "voucher ready for download"
                      : "vouchers ready for download"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close PDF template selector"
                className="rounded-md px-3 py-1 text-2xl leading-none text-muted transition hover:bg-soft hover:text-ink"
                onClick={() =>
                  setPdfModalOpen(false)
                }
                disabled={downloadingPdf}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-ink">
                Choose PDF Template
              </h3>

              <p className="mt-1 text-sm text-muted">
                The PDF is generated on A4 pages and
                downloaded directly to your device.
              </p>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                {VOUCHER_PDF_TEMPLATES.map(
                  (option) => {
                    const selected =
                      pdfTemplate === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setPdfTemplate(
                            option.value
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-accent bg-emerald-400/10 ring-2 ring-accent/30"
                            : "border-line bg-panel hover:border-accent/50 hover:bg-soft"
                        }`}
                      >
                        <PdfTemplatePreview
                          template={option.value}
                        />

                        <div className="mt-4">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-base font-semibold text-ink">
                              {option.label}
                            </h4>

                            {selected ? (
                              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-slate-950">
                                Selected
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 min-h-10 text-sm text-muted">
                            {option.detail}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {option.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-line bg-app px-2.5 py-1 text-xs font-medium text-ink"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  {
                    VOUCHER_PDF_TEMPLATES.find(
                      (item) =>
                        item.value === pdfTemplate
                    )?.piecesPerPage
                  }{" "}
                  vouchers per A4 page with the selected
                  layout.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={downloadingPdf}
                    onClick={() =>
                      setPdfModalOpen(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn"
                    disabled={
                      downloadingPdf ||
                      !selectedVouchers.length
                    }
                    onClick={handleDownloadPdf}
                  >
                    {downloadingPdf
                      ? "Generating PDF..."
                      : `Download PDF (${selectedVouchers.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
