import jsPDF from "jspdf";

// ============================================================
// INVOICE CONFIG - Customize these variables for your shop
// ============================================================
const SHOP_CONFIG = {
  name: "CV. Dunia Busana Tailor",
  tagline: "Menerima Jahitan Pria & Wanita",
  address: "Jl. KIS. Mangunsarkoro No.31, Jati Baru Kota Padang",
  phone: "0813-6313-4646",
  whatsapp: "0813-6313-4646",
  footer: "Terima kasih atas kepercayaan Anda!",
  footerNote: "Simpan nota ini sebagai bukti pengambilan.",
};

type ItemCharge = {
  label: string;
  amount: number;
};

type TransactionItem = {
  itemName: string;
  sewingPrice: number;
  fabricPrice?: number;
  modelDescription?: string;
  fabricSource: string;
  fabricName?: string;
  charges?: ItemCharge[];
};

type InvoiceData = {
  transactionCode: string;
  customerName: string;
  customerPhone?: string;
  transactionDate: string;
  completionDate?: string;
  items: TransactionItem[];
  totalAmount: number;
  downPayment?: number;
  remainingAmount: number;
  note?: string;
};

// export function generateInvoicePDF(data: InvoiceData) {
//   // Use 80mm receipt width (approx 226 points)
//   const pageWidth = 80;
//   const doc = new jsPDF({ unit: "mm", format: [pageWidth, 200] });
//   const margin = 4;
//   const contentWidth = pageWidth - margin * 2;
//   let y = 8;

//   // Helper functions
//   const drawLine = () => {
//     doc.setDrawColor(0);
//     doc.setLineWidth(0.2);
//     doc.line(margin, y, pageWidth - margin, y);
//     y += 3;
//   };

//   const drawDashedLine = () => {
//     doc.setDrawColor(150);
//     doc.setLineWidth(0.1);
//     for (let x = margin; x < pageWidth - margin; x += 2) {
//       doc.line(x, y, x + 1, y);
//     }
//     y += 3;
//   };

//   const textRight = (text: string, yPos: number) => {
//     doc.text(text, pageWidth - margin, yPos, { align: "right" });
//   };

//   const textCenter = (text: string, yPos: number) => {
//     doc.text(text, pageWidth / 2, yPos, { align: "center" });
//   };

//   // ===================== HEADER =====================
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(12);
//   textCenter(SHOP_CONFIG.name, y);
//   y += 4;

//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(7);
//   textCenter(SHOP_CONFIG.tagline, y);
//   y += 3;
//   textCenter(SHOP_CONFIG.address, y);
//   y += 3;
//   textCenter(`Telp: ${SHOP_CONFIG.phone}`, y);
//   y += 4;

//   drawLine();

//   // ===================== TRANSACTION INFO =====================
//   doc.setFontSize(7);
//   doc.setFont("helvetica", "normal");
//   doc.text(`No: ${data.transactionCode}`, margin, y);
//   textRight(data.transactionDate, y);
//   y += 3.5;
//   doc.text(`Pelanggan: ${data.customerName}`, margin, y);
//   y += 3.5;
//   if (data.customerPhone) {
//     doc.text(`Telp: ${data.customerPhone}`, margin, y);
//     y += 3.5;
//   }
//   if (data.completionDate) {
//     doc.text(`Est. Selesai: ${data.completionDate}`, margin, y);
//     y += 3.5;
//   }

//   drawDashedLine();

//   // ===================== ITEMS =====================
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(7);
//   doc.text("ITEM", margin, y);
//   textRight("HARGA", y);
//   y += 3;
//   drawDashedLine();

//   doc.setFont("helvetica", "normal");
//   let subtotalJahit = 0;
//   let subtotalKain = 0;
//   let subtotalCharges = 0;

//   data.items.forEach((item, idx) => {
//     // Check if page needs extending
//     if (y > 185) {
//       doc.addPage([pageWidth, 200]);
//       y = 8;
//     }

//     // Item name
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(7);
//     doc.text(`${idx + 1}. ${item.itemName}`, margin, y);
//     y += 3.5;

//     // Sewing price
//     doc.setFont("helvetica", "normal");
//     doc.text("   Jahit", margin, y);
//     textRight(`Rp ${item.sewingPrice.toLocaleString("id-ID")}`, y);
//     subtotalJahit += item.sewingPrice;
//     y += 3;

//     // Fabric price
//     if (item.fabricPrice && item.fabricPrice > 0) {
//       const fabricLabel = item.fabricName ? `   Kain: ${item.fabricName}` : "   Kain";
//       doc.text(fabricLabel, margin, y);
//       textRight(`Rp ${item.fabricPrice.toLocaleString("id-ID")}`, y);
//       subtotalKain += item.fabricPrice;
//       y += 3;
//     } else if (item.fabricSource === "Customer") {
//       doc.setFontSize(6);
//       doc.setTextColor(100);
//       doc.text("   (Kain sendiri)", margin, y);
//       doc.setTextColor(0);
//       doc.setFontSize(7);
//       y += 3;
//     }

//     // Charges
//     if (item.charges && item.charges.length > 0) {
//       item.charges.forEach((charge) => {
//         doc.text(`   + ${charge.label}`, margin, y);
//         textRight(`Rp ${charge.amount.toLocaleString("id-ID")}`, y);
//         subtotalCharges += charge.amount;
//         y += 3;
//       });
//     }

//     // Model description
//     if (item.modelDescription) {
//       doc.setFontSize(6);
//       doc.setTextColor(80);
//       const lines = doc.splitTextToSize(`   ${item.modelDescription}`, contentWidth - 5);
//       doc.text(lines, margin, y);
//       y += lines.length * 2.5;
//       doc.setTextColor(0);
//       doc.setFontSize(7);
//     }

//     y += 1;
//   });

//   drawDashedLine();

//   // ===================== TOTALS =====================
//   doc.setFontSize(7);
//   doc.setFont("helvetica", "normal");

//   if (subtotalJahit > 0) {
//     doc.text("Subtotal Jahit", margin, y);
//     textRight(`Rp ${subtotalJahit.toLocaleString("id-ID")}`, y);
//     y += 3.5;
//   }

//   if (subtotalKain > 0) {
//     doc.text("Subtotal Kain", margin, y);
//     textRight(`Rp ${subtotalKain.toLocaleString("id-ID")}`, y);
//     y += 3.5;
//   }

//   if (subtotalCharges > 0) {
//     doc.text("Biaya Tambahan", margin, y);
//     textRight(`Rp ${subtotalCharges.toLocaleString("id-ID")}`, y);
//     y += 3.5;
//   }

//   drawLine();

//   // Grand Total
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(9);
//   doc.text("TOTAL", margin, y);
//   textRight(`Rp ${data.totalAmount.toLocaleString("id-ID")}`, y);
//   y += 4;

//   // Payment info
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(7);
//   if (data.downPayment && data.downPayment > 0) {
//     doc.text("Dibayar (DP)", margin, y);
//     textRight(`Rp ${data.downPayment.toLocaleString("id-ID")}`, y);
//     y += 3.5;

//     doc.setFont("helvetica", "bold");
//     doc.text("SISA", margin, y);
//     textRight(`Rp ${data.remainingAmount.toLocaleString("id-ID")}`, y);
//     y += 4;
//   }

//   drawDashedLine();

//   // ===================== NOTES =====================
//   if (data.note) {
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(6);
//     doc.text("Catatan:", margin, y);
//     y += 2.5;
//     const noteLines = doc.splitTextToSize(data.note, contentWidth);
//     doc.text(noteLines, margin, y);
//     y += noteLines.length * 2.5 + 2;
//     drawDashedLine();
//   }

//   // ===================== FOOTER =====================
//   doc.setFont("helvetica", "italic");
//   doc.setFontSize(6);
//   doc.setTextColor(80);
//   textCenter(SHOP_CONFIG.footer, y);
//   y += 3;
//   textCenter(SHOP_CONFIG.footerNote, y);
//   y += 3;
//   doc.setTextColor(0);

//   return doc;
// }
export function generateInvoicePDF(data: InvoiceData) {
  const pageWidth =72; // 80mm width standard
  const margin = 2;
  const contentWidth = pageWidth - margin * 2;
  const priceColumnWidth = 28;
  const leftColumnWidth = contentWidth - priceColumnWidth;

  // ===================== 1. DYNAMIC HEIGHT CALCULATION =====================
  // Estimate height dynamically (in mm) based on the size of elements
  let estimatedHeight = 6; // Starting top padding

  // Header blocks
  estimatedHeight +=  4 + 3 + 3 + 3 + 3; // Titles, subtitles, lines
  
  // Transaction Metadata
  estimatedHeight += 3.5 + 3.5;
  if (data.customerPhone) estimatedHeight += 3.5;
  if (data.completionDate) estimatedHeight += 3.5;
  estimatedHeight += 3 + 3; // Dividers and section labels

  // Calculation for variable rows
  data.items.forEach((item) => {
    estimatedHeight += 3.5; // Title row
    estimatedHeight += 3;   // Standard base line item (Jahit)
    
    if (item.fabricPrice && item.fabricPrice > 0) estimatedHeight += 3;
    else if (item.fabricSource === "Customer") estimatedHeight += 3;
    
    if (item.charges && item.charges.length > 0) {
      estimatedHeight += item.charges.length * 3;
    }
    
    if (item.modelDescription) {
      // Create a temporary doc block to test how many line breaks are produced
      const docTemp = new jsPDF({ unit: "mm" });
      docTemp.setFontSize(6);
      const lines = docTemp.splitTextToSize(item.modelDescription, contentWidth - 5);
      estimatedHeight += lines.length * 2.5;
    }
    estimatedHeight += 1; // Row divider buffer padding
  });

  estimatedHeight += 3; // Section divider lines

  // Pricing Blocks & Invoicing Rules
  let trackingSubtotals = 0;
  if (data.items.some(i => i.sewingPrice > 0)) trackingSubtotals += 3.5;
  if (data.items.some(i => i.fabricPrice && i.fabricPrice > 0)) trackingSubtotals += 3.5;
  if (data.items.some(i => i.charges && i.charges.length > 0)) trackingSubtotals += 3.5;
  estimatedHeight += trackingSubtotals + 3; // Totals and lines
  
  estimatedHeight += 4; // Grand Total text line
  if (data.downPayment && data.downPayment > 0) {
    estimatedHeight += 3.5 + 4; // Down payment and remaining balance lines
  }
  estimatedHeight += 3; // Section line

  // Custom Note Blocks
  if (data.note) {
    const docTemp = new jsPDF({ unit: "mm" });
    docTemp.setFontSize(6);
    const noteLines = docTemp.splitTextToSize(data.note, contentWidth);
    estimatedHeight += 2.5 + (noteLines.length * 2.5) + 2 + 3;
  }

  // Footer labels
  estimatedHeight += 3 + 3 + 10; // Included extra 10mm feed tail for clean cutter pathing

  // Map to printer-supported lengths to avoid very long custom paper in print dialog.
  const pageHeight = Math.ceil(estimatedHeight);

  // ===================== 2. INSTANTIATION WITH THE EXACT HEIGHT =====================
  const doc = new jsPDF({ unit: "mm", format: [pageWidth, pageHeight] });
  let y = 8;

  // Helper functions
  const drawLine = () => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;
  };

  const drawDashedLine = () => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    for (let x = margin; x < pageWidth - margin; x += 2) {
      doc.line(x, y, x + 1, y);
    }
    y += 3;
  };

  const textRight = (text: string, yPos: number) => {
    doc.setFontSize(7);
    doc.text(text, pageWidth - margin, yPos, { align: "right" });
    doc.setFontSize(7);
  };

  const fitText = (text: string, maxWidth: number) => {
    if (doc.getTextWidth(text) <= maxWidth) return text;
    const ellipsis = "...";
    let trimmed = text;
    while (trimmed.length > 0 && doc.getTextWidth(`${trimmed}${ellipsis}`) > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed.length > 0 ? `${trimmed}${ellipsis}` : ellipsis;
  };

  const textCenter = (text: string, yPos: number) => {
    doc.text(text, pageWidth / 2, yPos, { align: "center" });
  };

  // ===================== RENDER HEADER =====================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  textCenter(SHOP_CONFIG.name, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  textCenter(SHOP_CONFIG.tagline, y);
  y += 3;
  textCenter(SHOP_CONFIG.address, y);
  y += 3;
  textCenter(`Telp: ${SHOP_CONFIG.phone}`, y);
  y += 4;

  drawLine();

  // ===================== TRANSACTION METADATA =====================
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(fitText(`No: ${data.transactionCode}`, leftColumnWidth), margin, y);
  doc.setFontSize(6.5); // ← kecilkan font tanggal
  textRight(data.transactionDate, y);
  doc.setFontSize(7);
  y += 3.5;
  doc.text(fitText(`Pelanggan: ${data.customerName}`, contentWidth), margin, y);
  y += 3.5;
  if (data.customerPhone) {
    doc.text(fitText(`Telp: ${data.customerPhone}`, contentWidth), margin, y);
    y += 3.5;
  }
  if (data.completionDate) {
    doc.text(fitText(`Est. Selesai: ${data.completionDate}`, contentWidth), margin, y);
    y += 3.5;
  }

  drawDashedLine();

  // ===================== ITEM BREAKDOWN SECTION =====================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("ITEM", margin, y);
  textRight("HARGA", y);
  y += 3;
  drawDashedLine();

  doc.setFont("helvetica", "normal");
  let subtotalJahit = 0;
  const subtotalKain = 0;
  let subtotalCharges = 0;

  data.items.forEach((item) => {
    // Item name header line
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(fitText(`${item.itemName}`, contentWidth), margin, y);
    y += 3.5;

    // Sewing base price execution
    // doc.setFont("helvetica", "normal");
    // doc.setFontSize(7);
    // doc.text(fitText("   Upah", leftColumnWidth), margin, y);
    // textRight(`Rp ${item.sewingPrice.toLocaleString("id-ID")}`, y);
    // subtotalJahit += item.sewingPrice;
    // y += 3;

    // Fabric processing
    if (item.fabricPrice && item.fabricPrice > 0) {
      const fabricLabel = item.fabricName ? `   Kain: ${item.fabricName}` : "   Kain";
      const totalPrice = item.sewingPrice + item.fabricPrice;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(fitText("Upah & Bahan ", leftColumnWidth), margin, y);
      textRight(`Rp ${totalPrice.toLocaleString("id-ID")}`, y);
      subtotalJahit += item.sewingPrice;
      y += 3;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(fitText(fabricLabel, leftColumnWidth), margin, y);
      y += 3;
      // doc.setFontSize(7);
      // doc.text(fitText(fabricLabel, leftColumnWidth), margin, y);
      // textRight(`Rp ${item.fabricPrice.toLocaleString("id-ID")}`, y);
      // subtotalKain += item.fabricPrice;
      // y += 3;
    } else if (item.fabricSource === "Customer") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(fitText("   Upah", leftColumnWidth), margin, y);
      textRight(`Rp ${item.sewingPrice.toLocaleString("id-ID")}`, y);
      subtotalJahit += item.sewingPrice;
      y += 3;
    }

    // Custom accessories/charges looping loops
    if (item.charges && item.charges.length > 0) {
      item.charges.forEach((charge) => {
        doc.setFontSize(7);
        doc.text(fitText(`   + ${charge.label}`, leftColumnWidth), margin, y);
        textRight(`Rp ${charge.amount.toLocaleString("id-ID")}`, y);
        subtotalCharges += charge.amount;
        y += 3;
      });
    }

    // Dynamic model description rendering
    if (item.modelDescription) {
      doc.setFontSize(7);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(`   ${item.modelDescription}`, contentWidth - 5);
      doc.text(lines, margin, y);
      y += lines.length * 2.5;
      doc.setTextColor(0);
      doc.setFontSize(7);
    }

    y += 1;
  });

  drawDashedLine();

  // ===================== PRICING CALCULATION BALANCES =====================
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  if (subtotalJahit > 0) {
    doc.text("Subtotal Jahit", margin, y);
    textRight(`Rp ${subtotalJahit.toLocaleString("id-ID")}`, y);
    y += 3.5;
  }

  if (subtotalKain > 0) {
    doc.text("Subtotal Kain", margin, y);
    textRight(`Rp ${subtotalKain.toLocaleString("id-ID")}`, y);
    y += 3.5;
  }

  if (subtotalCharges > 0) {
    doc.text("Biaya Tambahan", margin, y);
    textRight(`Rp ${subtotalCharges.toLocaleString("id-ID")}`, y);
    y += 3.5;
  }

  drawLine();

  // Grand Total Line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL", margin, y);
  textRight(`Rp ${data.totalAmount.toLocaleString("id-ID")}`, y);
  y += 4;

  // Split calculations if a Downpayment exists
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  if (data.downPayment && data.downPayment > 0) {
    doc.text("Dibayar (DP)", margin, y);
    textRight(`Rp ${data.downPayment.toLocaleString("id-ID")}`, y);
    y += 3.5;

    doc.setFont("helvetica", "bold");
    doc.text("SISA", margin, y);
    textRight(`Rp ${data.remainingAmount.toLocaleString("id-ID")}`, y);
    y += 4;
  }

  drawDashedLine();

  // ===================== OPTIONAL CUSTOM DATA NOTE BLOCKS =====================
  if (data.note) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Catatan:", margin, y);
    y += 2.5;
    const noteLines = doc.splitTextToSize(data.note, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 2.5 + 2;
    drawDashedLine();
  }

  // ===================== FOOTER =====================
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(0);
  textCenter(SHOP_CONFIG.footer, y);
  y += 3;
  textCenter(SHOP_CONFIG.footerNote, y);
  y += 3;
  doc.setTextColor(0);

  return doc;
}

export function generateWhatsAppMessage(data: InvoiceData): string {
  let message = `*${SHOP_CONFIG.name}*\n`;
  message += `${SHOP_CONFIG.address}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `*NOTA JAHITAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `No: ${data.transactionCode}\n`;
  message += `Tgl: ${data.transactionDate}\n`;
  message += `Pelanggan: ${data.customerName}\n`;
  if (data.completionDate) {
    message += `Est. Selesai: ${data.completionDate}\n`;
  }
  message += `\n*Detail Pesanan:*\n`;

  data.items.forEach((item, index) => {
    message += `\n${index + 1}. *${item.itemName}*\n`;
    message += `   Jahit: Rp ${item.sewingPrice.toLocaleString("id-ID")}\n`;
    if (item.fabricPrice && item.fabricPrice > 0) {
      message += `   Kain${item.fabricName ? ` (${item.fabricName})` : ""}: Rp ${item.fabricPrice.toLocaleString("id-ID")}\n`;
    } else if (item.fabricSource === "Customer") {
      message += `   Kain: Sendiri\n`;
    }
    if (item.charges && item.charges.length > 0) {
      item.charges.forEach((c) => {
        message += `   + ${c.label}: Rp ${c.amount.toLocaleString("id-ID")}\n`;
      });
    }
    if (item.modelDescription) {
      message += `   _${item.modelDescription}_\n`;
    }
  });

  message += `\n━━━━━━━━━━━━━━━━━━\n`;
  message += `*TOTAL: Rp ${data.totalAmount.toLocaleString("id-ID")}*\n`;

  if (data.downPayment && data.downPayment > 0) {
    message += `Dibayar: Rp ${data.downPayment.toLocaleString("id-ID")}\n`;
    message += `*Sisa: Rp ${data.remainingAmount.toLocaleString("id-ID")}*\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━\n`;

  if (data.note) {
    message += `\n_Catatan: ${data.note}_\n`;
  }

  message += `\n${SHOP_CONFIG.footer}\n`;
  message += `${SHOP_CONFIG.footerNote}`;

  return message;
}

export function downloadPDF(doc: jsPDF, _filename: string) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked while opening PDF preview");
  }

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
}

export function sendWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const intlPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
  const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
