import { jsPDF } from "jspdf";

interface BonItem {
  transactionCode: string;
  customerName: string;
  agencyName?: string;
  itemName: string;
  modelDescription?: string;
  fabricSource?: "Customer" | "Store";
  fabricName?: string;
  fabricMeters?: string;
  transactionNote?: string;
  additionalCharges?: { label: string; amount: number; note?: string }[];
  sizes: { name: string; value: string }[];
}

/**
 * Generate a bon/ticket PDF (10cm x 15cm) for a single transaction item.
 * Layout: header with transaction code + customer, sizes listed vertically, notes at bottom.
 */
export function generateBonPDF(item: BonItem) {
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

  // Sizes - vertical list (full width)
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("UKURAN", margin, y + 3);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  item.sizes.forEach((size) => {
    if (y < 135) {
      doc.text(`${size.name}:`, margin, y + 3);
      doc.text(size.value || "___", margin + 35, y + 3);
      y += 4.5;
    }
  });

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

export function printBon(item: BonItem) {
  const doc = generateBonPDF(item);
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
