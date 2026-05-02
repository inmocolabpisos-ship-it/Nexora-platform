import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type BookingFinanza = {
  id: string;
  propiedad_nombre: string | null;
  huesped_nombre: string | null;
  anfitrion_nombre: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  precio_total: number | null;
  subtotal_alojamiento: number | null;
  comision_nexura: number | null;
  subtotal_servicios: number | null;
  iva_servicios: number | null;
  servicios_extra: { key: string; label: string; precio: number }[] | null;
  metodo_pago: string | null;
  stripe_payment_status: string | null;
  categoria?: string | null; // 'propiedad' | 'barco' | 'hostal' | 'camping'
};

type BarcoBookingFinanza = {
  id: string;
  barco_nombre: string;
  barco_id: string;
  fecha_reserva: string;
  tipo_reserva: string;
  num_personas: number;
  precio_base: number;
  comision_nexura: number;
  iva_comision: number;
  precio_total: number;
  metodo_pago: string | null;
  estado: string;
  cliente_nombre: string | null;
};

type InmobiliariaSub = {
  id: string;
  nombre_inmobiliaria: string;
  plan: string;
  estado: string;
  metodo_pago: string | null;
  justificante_estado: string | null;
  fecha_proximo_pago: string | null;
  created_at: string;
};

type Periodo = "mes" | "trimestre" | "anio" | "todo";

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "mes", label: "Este mes" },
  { key: "trimestre", label: "Trimestre" },
  { key: "anio", label: "Este año" },
  { key: "todo", label: "Todo" },
];

function filtrarPorPeriodo<T extends { fecha_inicio?: string; fecha_reserva?: string }>(
  items: T[],
  periodo: Periodo,
  dateField: "fecha_inicio" | "fecha_reserva" = "fecha_inicio"
): T[] {
  const now = new Date();
  return items.filter((b) => {
    const raw = dateField === "fecha_reserva"
      ? (b as { fecha_reserva?: string }).fecha_reserva
      : (b as { fecha_inicio?: string }).fecha_inicio;
    if (!raw) return false;
    const d = new Date(raw);
    if (periodo === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (periodo === "trimestre") {
      const q = Math.floor(now.getMonth() / 3);
      return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
    }
    if (periodo === "anio") return d.getFullYear() === now.getFullYear();
    return true;
  });
}

export default function FinanzasSection() {
  const [bookings, setBookings] = useState<BookingFinanza[]>([]);
  const [barcoBookings, setBarcoBookings] = useState<BarcoBookingFinanza[]>([]);
  const [inmoSubs, setInmoSubs] = useState<InmobiliariaSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [tab, setTab] = useState<"resumen" | "categorias" | "propietarios" | "huespedes" | "iva" | "inmobiliarias" | "detalle">("resumen");

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: bData }, { data: bbData }, { data: inmoData }] = await Promise.all([
        supabase
          .from("bookings")
          .select("id,propiedad_nombre,huesped_nombre,anfitrion_nombre,fecha_inicio,fecha_fin,estado,precio_total,subtotal_alojamiento,comision_nexura,subtotal_servicios,iva_servicios,servicios_extra,metodo_pago,stripe_payment_status")
          .order("fecha_inicio", { ascending: false }),
        supabase
          .from("barco_bookings")
          .select("id,barco_nombre,barco_id,fecha_reserva,tipo_reserva,num_personas,precio_base,comision_nexura,iva_comision,precio_total,metodo_pago,estado,cliente_nombre")
          .order("fecha_reserva", { ascending: false }),
        supabase
          .from("inmobiliarias_suscripciones")
          .select("id,nombre_inmobiliaria,plan,estado,metodo_pago,justificante_estado,fecha_proximo_pago,created_at")
          .order("created_at", { ascending: false }),
      ]);
      setBookings((bData as BookingFinanza[]) || []);
      setBarcoBookings((bbData as BarcoBookingFinanza[]) || []);
      setInmoSubs((inmoData as InmobiliariaSub[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const confirmadas = bookings.filter((b) => b.estado === "confirmada");
  const filtradas = filtrarPorPeriodo(confirmadas, periodo, "fecha_inicio");

  const barcoConfirmadas = barcoBookings.filter((b) => b.estado === "confirmada");
  const barcoFiltradas = filtrarPorPeriodo(barcoConfirmadas, periodo, "fecha_reserva");

  // ── Totales propiedades ──────────────────────────────────────────────────
  const totalAlojamiento = filtradas.reduce((a, b) => a + (b.subtotal_alojamiento || b.precio_total || 0), 0);
  const totalComisionProp = filtradas.reduce((a, b) => a + (b.comision_nexura || 0), 0);
  const totalServicios = filtradas.reduce((a, b) => a + (b.subtotal_servicios || 0), 0);
  const totalIVAServicios = filtradas.reduce((a, b) => a + (b.iva_servicios || 0), 0);
  const importePropietarios = totalAlojamiento - totalComisionProp;

  // ── Totales barcos ───────────────────────────────────────────────────────
  const totalBarcoBase = barcoFiltradas.reduce((a, b) => a + (b.precio_base || 0), 0);
  const totalComisionBarcos = barcoFiltradas.reduce((a, b) => a + (b.comision_nexura || 0), 0);
  const totalIVAComisionBarcos = barcoFiltradas.reduce((a, b) => a + (b.iva_comision || 0), 0);
  const totalBarcoTotal = barcoFiltradas.reduce((a, b) => a + (b.precio_total || 0), 0);

  // ── Totales combinados ───────────────────────────────────────────────────
  const totalComisionNexura = totalComisionProp + totalComisionBarcos;
  // IVA 21% sobre comisiones NEXURA (mediación digital)
  const ivaComisionNexura = Math.round(totalComisionNexura * 0.21);
  // IVA 10% servicios adicionales alojamiento
  const totalIVA = totalIVAServicios + totalIVAComisionBarcos;
  const gananciaReal = totalComisionNexura; // antes de IVA
  const gananciaNetaIVA = gananciaReal - ivaComisionNexura; // después de IVA
  const totalBruto = filtradas.reduce((a, b) => a + (b.precio_total || 0), 0) + totalBarcoTotal;

  // ── Inmobiliarias ────────────────────────────────────────────────────────────
  const PLAN_PRECIO: Record<string, number> = { basico: 25, profesional: 50, ilimitado: 95 };
  const PLAN_NETO: Record<string, number> = { basico: 20.66, profesional: 41.32, ilimitado: 78.51 };
  const PLAN_LABELS: Record<string, string> = { basico: "Básico", profesional: "Profesional", ilimitado: "Ilimitado" };

  const inmoActivas = inmoSubs.filter((s) => s.estado === "activo");
  const inmoPendientes = inmoSubs.filter((s) => s.justificante_estado === "pendiente_revision");
  const inmoRechazadas = inmoSubs.filter((s) => s.justificante_estado === "rechazado");

  const ingresos_inmo_bruto = inmoActivas.reduce((a, s) => a + (PLAN_PRECIO[s.plan] || 0), 0);
  const ingresos_inmo_neto = inmoActivas.reduce((a, s) => a + (PLAN_NETO[s.plan] || 0), 0);
  const iva_inmo = ingresos_inmo_bruto - ingresos_inmo_neto;

  const porPlan: Record<string, { label: string; precio: number; neto: number; count: number }> = {
    basico: { label: "Básico", precio: 25, neto: 20.66, count: 0 },
    profesional: { label: "Profesional", precio: 50, neto: 41.32, count: 0 },
    ilimitado: { label: "Ilimitado", precio: 95, neto: 78.51, count: 0 },
  };
  inmoActivas.forEach((s) => { if (porPlan[s.plan]) porPlan[s.plan].count += 1; });

  // ── Por propietario ──────────────────────────────────────────────────────
  const porPropietario: Record<string, { nombre: string; reservas: number; alojamiento: number; comision: number; neto: number }> = {};
  filtradas.forEach((b) => {
    const key = b.anfitrion_nombre || "Sin nombre";
    if (!porPropietario[key]) porPropietario[key] = { nombre: key, reservas: 0, alojamiento: 0, comision: 0, neto: 0 };
    porPropietario[key].reservas += 1;
    porPropietario[key].alojamiento += b.subtotal_alojamiento || b.precio_total || 0;
    porPropietario[key].comision += b.comision_nexura || 0;
    porPropietario[key].neto += (b.subtotal_alojamiento || b.precio_total || 0) - (b.comision_nexura || 0);
  });

  // ── Por huésped ──────────────────────────────────────────────────────────
  const porHuesped: Record<string, { nombre: string; reservas: number; total: number; servicios: number; iva: number }> = {};
  filtradas.forEach((b) => {
    const key = b.huesped_nombre || "Sin nombre";
    if (!porHuesped[key]) porHuesped[key] = { nombre: key, reservas: 0, total: 0, servicios: 0, iva: 0 };
    porHuesped[key].reservas += 1;
    porHuesped[key].total += b.precio_total || 0;
    porHuesped[key].servicios += b.subtotal_servicios || 0;
    porHuesped[key].iva += b.iva_servicios || 0;
  });

  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const estadoColor: Record<string, string> = {
    confirmada: "bg-emerald-100 text-emerald-700",
    pendiente: "bg-amber-100 text-amber-700",
    cancelada: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone-100 rounded animate-pulse"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 animate-pulse h-28"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Finanzas</h2>
          <p className="text-stone-500 text-sm mt-0.5">Ingresos, comisiones, IVA y liquidaciones por categoría</p>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                periodo === p.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comisiones info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <i className="ri-information-line text-amber-500 mt-0.5 flex-shrink-0 text-lg"></i>
        <div className="text-xs text-amber-800 leading-relaxed">
          <strong>Tarifas de comisión activas:</strong> Anfitriones 5% · Huéspedes 15% · Barcos/Catamaranes 15% · Hostales 15% · Camping 15%
          <span className="ml-2 text-amber-600">· IVA 21% sobre comisiones NEXURA (mediación digital) · IVA 10% sobre servicios adicionales</span>
          <span className="ml-2 font-semibold text-amber-700">· Inmobiliarias: cuota fija mensual (IVA 21% incluido)</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 mb-3">
            <i className="ri-money-euro-circle-line text-lg"></i>
          </div>
          <div className="text-2xl font-bold text-stone-900">{fmt(totalBruto + ingresos_inmo_bruto)}€</div>
          <div className="text-stone-500 text-xs mt-0.5">Total facturado</div>
          <div className="text-stone-400 text-xs mt-1">{filtradas.length + barcoFiltradas.length} reservas + {inmoActivas.length} inmo</div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-3">
            <i className="ri-home-4-line text-lg"></i>
          </div>
          <div className="text-2xl font-bold text-stone-900">{fmt(importePropietarios)}€</div>
          <div className="text-stone-500 text-xs mt-0.5">Importe propietarios</div>
          <div className="text-stone-400 text-xs mt-1">Alojamiento − comisión</div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-3">
            <i className="ri-government-line text-lg"></i>
          </div>
          <div className="text-2xl font-bold text-stone-900">{fmt(totalIVA + ivaComisionNexura + iva_inmo)}€</div>
          <div className="text-stone-500 text-xs mt-0.5">IVA total a declarar</div>
          <div className="text-stone-400 text-xs mt-1">Servicios + comisiones + inmo</div>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/30 text-white mb-3">
            <i className="ri-trophy-line text-lg"></i>
          </div>
          <div className="text-2xl font-bold text-white">{fmt(gananciaNetaIVA + ingresos_inmo_neto)}€</div>
          <div className="text-amber-100 text-xs mt-0.5">Ganancia neta NEXURA</div>
          <div className="text-amber-200 text-xs mt-1">Comisión + inmo (neto IVA)</div>
        </div>
      </div>

      {/* Desglose visual */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-semibold text-stone-900 mb-4">Desglose financiero completo</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Alojamiento bruto", value: totalAlojamiento, color: "bg-stone-100 text-stone-700", icon: "ri-building-line", note: "Exento IVA" },
            { label: "Barcos/Catamaranes", value: totalBarcoBase, color: "bg-sky-100 text-sky-700", icon: "ri-sailboat-line", note: "Base sin comisión" },
            { label: "Comisión NEXURA", value: totalComisionNexura, color: "bg-amber-100 text-amber-700", icon: "ri-percent-line", note: "Antes de IVA" },
            { label: "IVA 21% comisión", value: ivaComisionNexura, color: "bg-rose-100 text-rose-700", icon: "ri-government-line", note: "A declarar (mod. 303)" },
            { label: "Neto propietarios", value: importePropietarios, color: "bg-emerald-100 text-emerald-700", icon: "ri-user-star-line", note: "A liquidar" },
            { label: "Inmo cuotas (neto)", value: ingresos_inmo_neto, color: "bg-violet-100 text-violet-700", icon: "ri-building-2-line", note: `${inmoActivas.length} activas` },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <i className={`${item.icon} text-sm`}></i>
                <span className="text-xs font-medium leading-tight">{item.label}</span>
              </div>
              <div className="text-xl font-bold">{fmt(item.value)}€</div>
              <div className="text-xs opacity-70 mt-0.5">{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="flex border-b border-stone-100 overflow-x-auto">
          {[
            { key: "resumen", label: "Resumen", icon: "ri-bar-chart-line" },
            { key: "categorias", label: "Por categoría", icon: "ri-grid-line" },
            { key: "propietarios", label: "Propietarios", icon: "ri-user-star-line" },
            { key: "huespedes", label: "Huéspedes", icon: "ri-user-heart-line" },
            { key: "iva", label: "IVA", icon: "ri-government-line" },
            { key: "inmobiliarias", label: "Inmobiliarias", icon: "ri-building-2-line" },
            { key: "detalle", label: "Detalle", icon: "ri-list-check" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                tab === t.key
                  ? "border-amber-500 text-amber-600 bg-amber-50/50"
                  : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              <i className={t.icon}></i>
              {t.label}
              {t.key === "inmobiliarias" && inmoPendientes.length > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {inmoPendientes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* RESUMEN */}
          {tab === "resumen" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="text-xs text-stone-500 mb-1">Total facturado</div>
                  <div className="text-2xl font-bold text-stone-900">{fmt(totalBruto + ingresos_inmo_bruto)}€</div>
                  <div className="text-xs text-stone-400 mt-1">Reservas + cuotas inmobiliarias</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="text-xs text-amber-600 mb-1">Comisión bruta NEXURA</div>
                  <div className="text-2xl font-bold text-amber-700">{fmt(gananciaReal + ingresos_inmo_neto)}€</div>
                  <div className="text-xs text-amber-500 mt-1">
                    IVA: −{fmt(ivaComisionNexura + iva_inmo)}€ → Neto: {fmt(gananciaNetaIVA + ingresos_inmo_neto)}€
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-xs text-emerald-600 mb-1">A propietarios</div>
                  <div className="text-2xl font-bold text-emerald-700">{fmt(importePropietarios)}€</div>
                  <div className="text-xs text-emerald-500 mt-1">
                    {totalBruto > 0 ? ((importePropietarios / totalBruto) * 100).toFixed(1) : 0}% del total reservas
                  </div>
                </div>
              </div>

              {/* Inmobiliarias resumen rápido */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="ri-building-2-line text-violet-600"></i>
                  <span className="text-sm font-semibold text-violet-800">Ingresos por cuotas de inmobiliarias</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-violet-700">{fmt(ingresos_inmo_bruto)}€</div>
                    <div className="text-xs text-stone-400 mt-0.5">Bruto (IVA inc.)</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-rose-600">{fmt(iva_inmo)}€</div>
                    <div className="text-xs text-stone-400 mt-0.5">IVA 21%</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-emerald-700">{fmt(ingresos_inmo_neto)}€</div>
                    <div className="text-xs text-stone-400 mt-0.5">Neto NEXURA</div>
                  </div>
                </div>
              </div>

              {totalBruto > 0 && (
                <div>
                  <div className="text-xs text-stone-500 mb-2">Distribución del ingreso total</div>
                  <div className="flex rounded-full overflow-hidden h-4">
                    <div className="bg-emerald-400 transition-all" style={{ width: `${(importePropietarios / (totalBruto + ingresos_inmo_bruto)) * 100}%` }} title={`Propietarios: ${fmt(importePropietarios)}€`}></div>
                    <div className="bg-amber-400 transition-all" style={{ width: `${(gananciaNetaIVA / (totalBruto + ingresos_inmo_bruto)) * 100}%` }} title={`NEXURA neto reservas: ${fmt(gananciaNetaIVA)}€`}></div>
                    <div className="bg-violet-400 transition-all" style={{ width: `${(ingresos_inmo_neto / (totalBruto + ingresos_inmo_bruto)) * 100}%` }} title={`NEXURA neto inmo: ${fmt(ingresos_inmo_neto)}€`}></div>
                    <div className="bg-rose-400 transition-all" style={{ width: `${((ivaComisionNexura + iva_inmo) / (totalBruto + ingresos_inmo_bruto)) * 100}%` }} title={`IVA total: ${fmt(ivaComisionNexura + iva_inmo)}€`}></div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {[
                      { color: "bg-emerald-400", label: "Propietarios" },
                      { color: "bg-amber-400", label: "NEXURA neto reservas" },
                      { color: "bg-violet-400", label: "NEXURA neto inmo" },
                      { color: "bg-rose-400", label: "IVA total" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5 text-xs text-stone-500">
                        <div className={`w-3 h-3 rounded-full ${l.color}`}></div> {l.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filtradas.length === 0 && barcoFiltradas.length === 0 && inmoActivas.length === 0 && (
                <div className="text-center py-10">
                  <i className="ri-bar-chart-line text-4xl text-stone-200 mb-3"></i>
                  <p className="text-stone-400 text-sm">Sin datos en este periodo</p>
                </div>
              )}
            </div>
          )}

          {/* CATEGORÍAS */}
          {tab === "categorias" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">Desglose de ingresos y comisiones por tipo de alojamiento</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    key: "propiedades",
                    label: "Propiedades / Apartamentos",
                    icon: "ri-building-line",
                    color: "bg-stone-50 border-stone-200",
                    iconColor: "bg-stone-100 text-stone-600",
                    reservas: filtradas.length,
                    bruto: totalAlojamiento,
                    comision: totalComisionProp,
                    ivaComision: Math.round(totalComisionProp * 0.21),
                    neto: importePropietarios,
                    tasaComision: "5% anfitrión / 15% huésped",
                  },
                  {
                    key: "barcos",
                    label: "Barcos y Catamaranes",
                    icon: "ri-sailboat-line",
                    color: "bg-sky-50 border-sky-200",
                    iconColor: "bg-sky-100 text-sky-600",
                    reservas: barcoFiltradas.length,
                    bruto: totalBarcoBase,
                    comision: totalComisionBarcos,
                    ivaComision: totalIVAComisionBarcos,
                    neto: totalBarcoBase - totalComisionBarcos,
                    tasaComision: "15% sobre base imponible",
                  },
                  {
                    key: "hostales",
                    label: "Hostales",
                    icon: "ri-hotel-line",
                    color: "bg-emerald-50 border-emerald-200",
                    iconColor: "bg-emerald-100 text-emerald-600",
                    reservas: 0,
                    bruto: 0,
                    comision: 0,
                    ivaComision: 0,
                    neto: 0,
                    tasaComision: "15% sobre base imponible",
                  },
                  {
                    key: "camping",
                    label: "Camping",
                    icon: "ri-tent-line",
                    color: "bg-amber-50 border-amber-200",
                    iconColor: "bg-amber-100 text-amber-600",
                    reservas: 0,
                    bruto: 0,
                    comision: 0,
                    ivaComision: 0,
                    neto: 0,
                    tasaComision: "15% sobre base imponible",
                  },
                ].map((cat) => (
                  <div key={cat.key} className={`border rounded-2xl p-5 ${cat.color}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${cat.iconColor}`}>
                        <i className={`${cat.icon} text-lg`}></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-900 text-sm">{cat.label}</h4>
                        <p className="text-xs text-stone-400">{cat.tasaComision}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="bg-white border border-stone-200 text-stone-600 text-xs px-2.5 py-1 rounded-full font-medium">
                          {cat.reservas} reservas
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-xs text-stone-400 mb-0.5">Facturado</div>
                        <div className="text-base font-bold text-stone-900">{fmt(cat.bruto)}€</div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-xs text-stone-400 mb-0.5">Comisión bruta</div>
                        <div className="text-base font-bold text-amber-700">{fmt(cat.comision)}€</div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-xs text-stone-400 mb-0.5">IVA 21% comisión</div>
                        <div className="text-base font-bold text-rose-600">{fmt(cat.ivaComision)}€</div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-xs text-stone-400 mb-0.5">Neto propietario</div>
                        <div className="text-base font-bold text-emerald-700">{fmt(cat.neto)}€</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROPIETARIOS */}
          {tab === "propietarios" && (
            <div>
              <div className="text-sm text-stone-500 mb-4">
                Importe a liquidar a cada propietario (alojamiento − comisión NEXURA)
              </div>
              {Object.values(porPropietario).length === 0 ? (
                <div className="text-center py-10">
                  <i className="ri-user-star-line text-4xl text-stone-200 mb-3"></i>
                  <p className="text-stone-400 text-sm">Sin datos en este periodo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.values(porPropietario)
                    .sort((a, b) => b.neto - a.neto)
                    .map((p) => (
                      <div key={p.nombre} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm flex-shrink-0">
                            {p.nombre[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900 text-sm">{p.nombre}</div>
                            <div className="text-stone-400 text-xs">{p.reservas} reserva{p.reservas !== 1 ? "s" : ""}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <div className="text-xs text-stone-400">Alojamiento</div>
                            <div className="text-sm font-medium text-stone-700">{fmt(p.alojamiento)}€</div>
                          </div>
                          <div>
                            <div className="text-xs text-stone-400">Comisión</div>
                            <div className="text-sm font-medium text-amber-600">−{fmt(p.comision)}€</div>
                          </div>
                          <div>
                            <div className="text-xs text-stone-400">A liquidar</div>
                            <div className="text-base font-bold text-emerald-700">{fmt(p.neto)}€</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="flex justify-between items-center pt-3 border-t border-stone-200 px-4">
                    <span className="text-sm font-semibold text-stone-700">Total a liquidar</span>
                    <span className="text-lg font-bold text-emerald-700">{fmt(importePropietarios)}€</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HUÉSPEDES */}
          {tab === "huespedes" && (
            <div>
              <div className="text-sm text-stone-500 mb-4">
                Importe total pagado por cada huésped, incluyendo servicios e IVA
              </div>
              {Object.values(porHuesped).length === 0 ? (
                <div className="text-center py-10">
                  <i className="ri-user-heart-line text-4xl text-stone-200 mb-3"></i>
                  <p className="text-stone-400 text-sm">Sin datos en este periodo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.values(porHuesped)
                    .sort((a, b) => b.total - a.total)
                    .map((h) => (
                      <div key={h.nombre} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-sm flex-shrink-0">
                            {h.nombre[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900 text-sm">{h.nombre}</div>
                            <div className="text-stone-400 text-xs">{h.reservas} reserva{h.reservas !== 1 ? "s" : ""}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          {h.servicios > 0 && (
                            <>
                              <div>
                                <div className="text-xs text-stone-400">Servicios</div>
                                <div className="text-sm font-medium text-stone-700">{fmt(h.servicios)}€</div>
                              </div>
                              <div>
                                <div className="text-xs text-stone-400">IVA 10%</div>
                                <div className="text-sm font-medium text-violet-600">{fmt(h.iva)}€</div>
                              </div>
                            </>
                          )}
                          <div>
                            <div className="text-xs text-stone-400">Total pagado</div>
                            <div className="text-base font-bold text-stone-900">{fmt(h.total)}€</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="flex justify-between items-center pt-3 border-t border-stone-200 px-4">
                    <span className="text-sm font-semibold text-stone-700">Total recaudado de huéspedes</span>
                    <span className="text-lg font-bold text-stone-900">{fmt(filtradas.reduce((a, b) => a + (b.precio_total || 0), 0))}€</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* IVA */}
          {tab === "iva" && (
            <div className="space-y-5">
              {/* IVA Comisiones NEXURA */}
              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <i className="ri-percent-line text-amber-500"></i>
                  IVA 21% sobre comisiones NEXURA (mediación digital)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="text-xs text-amber-600 mb-1">Comisión bruta total</div>
                    <div className="text-2xl font-bold text-amber-700">{fmt(totalComisionNexura)}€</div>
                    <div className="text-xs text-amber-500 mt-1">Base imponible</div>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-4">
                    <div className="text-xs text-rose-600 mb-1">IVA 21% a declarar</div>
                    <div className="text-2xl font-bold text-rose-700">{fmt(ivaComisionNexura)}€</div>
                    <div className="text-xs text-rose-400 mt-1">Modelo 303 trimestral</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="text-xs text-emerald-600 mb-1">Ganancia neta NEXURA</div>
                    <div className="text-2xl font-bold text-emerald-700">{fmt(gananciaNetaIVA)}€</div>
                    <div className="text-xs text-emerald-500 mt-1">Después de IVA 21%</div>
                  </div>
                </div>

                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="text-left py-2.5 text-xs font-medium text-stone-500">Categoría</th>
                        <th className="text-right py-2.5 text-xs font-medium text-stone-500">Reservas</th>
                        <th className="text-right py-2.5 text-xs font-medium text-stone-500">Base imponible</th>
                        <th className="text-right py-2.5 text-xs font-medium text-stone-500">IVA 21%</th>
                        <th className="text-right py-2.5 text-xs font-medium text-stone-500">Total c/IVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Propiedades / Apartamentos", reservas: filtradas.length, base: totalComisionProp, iva: Math.round(totalComisionProp * 0.21) },
                        { label: "Barcos y Catamaranes", reservas: barcoFiltradas.length, base: totalComisionBarcos, iva: totalIVAComisionBarcos },
                        { label: "Hostales", reservas: 0, base: 0, iva: 0 },
                        { label: "Camping", reservas: 0, base: 0, iva: 0 },
                        { label: "Inmobiliarias (cuotas)", reservas: inmoActivas.length, base: ingresos_inmo_neto, iva: Math.round(iva_inmo) },
                      ].map((row) => (
                        <tr key={row.label} className="border-b border-stone-50">
                          <td className="py-3 text-stone-800 font-medium">{row.label}</td>
                          <td className="py-3 text-right text-stone-500">{row.reservas}</td>
                          <td className="py-3 text-right text-stone-700">{fmt(row.base)}€</td>
                          <td className="py-3 text-right text-rose-600 font-medium">{fmt(row.iva)}€</td>
                          <td className="py-3 text-right text-stone-900 font-semibold">{fmt(row.base + row.iva)}€</td>
                        </tr>
                      ))}
                      <tr className="bg-stone-50">
                        <td className="py-3 font-bold text-stone-900" colSpan={2}>TOTAL</td>
                        <td className="py-3 text-right font-bold text-stone-900">{fmt(totalComisionNexura + ingresos_inmo_neto)}€</td>
                        <td className="py-3 text-right font-bold text-rose-700">{fmt(ivaComisionNexura + Math.round(iva_inmo))}€</td>
                        <td className="py-3 text-right font-bold text-stone-900">{fmt(totalComisionNexura + ivaComisionNexura + ingresos_inmo_bruto)}€</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* IVA Servicios adicionales */}
              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <i className="ri-service-line text-violet-500"></i>
                  IVA 10% sobre servicios adicionales de alojamiento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-stone-50 rounded-xl p-4">
                    <div className="text-xs text-stone-500 mb-1">Base imponible servicios</div>
                    <div className="text-2xl font-bold text-stone-900">{fmt(totalServicios)}€</div>
                    <div className="text-xs text-stone-400 mt-1">Limpieza + sábanas + hostelería</div>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-4">
                    <div className="text-xs text-violet-600 mb-1">IVA 10% a declarar</div>
                    <div className="text-2xl font-bold text-violet-700">{fmt(totalIVAServicios)}€</div>
                    <div className="text-xs text-violet-400 mt-1">Modelo 303 trimestral</div>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <div className="text-xs text-stone-500 mb-1">Alojamiento exento</div>
                    <div className="text-2xl font-bold text-stone-900">{fmt(totalAlojamiento)}€</div>
                    <div className="text-xs text-stone-400 mt-1">Art. 20.Uno.23.b) Ley 37/1992</div>
                  </div>
                </div>
              </div>

              {/* Resumen total IVA */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                  <i className="ri-government-line"></i>
                  Resumen IVA total a declarar (Modelo 303)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-rose-700">
                    <span>IVA 21% sobre comisiones NEXURA (mediación)</span>
                    <span className="font-semibold">{fmt(ivaComisionNexura)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-rose-700">
                    <span>IVA 10% sobre servicios adicionales</span>
                    <span className="font-semibold">{fmt(totalIVAServicios)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-rose-700">
                    <span>IVA 21% barcos (incluido en comisión)</span>
                    <span className="font-semibold">{fmt(totalIVAComisionBarcos)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-rose-700">
                    <span>IVA 21% cuotas inmobiliarias</span>
                    <span className="font-semibold">{fmt(Math.round(iva_inmo))}€</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-900 pt-2 border-t border-rose-200 text-base">
                    <span>TOTAL IVA A DECLARAR</span>
                    <span>{fmt(totalIVA + ivaComisionNexura + Math.round(iva_inmo))}€</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <i className="ri-information-line text-amber-500 mt-0.5 flex-shrink-0"></i>
                <div className="text-xs text-amber-700 leading-relaxed">
                  <strong>Nota fiscal:</strong> El alojamiento vacacional está exento de IVA (art. 20.Uno.23.b Ley 37/1992). Los servicios de limpieza y hostelería tributan al 10% (art. 91.Uno.2.2.º). Las comisiones de mediación digital de NEXURA y las cuotas de inmobiliarias tributan al tipo general del 21% como prestación de servicios.
                </div>
              </div>
            </div>
          )}

          {/* INMOBILIARIAS */}
          {tab === "inmobiliarias" && (
            <div className="space-y-6">
              {/* KPIs inmobiliarias */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Activas", value: inmoActivas.length, color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: "ri-check-double-line" },
                  { label: "Pendientes revisión", value: inmoPendientes.length, color: "bg-amber-50 border-amber-200 text-amber-700", icon: "ri-time-line" },
                  { label: "Rechazadas", value: inmoRechazadas.length, color: "bg-red-50 border-red-200 text-red-700", icon: "ri-close-circle-line" },
                  { label: "Total registradas", value: inmoSubs.length, color: "bg-stone-50 border-stone-200 text-stone-700", icon: "ri-building-2-line" },
                ].map((s) => (
                  <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className={`${s.icon} text-lg`}></i>
                    </div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs mt-0.5 opacity-80">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Ingresos por plan */}
              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <i className="ri-pie-chart-line text-violet-500"></i>
                  Ingresos mensuales por plan (inmobiliarias activas)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {Object.values(porPlan).map((p) => (
                    <div key={p.label} className="bg-white border border-stone-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-stone-800">{p.label}</span>
                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">{p.count} activas</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-stone-500">
                          <span>Precio c/IVA</span>
                          <span className="font-semibold text-stone-800">{p.precio}€/mes</span>
                        </div>
                        <div className="flex justify-between text-xs text-stone-500">
                          <span>Neto NEXURA</span>
                          <span className="font-semibold text-emerald-700">{p.neto}€/mes</span>
                        </div>
                        <div className="flex justify-between text-xs text-stone-500">
                          <span>IVA 21%</span>
                          <span className="font-semibold text-rose-600">{fmt(p.precio - p.neto)}€/mes</span>
                        </div>
                        <div className="pt-2 border-t border-stone-100 flex justify-between text-xs">
                          <span className="text-stone-500">Total mensual</span>
                          <span className="font-bold text-violet-700">{fmt(p.precio * p.count)}€</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-violet-600 mb-1">Facturación mensual bruta</div>
                      <div className="text-2xl font-bold text-violet-800">{fmt(ingresos_inmo_bruto)}€</div>
                      <div className="text-xs text-violet-500 mt-0.5">IVA incluido</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-rose-600 mb-1">IVA 21% a declarar</div>
                      <div className="text-2xl font-bold text-rose-700">{fmt(Math.round(iva_inmo))}€</div>
                      <div className="text-xs text-rose-400 mt-0.5">Modelo 303</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-emerald-600 mb-1">Neto NEXURA mensual</div>
                      <div className="text-2xl font-bold text-emerald-700">{fmt(ingresos_inmo_neto)}€</div>
                      <div className="text-xs text-emerald-500 mt-0.5">Después de IVA</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de inmobiliarias */}
              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <i className="ri-list-check text-stone-500"></i>
                  Listado de inmobiliarias registradas
                </h4>
                {inmoSubs.length === 0 ? (
                  <div className="text-center py-10">
                    <i className="ri-building-2-line text-4xl text-stone-200 mb-3"></i>
                    <p className="text-stone-400 text-sm">No hay inmobiliarias registradas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-100">
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Inmobiliaria</th>
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Plan</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">Cuota/mes</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">Neto</th>
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Método pago</th>
                          <th className="text-center py-2.5 text-xs font-medium text-stone-500">Estado</th>
                          <th className="text-center py-2.5 text-xs font-medium text-stone-500">Justificante</th>
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Próximo pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inmoSubs.map((s) => {
                          const precio = PLAN_PRECIO[s.plan] || 0;
                          const neto = PLAN_NETO[s.plan] || 0;
                          const estadoConfig: Record<string, { label: string; cls: string }> = {
                            activo: { label: "Activo", cls: "bg-emerald-100 text-emerald-700" },
                            pendiente: { label: "Pendiente", cls: "bg-amber-100 text-amber-700" },
                            inactivo: { label: "Inactivo", cls: "bg-stone-100 text-stone-500" },
                          };
                          const justConfig: Record<string, { label: string; cls: string }> = {
                            aprobado: { label: "Aprobado", cls: "bg-emerald-100 text-emerald-700" },
                            pendiente_revision: { label: "En revisión", cls: "bg-amber-100 text-amber-700" },
                            rechazado: { label: "Rechazado", cls: "bg-red-100 text-red-700" },
                            sin_justificante: { label: "Sin justif.", cls: "bg-stone-100 text-stone-400" },
                          };
                          const ec = estadoConfig[s.estado] || { label: s.estado, cls: "bg-stone-100 text-stone-500" };
                          const jc = justConfig[s.justificante_estado || "sin_justificante"] || justConfig.sin_justificante;
                          return (
                            <tr key={s.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                              <td className="py-3 text-stone-800 font-medium max-w-36 truncate">{s.nombre_inmobiliaria}</td>
                              <td className="py-3 text-stone-600">{PLAN_LABELS[s.plan] || s.plan}</td>
                              <td className="py-3 text-right font-semibold text-stone-900">{precio}€</td>
                              <td className="py-3 text-right text-emerald-700 font-semibold">{fmt(neto)}€</td>
                              <td className="py-3 text-stone-500 capitalize">{s.metodo_pago || "—"}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ec.cls}`}>{ec.label}</span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${jc.cls}`}>{jc.label}</span>
                              </td>
                              <td className="py-3 text-stone-400 text-xs">
                                {s.fecha_proximo_pago
                                  ? new Date(s.fecha_proximo_pago).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETALLE RESERVAS */}
          {tab === "detalle" && (
            <div className="space-y-6">
              {/* Propiedades */}
              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <i className="ri-building-line text-stone-500"></i>
                  Propiedades ({filtradas.length})
                </h4>
                {filtradas.length === 0 ? (
                  <p className="text-stone-400 text-sm text-center py-4">Sin reservas en este periodo</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-100">
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Propiedad</th>
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Huésped</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">Alojamiento</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">Comisión</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">IVA 21%</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">Total</th>
                          <th className="text-center py-2.5 text-xs font-medium text-stone-500">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtradas.map((b) => {
                          const com = b.comision_nexura || 0;
                          const ivaC = Math.round(com * 0.21);
                          return (
                            <tr key={b.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                              <td className="py-3 text-stone-800 font-medium max-w-32 truncate">{b.propiedad_nombre || "—"}</td>
                              <td className="py-3 text-stone-600 max-w-28 truncate">{b.huesped_nombre || "—"}</td>
                              <td className="py-3 text-right text-stone-700">{fmt(b.subtotal_alojamiento || b.precio_total || 0)}€</td>
                              <td className="py-3 text-right text-amber-600">{com ? `${fmt(com)}€` : "—"}</td>
                              <td className="py-3 text-right text-rose-500 text-xs">{com ? `${fmt(ivaC)}€` : "—"}</td>
                              <td className="py-3 text-right font-bold text-stone-900">{fmt(b.precio_total || 0)}€</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[b.estado] || "bg-stone-100 text-stone-600"}`}>
                                  {b.estado}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Barcos */}
              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <i className="ri-sailboat-line text-sky-500"></i>
                  Barcos y Catamaranes ({barcoFiltradas.length})
                </h4>
                {barcoFiltradas.length === 0 ? (
                  <p className="text-stone-400 text-sm text-center py-4">Sin reservas en este periodo</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-100">
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Embarcación</th>
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Cliente</th>
                          <th className="text-left py-2.5 text-xs font-medium text-stone-500">Fecha</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">Base</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">Comisión 15%</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">IVA 21%</th>
                          <th className="text-right py-2.5 text-xs font-medium text-stone-500">Total</th>
                          <th className="text-center py-2.5 text-xs font-medium text-stone-500">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {barcoFiltradas.map((b) => (
                          <tr key={b.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                            <td className="py-3 text-stone-800 font-medium max-w-32 truncate">{b.barco_nombre}</td>
                            <td className="py-3 text-stone-600 max-w-28 truncate">{b.cliente_nombre || "—"}</td>
                            <td className="py-3 text-stone-500 text-xs">{b.fecha_reserva}</td>
                            <td className="py-3 text-right text-stone-700">{fmt(b.precio_base)}€</td>
                            <td className="py-3 text-right text-amber-600">{fmt(b.comision_nexura)}€</td>
                            <td className="py-3 text-right text-rose-500 text-xs">{fmt(b.iva_comision)}€</td>
                            <td className="py-3 text-right font-bold text-stone-900">{fmt(b.precio_total)}€</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[b.estado] || "bg-stone-100 text-stone-600"}`}>
                                {b.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
