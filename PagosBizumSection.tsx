import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type PagoBizum = {
  id: string;
  tipo: "propiedad" | "barco" | "hostal" | "camping" | "inmobiliaria";
  concepto: string;
  nombre_cliente: string | null;
  telefono_cliente: string | null;
  importe_bruto: number;
  base_imponible: number;
  iva_tipo: number;
  iva_importe: number;
  neto: number;
  estado: "pendiente" | "verificado" | "rechazado";
  fecha: string;
  nota: string | null;
  archivo_nombre: string | null;
  archivo_url?: string | null;
  // Desglose legal
  desglose: {
    alojamiento?: number;
    comision_nexura?: number;
    iva_comision?: number;
    servicios?: number;
    iva_servicios?: number;
  };
};

type TabFiltro = "todos" | "pendiente" | "verificado" | "rechazado";
type TipoFiltro = "todos" | "propiedad" | "barco" | "hostal" | "camping" | "inmobiliaria";

const TIPO_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  propiedad: { label: "Propiedad", icon: "ri-building-line", color: "text-stone-600", bg: "bg-stone-100" },
  barco: { label: "Barco", icon: "ri-sailboat-line", color: "text-sky-600", bg: "bg-sky-100" },
  hostal: { label: "Hostal", icon: "ri-hotel-line", color: "text-amber-600", bg: "bg-amber-100" },
  camping: { label: "Camping", icon: "ri-tent-line", color: "text-emerald-600", bg: "bg-emerald-100" },
  inmobiliaria: { label: "Inmobiliaria", icon: "ri-building-2-line", color: "text-violet-600", bg: "bg-violet-100" },
};

const ESTADO_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-amber-100 text-amber-700", icon: "ri-time-line" },
  verificado: { label: "Verificado", cls: "bg-emerald-100 text-emerald-700", icon: "ri-check-double-line" },
  rechazado: { label: "Rechazado", cls: "bg-red-100 text-red-700", icon: "ri-close-circle-line" },
};

// ─── Datos mock mientras no hay tabla dedicada ────────────────────────────────
// Los pagos Bizum se construyen a partir de bookings con metodo_pago = 'bizum'
// y de inmobiliarias_suscripciones con metodo_pago = 'bizum'

function calcDesglosePropiedad(precioTotal: number, subtotalAlojamiento: number, comisionNexura: number, subtotalServicios: number, ivaServicios: number) {
  return {
    alojamiento: subtotalAlojamiento,
    comision_nexura: comisionNexura,
    iva_comision: Math.round(comisionNexura * 0.21),
    servicios: subtotalServicios,
    iva_servicios: ivaServicios,
  };
}

function calcDesgloseBarco(precioBase: number, comisionNexura: number, ivaComision: number) {
  return {
    alojamiento: precioBase,
    comision_nexura: comisionNexura,
    iva_comision: ivaComision,
  };
}

function calcDesgloseInmo(precio: number) {
  const neto = Math.round((precio / 1.21) * 100) / 100;
  const iva = Math.round((precio - neto) * 100) / 100;
  return { alojamiento: neto, iva_comision: iva };
}

const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PagosBizumSection() {
  const [pagos, setPagos] = useState<PagoBizum[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabFiltro, setTabFiltro] = useState<TabFiltro>("todos");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("todos");
  const [pagoDetalle, setPagoDetalle] = useState<PagoBizum | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    setLoading(true);
    const [
      { data: bookings },
      { data: barcoBookings },
      { data: hostalBookings },
      { data: campingBookings },
      { data: inmoSubs },
      { data: bizumJustificantes },
    ] = await Promise.all([
      supabase.from("bookings").select("id,propiedad_nombre,huesped_nombre,fecha_inicio,precio_total,subtotal_alojamiento,comision_nexura,subtotal_servicios,iva_servicios,metodo_pago,estado,created_at").eq("metodo_pago", "bizum").order("created_at", { ascending: false }),
      supabase.from("barco_bookings").select("id,barco_nombre,cliente_nombre,fecha_reserva,precio_total,precio_base,comision_nexura,iva_comision,metodo_pago,estado,created_at").eq("metodo_pago", "bizum").order("created_at", { ascending: false }),
      supabase.from("hostal_bookings").select("id,hostal_nombre,huesped_nombre,fecha_entrada,precio_total,metodo_pago,estado,created_at").eq("metodo_pago", "bizum").order("created_at", { ascending: false }),
      supabase.from("camping_bookings").select("id,camping_nombre,huesped_nombre,fecha_entrada,precio_total,metodo_pago,estado,created_at").eq("metodo_pago", "bizum").order("created_at", { ascending: false }),
      supabase.from("inmobiliarias_suscripciones").select("id,nombre_inmobiliaria,plan,precio_plan,metodo_pago,justificante_estado,created_at").eq("metodo_pago", "bizum").order("created_at", { ascending: false }),
      supabase.from("bizum_justificantes").select("id,nombre_cliente,telefono_cliente,concepto,importe,tipo_reserva,nota_cliente,archivo_url,archivo_nombre,archivo_tipo,estado,created_at").order("created_at", { ascending: false }),
    ]);

    const PLAN_PRECIO: Record<string, number> = { basico: 25, profesional: 50, ilimitado: 95 };

    const lista: PagoBizum[] = [
      ...((bookings || []).map((b: Record<string, unknown>) => {
        const aloj = (b.subtotal_alojamiento as number) || (b.precio_total as number) || 0;
        const com = (b.comision_nexura as number) || 0;
        const serv = (b.subtotal_servicios as number) || 0;
        const ivaS = (b.iva_servicios as number) || 0;
        const ivaC = Math.round(com * 0.21);
        return {
          id: b.id as string,
          tipo: "propiedad" as const,
          concepto: `Reserva ${b.propiedad_nombre || "Propiedad"}`,
          nombre_cliente: b.huesped_nombre as string | null,
          telefono_cliente: null,
          importe_bruto: (b.precio_total as number) || 0,
          base_imponible: aloj,
          iva_tipo: 21,
          iva_importe: ivaC + ivaS,
          neto: aloj - com,
          estado: (b.estado === "confirmada" ? "verificado" : b.estado === "cancelada" ? "rechazado" : "pendiente") as PagoBizum["estado"],
          fecha: (b.created_at as string)?.split("T")[0] || "",
          nota: null,
          archivo_nombre: null,
          desglose: calcDesglosePropiedad(b.precio_total as number, aloj, com, serv, ivaS),
        };
      })),
      ...((barcoBookings || []).map((b: Record<string, unknown>) => {
        const base = (b.precio_base as number) || 0;
        const com = (b.comision_nexura as number) || 0;
        const ivaC = (b.iva_comision as number) || 0;
        return {
          id: b.id as string,
          tipo: "barco" as const,
          concepto: `Reserva ${b.barco_nombre || "Barco"}`,
          nombre_cliente: b.cliente_nombre as string | null,
          telefono_cliente: null,
          importe_bruto: (b.precio_total as number) || 0,
          base_imponible: base,
          iva_tipo: 21,
          iva_importe: ivaC,
          neto: base - com,
          estado: (b.estado === "confirmada" ? "verificado" : b.estado === "cancelada" ? "rechazado" : "pendiente") as PagoBizum["estado"],
          fecha: (b.created_at as string)?.split("T")[0] || "",
          nota: null,
          archivo_nombre: null,
          desglose: calcDesgloseBarco(base, com, ivaC),
        };
      })),
      ...((hostalBookings || []).map((b: Record<string, unknown>) => {
        const total = (b.precio_total as number) || 0;
        const com = Math.round(total * 0.15 / 1.15);
        const ivaC = Math.round(com * 0.21);
        return {
          id: b.id as string,
          tipo: "hostal" as const,
          concepto: `Reserva ${b.hostal_nombre || "Hostal"}`,
          nombre_cliente: b.huesped_nombre as string | null,
          telefono_cliente: null,
          importe_bruto: total,
          base_imponible: total - com,
          iva_tipo: 21,
          iva_importe: ivaC,
          neto: total - com - ivaC,
          estado: (b.estado === "confirmada" ? "verificado" : b.estado === "cancelada" ? "rechazado" : "pendiente") as PagoBizum["estado"],
          fecha: (b.created_at as string)?.split("T")[0] || "",
          nota: null,
          archivo_nombre: null,
          desglose: { alojamiento: total - com, comision_nexura: com, iva_comision: ivaC },
        };
      })),
      ...((campingBookings || []).map((b: Record<string, unknown>) => {
        const total = (b.precio_total as number) || 0;
        const com = Math.round(total * 0.15 / 1.15);
        const ivaC = Math.round(com * 0.21);
        return {
          id: b.id as string,
          tipo: "camping" as const,
          concepto: `Reserva ${b.camping_nombre || "Camping"}`,
          nombre_cliente: b.huesped_nombre as string | null,
          telefono_cliente: null,
          importe_bruto: total,
          base_imponible: total - com,
          iva_tipo: 21,
          iva_importe: ivaC,
          neto: total - com - ivaC,
          estado: (b.estado === "confirmada" ? "verificado" : b.estado === "cancelada" ? "rechazado" : "pendiente") as PagoBizum["estado"],
          fecha: (b.created_at as string)?.split("T")[0] || "",
          nota: null,
          archivo_nombre: null,
          desglose: { alojamiento: total - com, comision_nexura: com, iva_comision: ivaC },
        };
      })),
      ...((inmoSubs || []).map((s: Record<string, unknown>) => {
        const precio = (s.precio_plan as number) || PLAN_PRECIO[s.plan as string] || 0;
        const d = calcDesgloseInmo(precio);
        const jEst = s.justificante_estado as string;
        return {
          id: s.id as string,
          tipo: "inmobiliaria" as const,
          concepto: `Plan ${s.plan} NEXURA — ${s.nombre_inmobiliaria}`,
          nombre_cliente: s.nombre_inmobiliaria as string | null,
          telefono_cliente: null,
          importe_bruto: precio,
          base_imponible: d.alojamiento || 0,
          iva_tipo: 21,
          iva_importe: d.iva_comision || 0,
          neto: d.alojamiento || 0,
          estado: (jEst === "aprobado" ? "verificado" : jEst === "rechazado" ? "rechazado" : "pendiente") as PagoBizum["estado"],
          fecha: (s.created_at as string)?.split("T")[0] || "",
          nota: null,
          archivo_nombre: null,
          desglose: d,
        };
      })),
      // Justificantes Bizum subidos directamente por clientes
      ...((bizumJustificantes || []).map((j: Record<string, unknown>) => {
        const imp = (j.importe as number) || 0;
        const com = Math.round(imp * 0.05);
        const ivaC = Math.round(com * 0.21);
        const tipoR = (j.tipo_reserva as string) || "propiedad";
        return {
          id: `bj-${j.id as string}`,
          tipo: (tipoR as PagoBizum["tipo"]) || "propiedad",
          concepto: (j.concepto as string) || "Pago Bizum",
          nombre_cliente: j.nombre_cliente as string | null,
          telefono_cliente: j.telefono_cliente as string | null,
          importe_bruto: imp,
          base_imponible: imp - com,
          iva_tipo: 21,
          iva_importe: ivaC,
          neto: imp - com - ivaC,
          estado: (j.estado as PagoBizum["estado"]) || "pendiente",
          fecha: (j.created_at as string)?.split("T")[0] || "",
          nota: j.nota_cliente as string | null,
          archivo_nombre: j.archivo_nombre as string | null,
          archivo_url: j.archivo_url as string | null,
          desglose: {
            alojamiento: imp - com,
            comision_nexura: com,
            iva_comision: ivaC,
          },
        };
      })),
    ];

    setPagos(lista);
    setLoading(false);
  };

  const cambiarEstado = async (pago: PagoBizum, nuevoEstado: PagoBizum["estado"]) => {
    setActualizando(pago.id);
    try {
      // Justificante directo de cliente (tabla bizum_justificantes)
      if (pago.id.startsWith("bj-")) {
        const realId = pago.id.replace("bj-", "");
        await supabase.from("bizum_justificantes").update({ estado: nuevoEstado }).eq("id", realId);
        setPagos((prev) => prev.map((p) => p.id === pago.id ? { ...p, estado: nuevoEstado } : p));
        setActualizando(null);
        return;
      }
      if (pago.tipo === "inmobiliaria") {
        await supabase.from("inmobiliarias_suscripciones").update({
          justificante_estado: nuevoEstado === "verificado" ? "aprobado" : nuevoEstado === "rechazado" ? "rechazado" : "pendiente_revision",
          estado: nuevoEstado === "verificado" ? "activo" : "pendiente",
        }).eq("id", pago.id);
      } else if (pago.tipo === "propiedad") {
        await supabase.from("bookings").update({ estado: nuevoEstado === "verificado" ? "confirmada" : nuevoEstado === "rechazado" ? "cancelada" : "pendiente" }).eq("id", pago.id);
      } else if (pago.tipo === "barco") {
        await supabase.from("barco_bookings").update({ estado: nuevoEstado === "verificado" ? "confirmada" : nuevoEstado === "rechazado" ? "cancelada" : "pendiente" }).eq("id", pago.id);
      } else if (pago.tipo === "hostal") {
        await supabase.from("hostal_bookings").update({ estado: nuevoEstado === "verificado" ? "confirmada" : nuevoEstado === "rechazado" ? "cancelada" : "pendiente" }).eq("id", pago.id);
      } else if (pago.tipo === "camping") {
        await supabase.from("camping_bookings").update({ estado: nuevoEstado === "verificado" ? "confirmada" : nuevoEstado === "rechazado" ? "cancelada" : "pendiente" }).eq("id", pago.id);
      }
      setPagos((prev) => prev.map((p) => p.id === pago.id ? { ...p, estado: nuevoEstado } : p));
    } catch { /* silent */ }
    setActualizando(null);
  };

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const pagosFiltrados = pagos.filter((p) => {
    if (tabFiltro !== "todos" && p.estado !== tabFiltro) return false;
    if (tipoFiltro !== "todos" && p.tipo !== tipoFiltro) return false;
    return true;
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const totalBruto = pagos.reduce((a, p) => a + p.importe_bruto, 0);
  const totalIVA = pagos.reduce((a, p) => a + p.iva_importe, 0);
  const totalNeto = pagos.reduce((a, p) => a + p.neto, 0);
  const pendientes = pagos.filter((p) => p.estado === "pendiente").length;

  // ── IVA por tipo ─────────────────────────────────────────────────────────────
  const ivaAnfitrion = pagos
    .filter((p) => ["propiedad", "barco", "hostal", "camping"].includes(p.tipo))
    .reduce((a, p) => a + (p.desglose.iva_comision || 0), 0);
  const ivaHuesped = pagos
    .filter((p) => ["propiedad", "barco", "hostal", "camping"].includes(p.tipo))
    .reduce((a, p) => a + (p.desglose.iva_servicios || 0), 0);
  const ivaInmo = pagos
    .filter((p) => p.tipo === "inmobiliaria")
    .reduce((a, p) => a + p.iva_importe, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-stone-100 rounded animate-pulse"></div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 animate-pulse h-24"></div>
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
          <h2 className="text-xl font-semibold text-stone-900">Pagos por Bizum</h2>
          <p className="text-stone-500 text-sm mt-0.5">Todos los pagos recibidos por Bizum con desglose legal de IVA</p>
        </div>
        <Link
          to="/confirmacion-bizum"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-upload-cloud-2-line"></i>
          Subir justificante
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-3">
            <i className="ri-smartphone-line text-lg"></i>
          </div>
          <div className="text-2xl font-bold text-stone-900">{fmt(totalBruto)}€</div>
          <div className="text-stone-500 text-xs mt-0.5">Total recibido Bizum</div>
          <div className="text-stone-400 text-xs mt-1">{pagos.length} pagos registrados</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-3">
            <i className="ri-government-line text-lg"></i>
          </div>
          <div className="text-2xl font-bold text-stone-900">{fmt(totalIVA)}€</div>
          <div className="text-stone-500 text-xs mt-0.5">IVA total recaudado</div>
          <div className="text-stone-400 text-xs mt-1">A declarar Mod. 303</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 mb-3">
            <i className="ri-time-line text-lg"></i>
          </div>
          <div className="text-2xl font-bold text-stone-900">{pendientes}</div>
          <div className="text-stone-500 text-xs mt-0.5">Pendientes de verificar</div>
          <div className="text-stone-400 text-xs mt-1">Justificantes por revisar</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 text-white mb-3">
            <i className="ri-money-euro-circle-line text-lg"></i>
          </div>
          <div className="text-2xl font-bold text-white">{fmt(totalNeto)}€</div>
          <div className="text-emerald-100 text-xs mt-0.5">Neto NEXURA</div>
          <div className="text-emerald-200 text-xs mt-1">Después de IVA</div>
        </div>
      </div>

      {/* IVA desglosado por origen */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <i className="ri-government-line text-rose-500"></i>
          IVA recaudado por Bizum — Desglose legal (Ley 37/1992)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* IVA anfitrión */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <i className="ri-user-star-line text-sm"></i>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-800">IVA comisión anfitrión</p>
                <p className="text-xs text-amber-600">21% sobre comisión NEXURA</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-700">{fmt(ivaAnfitrion)}€</div>
            <p className="text-xs text-amber-500 mt-1">Mediación digital — Art. 69 Ley 37/1992</p>
          </div>
          {/* IVA huésped */}
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <i className="ri-user-heart-line text-sm"></i>
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-800">IVA servicios huésped</p>
                <p className="text-xs text-violet-600">10% sobre servicios adicionales</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-violet-700">{fmt(ivaHuesped)}€</div>
            <p className="text-xs text-violet-500 mt-1">Limpieza/hostelería — Art. 91.Uno.2 Ley 37/1992</p>
          </div>
          {/* IVA inmobiliarias */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <i className="ri-building-2-line text-sm"></i>
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-800">IVA cuotas inmobiliarias</p>
                <p className="text-xs text-rose-600">21% sobre cuota mensual</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-700">{fmt(ivaInmo)}€</div>
            <p className="text-xs text-rose-500 mt-1">Servicios plataforma — Tipo general 21%</p>
          </div>
        </div>

        {/* Tabla resumen IVA */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left py-2.5 text-xs font-medium text-stone-500">Concepto</th>
                <th className="text-left py-2.5 text-xs font-medium text-stone-500">Base legal</th>
                <th className="text-right py-2.5 text-xs font-medium text-stone-500">Tipo IVA</th>
                <th className="text-right py-2.5 text-xs font-medium text-stone-500">IVA recaudado</th>
                <th className="text-right py-2.5 text-xs font-medium text-stone-500">Neto</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  concepto: "Alojamiento vacacional",
                  base: "Art. 20.Uno.23.b) Ley 37/1992",
                  tipo: "Exento",
                  iva: 0,
                  neto: pagos.filter(p => ["propiedad","hostal","camping"].includes(p.tipo)).reduce((a, p) => a + (p.desglose.alojamiento || 0), 0),
                  cls: "text-stone-400",
                },
                {
                  concepto: "Comisión mediación NEXURA (anfitrión)",
                  base: "Art. 69 Ley 37/1992 — Mediación digital",
                  tipo: "21%",
                  iva: ivaAnfitrion,
                  neto: pagos.reduce((a, p) => a + (p.desglose.comision_nexura || 0), 0),
                  cls: "text-rose-600 font-semibold",
                },
                {
                  concepto: "Servicios adicionales (huésped)",
                  base: "Art. 91.Uno.2.2.º Ley 37/1992 — Hostelería",
                  tipo: "10%",
                  iva: ivaHuesped,
                  neto: pagos.reduce((a, p) => a + (p.desglose.servicios || 0), 0),
                  cls: "text-rose-600 font-semibold",
                },
                {
                  concepto: "Cuotas inmobiliarias",
                  base: "Tipo general — Servicios plataforma digital",
                  tipo: "21%",
                  iva: ivaInmo,
                  neto: pagos.filter(p => p.tipo === "inmobiliaria").reduce((a, p) => a + p.neto, 0),
                  cls: "text-rose-600 font-semibold",
                },
              ].map((row) => (
                <tr key={row.concepto} className="border-b border-stone-50">
                  <td className="py-3 text-stone-800 font-medium text-xs">{row.concepto}</td>
                  <td className="py-3 text-stone-400 text-xs max-w-48">{row.base}</td>
                  <td className="py-3 text-right text-xs font-semibold text-stone-600">{row.tipo}</td>
                  <td className={`py-3 text-right text-xs ${row.cls}`}>{fmt(row.iva)}€</td>
                  <td className="py-3 text-right text-xs font-semibold text-stone-900">{fmt(row.neto)}€</td>
                </tr>
              ))}
              <tr className="bg-rose-50">
                <td className="py-3 font-bold text-stone-900 text-sm" colSpan={3}>TOTAL IVA A DECLARAR (Mod. 303)</td>
                <td className="py-3 text-right font-bold text-rose-700 text-sm">{fmt(totalIVA)}€</td>
                <td className="py-3 text-right font-bold text-stone-900 text-sm">{fmt(totalNeto)}€</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-stone-100">
          {/* Estado tabs */}
          <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1">
            {(["todos", "pendiente", "verificado", "rechazado"] as TabFiltro[]).map((t) => (
              <button
                key={t}
                onClick={() => setTabFiltro(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${
                  tabFiltro === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {t === "todos" ? "Todos" : t === "pendiente" ? "Pendientes" : t === "verificado" ? "Verificados" : "Rechazados"}
                {t === "pendiente" && pendientes > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">{pendientes}</span>
                )}
              </button>
            ))}
          </div>
          {/* Tipo filtro */}
          <div className="flex items-center gap-1 flex-wrap">
            {(["todos", "propiedad", "barco", "hostal", "camping", "inmobiliaria"] as TipoFiltro[]).map((t) => (
              <button
                key={t}
                onClick={() => setTipoFiltro(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  tipoFiltro === t
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
              >
                {t === "todos" ? "Todos los tipos" : TIPO_CONFIG[t]?.label || t}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de pagos */}
        <div className="divide-y divide-stone-50">
          {pagosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-stone-100 text-stone-300 mx-auto mb-3">
                <i className="ri-smartphone-line text-2xl"></i>
              </div>
              <p className="text-stone-400 text-sm">No hay pagos Bizum con estos filtros</p>
            </div>
          ) : (
            pagosFiltrados.map((pago) => {
              const tc = TIPO_CONFIG[pago.tipo];
              const ec = ESTADO_CONFIG[pago.estado];
              return (
                <div key={pago.id} className="p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icono tipo */}
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${tc.bg} ${tc.color}`}>
                      <i className={`${tc.icon} text-base`}></i>
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-sm font-semibold text-stone-900 truncate">{pago.concepto}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {pago.nombre_cliente && (
                              <span className="text-xs text-stone-500 flex items-center gap-1">
                                <i className="ri-user-line text-stone-300"></i>
                                {pago.nombre_cliente}
                              </span>
                            )}
                            <span className="text-xs text-stone-400">{pago.fecha}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.bg} ${tc.color}`}>{tc.label}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-bold text-stone-900">{fmt(pago.importe_bruto)}€</div>
                          <div className="text-xs text-rose-500">IVA: {fmt(pago.iva_importe)}€</div>
                        </div>
                      </div>

                      {/* Desglose legal compacto */}
                      <div className="bg-stone-50 rounded-xl p-3 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {pago.desglose.alojamiento !== undefined && (
                          <div>
                            <p className="text-xs text-stone-400">Alojamiento</p>
                            <p className="text-xs font-semibold text-stone-700">{fmt(pago.desglose.alojamiento)}€ <span className="text-stone-300 font-normal">exento</span></p>
                          </div>
                        )}
                        {pago.desglose.comision_nexura !== undefined && (
                          <div>
                            <p className="text-xs text-stone-400">Comisión NEXURA</p>
                            <p className="text-xs font-semibold text-amber-700">{fmt(pago.desglose.comision_nexura)}€</p>
                          </div>
                        )}
                        {pago.desglose.iva_comision !== undefined && (
                          <div>
                            <p className="text-xs text-stone-400">IVA 21% comisión</p>
                            <p className="text-xs font-semibold text-rose-600">{fmt(pago.desglose.iva_comision)}€</p>
                          </div>
                        )}
                        {pago.desglose.servicios !== undefined && pago.desglose.servicios > 0 && (
                          <div>
                            <p className="text-xs text-stone-400">Servicios + IVA 10%</p>
                            <p className="text-xs font-semibold text-violet-600">{fmt(pago.desglose.servicios)}€ + {fmt(pago.desglose.iva_servicios || 0)}€</p>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${ec.cls}`}>
                          <i className={ec.icon}></i>
                          {ec.label}
                        </span>
                        {pago.estado === "pendiente" && (
                          <>
                            <button
                              onClick={() => cambiarEstado(pago, "verificado")}
                              disabled={actualizando === pago.id}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                            >
                              {actualizando === pago.id ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-check-line"></i>}
                              Verificar pago
                            </button>
                            <button
                              onClick={() => cambiarEstado(pago, "rechazado")}
                              disabled={actualizando === pago.id}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                            >
                              <i className="ri-close-line"></i>
                              Rechazar
                            </button>
                          </>
                        )}
                        {pago.estado === "verificado" && (
                          <button
                            onClick={() => cambiarEstado(pago, "pendiente")}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-refresh-line"></i>
                            Revertir
                          </button>
                        )}
                        <button
                          onClick={() => setPagoDetalle(pagoDetalle?.id === pago.id ? null : pago)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap ml-auto"
                        >
                          <i className={pagoDetalle?.id === pago.id ? "ri-eye-off-line" : "ri-eye-line"}></i>
                          {pagoDetalle?.id === pago.id ? "Ocultar" : "Ver desglose"}
                        </button>
                      </div>

                      {/* Desglose legal completo expandido */}
                      {pagoDetalle?.id === pago.id && (
                        <div className="mt-3 bg-white border border-stone-200 rounded-xl p-4 space-y-4">
                          {/* Datos del cliente */}
                          {(pago.telefono_cliente || pago.nota) && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-1.5">
                              <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                                <i className="ri-user-line"></i> Datos del cliente
                              </p>
                              {pago.telefono_cliente && (
                                <a
                                  href={`https://wa.me/34${pago.telefono_cliente.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-emerald-700 hover:underline cursor-pointer"
                                >
                                  <i className="ri-whatsapp-line text-emerald-500"></i>
                                  {pago.telefono_cliente} — Contactar por WhatsApp
                                </a>
                              )}
                              {pago.nota && (
                                <p className="text-xs text-stone-600 italic">“{pago.nota}”</p>
                              )}
                            </div>
                          )}

                          {/* Justificante adjunto */}
                          {pago.archivo_url && (
                            <div>
                              <p className="text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                                <i className="ri-attachment-line text-amber-500"></i>
                                Justificante adjunto
                              </p>
                              {pago.archivo_nombre?.toLowerCase().endsWith(".pdf") ? (
                                <a
                                  href={pago.archivo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                                >
                                  <i className="ri-file-pdf-line text-red-500 text-xl"></i>
                                  <div>
                                    <p className="text-xs font-semibold text-stone-800">{pago.archivo_nombre}</p>
                                    <p className="text-xs text-stone-400">Abrir PDF</p>
                                  </div>
                                  <i className="ri-external-link-line text-stone-400 ml-auto"></i>
                                </a>
                              ) : (
                                <a href={pago.archivo_url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                                  <img
                                    src={pago.archivo_url}
                                    alt="Justificante Bizum"
                                    className="w-full max-h-48 object-contain rounded-xl border border-stone-200 bg-stone-50"
                                  />
                                  <p className="text-xs text-amber-600 hover:underline mt-1 flex items-center gap-1">
                                    <i className="ri-zoom-in-line"></i> Ver imagen completa
                                  </p>
                                </a>
                              )}
                            </div>
                          )}

                          <p className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-2">
                            <i className="ri-file-text-line text-amber-500"></i>
                            Desglose legal completo — Ley 37/1992 IVA España
                          </p>
                          <div className="space-y-2">
                            {pago.desglose.alojamiento !== undefined && (
                              <div className="flex justify-between items-start py-2 border-b border-stone-50">
                                <div>
                                  <p className="text-xs font-semibold text-stone-800">Alojamiento vacacional</p>
                                  <p className="text-xs text-stone-400">Art. 20.Uno.23.b) Ley 37/1992 — Exento de IVA</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-stone-900">{fmt(pago.desglose.alojamiento)}€</p>
                                  <p className="text-xs text-stone-400">Exento</p>
                                </div>
                              </div>
                            )}
                            {pago.desglose.comision_nexura !== undefined && (
                              <div className="flex justify-between items-start py-2 border-b border-stone-50">
                                <div>
                                  <p className="text-xs font-semibold text-stone-800">Comisión mediación NEXURA</p>
                                  <p className="text-xs text-stone-400">Art. 69 Ley 37/1992 — Mediación digital 21% IVA</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-amber-700">{fmt(pago.desglose.comision_nexura)}€</p>
                                  <p className="text-xs text-rose-500">+ IVA {fmt(pago.desglose.iva_comision || 0)}€</p>
                                </div>
                              </div>
                            )}
                            {pago.desglose.servicios !== undefined && pago.desglose.servicios > 0 && (
                              <div className="flex justify-between items-start py-2 border-b border-stone-50">
                                <div>
                                  <p className="text-xs font-semibold text-stone-800">Servicios adicionales</p>
                                  <p className="text-xs text-stone-400">Art. 91.Uno.2.2.º Ley 37/1992 — Hostelería 10% IVA</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-violet-700">{fmt(pago.desglose.servicios)}€</p>
                                  <p className="text-xs text-rose-500">+ IVA {fmt(pago.desglose.iva_servicios || 0)}€</p>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2">
                              <p className="text-sm font-bold text-stone-900">TOTAL PAGADO</p>
                              <p className="text-lg font-bold text-stone-900">{fmt(pago.importe_bruto)}€</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-rose-600 font-semibold">IVA total incluido</p>
                              <p className="text-sm font-bold text-rose-600">{fmt(pago.iva_importe)}€</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-emerald-600 font-semibold">Neto NEXURA</p>
                              <p className="text-sm font-bold text-emerald-700">{fmt(pago.neto)}€</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
