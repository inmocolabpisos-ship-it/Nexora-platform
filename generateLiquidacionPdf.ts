import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiqRowExport {
  id: string;
  nombre_alojamiento: string;
  cliente_nombre: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  precio_total: number;
  comision_nexura: number;
  iva_comision: number;
  importe_neto: number;
  metodo_pago: string | null;
  estado: string;
  transfer_status: string | null;
  stripe_transfer_status?: string | null;
}

export interface PropietarioLiqExport {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  cuenta_bancaria: { titular?: string; iban?: string; banco?: string; swift?: string } | null;
  reservas: LiqRowExport[];
  total_bruto: number;
  total_comision: number;
  total_iva: number;
  total_neto: number;
  pendiente: number;
  transferido: number;
}

export type CategoriaExport = "propiedades" | "barcos" | "hostales" | "camping";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return d; }
}

function fmtEur(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

const categoriaLabel: Record<CategoriaExport, string> = {
  propiedades: "Propiedades",
  barcos: "Barcos & Catamaranes",
  hostales: "Hostales",
  camping: "Camping & Glamping",
};

const categoriaColor: Record<CategoriaExport, [number, number, number]> = {
  propiedades: [180, 120, 30],
  barcos:      [14, 116, 144],
  hostales:    [190, 50, 80],
  camping:     [22, 130, 80],
};

// ─── PDF individual por propietario ──────────────────────────────────────────

export function generateLiquidacionPdf(
  liq: PropietarioLiqExport,
  categoria: CategoriaExport,
  isTransferred: boolean
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const [r, g, b] = categoriaColor[categoria];
  const today = fmtDate(new Date().toISOString());
  const nowTime = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  // ── HEADER ──────────────────────────────────────────────────────────────────
  doc.setFillColor(28, 25, 23);
  doc.rect(0, 0, pageW, 26, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NEXURA", 14, 12);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma de Alojamientos Premium", 14, 18);

  // Título derecha
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("JUSTIFICANTE DE LIQUIDACIÓN", pageW - 14, 11, { align: "right" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`${categoriaLabel[categoria]} · ${today} ${nowTime}`, pageW - 14, 17, { align: "right" });

  // Banda de color categoría
  doc.setFillColor(r, g, b);
  doc.rect(0, 26, pageW, 3, "F");

  doc.setTextColor(28, 25, 23);
  let y = 38;

  // ── ESTADO BADGE ────────────────────────────────────────────────────────────
  if (isTransferred) {
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(14, y - 6, 60, 10, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text("✓  LIQUIDACIÓN COMPLETADA", 18, y);
  } else {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(14, y - 6, 60, 10, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 64, 14);
    doc.text("⏳  LIQUIDACIÓN PENDIENTE", 18, y);
  }

  // Ref documento
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 110, 100);
  const refId = `LIQ-${categoria.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  doc.text(`Ref: ${refId}`, pageW - 14, y, { align: "right" });
  doc.setTextColor(28, 25, 23);
  y += 14;

  // ── DATOS PROPIETARIO ────────────────────────────────────────────────────────
  doc.setFillColor(r, g, b);
  doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DATOS DEL PROPIETARIO / ESTABLECIMIENTO", 18, y + 4.8);
  doc.setTextColor(28, 25, 23);
  y += 11;

  const propietarioFields: [string, string][] = [
    ["Nombre / Razón social", `${liq.nombre} ${liq.apellidos}`.trim() || liq.nombre],
    ["Email de contacto", liq.email || "—"],
    ["Categoría", categoriaLabel[categoria]],
  ];
  if (liq.cuenta_bancaria?.iban) {
    propietarioFields.push(["IBAN", liq.cuenta_bancaria.iban]);
    if (liq.cuenta_bancaria.banco) propietarioFields.push(["Banco", liq.cuenta_bancaria.banco]);
    if (liq.cuenta_bancaria.titular) propietarioFields.push(["Titular cuenta", liq.cuenta_bancaria.titular]);
    if (liq.cuenta_bancaria.swift) propietarioFields.push(["SWIFT / BIC", liq.cuenta_bancaria.swift]);
  }

  autoTable(doc, {
    startY: y,
    head: [],
    body: propietarioFields,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 90, 80], cellWidth: 55 },
      1: { textColor: [28, 25, 23] },
    },
    alternateRowStyles: { fillColor: [252, 250, 248] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── RESUMEN FINANCIERO ───────────────────────────────────────────────────────
  doc.setFillColor(r, g, b);
  doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("RESUMEN FINANCIERO", 18, y + 4.8);
  doc.setTextColor(28, 25, 23);
  y += 11;

  // Caja resumen
  doc.setFillColor(245, 242, 238);
  doc.roundedRect(14, y, pageW - 28, 52, 2, 2, "F");

  const colLeft = 18;
  const colRight = pageW - 18;
  const lineH = 8;
  let fy = y + 8;

  const summaryLines: [string, string, boolean, boolean][] = [
    ["Total facturado (bruto)", fmtEur(liq.total_bruto), false, false],
    [`Comisión NEXURA (${categoria === "propiedades" ? "5%" : "15%"})`, `− ${fmtEur(liq.total_comision)}`, false, true],
    ["IVA 21% sobre comisión (mediación digital)", `− ${fmtEur(liq.total_iva)}`, false, true],
    ["─────────────────────────────────────────", "", false, false],
    ["IMPORTE NETO A TRANSFERIR", fmtEur(liq.total_neto), true, false],
    ["Ya transferido", fmtEur(liq.transferido), false, false],
    ["Pendiente de transferir", fmtEur(liq.pendiente), false, liq.pendiente > 0],
  ];

  summaryLines.forEach(([label, value, bold, highlight]) => {
    if (label.startsWith("───")) {
      doc.setDrawColor(200, 195, 190);
      doc.setLineWidth(0.3);
      doc.line(colLeft, fy - 2, colRight, fy - 2);
      fy += 2;
      return;
    }
    doc.setFontSize(bold ? 9.5 : 8.5);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    if (highlight && !bold) {
      doc.setTextColor(liq.pendiente > 0 ? 146 : 22, liq.pendiente > 0 ? 64 : 101, liq.pendiente > 0 ? 14 : 52);
    } else if (bold) {
      doc.setTextColor(28, 25, 23);
    } else {
      doc.setTextColor(80, 75, 70);
    }
    doc.text(label, colLeft, fy);
    doc.text(value, colRight, fy, { align: "right" });
    fy += lineH;
  });

  doc.setTextColor(28, 25, 23);
  y += 56;

  // ── DETALLE DE RESERVAS ──────────────────────────────────────────────────────
  if (y + 20 > doc.internal.pageSize.getHeight() - 20) {
    addFooter(doc, today);
    doc.addPage();
    addSubHeader(doc, categoria, today);
    y = 30;
  }

  doc.setFillColor(r, g, b);
  doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`DETALLE DE RESERVAS (${liq.reservas.length})`, 18, y + 4.8);
  doc.setTextColor(28, 25, 23);
  y += 11;

  const tableBody = liq.reservas.map((r, i) => {
    const isTransf = r.transfer_status === "completed" || r.stripe_transfer_status === "completed";
    const isPaid = r.metodo_pago || r.transfer_status;
    return [
      String(i + 1),
      r.nombre_alojamiento,
      r.cliente_nombre || "—",
      `${fmtDate(r.fecha_inicio)}\n→ ${fmtDate(r.fecha_fin)}`,
      r.metodo_pago || "—",
      fmtEur(r.precio_total),
      `− ${fmtEur(r.comision_nexura + r.iva_comision)}`,
      fmtEur(r.importe_neto),
      isPaid ? (isTransf ? "Transferido" : "Pendiente") : "Sin cobrar",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Alojamiento", "Cliente", "Fechas", "Pago", "Bruto", "Com.+IVA", "Neto", "Estado"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [28, 25, 23],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [252, 250, 248] },
    columnStyles: {
      0: { cellWidth: 7, halign: "center" },
      1: { cellWidth: 32 },
      2: { cellWidth: 28 },
      3: { cellWidth: 26 },
      4: { cellWidth: 18 },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 20, halign: "right", fontStyle: "bold" },
      8: { cellWidth: 18, halign: "center" },
    },
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      if (data.column.index === 8 && data.section === "body") {
        const val = String(data.cell.raw);
        if (val === "Transferido") {
          doc.setTextColor(22, 101, 52);
        } else if (val === "Pendiente") {
          doc.setTextColor(146, 64, 14);
        } else {
          doc.setTextColor(120, 110, 100);
        }
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        addSubHeader(doc, categoria, today);
      }
    },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── NOTA LEGAL ───────────────────────────────────────────────────────────────
  if (y + 30 > doc.internal.pageSize.getHeight() - 20) {
    addFooter(doc, today);
    doc.addPage();
    addSubHeader(doc, categoria, today);
    y = 30;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(200, 195, 190);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, pageW - 28, 22, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 55, 50);
  doc.text("NOTA FISCAL Y LEGAL", 18, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(90, 85, 80);
  const nota = "La comisión de mediación digital facturada por NEXURA está sujeta al IVA general del 21% (Art. 69 LIVA). El importe neto indicado corresponde al precio del alojamiento menos la comisión de NEXURA y el IVA sobre dicha comisión. El IVA del alojamiento (si aplica) es responsabilidad del propietario/establecimiento. Este documento tiene validez como justificante de liquidación entre NEXURA y el propietario.";
  const notaLines = doc.splitTextToSize(nota, pageW - 36);
  doc.text(notaLines, 18, y + 12);
  y += 28;

  // ── FIRMA ────────────────────────────────────────────────────────────────────
  if (y + 40 > doc.internal.pageSize.getHeight() - 20) {
    addFooter(doc, today);
    doc.addPage();
    addSubHeader(doc, categoria, today);
    y = 30;
  }

  const colW = (pageW - 32) / 2;
  doc.setDrawColor(200, 195, 190);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, colW, 32, 2, 2, "S");
  doc.roundedRect(14 + colW + 4, y, colW, 32, 2, 2, "S");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 90, 80);
  doc.text("Firma NEXURA (emisor)", 18, y + 6);
  doc.text(`Firma ${liq.nombre} (receptor)`, 18 + colW + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 120, 110);
  doc.text(`Fecha: ${today}`, 18, y + 28);
  doc.text(`Fecha: ${today}`, 18 + colW + 4, y + 28);
  doc.text(`Ref: ${refId}`, 18, y + 32);

  addFooter(doc, today);

  const fileName = `NEXURA_Liquidacion_${categoriaLabel[categoria].replace(/\s+/g, "_")}_${(liq.nombre + "_" + liq.apellidos).replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    .replace(/[^a-zA-Z0-9_.-]/g, "");

  doc.save(fileName);
}

// ─── PDF global de todas las categorías ──────────────────────────────────────

export function generateLiquidacionesGlobalPdf(
  dataByCategoria: Record<CategoriaExport, PropietarioLiqExport[]>
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const today = fmtDate(new Date().toISOString());
  const nowTime = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  // ── PORTADA ──────────────────────────────────────────────────────────────────
  doc.setFillColor(28, 25, 23);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NEXURA", pageW / 2, 18, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("INFORME GLOBAL DE LIQUIDACIONES", pageW / 2, 27, { align: "center" });

  doc.setFontSize(8);
  doc.text(`Generado el ${today} a las ${nowTime}`, pageW / 2, 35, { align: "center" });

  doc.setTextColor(28, 25, 23);

  // Resumen global
  const allRows = (Object.values(dataByCategoria) as PropietarioLiqExport[][]).flat();
  const globalBruto = allRows.reduce((a, l) => a + l.total_bruto, 0);
  const globalComision = allRows.reduce((a, l) => a + l.total_comision + l.total_iva, 0);
  const globalNeto = allRows.reduce((a, l) => a + l.total_neto, 0);
  const globalPendiente = allRows.reduce((a, l) => a + l.pendiente, 0);
  const globalTransferido = allRows.reduce((a, l) => a + l.transferido, 0);

  let y = 52;

  // Tarjetas resumen
  const cards = [
    { label: "Total facturado", value: fmtEur(globalBruto), color: [28, 25, 23] as [number, number, number] },
    { label: "Ingresos NEXURA", value: fmtEur(globalComision), color: [180, 120, 30] as [number, number, number] },
    { label: "Neto propietarios", value: fmtEur(globalNeto), color: [28, 25, 23] as [number, number, number] },
    { label: "Ya transferido", value: fmtEur(globalTransferido), color: [22, 130, 80] as [number, number, number] },
    { label: "Pendiente", value: fmtEur(globalPendiente), color: [146, 64, 14] as [number, number, number] },
  ];

  const cardW = (pageW - 28 - 16) / 5;
  cards.forEach((card, i) => {
    const cx = 14 + i * (cardW + 4);
    doc.setFillColor(245, 242, 238);
    doc.roundedRect(cx, y, cardW, 22, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 110, 100);
    doc.text(card.label, cx + cardW / 2, y + 7, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...card.color);
    doc.text(card.value, cx + cardW / 2, y + 17, { align: "center" });
  });

  doc.setTextColor(28, 25, 23);
  y += 32;

  // ── TABLA POR CATEGORÍA ──────────────────────────────────────────────────────
  (Object.entries(dataByCategoria) as [CategoriaExport, PropietarioLiqExport[]][]).forEach(([cat, rows]) => {
    if (rows.length === 0) return;

    if (y + 20 > doc.internal.pageSize.getHeight() - 20) {
      addLandscapeFooter(doc, today);
      doc.addPage();
      addLandscapeHeader(doc, today);
      y = 20;
    }

    const [r, g, b] = categoriaColor[cat];
    doc.setFillColor(r, g, b);
    doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${categoriaLabel[cat].toUpperCase()} — ${rows.length} propietario(s)`, 18, y + 4.8);
    doc.setTextColor(28, 25, 23);
    y += 11;

    const tableBody = rows.map((liq) => {
      const pendienteReal = liq.pendiente;
      return [
        `${liq.nombre} ${liq.apellidos}`.trim() || liq.nombre,
        liq.email || "—",
        liq.cuenta_bancaria?.iban || "Sin IBAN",
        String(liq.reservas.length),
        fmtEur(liq.total_bruto),
        fmtEur(liq.total_comision),
        fmtEur(liq.total_iva),
        fmtEur(liq.total_neto),
        fmtEur(liq.transferido),
        fmtEur(pendienteReal),
        pendienteReal > 0 ? "PENDIENTE" : "AL DÍA",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Propietario", "Email", "IBAN", "Reservas", "Bruto", "Comisión", "IVA 21%", "Neto", "Transferido", "Pendiente", "Estado"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [28, 25, 23], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: "bold", cellPadding: 2.5 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      alternateRowStyles: { fillColor: [252, 250, 248] },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 40 },
        2: { cellWidth: 42 },
        3: { cellWidth: 14, halign: "center" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 18, halign: "right" },
        7: { cellWidth: 22, halign: "right", fontStyle: "bold" },
        8: { cellWidth: 22, halign: "right" },
        9: { cellWidth: 22, halign: "right" },
        10: { cellWidth: 18, halign: "center" },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addLandscapeHeader(doc, today);
        }
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  });

  addLandscapeFooter(doc, today);

  doc.save(`NEXURA_Liquidaciones_Global_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function addFooter(doc: jsPDF, today: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 215, 210);
  doc.setLineWidth(0.3);
  doc.line(14, pageH - 14, pageW - 14, pageH - 14);
  doc.setFontSize(6.5);
  doc.setTextColor(120, 110, 100);
  doc.setFont("helvetica", "normal");
  doc.text("NEXURA · Plataforma de Alojamientos Premium · Documento confidencial de liquidación", pageW / 2, pageH - 9, { align: "center" });
  doc.text(`Generado el ${today}`, pageW / 2, pageH - 4, { align: "center" });
}

function addSubHeader(doc: jsPDF, categoria: CategoriaExport, today: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const [r, g, b] = categoriaColor[categoria];
  doc.setFillColor(28, 25, 23);
  doc.rect(0, 0, pageW, 12, "F");
  doc.setFillColor(r, g, b);
  doc.rect(0, 12, pageW, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("NEXURA — JUSTIFICANTE DE LIQUIDACIÓN", 14, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`${categoriaLabel[categoria]} · ${today}`, pageW - 14, 8, { align: "right" });
  doc.setTextColor(28, 25, 23);
}

function addLandscapeHeader(doc: jsPDF, today: string) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(28, 25, 23);
  doc.rect(0, 0, pageW, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("NEXURA — INFORME GLOBAL DE LIQUIDACIONES", 14, 7);
  doc.setFont("helvetica", "normal");
  doc.text(today, pageW - 14, 7, { align: "right" });
  doc.setTextColor(28, 25, 23);
}

function addLandscapeFooter(doc: jsPDF, today: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(6.5);
  doc.setTextColor(120, 110, 100);
  doc.text("NEXURA · Informe confidencial de liquidaciones · Uso interno", pageW / 2, pageH - 5, { align: "center" });
  doc.text(`Generado el ${today}`, pageW - 14, pageH - 5, { align: "right" });
}
