import type { PropietarioLiqExport, CategoriaExport } from "./generateLiquidacionPdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("es-ES"); } catch { return d; }
}

function fmtEur(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const categoriaLabel: Record<CategoriaExport, string> = {
  propiedades: "Propiedades",
  barcos: "Barcos & Catamaranes",
  hostales: "Hostales",
  camping: "Camping & Glamping",
};

// ─── CSV builder ──────────────────────────────────────────────────────────────

function escapeCsv(val: string | number | null | undefined): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCsv).join(";");
}

// ─── Export individual propietario CSV ────────────────────────────────────────

export function exportLiquidacionCsv(
  liq: PropietarioLiqExport,
  categoria: CategoriaExport
): void {
  const today = fmtDate(new Date().toISOString());
  const lines: string[] = [];

  // Cabecera del documento
  lines.push(buildRow(["NEXURA — JUSTIFICANTE DE LIQUIDACIÓN"]));
  lines.push(buildRow([`Categoría: ${categoriaLabel[categoria]}`]));
  lines.push(buildRow([`Fecha de generación: ${today}`]));
  lines.push("");

  // Datos propietario
  lines.push(buildRow(["DATOS DEL PROPIETARIO"]));
  lines.push(buildRow(["Nombre", `${liq.nombre} ${liq.apellidos}`.trim()]));
  lines.push(buildRow(["Email", liq.email || "—"]));
  if (liq.cuenta_bancaria?.iban) {
    lines.push(buildRow(["IBAN", liq.cuenta_bancaria.iban]));
    if (liq.cuenta_bancaria.banco) lines.push(buildRow(["Banco", liq.cuenta_bancaria.banco]));
    if (liq.cuenta_bancaria.titular) lines.push(buildRow(["Titular", liq.cuenta_bancaria.titular]));
    if (liq.cuenta_bancaria.swift) lines.push(buildRow(["SWIFT", liq.cuenta_bancaria.swift]));
  }
  lines.push("");

  // Resumen financiero
  lines.push(buildRow(["RESUMEN FINANCIERO"]));
  lines.push(buildRow(["Concepto", "Importe (€)"]));
  lines.push(buildRow(["Total facturado (bruto)", fmtEur(liq.total_bruto)]));
  lines.push(buildRow([`Comisión NEXURA (${categoria === "propiedades" ? "5%" : "15%"})`, `- ${fmtEur(liq.total_comision)}`]));
  lines.push(buildRow(["IVA 21% sobre comisión", `- ${fmtEur(liq.total_iva)}`]));
  lines.push(buildRow(["IMPORTE NETO A TRANSFERIR", fmtEur(liq.total_neto)]));
  lines.push(buildRow(["Ya transferido", fmtEur(liq.transferido)]));
  lines.push(buildRow(["Pendiente de transferir", fmtEur(liq.pendiente)]));
  lines.push("");

  // Detalle reservas
  lines.push(buildRow(["DETALLE DE RESERVAS"]));
  lines.push(buildRow([
    "Nº", "Alojamiento", "Cliente", "Fecha entrada", "Fecha salida",
    "Método pago", "Bruto (€)", "Comisión+IVA (€)", "Neto (€)", "Estado transferencia"
  ]));

  liq.reservas.forEach((r, i) => {
    const isTransf = r.transfer_status === "completed" || r.stripe_transfer_status === "completed";
    const isPaid = r.metodo_pago || r.transfer_status;
    lines.push(buildRow([
      i + 1,
      r.nombre_alojamiento,
      r.cliente_nombre || "—",
      fmtDate(r.fecha_inicio),
      fmtDate(r.fecha_fin),
      r.metodo_pago || "—",
      fmtEur(r.precio_total),
      fmtEur(r.comision_nexura + r.iva_comision),
      fmtEur(r.importe_neto),
      isPaid ? (isTransf ? "Transferido" : "Pendiente") : "Sin cobrar",
    ]));
  });

  lines.push("");
  lines.push(buildRow(["Documento generado por NEXURA · Uso confidencial"]));

  downloadCsv(
    lines.join("\n"),
    `NEXURA_Liquidacion_${categoriaLabel[categoria].replace(/\s+/g, "_")}_${(liq.nombre + "_" + liq.apellidos).replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
  );
}

// ─── Export global todas las categorías CSV ───────────────────────────────────

export function exportLiquidacionesGlobalCsv(
  dataByCategoria: Record<CategoriaExport, PropietarioLiqExport[]>
): void {
  const today = fmtDate(new Date().toISOString());
  const lines: string[] = [];

  lines.push(buildRow(["NEXURA — INFORME GLOBAL DE LIQUIDACIONES"]));
  lines.push(buildRow([`Fecha: ${today}`]));
  lines.push("");

  // Resumen global
  const allRows = (Object.values(dataByCategoria) as PropietarioLiqExport[][]).flat();
  const globalBruto = allRows.reduce((a, l) => a + l.total_bruto, 0);
  const globalComision = allRows.reduce((a, l) => a + l.total_comision + l.total_iva, 0);
  const globalNeto = allRows.reduce((a, l) => a + l.total_neto, 0);
  const globalPendiente = allRows.reduce((a, l) => a + l.pendiente, 0);
  const globalTransferido = allRows.reduce((a, l) => a + l.transferido, 0);

  lines.push(buildRow(["RESUMEN GLOBAL"]));
  lines.push(buildRow(["Total facturado", fmtEur(globalBruto)]));
  lines.push(buildRow(["Ingresos NEXURA (comisión+IVA)", fmtEur(globalComision)]));
  lines.push(buildRow(["Neto propietarios", fmtEur(globalNeto)]));
  lines.push(buildRow(["Ya transferido", fmtEur(globalTransferido)]));
  lines.push(buildRow(["Pendiente de transferir", fmtEur(globalPendiente)]));
  lines.push("");

  // Por categoría
  (Object.entries(dataByCategoria) as [CategoriaExport, PropietarioLiqExport[]][]).forEach(([cat, rows]) => {
    if (rows.length === 0) return;

    lines.push(buildRow([`=== ${categoriaLabel[cat].toUpperCase()} ===`]));
    lines.push(buildRow([
      "Propietario", "Email", "IBAN", "Reservas",
      "Bruto (€)", "Comisión (€)", "IVA 21% (€)", "Neto (€)",
      "Transferido (€)", "Pendiente (€)", "Estado"
    ]));

    rows.forEach((liq) => {
      lines.push(buildRow([
        `${liq.nombre} ${liq.apellidos}`.trim() || liq.nombre,
        liq.email || "—",
        liq.cuenta_bancaria?.iban || "Sin IBAN",
        liq.reservas.length,
        fmtEur(liq.total_bruto),
        fmtEur(liq.total_comision),
        fmtEur(liq.total_iva),
        fmtEur(liq.total_neto),
        fmtEur(liq.transferido),
        fmtEur(liq.pendiente),
        liq.pendiente > 0 ? "PENDIENTE" : "AL DÍA",
      ]));
    });

    lines.push("");
  });

  lines.push(buildRow(["Documento generado por NEXURA · Uso confidencial"]));

  downloadCsv(
    lines.join("\n"),
    `NEXURA_Liquidaciones_Global_${new Date().toISOString().split("T")[0]}.csv`
  );
}

// ─── Download helper ──────────────────────────────────────────────────────────

function downloadCsv(content: string, filename: string): void {
  // BOM para que Excel abra correctamente con caracteres especiales
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
