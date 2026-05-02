import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DbMember } from "@/lib/supabase";

// ─── Payment config ──────────────────────────────────────────────────────────
const PAYMENT_INFO = {
  titular: "Youssef Ait Brahim",
  revolut: "@youssefaitbrahim",
  iban: "ES94 1562 0001 1692 1498 5952",
  banco: "Revolut Bank UAB",
  swift: "REVOGB21",
  titular2: "Maria Angeles Herrera Martin",
  revolut2: "@mangelg8sg",
  nota: "Transferencia bancaria o pago con tarjeta a través de Revolut",
};

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function addPageHeader(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(28, 25, 23);
  doc.rect(0, 0, pageW, 20, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("STAYLUX", 14, 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("FICHA DE VIAJEROS — SES HOSPEDAJE (RD 933/2021)", pageW / 2, 13, { align: "center" });

  doc.setFontSize(7);
  doc.text(`Pág. ${pageNum} / ${totalPages}`, pageW - 14, 13, { align: "right" });

  doc.setTextColor(28, 25, 23);
}

function addPageFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setDrawColor(220, 215, 210);
  doc.setLineWidth(0.3);
  doc.line(14, pageH - 16, pageW - 14, pageH - 16);

  doc.setFontSize(6.5);
  doc.setTextColor(120, 110, 100);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Documento generado por StayLux · Plataforma de Alquiler Vacacional · Cumplimiento SES HOSPEDAJE (RD 933/2021) · Datos protegidos según RGPD",
    pageW / 2,
    pageH - 10,
    { align: "center" }
  );
  doc.text(
    `Generado el ${formatDate(new Date().toISOString())} a las ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`,
    pageW / 2,
    pageH - 5,
    { align: "center" }
  );
}

// ─── single member PDF ───────────────────────────────────────────────────────

export async function generateMemberPdf(member: DbMember): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  addPageHeader(doc, 1, 1);

  let y = 28;

  // ── AVISO POLICIAL ──
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, y, pageW - 28, 10, 2, 2, "F");
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, pageW - 28, 10, 2, 2, "S");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(146, 64, 14);
  doc.text("DOCUMENTO PARA COMUNICACIÓN A FUERZAS Y CUERPOS DE SEGURIDAD DEL ESTADO", pageW / 2, y + 4.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Obligación legal según RD 933/2021 · Registro de viajeros en alojamientos turísticos", pageW / 2, y + 8.5, { align: "center" });
  doc.setTextColor(28, 25, 23);
  y += 16;

  // ── Section: Datos personales ──
  doc.setFillColor(245, 242, 238);
  doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 25, 23);
  doc.text("1. DATOS PERSONALES DEL VIAJERO", 18, y + 4.8);
  y += 11;

  const personalFields: [string, string][] = [
    ["Nombre completo", `${member.nombre} ${member.apellidos}`],
    ["Nº DNI / Pasaporte / NIE", member.dni_numero || "—"],
    ["Fecha de nacimiento", formatDate(member.fecha_nacimiento)],
    ["Nacionalidad", member.nacionalidad || "—"],
    ["Email de contacto", member.email || "—"],
    ["Teléfono de contacto", member.telefono || "—"],
    ["Dirección de residencia", member.direccion || "—"],
    ["Ciudad", member.ciudad || "—"],
    ["Código postal", member.codigo_postal || "—"],
    ["País de residencia", member.pais || "España"],
    ["Fecha de registro", formatDate(member.fecha_registro)],
    ["Estado de verificación", member.estado.charAt(0).toUpperCase() + member.estado.slice(1)],
    ["Forma de pago preferida", (member as DbMember & { forma_pago?: string }).forma_pago || "—"],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: personalFields,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 } },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 90, 80], cellWidth: 60 },
      1: { textColor: [28, 25, 23] },
    },
    alternateRowStyles: { fillColor: [252, 250, 248] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Section: Información de pago ──
  if (y + 40 > doc.internal.pageSize.getHeight() - 20) {
    addPageFooter(doc);
    doc.addPage();
    addPageHeader(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
    y = 28;
  }

  doc.setFillColor(245, 242, 238);
  doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 25, 23);
  doc.text("2. INFORMACIÓN DE PAGO", 18, y + 4.8);
  y += 11;

  const paymentFields: [string, string][] = [
    ["── CUENTA PRINCIPAL ──", ""],
    ["Titular", PAYMENT_INFO.titular],
    ["Banco / Entidad", PAYMENT_INFO.banco],
    ["IBAN", PAYMENT_INFO.iban],
    ["SWIFT / BIC (internacional)", PAYMENT_INFO.swift],
    ["Revolut", PAYMENT_INFO.revolut],
    ["── CUENTA ALTERNATIVA ──", ""],
    ["Titular", PAYMENT_INFO.titular2],
    ["Revolut", PAYMENT_INFO.revolut2],
    ["── GENERAL ──", ""],
    ["Métodos aceptados", "Transferencia bancaria · Tarjeta (Revolut)"],
    ["Concepto de pago", `Alojamiento - ${member.nombre} ${member.apellidos}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: paymentFields,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 } },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 90, 80], cellWidth: 60 },
      1: { textColor: [28, 25, 23] },
    },
    alternateRowStyles: { fillColor: [252, 250, 248] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Section: Documentación fotográfica ──
  if (y + 20 > doc.internal.pageSize.getHeight() - 20) {
    addPageFooter(doc);
    doc.addPage();
    addPageHeader(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
    y = 28;
  }

  doc.setFillColor(245, 242, 238);
  doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 25, 23);
  doc.text("3. DOCUMENTACIÓN FOTOGRÁFICA DE IDENTIDAD", 18, y + 4.8);
  y += 11;

  const photoItems = [
    { label: "DNI / Pasaporte — Parte Frontal", url: member.dni_frontal },
    { label: "DNI / Pasaporte — Parte Trasera", url: member.dni_trasero },
    { label: "Selfie de verificación de identidad", url: member.selfie },
  ];

  for (const item of photoItems) {
    if (!item.url) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 140, 130);
      doc.text(`${item.label}: No disponible`, 18, y + 4);
      y += 8;
      continue;
    }

    if (y + 65 > doc.internal.pageSize.getHeight() - 20) {
      addPageFooter(doc);
      doc.addPage();
      addPageHeader(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
      y = 28;
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 90, 80);
    doc.text(item.label, 18, y + 4);
    y += 7;

    try {
      const imgData = await loadImageAsBase64(item.url);
      if (imgData) {
        const imgW = 80;
        const imgH = 52;
        doc.setDrawColor(220, 215, 210);
        doc.setLineWidth(0.3);
        doc.roundedRect(18, y, imgW, imgH, 2, 2, "S");
        doc.addImage(imgData, "JPEG", 18, y, imgW, imgH, undefined, "FAST");
        y += imgH + 8;
      }
    } catch {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 140, 130);
      doc.text(`Imagen no disponible: ${item.url}`, 18, y + 4);
      y += 8;
    }
  }

  // ── Section: Notas ──
  if (member.notas) {
    if (y + 20 > doc.internal.pageSize.getHeight() - 20) {
      addPageFooter(doc);
      doc.addPage();
      addPageHeader(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
      y = 28;
    }

    doc.setFillColor(245, 242, 238);
    doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 25, 23);
    doc.text("4. NOTAS INTERNAS", 18, y + 4.8);
    y += 11;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 55, 50);
    const lines = doc.splitTextToSize(member.notas, pageW - 32);
    doc.text(lines, 18, y + 4);
    y += lines.length * 5 + 8;
  }

  // ── Signature box ──
  if (y + 40 > doc.internal.pageSize.getHeight() - 20) {
    addPageFooter(doc);
    doc.addPage();
    addPageHeader(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
    y = 28;
  }

  y += 4;

  // Declaración
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageW - 28, 14, 2, 2, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 75, 70);
  const declaracion = "El viajero declara que los datos facilitados son verídicos y que la documentación aportada es auténtica. El establecimiento certifica haber verificado la identidad del viajero conforme a la normativa vigente (RD 933/2021).";
  const declLines = doc.splitTextToSize(declaracion, pageW - 36);
  doc.text(declLines, 18, y + 5);
  y += 18;

  const colW = (pageW - 32) / 2;
  doc.setDrawColor(200, 195, 190);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, colW, 32, 2, 2, "S");
  doc.roundedRect(14 + colW + 4, y, colW, 32, 2, 2, "S");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 110, 100);
  doc.text("Firma del viajero", 18, y + 28);
  doc.text("Firma del responsable del establecimiento", 18 + colW + 4, y + 28);

  doc.setFontSize(7);
  doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, 18, y + 5);
  doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, 18 + colW + 4, y + 5);

  addPageFooter(doc);

  const fileName = `SES_POLICIA_${member.apellidos}_${member.nombre}_${member.dni_numero || member.id}.pdf`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");

  doc.save(fileName);
}

// ─── bulk export PDF ─────────────────────────────────────────────────────────

export async function generateBulkSesPdf(members: DbMember[]): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Cover page
  doc.setFillColor(28, 25, 23);
  doc.rect(0, 0, pageW, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("STAYLUX — REGISTRO DE VIAJEROS", pageW / 2, 18, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Exportación para comunicación a Fuerzas y Cuerpos de Seguridad del Estado", pageW / 2, 26, { align: "center" });
  doc.text("Obligación legal según RD 933/2021 · SES HOSPEDAJE", pageW / 2, 32, { align: "center" });

  doc.setTextColor(28, 25, 23);
  doc.setFontSize(9);
  doc.text(`Fecha de exportación: ${formatDate(new Date().toISOString())}`, 14, 48);
  doc.text(`Total de registros: ${members.length}`, 14, 55);
  doc.text(`Verificados: ${members.filter((m) => m.estado === "verificado").length}`, 14, 62);
  doc.text(`Pendientes: ${members.filter((m) => m.estado === "pendiente").length}`, 14, 69);

  // Payment info box
  doc.setFillColor(245, 242, 238);
  doc.roundedRect(pageW / 2 + 10, 42, pageW / 2 - 24, 38, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 25, 23);
  doc.text("DATOS DE PAGO DEL ESTABLECIMIENTO", pageW / 2 + 14, 49);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 75, 70);
  doc.text(`Titular: ${PAYMENT_INFO.titular}`, pageW / 2 + 14, 56);
  doc.text(`IBAN: ${PAYMENT_INFO.iban}`, pageW / 2 + 14, 62);
  doc.text(`Banco: ${PAYMENT_INFO.banco}`, pageW / 2 + 14, 68);
  doc.text(`Revolut: ${PAYMENT_INFO.revolut} · Métodos: Transferencia y Tarjeta`, pageW / 2 + 14, 74);

  // Table
  const tableBody = members.map((m, i) => [
    String(i + 1),
    `${m.apellidos}, ${m.nombre}`,
    m.dni_numero || "—",
    formatDate(m.fecha_nacimiento),
    m.nacionalidad || "—",
    m.telefono || "—",
    m.email || "—",
    m.direccion || "—",
    m.ciudad || "—",
    formatDate(m.fecha_registro),
    m.estado.charAt(0).toUpperCase() + m.estado.slice(1),
  ]);

  autoTable(doc, {
    startY: 86,
    head: [["#", "Apellidos, Nombre", "DNI/NIE/Pasaporte", "F. Nacimiento", "Nacionalidad", "Teléfono", "Email", "Dirección", "Ciudad", "F. Registro", "Estado"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [28, 25, 23],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 7, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [252, 250, 248] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 38 },
      2: { cellWidth: 26 },
      3: { cellWidth: 22 },
      4: { cellWidth: 24 },
      5: { cellWidth: 26 },
      6: { cellWidth: 42 },
      7: { cellWidth: 38 },
      8: { cellWidth: 22 },
      9: { cellWidth: 22 },
      10: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageNum = data.pageNumber;
      doc.setFillColor(28, 25, 23);
      doc.rect(0, 0, pageW, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text("STAYLUX — REGISTRO DE VIAJEROS SES HOSPEDAJE (RD 933/2021)", 14, 7);
      doc.text(`Pág. ${pageNum}`, pageW - 14, 7, { align: "right" });
      doc.setTextColor(28, 25, 23);
    },
  });

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(6.5);
  doc.setTextColor(120, 110, 100);
  doc.text(
    "Documento generado por StayLux · Cumplimiento SES HOSPEDAJE (RD 933/2021) · Datos protegidos según RGPD",
    pageW / 2,
    pageH - 6,
    { align: "center" }
  );

  doc.save(`SES_POLICIA_Registro_Viajeros_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── booking viajeros PDF ────────────────────────────────────────────────────

export interface BookingViajeroPdf {
  id: string;
  nombre: string;
  apellidos: string;
  tipo_documento?: "dni" | "pasaporte" | "nie";
  dni_numero: string;
  fecha_nacimiento: string;
  nacionalidad: string;
  es_menor: boolean;
}

export interface BookingPdfData {
  id: string;
  propiedad_nombre: string | null;
  huesped_nombre: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  num_huespedes: number | null;
  precio_total: number | null;
  notas: string | null;
  viajeros: BookingViajeroPdf[];
}

export async function generateBookingSesPdf(booking: BookingPdfData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── HEADER ──
  doc.setFillColor(28, 25, 23);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("STAYLUX", 14, 10);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("FICHA DE VIAJEROS — SES HOSPEDAJE (RD 933/2021)", pageW / 2, 10, { align: "center" });
  doc.setFontSize(7);
  doc.text(`Generado el ${formatDate(new Date().toISOString())} a las ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`, pageW / 2, 17, { align: "center" });
  doc.setTextColor(28, 25, 23);

  let y = 30;

  // ── AVISO POLICIAL ──
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, y, pageW - 28, 14, 2, 2, "F");
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, pageW - 28, 14, 2, 2, "S");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(146, 64, 14);
  doc.text("DOCUMENTO OFICIAL PARA COMUNICACIÓN A FUERZAS Y CUERPOS DE SEGURIDAD DEL ESTADO", pageW / 2, y + 5.5, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Obligación legal según Ley Orgánica 4/2015 y Real Decreto 933/2021 · Registro de viajeros en alojamientos turísticos", pageW / 2, y + 10.5, { align: "center" });
  doc.setTextColor(28, 25, 23);
  y += 20;

  // ── DATOS DE LA RESERVA ──
  doc.setFillColor(245, 242, 238);
  doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("1. DATOS DE LA RESERVA", 18, y + 4.8);
  y += 11;

  const nights = booking.fecha_inicio && booking.fecha_fin
    ? Math.max(1, Math.round((new Date(booking.fecha_fin).getTime() - new Date(booking.fecha_inicio).getTime()) / 86400000))
    : null;

  const reservaFields: [string, string][] = [
    ["Establecimiento / Propiedad", booking.propiedad_nombre || "—"],
    ["Titular de la reserva", booking.huesped_nombre || "—"],
    ["Fecha de entrada", formatDate(booking.fecha_inicio)],
    ["Fecha de salida", formatDate(booking.fecha_fin)],
    ["Duración de la estancia", nights ? `${nights} ${nights === 1 ? "noche" : "noches"}` : "—"],
    ["Número total de viajeros", String(booking.viajeros?.length || booking.num_huespedes || "—")],
    ["Precio total de la reserva", booking.precio_total ? `${booking.precio_total.toLocaleString("es-ES")}€` : "—"],
    ["Referencia de reserva", booking.id.slice(0, 8).toUpperCase()],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: reservaFields,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 } },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 90, 80], cellWidth: 65 },
      1: { textColor: [28, 25, 23] },
    },
    alternateRowStyles: { fillColor: [252, 250, 248] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── TABLA DE VIAJEROS ──
  if (y + 20 > doc.internal.pageSize.getHeight() - 20) {
    addPageFooter(doc);
    doc.addPage();
    addPageHeader(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
    y = 28;
  }

  doc.setFillColor(245, 242, 238);
  doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 25, 23);
  doc.text(`2. REGISTRO DE VIAJEROS (${booking.viajeros?.length || 0} personas)`, 18, y + 4.8);
  y += 11;

  if (!booking.viajeros || booking.viajeros.length === 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 140, 130);
    doc.text("No se han registrado viajeros para esta reserva.", 18, y + 5);
    y += 12;
  } else {
    const viajerosBody = booking.viajeros.map((v, i) => {
      const tipoDoc = v.tipo_documento === "pasaporte" ? "Pasaporte" : v.tipo_documento === "nie" ? "NIE" : "DNI";
      return [
        String(i + 1),
        `${v.apellidos}, ${v.nombre}`,
        tipoDoc,
        v.dni_numero || (v.es_menor ? "(menor — opcional)" : "—"),
        formatDate(v.fecha_nacimiento),
        v.nacionalidad || "—",
        v.es_menor ? "Sí" : "No",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["#", "Apellidos, Nombre", "Tipo doc.", "Nº Documento", "F. Nacimiento", "Nacionalidad", "Menor"]],
      body: viajerosBody,
      theme: "striped",
      headStyles: {
        fillColor: [28, 25, 23],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: 3,
      },
      bodyStyles: { fontSize: 8, cellPadding: 2.8 },
      alternateRowStyles: { fillColor: [252, 250, 248] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 48 },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 32 },
        4: { cellWidth: 24, halign: "center" },
        5: { cellWidth: 28 },
        6: { cellWidth: 14, halign: "center" },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addPageHeader(doc, data.pageNumber, data.pageNumber);
        }
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── NOTAS ──
  if (booking.notas) {
    if (y + 20 > doc.internal.pageSize.getHeight() - 20) {
      addPageFooter(doc);
      doc.addPage();
      addPageHeader(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
      y = 28;
    }
    doc.setFillColor(245, 242, 238);
    doc.roundedRect(14, y, pageW - 28, 7, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 25, 23);
    doc.text("3. NOTAS DE LA RESERVA", 18, y + 4.8);
    y += 11;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 55, 50);
    const lines = doc.splitTextToSize(booking.notas, pageW - 32);
    doc.text(lines, 18, y + 4);
    y += lines.length * 5 + 10;
  }

  // ── DECLARACIÓN Y FIRMAS ──
  if (y + 55 > doc.internal.pageSize.getHeight() - 20) {
    addPageFooter(doc);
    doc.addPage();
    addPageHeader(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
    y = 28;
  }

  // Aviso legal
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(200, 195, 190);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, pageW - 28, 18, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 55, 50);
  doc.text("DECLARACIÓN RESPONSABLE", 18, y + 5.5);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(80, 75, 70);
  const declaracion = "El establecimiento de alojamiento certifica que los datos de los viajeros recogidos en este documento son verídicos y han sido verificados conforme a la normativa vigente. Los datos serán comunicados a las Fuerzas y Cuerpos de Seguridad del Estado en cumplimiento del Real Decreto 933/2021 y la Ley Orgánica 4/2015 de protección de la seguridad ciudadana.";
  const declLines = doc.splitTextToSize(declaracion, pageW - 36);
  doc.text(declLines, 18, y + 10);
  y += 24;

  // Firmas
  const colW = (pageW - 32) / 2;
  doc.setDrawColor(200, 195, 190);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, colW, 36, 2, 2, "S");
  doc.roundedRect(14 + colW + 4, y, colW, 36, 2, 2, "S");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 90, 80);
  doc.text("Firma del responsable del establecimiento", 18, y + 6);
  doc.text("Sello del establecimiento", 18 + colW + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 120, 110);
  doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, 18, y + 32);
  doc.text(`Ref. reserva: ${booking.id.slice(0, 8).toUpperCase()}`, 18 + colW + 4, y + 32);

  // ── FOOTER ──
  addPageFooter(doc);

  const fileName = `SES_POLICIA_Reserva_${(booking.propiedad_nombre || "Propiedad").replace(/\s+/g, "_")}_${booking.fecha_inicio}_${booking.id.slice(0, 6).toUpperCase()}.pdf`
    .replace(/[^a-zA-Z0-9_.-]/g, "");

  doc.save(fileName);
}

// ─── image loader ────────────────────────────────────────────────────────────

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
