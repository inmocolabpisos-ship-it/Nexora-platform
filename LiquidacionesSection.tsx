import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { generateLiquidacionPdf, generateLiquidacionesGlobalPdf } from "@/lib/generateLiquidacionPdf";
import { exportLiquidacionCsv, exportLiquidacionesGlobalCsv } from "@/lib/exportLiquidacionExcel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Categoria = "propiedades" | "barcos" | "hostales" | "camping";

interface LiqRow {
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
  categoria: Categoria;
  // propiedades only
  stripe_payment_status?: string | null;
  stripe_transfer_status?: string | null;
}

interface PropietarioLiq {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  cuenta_bancaria: { titular?: string; iban?: string; banco?: string; swift?: string } | null;
  reservas: LiqRow[];
  total_bruto: number;
  total_comision: number;
  total_iva: number;
  total_neto: number;
  pendiente: number;
  transferido: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const categoriaConfig: Record<Categoria, { label: string; icon: string; color: string; bg: string; accent: string }> = {
  propiedades: { label: "Propiedades",  icon: "ri-home-4-line",     color: "text-amber-700",   bg: "bg-amber-50",   accent: "bg-amber-500" },
  barcos:      { label: "Barcos",       icon: "ri-ship-line",       color: "text-sky-700",     bg: "bg-sky-50",     accent: "bg-sky-500" },
  hostales:    { label: "Hostales",     icon: "ri-building-2-line", color: "text-rose-700",    bg: "bg-rose-50",    accent: "bg-rose-500" },
  camping:     { label: "Camping",      icon: "ri-tent-line",       color: "text-emerald-700", bg: "bg-emerald-50", accent: "bg-emerald-500" },
};

// ─── Generic liquidation list ─────────────────────────────────────────────────

function LiquidacionList({
  rows,
  onMarkTransfer,
  onMarkAllTransfer,
  markingId,
  categoria,
}: {
  rows: PropietarioLiq[];
  onMarkTransfer: (rowId: string, cat: Categoria) => void;
  onMarkAllTransfer: (propId: string, cat: Categoria) => void;
  markingId: string | null;
  categoria: Categoria;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const cfg = categoriaConfig[categoria];

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-stone-100">
        <div className={`w-14 h-14 flex items-center justify-center rounded-full ${cfg.bg} ${cfg.color} mx-auto mb-3`}>
          <i className={`${cfg.icon} text-2xl`}></i>
        </div>
        <p className="text-stone-500 text-sm font-medium">No hay liquidaciones pendientes</p>
        <p className="text-stone-400 text-xs mt-1">Aparecerán aquí cuando haya reservas confirmadas con pago registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((liq) => {
        const isExpanded = expanded === liq.id;
        const pendienteReal = liq.reservas
          .filter((r) => {
            if (categoria === "propiedades") return r.stripe_payment_status === "paid" && r.stripe_transfer_status !== "completed";
            return r.metodo_pago && r.transfer_status !== "completed";
          })
          .reduce((acc, r) => acc + r.importe_neto, 0);
        const hasPendientes = pendienteReal > 0;

        return (
          <div key={liq.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Propietario info */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${cfg.bg} ${cfg.color} text-lg font-bold flex-shrink-0`}>
                    {liq.nombre?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">{liq.nombre} {liq.apellidos}</h3>
                    <p className="text-xs text-stone-500">{liq.email}</p>
                    {liq.cuenta_bancaria?.iban && (
                      <p className="text-xs text-stone-400 mt-0.5 font-mono">
                        <i className="ri-bank-line mr-1"></i>{liq.cuenta_bancaria.iban}
                      </p>
                    )}
                  </div>
                </div>

                {/* Importes */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Total bruto</p>
                    <p className="text-sm font-semibold text-stone-700">{fmt(liq.total_bruto)}€</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Comisión NEXURA</p>
                    <p className="text-sm font-semibold text-amber-600">−{fmt(liq.total_comision)}€</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">IVA 21% comisión</p>
                    <p className="text-sm font-semibold text-amber-500">−{fmt(liq.total_iva)}€</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Neto propietario</p>
                    <p className="text-sm font-bold text-stone-900">{fmt(liq.total_neto)}€</p>
                  </div>
                  {hasPendientes ? (
                    <div className="text-right bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <p className="text-xs text-amber-600 font-medium">Pendiente</p>
                      <p className="text-base font-bold text-amber-700">{fmt(pendienteReal)}€</p>
                    </div>
                  ) : liq.transferido > 0 ? (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                      <i className="ri-check-double-line text-emerald-600 text-sm"></i>
                      <span className="text-xs font-semibold text-emerald-700">Al día</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Cuenta bancaria */}
              {liq.cuenta_bancaria?.banco && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1"><i className="ri-bank-line text-stone-400"></i>{liq.cuenta_bancaria.banco}</span>
                  {liq.cuenta_bancaria.titular && <span className="flex items-center gap-1"><i className="ri-user-line text-stone-400"></i>{liq.cuenta_bancaria.titular}</span>}
                  {liq.cuenta_bancaria.swift && <span className="flex items-center gap-1 font-mono"><i className="ri-global-line text-stone-400"></i>{liq.cuenta_bancaria.swift}</span>}
                </div>
              )}
              {!liq.cuenta_bancaria?.iban && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  <i className="ri-error-warning-line"></i>
                  Este propietario aún no ha añadido su cuenta bancaria
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100 flex-wrap">
                <button
                  onClick={() => setExpanded(isExpanded ? null : liq.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <i className={isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}></i>
                  {isExpanded ? "Ocultar" : "Ver"} reservas ({liq.reservas.length})
                </button>
                {hasPendientes && (
                  <button
                    onClick={() => onMarkAllTransfer(liq.id, categoria)}
                    disabled={markingId === liq.id}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {markingId === liq.id
                      ? <><i className="ri-loader-4-line animate-spin"></i> Marcando...</>
                      : <><i className="ri-check-double-line"></i> Marcar todo como transferido</>
                    }
                  </button>
                )}
                {liq.cuenta_bancaria?.iban && hasPendientes && (
                  <button
                    onClick={() => {
                      const text = `Transferencia NEXURA\nBeneficiario: ${liq.nombre} ${liq.apellidos}\nIBAN: ${liq.cuenta_bancaria?.iban}\nImporte: ${fmt(pendienteReal)}€\nConcepto: Liquidación ${categoriaConfig[categoria].label}`;
                      navigator.clipboard.writeText(text);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap border border-stone-200"
                  >
                    <i className="ri-clipboard-line"></i> Copiar IBAN
                  </button>
                )}
                {/* Exportar PDF individual */}
                <button
                  onClick={() => generateLiquidacionPdf(liq, categoria, !hasPendientes)}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap border border-red-100"
                >
                  <i className="ri-file-pdf-2-line"></i> PDF justificante
                </button>
                {/* Exportar CSV individual */}
                <button
                  onClick={() => exportLiquidacionCsv(liq, categoria)}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer whitespace-nowrap border border-emerald-100"
                >
                  <i className="ri-file-excel-2-line"></i> Excel/CSV
                </button>
              </div>
            </div>

            {/* Detalle reservas */}
            {isExpanded && (
              <div className="border-t border-stone-100 bg-stone-50">
                <div className="p-4 space-y-2">
                  {liq.reservas.map((r) => {
                    const isPaid = categoria === "propiedades"
                      ? r.stripe_payment_status === "paid"
                      : !!r.metodo_pago;
                    const isTransferred = categoria === "propiedades"
                      ? r.stripe_transfer_status === "completed"
                      : r.transfer_status === "completed";

                    return (
                      <div key={r.id} className="bg-white rounded-xl border border-stone-100 p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-semibold text-stone-800 truncate">{r.nombre_alojamiento}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.estado === "completada" ? "bg-stone-100 text-stone-600" : "bg-emerald-100 text-emerald-700"}`}>
                                {r.estado}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500">
                              <i className="ri-user-line mr-1"></i>{r.cliente_nombre || "—"}
                              <span className="mx-2">·</span>
                              {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)}
                            </p>
                            {r.metodo_pago && (
                              <p className="text-xs text-stone-400 mt-0.5">
                                <i className="ri-bank-card-line mr-1"></i>Pagado por {r.metodo_pago}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                            <div className="text-right">
                              <p className="text-xs text-stone-400">Bruto</p>
                              <p className="text-xs font-medium text-stone-700">{fmt(r.precio_total)}€</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-stone-400">Comisión+IVA</p>
                              <p className="text-xs font-medium text-amber-600">−{fmt(r.comision_nexura + r.iva_comision)}€</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-stone-400">A pagar</p>
                              <p className="text-sm font-bold text-stone-900">{fmt(r.importe_neto)}€</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                <i className={isPaid ? "ri-money-euro-circle-line" : "ri-time-line"}></i>
                                {isPaid ? "Cobrado" : "Sin cobrar"}
                              </span>
                              {isPaid && (
                                isTransferred ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-600 flex items-center gap-1">
                                    <i className="ri-check-line"></i>Transferido
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => onMarkTransfer(r.id, categoria)}
                                    disabled={markingId === r.id}
                                    className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
                                  >
                                    {markingId === r.id
                                      ? <><i className="ri-loader-4-line animate-spin mr-1"></i>...</>
                                      : <><i className="ri-send-plane-line mr-1"></i>Marcar transferido</>
                                    }
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen pie */}
                <div className="px-4 pb-4">
                  <div className="bg-stone-900 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <i className={`${cfg.icon} text-stone-400 text-sm`}></i>
                      <span className="text-stone-400 text-xs">Resumen {liq.nombre}</span>
                    </div>
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">Total bruto</p>
                        <p className="text-white text-sm font-semibold">{fmt(liq.total_bruto)}€</p>
                      </div>
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">Comisión NEXURA</p>
                        <p className="text-amber-400 text-sm font-semibold">−{fmt(liq.total_comision)}€</p>
                      </div>
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">IVA 21% mediación</p>
                        <p className="text-amber-300 text-sm font-semibold">−{fmt(liq.total_iva)}€</p>
                      </div>
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">Ya transferido</p>
                        <p className="text-emerald-400 text-sm font-semibold">{fmt(liq.transferido)}€</p>
                      </div>
                      <div className="text-center">
                        <p className="text-stone-400 text-xs">Pendiente</p>
                        <p className="text-white text-base font-bold">{fmt(pendienteReal)}€</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiquidacionesSection() {
  const [activeTab, setActiveTab] = useState<Categoria>("propiedades");
  const [dataByCategoria, setDataByCategoria] = useState<Record<Categoria, PropietarioLiq[]>>({
    propiedades: [], barcos: [], hostales: [], camping: [],
  });
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };

  // ── Fetch propiedades (existing logic) ──────────────────────────────────────
  const fetchPropiedades = async (): Promise<PropietarioLiq[]> => {
    const [bookRes, propRes, memRes] = await Promise.all([
      supabase.from("bookings")
        .select("id,propiedad_id,propiedad_nombre,huesped_nombre,fecha_inicio,fecha_fin,precio_total,estado,stripe_payment_status,stripe_transfer_status,metodo_pago,comision_nexura,iva_servicios")
        .in("estado", ["confirmada", "completada"])
        .not("precio_total", "is", null),
      supabase.from("properties").select("id,nombre,propietario_id"),
      supabase.from("members").select("id,nombre,apellidos,email,cuenta_bancaria").eq("tipo", "anfitrion"),
    ]);

    const bookings = (bookRes.data || []) as {
      id: string; propiedad_id: string | null; propiedad_nombre: string | null;
      huesped_nombre: string | null; fecha_inicio: string; fecha_fin: string;
      precio_total: number | null; estado: string; stripe_payment_status: string | null;
      stripe_transfer_status: string | null; metodo_pago: string | null;
      comision_nexura: number | null; iva_servicios: number | null;
    }[];
    const properties = (propRes.data || []) as { id: string; nombre: string; propietario_id: string | null }[];
    const members = (memRes.data || []) as { id: string; nombre: string; apellidos: string; email: string; cuenta_bancaria: PropietarioLiq["cuenta_bancaria"] }[];

    const propToOwner: Record<string, string> = {};
    properties.forEach((p) => { if (p.propietario_id) propToOwner[p.id] = p.propietario_id; });

    const byOwner: Record<string, LiqRow[]> = {};
    bookings.forEach((b) => {
      if (!b.propiedad_id) return;
      const ownerId = propToOwner[b.propiedad_id];
      if (!ownerId) return;
      const total = b.precio_total || 0;
      const comision = b.comision_nexura || Math.round(total * 0.05);
      const iva = b.iva_servicios || 0;
      const importe_neto = Math.round((total - comision - iva) * 100) / 100;
      if (!byOwner[ownerId]) byOwner[ownerId] = [];
      byOwner[ownerId].push({
        id: b.id, nombre_alojamiento: b.propiedad_nombre || "Propiedad",
        cliente_nombre: b.huesped_nombre, fecha_inicio: b.fecha_inicio, fecha_fin: b.fecha_fin,
        precio_total: total, comision_nexura: comision, iva_comision: iva, importe_neto,
        metodo_pago: b.metodo_pago, estado: b.estado, transfer_status: b.stripe_transfer_status,
        categoria: "propiedades", stripe_payment_status: b.stripe_payment_status,
        stripe_transfer_status: b.stripe_transfer_status,
      });
    });

    return members.filter((m) => byOwner[m.id]?.length > 0).map((m) => {
      const reservas = byOwner[m.id] || [];
      const total_bruto = reservas.reduce((a, r) => a + r.precio_total, 0);
      const total_comision = reservas.reduce((a, r) => a + r.comision_nexura, 0);
      const total_iva = reservas.reduce((a, r) => a + r.iva_comision, 0);
      const total_neto = reservas.reduce((a, r) => a + r.importe_neto, 0);
      const transferido = reservas.filter((r) => r.stripe_transfer_status === "completed").reduce((a, r) => a + r.importe_neto, 0);
      const pendiente = total_neto - transferido;
      return { id: m.id, nombre: m.nombre, apellidos: m.apellidos, email: m.email, cuenta_bancaria: m.cuenta_bancaria, reservas, total_bruto, total_comision, total_iva, total_neto, pendiente, transferido };
    }).sort((a, b) => b.pendiente - a.pendiente);
  };

  // ── Fetch generic (barcos/hostales/camping) ──────────────────────────────────
  const fetchGeneric = async (
    table: string,
    nombreField: string,
    fechaInicioField: string,
    fechaFinField: string,
    cat: Categoria
  ): Promise<PropietarioLiq[]> => {
    const { data } = await supabase
      .from(table)
      .select(`id,${nombreField},cliente_nombre,cliente_email,${fechaInicioField},${fechaFinField},precio_total,precio_base,comision_nexura,iva_comision,metodo_pago,estado,transfer_status`)
      .in("estado", ["confirmada", "completada"])
      .not("precio_total", "is", null);

    if (!data || data.length === 0) return [];

    // Agrupar por nombre del alojamiento (como "propietario" virtual)
    const byAlojamiento: Record<string, LiqRow[]> = {};
    (data as Record<string, unknown>[]).forEach((b) => {
      const nombre = (b[nombreField] as string) || "Sin nombre";
      const total = (b.precio_total as number) || 0;
      const comision = (b.comision_nexura as number) || Math.round(total * 0.15);
      const iva = (b.iva_comision as number) || Math.round(comision * 0.21);
      const importe_neto = Math.round((total - comision - iva) * 100) / 100;
      if (!byAlojamiento[nombre]) byAlojamiento[nombre] = [];
      byAlojamiento[nombre].push({
        id: b.id as string,
        nombre_alojamiento: nombre,
        cliente_nombre: (b.cliente_nombre as string) || null,
        fecha_inicio: (b[fechaInicioField] as string) || "",
        fecha_fin: (b[fechaFinField] as string) || "",
        precio_total: total,
        comision_nexura: comision,
        iva_comision: iva,
        importe_neto,
        metodo_pago: (b.metodo_pago as string) || null,
        estado: (b.estado as string) || "",
        transfer_status: (b.transfer_status as string) || null,
        categoria: cat,
      });
    });

    return Object.entries(byAlojamiento).map(([nombre, reservas]) => {
      const total_bruto = reservas.reduce((a, r) => a + r.precio_total, 0);
      const total_comision = reservas.reduce((a, r) => a + r.comision_nexura, 0);
      const total_iva = reservas.reduce((a, r) => a + r.iva_comision, 0);
      const total_neto = reservas.reduce((a, r) => a + r.importe_neto, 0);
      const transferido = reservas.filter((r) => r.transfer_status === "completed").reduce((a, r) => a + r.importe_neto, 0);
      const pendiente = total_neto - transferido;
      return {
        id: nombre,
        nombre,
        apellidos: "",
        email: "",
        cuenta_bancaria: null,
        reservas,
        total_bruto,
        total_comision,
        total_iva,
        total_neto,
        pendiente,
        transferido,
      };
    }).sort((a, b) => b.pendiente - a.pendiente);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [propiedades, barcos, hostales, camping] = await Promise.all([
      fetchPropiedades(),
      fetchGeneric("barco_bookings", "barco_nombre", "fecha_inicio", "fecha_fin", "barcos"),
      fetchGeneric("hostal_bookings", "hostal_nombre", "fecha_entrada", "fecha_salida", "hostales"),
      fetchGeneric("camping_bookings", "camping_nombre", "fecha_entrada", "fecha_salida", "camping"),
    ]);
    setDataByCategoria({ propiedades, barcos, hostales, camping });
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Mark transfer ────────────────────────────────────────────────────────────
  const handleMarkTransfer = async (rowId: string, cat: Categoria) => {
    setMarkingId(rowId);
    const tableMap: Record<Categoria, string> = {
      propiedades: "bookings", barcos: "barco_bookings", hostales: "hostal_bookings", camping: "camping_bookings",
    };
    const table = tableMap[cat];
    const field = cat === "propiedades" ? "stripe_transfer_status" : "transfer_status";
    const { error } = await supabase.from(table).update({ [field]: "completed", updated_at: new Date().toISOString() }).eq("id", rowId);
    if (!error) {
      showSuccess("Transferencia marcada como realizada");
      await fetchAll();
    }
    setMarkingId(null);
  };

  const handleMarkAllTransfer = async (propId: string, cat: Categoria) => {
    setMarkingId(propId);
    const tableMap: Record<Categoria, string> = {
      propiedades: "bookings", barcos: "barco_bookings", hostales: "hostal_bookings", camping: "camping_bookings",
    };
    const table = tableMap[cat];
    const field = cat === "propiedades" ? "stripe_transfer_status" : "transfer_status";
    const liq = dataByCategoria[cat].find((l) => l.id === propId);
    if (!liq) { setMarkingId(null); return; }

    const pendientes = liq.reservas.filter((r) => {
      if (cat === "propiedades") return r.stripe_payment_status === "paid" && r.stripe_transfer_status !== "completed";
      return r.metodo_pago && r.transfer_status !== "completed";
    });

    await Promise.all(
      pendientes.map((r) =>
        supabase.from(table).update({ [field]: "completed", updated_at: new Date().toISOString() }).eq("id", r.id)
      )
    );
    showSuccess(`Todas las transferencias de ${liq.nombre} marcadas como realizadas`);
    await fetchAll();
    setMarkingId(null);
  };

  // ── Totales globales ─────────────────────────────────────────────────────────
  const globalPendiente = (Object.values(dataByCategoria) as PropietarioLiq[][])
    .flat()
    .reduce((acc, l) => acc + l.pendiente, 0);

  const globalTransferido = (Object.values(dataByCategoria) as PropietarioLiq[][])
    .flat()
    .reduce((acc, l) => acc + l.transferido, 0);

  const globalComision = (Object.values(dataByCategoria) as PropietarioLiq[][])
    .flat()
    .reduce((acc, l) => acc + l.total_comision + l.total_iva, 0);

  const totalPorCategoria = (cat: Categoria) =>
    dataByCategoria[cat].reduce((acc, l) => acc + l.pendiente, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Liquidaciones a propietarios</h2>
          <p className="text-stone-500 text-sm">Gestiona los pagos a propietarios de todas las categorías</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {globalPendiente > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
              <p className="text-xs text-amber-600 font-medium">Total pendiente global</p>
              <p className="text-xl font-bold text-amber-700">{fmt(globalPendiente)}€</p>
            </div>
          )}
          {/* Exportar informe global */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateLiquidacionesGlobalPdf(dataByCategoria)}
              disabled={loading}
              className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <i className="ri-file-pdf-2-line text-red-400"></i>
              Exportar informe PDF
            </button>
            <button
              onClick={() => exportLiquidacionesGlobalCsv(dataByCategoria)}
              disabled={loading}
              className="flex items-center gap-2 border border-stone-200 text-stone-600 px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <i className="ri-file-excel-2-line text-emerald-600"></i>
              Exportar Excel/CSV
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <i className="ri-checkbox-circle-line text-base"></i>
          {successMsg}
        </div>
      )}

      {/* Resumen global */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-100 text-amber-600 mb-2">
            <i className="ri-time-line text-sm"></i>
          </div>
          <div className="text-xl font-bold text-stone-900">{fmt(globalPendiente)}€</div>
          <div className="text-xs text-stone-500 mt-0.5">Pendiente de transferir</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 mb-2">
            <i className="ri-check-double-line text-sm"></i>
          </div>
          <div className="text-xl font-bold text-stone-900">{fmt(globalTransferido)}€</div>
          <div className="text-xs text-stone-500 mt-0.5">Ya transferido</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 text-stone-600 mb-2">
            <i className="ri-percent-line text-sm"></i>
          </div>
          <div className="text-xl font-bold text-stone-900">{fmt(globalComision)}€</div>
          <div className="text-xs text-stone-500 mt-0.5">Ingresos NEXURA (comisión+IVA)</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 text-stone-600 mb-2">
            <i className="ri-building-line text-sm"></i>
          </div>
          <div className="text-xl font-bold text-stone-900">
            {(Object.values(dataByCategoria) as PropietarioLiq[][]).flat().length}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">Propietarios con reservas</div>
        </div>
      </div>

      {/* Tabs por categoría */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-stone-100 overflow-x-auto">
          {(Object.entries(categoriaConfig) as [Categoria, typeof categoriaConfig[Categoria]][]).map(([cat, cfg]) => {
            const pendiente = totalPorCategoria(cat);
            const count = dataByCategoria[cat].length;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  activeTab === cat
                    ? `border-stone-900 ${cfg.color} bg-stone-50`
                    : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                }`}
              >
                <i className={`${cfg.icon} text-base`}></i>
                {cfg.label}
                {count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${activeTab === cat ? cfg.bg + " " + cfg.color : "bg-stone-100 text-stone-500"}`}>
                    {count}
                  </span>
                )}
                {pendiente > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    {fmt(pendiente)}€
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-16 text-stone-400 text-sm">
              <i className="ri-loader-4-line animate-spin text-2xl mb-2 block"></i>
              Calculando liquidaciones...
            </div>
          ) : (
            <LiquidacionList
              rows={dataByCategoria[activeTab]}
              onMarkTransfer={handleMarkTransfer}
              onMarkAllTransfer={handleMarkAllTransfer}
              markingId={markingId}
              categoria={activeTab}
            />
          )}
        </div>
      </div>

      {/* Resumen por categoría */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <i className="ri-pie-chart-2-line text-stone-500"></i>
            Resumen por categoría
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Object.entries(categoriaConfig) as [Categoria, typeof categoriaConfig[Categoria]][]).map(([cat, cfg]) => {
              const rows = dataByCategoria[cat];
              const bruto = rows.reduce((a, l) => a + l.total_bruto, 0);
              const comision = rows.reduce((a, l) => a + l.total_comision + l.total_iva, 0);
              const neto = rows.reduce((a, l) => a + l.total_neto, 0);
              const pendiente = rows.reduce((a, l) => a + l.pendiente, 0);
              return (
                <div key={cat} className={`rounded-xl border p-4 ${cfg.bg} border-transparent`}>
                  <div className="flex items-center gap-2 mb-3">
                    <i className={`${cfg.icon} ${cfg.color} text-base`}></i>
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">Bruto</span>
                      <span className="font-semibold text-stone-700">{fmt(bruto)}€</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">Comisión+IVA</span>
                      <span className="font-semibold text-amber-600">−{fmt(comision)}€</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">Neto propietarios</span>
                      <span className="font-semibold text-stone-800">{fmt(neto)}€</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1.5 border-t border-stone-200">
                      <span className="text-stone-500 font-medium">Pendiente</span>
                      <span className={`font-bold ${pendiente > 0 ? "text-amber-700" : "text-emerald-600"}`}>
                        {pendiente > 0 ? `${fmt(pendiente)}€` : "Al día"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
