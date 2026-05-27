import { jsPDF } from "jspdf";

interface BonItem {
  transactionCode: string;
  customerName: string;
  agencyName?: string;
  itemName: string;
  modelDescription?: string;
  modelImageUrl?: string;
  fabricSource?: "Customer" | "Store";
  fabricName?: string;
  fabricMeters?: string;
  transactionNote?: string;
  additionalCharges?: { label: string; amount: number; note?: string }[];
  sizes: { name: string; value: string }[];
}

function toDataUrlSvg(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildFallbackModelSvg(item: BonItem) {
  const safeTitle = (item.itemName || "Model").replace(/[<>&]/g, "");
  const safeDesc = (item.modelDescription || "").replace(/[<>&]/g, "").slice(0, 36);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="300" height="420" fill="url(#bg)"/>
  <rect x="18" y="18" width="264" height="384" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="150" cy="116" r="34" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>
  <path d="M90 286 L108 170 L130 156 L170 156 L192 170 L210 286" fill="#dbeafe" stroke="#60a5fa" stroke-width="3"/>
  <line x1="150" y1="200" x2="150" y2="285" stroke="#60a5fa" stroke-width="3" stroke-dasharray="5 4"/>
  <line x1="108" y1="208" x2="192" y2="208" stroke="#93c5fd" stroke-width="2"/>
  <text x="150" y="330" font-size="17" font-family="Helvetica, Arial, sans-serif" text-anchor="middle" fill="#0f172a">${safeTitle}</text>
  <text x="150" y="352" font-size="12" font-family="Helvetica, Arial, sans-serif" text-anchor="middle" fill="#475569">${safeDesc || "Auto model preview"}</text>
</svg>`;
}

async function imageUrlToDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function resolveModelImageDataUrl(item: BonItem): Promise<string> {
  if (item.modelImageUrl?.startsWith("data:image/")) {
    return item.modelImageUrl;
  }

  if (item.modelImageUrl) {
    const fetched = await imageUrlToDataUrl(item.modelImageUrl);
    if (fetched) return fetched;
  }

  return toDataUrlSvg(buildFallbackModelSvg(item));
}

/**
 * Generate a bon/ticket PDF (10cm x 15cm) for a single transaction item.
 * Layout: header with transaction code + customer, sizes listed vertically, notes at bottom.
 */
export async function generateBonPDF(item: BonItem) {
  // 10cm x 15cm in mm = 100 x 150
  const doc = new jsPDF({ unit: "mm", format: [100, 150] });

  const margin = 5;
  const pageW = 100;
  let y = margin;

  // Header
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(item.transactionCode, margin, y + 3);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("id-ID"), pageW - margin, y + 3, { align: "right" });

  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(item.customerName, margin, y + 3);
  y += 5;

  if (item.agencyName) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Agency: ${item.agencyName}`, margin, y + 3);
    y += 5;
  }

  // Divider
  y += 2;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  // Item name
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(item.itemName, margin, y + 3);
  y += 7;

  // Sizes + model image area
  const sizesColumnWidth = 50;
  const modelGap = 3;
  const modelBoxX = margin + sizesColumnWidth + modelGap;
  const modelBoxW = pageW - margin - modelBoxX;
  const modelBoxY = y;
  const modelBoxH = 48;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("UKURAN", margin, y + 3);
  doc.text("MODEL", modelBoxX, y + 3);
  y += 5;

  const modelImageDataUrl = await resolveModelImageDataUrl(item);
  try {
    const imageType = modelImageDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    (doc as any).addImage(modelImageDataUrl, imageType, modelBoxX, modelBoxY + 2, modelBoxW, modelBoxH);
  } catch {
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Preview gagal dimuat", modelBoxX + 2, modelBoxY + 8);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  item.sizes.forEach((size) => {
    if (y < 135) {
      doc.text(`${size.name}:`, margin, y + 3);
      doc.text(size.value || "___", margin + 28, y + 3);
      y += 4.5;
    }
  });

  y = Math.max(y, modelBoxY + modelBoxH + 2);

  // Bottom section - execution context for worker
  y += 3;
  if (y > 135) y = 135;

  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  if (item.modelDescription) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    const lines = doc.splitTextToSize(`Catatan: ${item.modelDescription}`, pageW - margin * 2);
    doc.text(lines.slice(0, 3), margin, y + 3);
    y += Math.min(lines.length, 3) * 3.2 + 1;
  }

  const fabricSourceLabel = item.fabricSource === "Customer" ? "Kain pelanggan" : item.fabricSource === "Store" ? "Kain toko" : undefined;
  if (fabricSourceLabel && y < 145) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const fabricDetail = item.fabricName
      ? `${fabricSourceLabel} - ${item.fabricName}${item.fabricMeters ? ` (${item.fabricMeters} m)` : ""}`
      : fabricSourceLabel;
    const lines = doc.splitTextToSize(fabricDetail, pageW - margin * 2);
    doc.text(lines.slice(0, 2), margin, y + 3);
    y += Math.min(lines.length, 2) * 3.2 + 1;
  }

  if (item.additionalCharges && item.additionalCharges.length > 0 && y < 145) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const firstCharge = item.additionalCharges[0];
    const chargeText = `Tambahan: ${firstCharge.label}${firstCharge.note ? ` (${firstCharge.note})` : ""}`;
    const lines = doc.splitTextToSize(chargeText, pageW - margin * 2);
    doc.text(lines.slice(0, 2), margin, y + 3);
    y += Math.min(lines.length, 2) * 3.2 + 1;
  }

  if (item.transactionNote && y < 145) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    const lines = doc.splitTextToSize(`Note order: ${item.transactionNote}`, pageW - margin * 2);
    doc.text(lines.slice(0, 2), margin, y + 3);
  }

  return doc;
}

export async function printBon(item: BonItem) {
  const doc = await generateBonPDF(item);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      win.print();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
  }
}
