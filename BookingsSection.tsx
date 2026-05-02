import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { generateBookingSesPdf } from "@/lib/generateSesPdf";

async function syncToNotion(
  action: "create_reserva" | "update_viajeros" | "update_estado" | "add_comprobante",
  booking: Booking,
  notionPageId?: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("notion-sync", {
      body: {
        action,
        booking: {
          id: booking.id,
          propiedad_nombre: booking.propiedad_nombre,
          huesped_nombre: booking.huesped_nombre,
          fecha_inicio: booking.fecha_inicio,
          fecha_fin: booking.fecha_fin,
          estado: booking.estado,
          precio_total: booking.precio_total,
          subtotal_alojamiento: booking.subtotal_alojamiento,
          comision_nexura: booking.comision_nexura,
          subtotal_servicios: booking.subtotal_servicios,
          iva_servicios: booking.iva_servicios,
          servicios_extra: booking.servicios_extra || [],
          num_huespedes: booking.num_huespedes,
          notas: booking.notas,
          mensaje_huesped: booking.mensaje_huesped,
          viajeros: booking.viajeros || [],
          viajeros_completado: booking.viajeros_completado,
          comprobante_pago: booking.comprobante_pago,
          metodo_pago: booking.metodo_pago,
        },
        notion_page_id: notionPageId || null,
      },
    });
    if (error) { console.error("Notion sync error:", error); return null; }
    return (data as { notion_page_id?: string })?.notion_page_id || null;
  } catch (e) {
    console.error("Notion sync failed:", e);
    return null;
  }
}

type BookingEstado = "pendiente" | "confirmada" | "cancelada" | "completada";
type StripePaymentStatus = "unpaid" | "pending" | "paid" | "failed" | null;

interface Viajero {
  id: string;
  nombre: string;
  apellidos: string;
  tipo_documento?: "dni" | "pasaporte" | "nie";
  dni_numero: string;
  fecha_nacimiento: string;
  nacionalidad: string;
  es_menor: boolean;
}

interface ServicioExtra {
  key: string;
  label: string;
  precio: number;
}

interface Booking {
  id: string;
  propiedad_id: string | null;
  propiedad_nombre: string | null;
  huesped_id: string | null;
  huesped_nombre: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: BookingEstado;
  precio_total: number | null;
  subtotal_alojamiento: number | null;
  comision_nexura: number | null;
  subtotal_servicios: number | null;
  iva_servicios: number | null;
  servicios_extra: ServicioExtra[] | null;
  num_huespedes: number | null;
  notas: string | null;
  mensaje_huesped: string | null;
  viajeros: Viajero[] | null;
  viajeros_completado: boolean;
  notion_page_id: string | null;
  comprobante_pago: string | null;
  metodo_pago: string | null;
  stripe_payment_status: StripePaymentStatus;
  stripe_payment_url: string | null;
  stripe_transfer_status: string | null;
  stripe_transfer_id: string | null;
  created_at: string;
}

interface Member {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  tipo: string;
}

interface Property {
  id: string;
  nombre: string;
  direccion: string;
}

const estadoConfig: Record<BookingEstado, { label: string; color: string; icon: string; bg: string }> = {
  pendiente:   { label: "Pendiente",   color: "text-amber-700",   icon: "ri-time-line",          bg: "bg-amber-100" },
  confirmada:  { label: "Confirmada",  color: "text-emerald-700", icon: "ri-check-double-line",   bg: "bg-emerald-100" },
  cancelada:   { label: "Cancelada",   color: "text-red-700",     icon: "ri-close-circle-line",   bg: "bg-red-100" },
  completada:  { label: "Completada",  color: "text-stone-600",   icon: "ri-flag-line",           bg: "bg-stone-100" },
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function diffDays(start: string, end: string) {
  const a = new Date(start);
  const b = new Date(end);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export default function BookingsSection() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState<"todos" | BookingEstado>("todos");
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [notionSyncing, setNotionSyncing] = useState(false);
  const [notionSuccess, setNotionSuccess] = useState<string | null>(null);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [comprobanteForm, setComprobanteForm] = useState({ metodo: "Transferencia", url: "" });
  const [payLoading, setPayLoading] = useState(false);
  const [payMsg, setPayMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [metodoPago, setMetodoPago] = useState<"Revolut" | "Bizum">("Revolut");

  const SERVICIOS_CATALOGO = [
    { key: "limpieza", label: "Servicio de limpieza", precio: 60 },
    { key: "sabanas", label: "Cambio de sábanas", precio: 30 },
    { key: "hosteleria", label: "Servicio de hostelería", precio: 80 },
  ];
  const IVA_RATE = 0.10;

  const emptyForm: Partial<Booking> = {
    propiedad_id: "",
    propiedad_nombre: "",
    huesped_id: "",
    huesped_nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "pendiente",
    precio_total: null,
    subtotal_alojamiento: null,
    comision_nexura: null,
    subtotal_servicios: 0,
    iva_servicios: 0,
    servicios_extra: [],
    num_huespedes: 1,
    notas: "",
    mensaje_huesped: "",
  };
  const [form, setForm] = useState<Partial<Booking>>(emptyForm);
  const [formServicios, setFormServicios] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [bookRes, memRes, propRes] = await Promise.all([
      supabase.from("bookings").select("*").order("fecha_inicio", { ascending: false }),
      supabase.from("members").select("id,nombre,apellidos,email,tipo").eq("tipo", "huesped"),
      supabase.from("properties").select("id,nombre,direccion"),
    ]);
    if (bookRes.data) setBookings(bookRes.data as Booking[]);
    if (memRes.data) setMembers(memRes.data as Member[]);
    if (propRes.data) setProperties(propRes.data as Property[]);
    setLoading(false);
  };

  const filtered = bookings.filter((b) => {
    const matchEstado = filterEstado === "todos" || b.estado === filterEstado;
    const q = search.toLowerCase();
    const matchSearch = !q || (b.huesped_nombre || "").toLowerCase().includes(q) || (b.propiedad_nombre || "").toLowerCase().includes(q);
    return matchEstado && matchSearch;
  });

  const handleMemberSelect = (id: string) => {
    const m = members.find((x) => x.id === id);
    setForm((f) => ({ ...f, huesped_id: id, huesped_nombre: m ? `${m.nombre} ${m.apellidos}` : "" }));
  };

  const handlePropertySelect = (id: string) => {
    const p = properties.find((x) => x.id === id);
    setForm((f) => ({ ...f, propiedad_id: id, propiedad_nombre: p ? p.nombre : "" }));
  };

  const calcFormPrecio = () => {
    const noches = form.fecha_inicio && form.fecha_fin ? diffDays(form.fecha_inicio, form.fecha_fin) : 0;
    const alojamiento = (form.precio_total || 0) > 0 ? (form.precio_total || 0) : 0;
    const subServ = SERVICIOS_CATALOGO
      .filter((s) => formServicios[s.key])
      .reduce((acc, s) => acc + s.precio, 0);
    const ivaServ = Math.round(subServ * IVA_RATE);
    const total = alojamiento + subServ + ivaServ;
    return { alojamiento, subServ, ivaServ, total };
  };

  const toggleFormServicio = (key: string) => {
    setFormServicios((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!form.fecha_inicio || !form.fecha_fin) return;
    setSaving(true);
    const { alojamiento, subServ, ivaServ, total } = calcFormPrecio();
    const serviciosSeleccionados = SERVICIOS_CATALOGO
      .filter((s) => formServicios[s.key])
      .map((s) => ({ key: s.key, label: s.label, precio: s.precio }));
    const payload = {
      propiedad_id: form.propiedad_id || null,
      propiedad_nombre: form.propiedad_nombre || "",
      huesped_id: form.huesped_id || null,
      huesped_nombre: form.huesped_nombre || "",
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      estado: form.estado || "pendiente",
      precio_total: total > 0 ? total : (form.precio_total || null),
      subtotal_alojamiento: alojamiento > 0 ? alojamiento : null,
      comision_nexura: alojamiento > 0 ? Math.round(alojamiento * 0.15) : null,
      subtotal_servicios: subServ,
      iva_servicios: ivaServ,
      servicios_extra: serviciosSeleccionados.length > 0 ? serviciosSeleccionados : null,
      num_huespedes: form.num_huespedes || 1,
      notas: form.notas || "",
      mensaje_huesped: form.mensaje_huesped || "",
      updated_at: new Date().toISOString(),
    };

    if (editMode && selected) {
      const { error } = await supabase.from("bookings").update(payload).eq("id", selected.id);
      if (!error) {
        setBookings((prev) => prev.map((b) => b.id === selected.id ? { ...b, ...payload } as Booking : b));
        setSelected((prev) => prev ? { ...prev, ...payload } as Booking : null);
      }
    } else {
      const { data, error } = await supabase.from("bookings").insert(payload).select().maybeSingle();
      if (!error && data) {
        const newBooking = data as Booking;
        setBookings((prev) => [newBooking, ...prev]);
        // Sync to Notion
        const notionId = await syncToNotion("create_reserva", newBooking);
        if (notionId) {
          await supabase.from("bookings").update({ notion_page_id: notionId }).eq("id", newBooking.id);
          setBookings((prev) => prev.map((b) => b.id === newBooking.id ? { ...b, notion_page_id: notionId } : b));
        }
        // Send WhatsApp notification
        try {
          const nights = newBooking.fecha_inicio && newBooking.fecha_fin ? diffDays(newBooking.fecha_inicio, newBooking.fecha_fin) : null;
          await supabase.functions.invoke("whatsapp-notify", {
            body: {
              propiedad: newBooking.propiedad_nombre,
              huesped: newBooking.huesped_nombre,
              fecha_inicio: formatDate(newBooking.fecha_inicio),
              fecha_fin: formatDate(newBooking.fecha_fin),
              noches: nights,
              precio_total: newBooking.precio_total,
              num_huespedes: newBooking.num_huespedes,
              estado: estadoConfig[newBooking.estado]?.label || newBooking.estado,
              mensaje_huesped: newBooking.mensaje_huesped,
            },
          });
        } catch (e) {
          console.error("WhatsApp notify error:", e);
        }
      }
    }

    setSaving(false);
    setShowModal(false);
    setEditMode(false);
    setForm(emptyForm);
  };

  const updateEstado = async (id: string, estado: BookingEstado) => {
    const { error } = await supabase.from("bookings").update({ estado, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) {
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, estado } : b));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, estado } : null);
      // Sync estado to Notion
      const booking = bookings.find((b) => b.id === id);
      if (booking) {
        setNotionSyncing(true);
        const notionId = await syncToNotion("update_estado", { ...booking, estado }, booking.notion_page_id);
        if (notionId && !booking.notion_page_id) {
          await supabase.from("bookings").update({ notion_page_id: notionId }).eq("id", id);
          setBookings((prev) => prev.map((b) => b.id === id ? { ...b, notion_page_id: notionId } : b));
        }
        setNotionSyncing(false);
        setNotionSuccess("Notion actualizado");
        setTimeout(() => setNotionSuccess(null), 3000);

        // WhatsApp notification on state change
        if (estado === "confirmada" || estado === "cancelada" || estado === "completada") {
          try {
            const nights = booking.fecha_inicio && booking.fecha_fin ? diffDays(booking.fecha_inicio, booking.fecha_fin) : null;
            const estadoEmoji: Record<string, string> = {
              confirmada: "✅ CONFIRMADA",
              cancelada: "❌ CANCELADA",
              completada: "🏁 COMPLETADA",
            };
            await supabase.functions.invoke("whatsapp-notify", {
              body: {
                tipo: "cambio_estado",
                estado_nuevo: estadoEmoji[estado] || estado,
                propiedad: booking.propiedad_nombre,
                huesped: booking.huesped_nombre,
                fecha_inicio: formatDate(booking.fecha_inicio),
                fecha_fin: formatDate(booking.fecha_fin),
                noches: nights,
                precio_total: booking.precio_total,
                num_huespedes: booking.num_huespedes,
                estado: estadoConfig[estado]?.label || estado,
              },
            });
          } catch (e) {
            console.error("WhatsApp notify error:", e);
          }
        }
      }
    }
  };

  const handleMarkAsPaid = async (bookingId: string) => {
    setPayLoading(true);
    setPayMsg(null);
    try {
      const { error } = await supabase.from("bookings").update({
        stripe_payment_status: "paid",
        metodo_pago: metodoPago,
        updated_at: new Date().toISOString(),
      }).eq("id", bookingId);
      if (error) throw new Error(error.message);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, stripe_payment_status: "paid", metodo_pago: metodoPago } : b));
      if (selected?.id === bookingId) setSelected((prev) => prev ? { ...prev, stripe_payment_status: "paid", metodo_pago: metodoPago } : null);
      setPayMsg({ type: "success", text: `Pago por ${metodoPago} registrado correctamente.` });

      // WhatsApp notification for payment received
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        try {
          const nights = booking.fecha_inicio && booking.fecha_fin ? diffDays(booking.fecha_inicio, booking.fecha_fin) : null;
          const neto = booking.precio_total ? Math.round(booking.precio_total * 0.95 * 100) / 100 : null;
          await supabase.functions.invoke("whatsapp-notify", {
            body: {
              tipo: "pago_revolut",
              metodo_pago: metodoPago,
              propiedad: booking.propiedad_nombre,
              huesped: booking.huesped_nombre,
              fecha_inicio: formatDate(booking.fecha_inicio),
              fecha_fin: formatDate(booking.fecha_fin),
              noches: nights,
              precio_total: booking.precio_total,
              precio_neto: neto,
              num_huespedes: booking.num_huespedes,
            },
          });
        } catch (e) {
          console.error("WhatsApp notify error:", e);
        }
      }
    } catch (err) {
      setPayMsg({ type: "error", text: (err as Error).message });
    }
    setPayLoading(false);
    setTimeout(() => setPayMsg(null), 5000);
  };

  const handleMarkAsUnpaid = async (bookingId: string) => {
    const { error } = await supabase.from("bookings").update({
      stripe_payment_status: "unpaid",
      updated_at: new Date().toISOString(),
    }).eq("id", bookingId);
    if (!error) {
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, stripe_payment_status: "unpaid" } : b));
      if (selected?.id === bookingId) setSelected((prev) => prev ? { ...prev, stripe_payment_status: "unpaid" } : null);
    }
  };

  const handleAddComprobante = async () => {
    if (!selected || !comprobanteForm.url.trim()) return;
    setNotionSyncing(true);
    const updatedBooking = { ...selected, comprobante_pago: comprobanteForm.url, metodo_pago: comprobanteForm.metodo };
    await supabase.from("bookings").update({
      comprobante_pago: comprobanteForm.url,
      metodo_pago: comprobanteForm.metodo,
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id);
    const notionId = await syncToNotion("add_comprobante", updatedBooking, selected.notion_page_id);
    if (notionId && !selected.notion_page_id) {
      await supabase.from("bookings").update({ notion_page_id: notionId }).eq("id", selected.id);
    }
    setBookings((prev) => prev.map((b) => b.id === selected.id ? updatedBooking : b));
    setSelected(updatedBooking);
    setNotionSyncing(false);
    setNotionSuccess("Comprobante guardado en Notion");
    setTimeout(() => setNotionSuccess(null), 3000);
    setShowComprobanteModal(false);
    setComprobanteForm({ metodo: "Transferencia", url: "" });
  };

  const handleExportPdf = async (b: Booking) => {
    setExporting(true);
    await generateBookingSesPdf({
      id: b.id,
      propiedad_nombre: b.propiedad_nombre,
      huesped_nombre: b.huesped_nombre,
      fecha_inicio: b.fecha_inicio,
      fecha_fin: b.fecha_fin,
      num_huespedes: b.num_huespedes,
      precio_total: b.precio_total,
      notas: b.notas,
      viajeros: b.viajeros || [],
    });
    setExporting(false);
  };

  const openEdit = (b: Booking) => {
    setForm({ ...b });
    const servs: Record<string, boolean> = {};
    (b.servicios_extra || []).forEach((s) => { servs[s.key] = true; });
    setFormServicios(servs);
    setEditMode(true);
    setShowModal(true);
  };

  const openNew = () => {
    setForm(emptyForm);
    setFormServicios({});
    setEditMode(false);
    setShowModal(true);
  };

  const counts = {
    pendiente: bookings.filter((b) => b.estado === "pendiente").length,
    confirmada: bookings.filter((b) => b.estado === "confirmada").length,
    cancelada: bookings.filter((b) => b.estado === "cancelada").length,
    completada: bookings.filter((b) => b.estado === "completada").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Reservas</h2>
          <p className="text-stone-500 text-sm">{bookings.length} reservas en total</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line"></i> Nueva reserva
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(estadoConfig) as [BookingEstado, typeof estadoConfig[BookingEstado]][]).map(([key, cfg]) => (
          <div key={key} className="bg-white rounded-xl border border-stone-100 p-4">
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${cfg.bg} ${cfg.color} mb-2`}>
              <i className={`${cfg.icon} text-sm`}></i>
            </div>
            <div className="text-2xl font-bold text-stone-900">{counts[key]}</div>
            <div className="text-xs text-stone-500">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
          <input
            type="text"
            placeholder="Buscar huésped o propiedad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-full text-sm focus:outline-none focus:border-stone-400 bg-white"
          />
        </div>
        <div className="flex bg-white border border-stone-200 rounded-full p-1 gap-1">
          {(["todos", "pendiente", "confirmada", "cancelada", "completada"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterEstado(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filterEstado === f ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"}`}
            >
              {f === "todos" ? "Todas" : estadoConfig[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* List */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-16 text-stone-400 text-sm bg-white rounded-xl border border-stone-100">
              <i className="ri-loader-4-line animate-spin text-2xl mb-2 block"></i>
              Cargando reservas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-stone-100">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-stone-100 text-stone-400 mx-auto mb-3">
                <i className="ri-calendar-line text-2xl"></i>
              </div>
              <p className="text-stone-500 text-sm font-medium">No hay reservas</p>
              <p className="text-stone-400 text-xs mt-1">Crea la primera reserva con el botón de arriba</p>
            </div>
          ) : filtered.map((b) => {
            const cfg = estadoConfig[b.estado] || estadoConfig.pendiente;
            const nights = b.fecha_inicio && b.fecha_fin ? diffDays(b.fecha_inicio, b.fecha_fin) : null;
            return (
              <div
                key={b.id}
                onClick={() => setSelected(b)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:border-stone-300 ${selected?.id === b.id ? "border-stone-400 ring-1 ring-stone-200" : "border-stone-100"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
                      <i className="ri-calendar-line text-base"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="text-stone-900 font-semibold text-sm truncate">
                        {b.propiedad_nombre || "Propiedad sin nombre"}
                      </div>
                      <div className="text-stone-500 text-xs truncate mt-0.5">
                        <i className="ri-user-line mr-1"></i>{b.huesped_nombre || "Huésped no asignado"}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-stone-500">
                          <i className="ri-calendar-event-line mr-1"></i>
                          {formatDate(b.fecha_inicio)} → {formatDate(b.fecha_fin)}
                        </span>
                        {nights && (
                          <span className="text-xs text-stone-400">{nights} {nights === 1 ? "noche" : "noches"}</span>
                        )}
                        {b.num_huespedes && (
                          <span className="text-xs text-stone-400">
                            <i className="ri-group-line mr-1"></i>{b.num_huespedes} {b.num_huespedes === 1 ? "huésped" : "huéspedes"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <i className={cfg.icon}></i> {cfg.label}
                    </span>
                    {b.precio_total && (
                      <span className="text-sm font-bold text-stone-800">{b.precio_total.toLocaleString("es-ES")}€</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full lg:w-96 bg-white rounded-2xl border border-stone-100 p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900 text-sm">Detalle de reserva</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(selected)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-500"
                >
                  <i className="ri-edit-line text-sm"></i>
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>
            </div>

            {/* Estado badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-5 ${estadoConfig[selected.estado]?.bg}`}>
              <i className={`${estadoConfig[selected.estado]?.icon} ${estadoConfig[selected.estado]?.color}`}></i>
              <span className={`text-sm font-semibold ${estadoConfig[selected.estado]?.color}`}>
                {estadoConfig[selected.estado]?.label}
              </span>
            </div>

            {/* Propiedad */}
            <div className="bg-stone-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-building-line text-stone-500 text-sm"></i>
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Propiedad</span>
              </div>
              <p className="text-stone-900 font-semibold text-sm">{selected.propiedad_nombre || "—"}</p>
            </div>

            {/* Huésped */}
            <div className="bg-stone-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-user-line text-stone-500 text-sm"></i>
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Huésped</span>
              </div>
              <p className="text-stone-900 font-semibold text-sm">{selected.huesped_nombre || "—"}</p>
              {selected.num_huespedes && (
                <p className="text-xs text-stone-500 mt-1">
                  <i className="ri-group-line mr-1"></i>{selected.num_huespedes} {selected.num_huespedes === 1 ? "persona" : "personas"}
                </p>
              )}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-600 font-medium mb-1">Entrada</p>
                <p className="text-sm font-bold text-stone-900">{formatDate(selected.fecha_inicio)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-500 font-medium mb-1">Salida</p>
                <p className="text-sm font-bold text-stone-900">{formatDate(selected.fecha_fin)}</p>
              </div>
            </div>

            {selected.fecha_inicio && selected.fecha_fin && (
              <div className="bg-amber-50 rounded-xl p-3 mb-4 text-center">
                <span className="text-amber-700 text-sm font-semibold">
                  {diffDays(selected.fecha_inicio, selected.fecha_fin)} {diffDays(selected.fecha_inicio, selected.fecha_fin) === 1 ? "noche" : "noches"}
                </span>
              </div>
            )}

            {/* Precio con desglose */}
            {selected.precio_total && (
              <div className="bg-stone-900 rounded-xl p-4 mb-4">
                <p className="text-stone-400 text-xs mb-2 text-center">Precio total</p>
                <p className="text-white text-2xl font-bold text-center">{selected.precio_total.toLocaleString("es-ES")}€</p>
                {/* Desglose */}
                <div className="mt-3 pt-3 border-t border-stone-700 space-y-1.5">
                  {selected.subtotal_alojamiento && selected.subtotal_alojamiento > 0 && (
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>Alojamiento (exento IVA)</span>
                      <span>€{selected.subtotal_alojamiento.toLocaleString("es-ES")}</span>
                    </div>
                  )}
                  {selected.comision_nexura && selected.comision_nexura > 0 && (
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>Comisión NEXURA (15%)</span>
                      <span>€{selected.comision_nexura.toLocaleString("es-ES")}</span>
                    </div>
                  )}
                  {selected.subtotal_servicios && selected.subtotal_servicios > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-stone-400">
                        <span>Servicios adicionales</span>
                        <span>€{selected.subtotal_servicios.toLocaleString("es-ES")}</span>
                      </div>
                      <div className="flex justify-between text-xs text-amber-400 font-semibold">
                        <span>IVA 10% (servicios)</span>
                        <span>€{selected.iva_servicios?.toLocaleString("es-ES") || "0"}</span>
                      </div>
                      {/* Lista de servicios */}
                      {selected.servicios_extra && selected.servicios_extra.length > 0 && (
                        <div className="pl-2 space-y-0.5">
                          {selected.servicios_extra.map((s) => (
                            <div key={s.key} className="flex justify-between text-xs text-stone-500">
                              <span>· {s.label}</span>
                              <span>€{s.precio}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {selected.fecha_inicio && selected.fecha_fin && (
                  <p className="text-stone-500 text-xs mt-2 text-center">
                    {diffDays(selected.fecha_inicio, selected.fecha_fin)} {diffDays(selected.fecha_inicio, selected.fecha_fin) === 1 ? "noche" : "noches"}
                  </p>
                )}
              </div>
            )}

            {/* Viajeros */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Viajeros registrados</span>
                {selected.viajeros_completado
                  ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><i className="ri-check-line"></i> Completado</span>
                  : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
                }
              </div>
              {selected.viajeros && selected.viajeros.length > 0 ? (
                <div className="space-y-2">
                  {selected.viajeros.map((v, i) => (
                    <div key={v.id || i} className="bg-stone-50 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-stone-800">{v.nombre} {v.apellidos}</span>
                        <div className="flex items-center gap-1.5">
                          {v.es_menor && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">Menor</span>}
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                            v.tipo_documento === "pasaporte" ? "bg-stone-200 text-stone-700" :
                            v.tipo_documento === "nie" ? "bg-amber-100 text-amber-700" :
                            "bg-stone-100 text-stone-600"
                          }`}>
                            <i className={`${v.tipo_documento === "pasaporte" ? "ri-passport-line" : "ri-id-card-line"} mr-0.5`}></i>
                            {v.tipo_documento === "pasaporte" ? "Pasaporte" : v.tipo_documento === "nie" ? "NIE" : "DNI"}
                          </span>
                        </div>
                      </div>
                      <div className="text-stone-500 space-y-0.5">
                        {v.dni_numero && <div>Nº documento: <span className="text-stone-700 font-medium">{v.dni_numero}</span></div>}
                        {v.fecha_nacimiento && <div>Nacimiento: <span className="text-stone-700">{formatDate(v.fecha_nacimiento)}</span></div>}
                        {v.nacionalidad && <div>Nacionalidad: <span className="text-stone-700">{v.nacionalidad}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-400 text-center">
                  <i className="ri-group-line mr-1"></i>El huésped aún no ha registrado los viajeros
                </div>
              )}
            </div>

            {/* Notas */}
            {selected.notas && (
              <div className="bg-stone-50 rounded-xl p-3 mb-4 text-xs text-stone-600">
                <span className="font-semibold text-stone-700">Notas: </span>{selected.notas}
              </div>
            )}
            {selected.mensaje_huesped && (
              <div className="bg-stone-50 rounded-xl p-3 mb-4 text-xs text-stone-600 border-l-2 border-amber-400">
                <span className="font-semibold text-stone-700">Mensaje del huésped: </span>{selected.mensaje_huesped}
              </div>
            )}

            {/* Notion sync status */}
            {notionSyncing && (
              <div className="mb-3 flex items-center gap-2 text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
                <i className="ri-loader-4-line animate-spin"></i> Sincronizando con Notion...
              </div>
            )}
            {notionSuccess && (
              <div className="mb-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <i className="ri-check-line"></i> {notionSuccess}
              </div>
            )}

            {/* Notion link */}
            <div className="mb-4 flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-600">Notion</span>
                {selected.notion_page_id ? (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <i className="ri-check-line"></i> Sincronizado
                  </span>
                ) : (
                  <span className="text-xs bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">No sincronizado</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selected.notion_page_id && (
                  <a
                    href={`https://www.notion.so/${selected.notion_page_id.replace(/-/g, "")}`}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Ver en Notion
                  </a>
                )}
                {!selected.notion_page_id && (
                  <button
                    onClick={async () => {
                      setNotionSyncing(true);
                      const notionId = await syncToNotion("create_reserva", selected);
                      if (notionId) {
                        await supabase.from("bookings").update({ notion_page_id: notionId }).eq("id", selected.id);
                        setBookings((prev) => prev.map((b) => b.id === selected.id ? { ...b, notion_page_id: notionId } : b));
                        setSelected((prev) => prev ? { ...prev, notion_page_id: notionId } : null);
                        setNotionSuccess("Reserva creada en Notion");
                        setTimeout(() => setNotionSuccess(null), 3000);
                      }
                      setNotionSyncing(false);
                    }}
                    className="text-xs text-stone-600 hover:text-stone-900 underline cursor-pointer"
                  >
                    Sincronizar ahora
                  </button>
                )}
              </div>
            </div>

            {/* Pago Revolut / Bizum */}
            <div className="mb-4">
              {payMsg && (
                <div className={`mb-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2.5 ${
                  payMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}>
                  <i className={`${payMsg.type === "success" ? "ri-check-line" : "ri-error-warning-line"} flex-shrink-0 mt-0.5`}></i>
                  <span>{payMsg.text}</span>
                </div>
              )}
              {selected.stripe_payment_status === "paid" ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <i className="ri-checkbox-circle-fill text-emerald-600"></i>
                      <span className="text-xs font-semibold text-emerald-700">
                        Pago recibido
                        {selected.metodo_pago && (
                          <span className="ml-1.5 font-normal text-emerald-600">· {selected.metodo_pago}</span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarkAsUnpaid(selected.id)}
                      className="text-xs text-stone-400 hover:text-red-500 cursor-pointer transition-colors"
                    >
                      Deshacer
                    </button>
                  </div>
                  {selected.precio_total && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Anfitrión recibirá: <strong>{(selected.precio_total * 0.95).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</strong> (−5% comisión)
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-3">
                  {/* Selector método de pago */}
                  <p className="text-xs font-medium text-stone-500 mb-2">Método de pago recibido</p>
                  <div className="flex gap-2 mb-3">
                    {(["Revolut", "Bizum"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetodoPago(m)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                          metodoPago === m
                            ? "bg-stone-900 text-white border-transparent"
                            : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        <i className={m === "Revolut" ? "ri-exchange-dollar-line" : "ri-smartphone-line"}></i>
                        {m}
                        {m === "Bizum" && <span className="text-xs opacity-70">614 976 736</span>}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleMarkAsPaid(selected.id)}
                    disabled={payLoading}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-full text-xs font-semibold hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {payLoading ? (
                      <><i className="ri-loader-4-line animate-spin"></i> Registrando...</>
                    ) : (
                      <><i className="ri-money-euro-circle-line"></i> Marcar como pagado ({metodoPago})</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Comprobante de pago */}
            <div className="mb-4">
              {selected.comprobante_pago ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <i className="ri-bank-card-line"></i> Comprobante de pago
                    </span>
                    <button
                      onClick={() => setShowComprobanteModal(true)}
                      className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                  <p className="text-xs text-emerald-600">{selected.metodo_pago || "Transferencia"}</p>
                  <a
                    href={selected.comprobante_pago}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="text-xs text-emerald-700 underline truncate block mt-1 cursor-pointer"
                  >
                    Ver comprobante
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => setShowComprobanteModal(true)}
                  className="w-full border border-dashed border-stone-200 rounded-xl py-3 text-xs text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-bank-card-line"></i> Adjuntar comprobante de pago
                </button>
              )}
            </div>

            {/* PDF Export SES */}
            <div className="mb-4">
              {selected.viajeros_completado ? (
                <button
                  onClick={() => handleExportPdf(selected)}
                  disabled={exporting}
                  className="w-full flex items-center justify-center gap-2 border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 py-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <><i className="ri-loader-4-line animate-spin text-sm"></i> Generando PDF...</>
                  ) : (
                    <>
                      <i className="ri-file-pdf-2-line text-red-500 text-base"></i>
                      Descargar ficha SES HOSPEDAJE (Policía)
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 border border-dashed border-stone-200 text-stone-400 py-3 rounded-xl text-xs">
                  <i className="ri-file-pdf-2-line text-sm"></i>
                  PDF disponible cuando el huésped registre los viajeros
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {selected.estado === "pendiente" && (
                <>
                  {!selected.viajeros_completado && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-1">
                      <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                        <i className="ri-error-warning-line"></i>
                        No se puede confirmar aún
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        El huésped debe rellenar primero el formulario de viajeros (obligatorio por ley SES HOSPEDAJE).
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => updateEstado(selected.id, "confirmada")}
                    disabled={!selected.viajeros_completado}
                    title={!selected.viajeros_completado ? "El huésped debe rellenar los datos de viajeros primero" : ""}
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-full text-xs font-semibold hover:bg-emerald-500 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="ri-check-double-line mr-1"></i>
                    {selected.viajeros_completado ? "Confirmar reserva" : "Esperando datos de viajeros..."}
                  </button>
                </>
              )}
              {selected.estado === "confirmada" && (
                <button
                  onClick={() => updateEstado(selected.id, "completada")}
                  className="w-full bg-stone-700 text-white py-2.5 rounded-full text-xs font-semibold hover:bg-stone-600 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-flag-line mr-1"></i> Marcar como completada
                </button>
              )}
              {(selected.estado === "pendiente" || selected.estado === "confirmada") && (
                <button
                  onClick={() => updateEstado(selected.id, "cancelada")}
                  className="w-full border border-red-200 text-red-500 py-2.5 rounded-full text-xs font-medium hover:bg-red-50 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-close-circle-line mr-1"></i> Cancelar reserva
                </button>
              )}
              {(selected.estado === "cancelada" || selected.estado === "completada") && (
                <button
                  onClick={() => updateEstado(selected.id, "pendiente")}
                  className="w-full border border-stone-200 text-stone-600 py-2.5 rounded-full text-xs font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap transition-colors"
                >
                  Restablecer a pendiente
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal comprobante de pago */}
      {showComprobanteModal && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900 text-sm">Adjuntar comprobante de pago</h3>
              <button
                onClick={() => setShowComprobanteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Transferencia", "Bizum", "Tarjeta de crédito", "Plataforma"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setComprobanteForm((f) => ({ ...f, metodo: m }))}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        comprobanteForm.metodo === m
                          ? "bg-stone-900 text-white border-transparent"
                          : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">URL del comprobante</label>
                <input
                  type="url"
                  placeholder="https://... (enlace a la imagen o PDF)"
                  value={comprobanteForm.url}
                  onChange={(e) => setComprobanteForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
                />
                <p className="text-xs text-stone-400 mt-1">Pega el enlace del comprobante (Google Drive, Dropbox, etc.)</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowComprobanteModal(false)}
                className="flex-1 border border-stone-200 text-stone-600 py-3 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddComprobante}
                disabled={notionSyncing || !comprobanteForm.url.trim()}
                className="flex-1 bg-stone-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {notionSyncing ? (
                  <><i className="ri-loader-4-line animate-spin mr-1"></i> Guardando...</>
                ) : (
                  <><i className="ri-save-line mr-1"></i> Guardar y enviar a Notion</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva/editar reserva */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-stone-900">{editMode ? "Editar reserva" : "Nueva reserva"}</h3>
              <button
                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Propiedad */}
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Propiedad</label>
                {properties.length > 0 ? (
                  <select
                    value={form.propiedad_id || ""}
                    onChange={(e) => handlePropertySelect(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 cursor-pointer"
                  >
                    <option value="">Seleccionar propiedad...</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nombre de la propiedad"
                    value={form.propiedad_nombre || ""}
                    onChange={(e) => setForm((f) => ({ ...f, propiedad_nombre: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                )}
              </div>

              {/* Huésped */}
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Huésped</label>
                {members.length > 0 ? (
                  <select
                    value={form.huesped_id || ""}
                    onChange={(e) => handleMemberSelect(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 cursor-pointer"
                  >
                    <option value="">Seleccionar huésped...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre} {m.apellidos} — {m.email}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nombre del huésped"
                    value={form.huesped_nombre || ""}
                    onChange={(e) => setForm((f) => ({ ...f, huesped_nombre: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    <i className="ri-calendar-event-line mr-1 text-emerald-500"></i>Fecha de entrada
                  </label>
                  <input
                    type="date"
                    value={form.fecha_inicio || ""}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    <i className="ri-calendar-event-line mr-1 text-red-400"></i>Fecha de salida
                  </label>
                  <input
                    type="date"
                    value={form.fecha_fin || ""}
                    min={form.fecha_inicio || ""}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                </div>
              </div>

              {/* Noches preview */}
              {form.fecha_inicio && form.fecha_fin && new Date(form.fecha_fin) > new Date(form.fecha_inicio) && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-sm text-amber-700 font-medium text-center">
                  <i className="ri-moon-line mr-1"></i>
                  {diffDays(form.fecha_inicio, form.fecha_fin)} {diffDays(form.fecha_inicio, form.fecha_fin) === 1 ? "noche" : "noches"}
                </div>
              )}

              {/* Nº huéspedes y precio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">Nº de huéspedes</label>
                  <input
                    type="number"
                    min={1}
                    value={form.num_huespedes || 1}
                    onChange={(e) => setForm((f) => ({ ...f, num_huespedes: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">Precio alojamiento (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.precio_total || ""}
                    onChange={(e) => setForm((f) => ({ ...f, precio_total: parseFloat(e.target.value) || null }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                  <p className="text-xs text-stone-400 mt-1">Exento de IVA</p>
                </div>
              </div>

              {/* Servicios adicionales con IVA */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-medium text-stone-600">Servicios adicionales</label>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">+10% IVA</span>
                </div>
                <div className="space-y-2">
                  {SERVICIOS_CATALOGO.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleFormServicio(s.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        formServicios[s.key]
                          ? "border-amber-400 bg-amber-50"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${
                        formServicios[s.key] ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"
                      }`}>
                        <i className={`${s.key === "limpieza" ? "ri-brush-line" : s.key === "sabanas" ? "ri-hotel-bed-line" : "ri-restaurant-line"} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${formServicios[s.key] ? "text-amber-800" : "text-stone-700"}`}>{s.label}</p>
                        <p className="text-xs text-stone-400">€{s.precio} + IVA 10%</p>
                      </div>
                      <div className={`w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 border-2 transition-all ${
                        formServicios[s.key] ? "border-amber-500 bg-amber-500" : "border-stone-200 bg-white"
                      }`}>
                        {formServicios[s.key] && <i className="ri-check-line text-white text-xs"></i>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desglose precio */}
              {(() => {
                const { alojamiento, subServ, ivaServ, total } = calcFormPrecio();
                if (total <= 0 && !form.precio_total) return null;
                return (
                  <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-2">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Desglose</p>
                    {alojamiento > 0 && (
                      <div className="flex justify-between text-xs text-stone-600">
                        <span>Alojamiento (exento IVA)</span>
                        <span>€{alojamiento.toLocaleString("es-ES")}</span>
                      </div>
                    )}
                    {subServ > 0 && (
                      <>
                        <div className="flex justify-between text-xs text-stone-600">
                          <span>Servicios adicionales</span>
                          <span>€{subServ.toLocaleString("es-ES")}</span>
                        </div>
                        <div className="flex justify-between text-xs text-amber-700 font-semibold">
                          <span>IVA 10% (servicios)</span>
                          <span>€{ivaServ.toLocaleString("es-ES")}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200 text-sm">
                      <span>Total</span>
                      <span>€{total.toLocaleString("es-ES")}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Estado */}
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(estadoConfig) as [BookingEstado, typeof estadoConfig[BookingEstado]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, estado: key }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        form.estado === key
                          ? `${cfg.bg} ${cfg.color} border-transparent`
                          : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                      }`}
                    >
                      <i className={cfg.icon}></i> {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Notas internas</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Notas sobre la reserva..."
                  value={form.notas || ""}
                  onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 resize-none"
                />
              </div>

              {/* Mensaje huésped */}
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Mensaje del huésped</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Peticiones especiales, alergias, etc..."
                  value={form.mensaje_huesped || ""}
                  onChange={(e) => setForm((f) => ({ ...f, mensaje_huesped: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                className="flex-1 border border-stone-200 text-stone-600 py-3 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.fecha_inicio || !form.fecha_fin}
                className="flex-1 bg-stone-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><i className="ri-loader-4-line animate-spin mr-1"></i> Guardando...</>
                ) : editMode ? "Guardar cambios" : "Crear reserva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
