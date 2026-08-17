import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export type VoucherPdfTemplate =
  | "branded_business"
  | "classic"
  | "modern_qr";

export type PrintableVoucher = {
  code: string;
  planName: string;
  hotspotName: string;
  supportContact?: string;
  priceLabel?: string;
  durationLabel?: string;
};

export type VoucherPdfTemplateOption = {
  value: VoucherPdfTemplate;
  label: string;
  detail: string;
  piecesPerPage: number;
  tags: string[];
};

export const VOUCHER_PDF_TEMPLATES: VoucherPdfTemplateOption[] = [
  {
    value: "branded_business",
    label: "Branded Business Voucher",
    detail:
      "Professional card style with hotspot branding, plan details, voucher code, and support contact.",
    piecesPerPage: 55,
    tags: ["Hotspot Name", "Support Contact", "55 Pieces", "Professional"]
  },
  {
    value: "classic",
    label: "Classic Template",
    detail:
      "Clean black-and-white layout designed to fit more vouchers on each A4 page.",
    piecesPerPage: 60,
    tags: ["Voucher Code", "60 Pieces", "Black & White", "Budget Friendly"]
  },
  {
    value: "modern_qr",
    label: "Modern QR Template",
    detail:
      "Modern NobliFi layout with a scannable QR code and strong visual branding.",
    piecesPerPage: 40,
    tags: ["QR Code", "40 Pieces", "Full Color", "Modern Design"]
  }
];

type Layout = {
  cols: number;
  rows: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
};

const A4_WIDTH = 210;
const A4_HEIGHT = 297;

const BRAND_TEAL: [number, number, number] = [21, 217, 180];
const BRAND_CYAN: [number, number, number] = [56, 189, 248];
const BRAND_DARK: [number, number, number] = [7, 22, 32];
const TEXT_DARK: [number, number, number] = [24, 35, 45];
const TEXT_MUTED: [number, number, number] = [95, 110, 120];
const LINE_LIGHT: [number, number, number] = [205, 215, 220];

const layouts: Record<VoucherPdfTemplate, Layout> = {
  branded_business: {
    cols: 5,
    rows: 11,
    marginX: 10,
    marginY: 12,
    gapX: 2,
    gapY: 2
  },
  classic: {
    cols: 5,
    rows: 12,
    marginX: 9,
    marginY: 10,
    gapX: 2,
    gapY: 1.5
  },
  modern_qr: {
    cols: 4,
    rows: 10,
    marginX: 10,
    marginY: 10,
    gapX: 3,
    gapY: 2
  }
};

function fitText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fallback = "-"
) {
  const source = String(text || fallback);

  if (doc.getTextWidth(source) <= maxWidth) {
    return source;
  }

  let result = source;

  while (
    result.length > 2 &&
    doc.getTextWidth(`${result}…`) > maxWidth
  ) {
    result = result.slice(0, -1);
  }

  return `${result}…`;
}

function drawBorder(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setDrawColor(...LINE_LIGHT);
  doc.setLineWidth(0.12);
  doc.rect(x, y, width, height);
}

function drawBrandedBusinessVoucher(
  doc: jsPDF,
  voucher: PrintableVoucher,
  x: number,
  y: number,
  width: number,
  height: number
) {
  drawBorder(doc, x, y, width, height);

  doc.setFillColor(...BRAND_TEAL);
  doc.rect(x, y, width, 2.2, "F");

  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.2);
  doc.text(
    fitText(doc, voucher.hotspotName || "NobliFi WiFi", width - 5),
    x + 2.3,
    y + 5.3
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    fitText(doc, voucher.planName, width - 5),
    x + 2.3,
    y + 7.7
  );

  doc.setFillColor(241, 252, 249);
  doc.roundedRect(
    x + 2.2,
    y + 9.2,
    width - 4.4,
    7,
    1.1,
    1.1,
    "F"
  );

  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    fitText(doc, voucher.code, width - 7),
    x + width / 2,
    y + 13.6,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.5);
  doc.setTextColor(...BRAND_TEAL);
  doc.text("WIFI VOUCHER", x + 2.3, y + height - 4.2);

  const detail =
    voucher.durationLabel ||
    voucher.priceLabel ||
    "NobliFi access";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.2);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    fitText(doc, detail, width - 5),
    x + 2.3,
    y + height - 2.1
  );

  if (voucher.supportContact) {
    doc.setFontSize(2.8);
    doc.text(
      fitText(doc, voucher.supportContact, width - 5),
      x + width - 2.3,
      y + height - 2.1,
      { align: "right" }
    );
  }
}

function drawClassicVoucher(
  doc: jsPDF,
  voucher: PrintableVoucher,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.18);
  doc.rect(x, y, width, height);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.4);
  doc.text(
    fitText(doc, voucher.hotspotName || "NobliFi WiFi", width - 4),
    x + width / 2,
    y + 3.3,
    { align: "center" }
  );

  doc.setDrawColor(160, 160, 160);
  doc.line(x + 1.5, y + 4.5, x + width - 1.5, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.2);
  doc.text(
    fitText(doc, voucher.planName, width - 5),
    x + 2,
    y + 7.3
  );

  doc.setFont("courier", "bold");
  doc.setFontSize(6.8);
  doc.text(
    fitText(doc, voucher.code, width - 5),
    x + width / 2,
    y + 12.3,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3);
  doc.setTextColor(70, 70, 70);

  const detail = [
    voucher.durationLabel,
    voucher.priceLabel
  ].filter(Boolean).join(" • ") || "WiFi voucher";

  doc.text(
    fitText(doc, detail, width - 5),
    x + width / 2,
    y + height - 4.6,
    { align: "center" }
  );

  if (voucher.supportContact) {
    doc.setFontSize(2.7);
    doc.text(
      fitText(doc, voucher.supportContact, width - 5),
      x + width / 2,
      y + height - 2.1,
      { align: "center" }
    );
  }
}

async function drawModernQrVoucher(
  doc: jsPDF,
  voucher: PrintableVoucher,
  x: number,
  y: number,
  width: number,
  height: number
) {
  drawBorder(doc, x, y, width, height);

  doc.setFillColor(...BRAND_DARK);
  doc.roundedRect(x, y, width, height, 1.4, 1.4, "F");

  doc.setFillColor(...BRAND_TEAL);
  doc.roundedRect(x, y, 2.6, height, 1.4, 1.4, "F");

  const qrSize = Math.min(13.2, height - 6);
  const qrDataUrl = await QRCode.toDataURL(voucher.code, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
    color: {
      dark: "#071620",
      light: "#FFFFFF"
    }
  });

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(
    x + 4,
    y + (height - qrSize - 2) / 2,
    qrSize + 2,
    qrSize + 2,
    1,
    1,
    "F"
  );

  doc.addImage(
    qrDataUrl,
    "PNG",
    x + 5,
    y + (height - qrSize) / 2,
    qrSize,
    qrSize
  );

  const contentX = x + qrSize + 8.5;
  const contentWidth = width - qrSize - 11;

  doc.setTextColor(...BRAND_TEAL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.4);
  doc.text(
    fitText(doc, voucher.hotspotName || "NobliFi WiFi", contentWidth),
    contentX,
    y + 5.2
  );

  doc.setTextColor(220, 232, 238);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.3);
  doc.text(
    fitText(doc, voucher.planName, contentWidth),
    contentX,
    y + 8
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont("courier", "bold");
  doc.setFontSize(6);
  doc.text(
    fitText(doc, voucher.code, contentWidth),
    contentX,
    y + 12.4
  );

  const detail =
    voucher.durationLabel ||
    voucher.priceLabel ||
    "WiFi access";

  doc.setTextColor(167, 190, 202);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3);
  doc.text(
    fitText(doc, detail, contentWidth),
    contentX,
    y + height - 5
  );

  if (voucher.supportContact) {
    doc.setTextColor(...BRAND_CYAN);
    doc.setFontSize(2.8);
    doc.text(
      fitText(doc, voucher.supportContact, contentWidth),
      contentX,
      y + height - 2.4
    );
  }
}

export async function downloadVoucherPdf(
  vouchers: PrintableVoucher[],
  template: VoucherPdfTemplate
) {
  if (!vouchers.length) {
    throw new Error("Select at least one voucher to download.");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const layout = layouts[template];
  const capacity = layout.cols * layout.rows;

  const cardWidth =
    (A4_WIDTH -
      layout.marginX * 2 -
      layout.gapX * (layout.cols - 1)) /
    layout.cols;

  const cardHeight =
    (A4_HEIGHT -
      layout.marginY * 2 -
      layout.gapY * (layout.rows - 1)) /
    layout.rows;

  for (
    let pageStart = 0;
    pageStart < vouchers.length;
    pageStart += capacity
  ) {
    if (pageStart > 0) {
      doc.addPage();
    }

    const pageVouchers = vouchers.slice(
      pageStart,
      pageStart + capacity
    );

    for (let index = 0; index < pageVouchers.length; index++) {
      const voucher = pageVouchers[index];
      const row = Math.floor(index / layout.cols);
      const col = index % layout.cols;

      const x =
        layout.marginX +
        col * (cardWidth + layout.gapX);

      const y =
        layout.marginY +
        row * (cardHeight + layout.gapY);

      if (template === "branded_business") {
        drawBrandedBusinessVoucher(
          doc,
          voucher,
          x,
          y,
          cardWidth,
          cardHeight
        );
      } else if (template === "classic") {
        drawClassicVoucher(
          doc,
          voucher,
          x,
          y,
          cardWidth,
          cardHeight
        );
      } else {
        await drawModernQrVoucher(
          doc,
          voucher,
          x,
          y,
          cardWidth,
          cardHeight
        );
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);

  doc.save(`noblifi-vouchers-${date}.pdf`);
}