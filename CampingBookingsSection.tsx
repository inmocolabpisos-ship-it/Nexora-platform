import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type EstadoReserva = "pendiente" | "confirmada" | "cancelada" | "completada";

interface CampingBooking {
  id: string;
  camping_id: string;
  camping_nombre: string | null;
  cliente_nombre: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_parcela: string | null;
  num_personas: number | null;
  precio_total: number | null;
  precio_base: number | null;
  comision_nexura: number | null;
  iva_comision: number | null;
  servicios_extra: { key: string; label: string; precio: number }[] | null;
  metodo_pago: string | null;
  estado: EstadoReserva;
  notas: string | null;
  created_at: string;
}

const estadoConfig: Record<EstadoReserva, { label: string; color: string; icon: string; bg: string; dot: string }> = {
  pendiente:  { label: "Pendiente",  color: "text-amber-700",   icon: "ri-time-line",         bg: "bg-amber-50",   dot: "bg-amber-400" },
  confirmada: { label: "Confirmada", color: "text-emerald-700", icon: "ri-check-double-line",  bg: "bg-emerald-50", dot: "bg-emerald-500" },
  cancelada:  { label: "Cancelada",  color: "text-red-700",     icon: "ri-close-circle-line",  bg: "bg-red-50",     dot: "bg-red-500" },
  completada: { label: "Completada", color: "text-stone-600",   icon: "ri-flag-line",          bg: "bg-stone-100",  dot: "bg-stone-400" },
};

const metodoPagoIcon: Record<string, string> = {
  Revolut: "ri-exchange-dollar-line",
  Bizum: "ri-smartphone-line",
  Efectivo: "ri-money-euro-circle-line",
  Transferencia: "ri-bank-line",
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function diffDays(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

function MiniCalendar({ campingId, bookings }: { campingId: string; bookings: CampingBooking[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();

  const activeBookings = bookings.filter(
    (b) => b.camping_id === campingId && (b.estado === "confirmada" || b.estado === "pendiente")
  );

  const getBookingForDay = (day: number) => {
    const date = new Date(year, month, day);
    return activeBookings.find((b) => {
      const start = new Date(b.fecha_inicio);
      const end = new Date(b.fecha_fin);
      return date >= start && date <= end;
    });
  };

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const monthName = currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div className="bg-stone-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-200 cursor-pointer text-stone-500">
          <i className="ri-arrow-left-s-line text-sm"></i>
        </button>
        <span className="text-xs font-semibold text-stone-700 capitalize">{monthName}</span>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-200 cursor-pointer text-stone-500">
          <i className="ri-arrow-right-s-line text-sm"></i>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="text-center text-xs text-stone-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const booking = getBookingForDay(day);
          const todayMark = isToday(day);
          return (
            <div
              key={day}
              title={booking ? `${booking.cliente_nombre || "Reservado"} · ${estadoConfig[booking.estado].label}` : ""}
              className={`h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors
                ${booking
                  ? booking.estado === "confirmada" ? "bg-emerald-600 text-white" : "bg-amber-400 text-white"
                  : "text-stone-600 hover:bg-stone-200"
                }
                ${todayMark && !booking ? "ring-2 ring-amber-400 ring-offset-1" : ""}
              `}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-200">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-600"></div><span className="text-xs text-stone-500">Confirmada</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-400"></div><span className="text-xs text-stone-500">Pendiente</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm ring-2 ring-amber-400 ring-offset-1 bg-white"></div><span className="text-xs text-stone-500">Hoy</span></div>
      </div>
    </div>
  );
}

export default function CampingBookingsSection() {
  const [bookings, setBookings] = useState<CampingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CampingBooking | null>(null);
  const [filterEstado, setFilterEstado] = useState<"todos" | EstadoReserva>("todos");
  const [filterCamping, setFilterCamping] = useState("todos");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarCampingId, setCalendarCampingId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<"Revolut" | "Bizum" | "Efectivo" | "Transferencia">("Revolut");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    camping_nombre: "", cliente_nombre: "", cliente_email: "", cliente_telefono: "",
    fecha_inicio: "", fecha_fin: "", tipo_parcela: "Parcela tienda",
    num_personas: 2, precio_base: 0, notas: "",
  });
  const [newSaving, setNewSaving] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("camping_bookings").select("*").order("fecha_inicio", { ascending: false });
    if (data) setBookings(data as CampingBooking[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    const channel = supabase
      .channel("camping_bookings_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "camping_bookings" }, () => { fetchBookings(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBookings]);

  const campings = Array.from(new Set(bookings.map((b) => b.camping_id))).map((id) => ({
    id,
    nombre: bookings.find((b) => b.camping_id === id)?.camping_nombre || id,
  }));

  const filtered = bookings.filter((b) => {
    const matchEstado = filterEstado === "todos" || b.estado === filterEstado;
    const matchCamping = filterCamping === "todos" || b.camping_id === filterCamping;
    const q = search.toLowerCase();
    const matchSearch = !q || (b.cliente_nombre || "").toLowerCase().includes(q) || (b.camping_nombre || "").toLowerCase().includes(q);
    return matchEstado && matchCamping && matchSearch;
  });

  const counts = {
    pendiente: bookings.filter((b) => b.estado === "pendiente").length,
    confirmada: bookings.filter((b) => b.estado === "confirmada").length,
    cancelada: bookings.filter((b) => b.estado === "cancelada").length,
    completada: bookings.filter((b) => b.estado === "completada").length,
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3500); };

  const updateEstado = async (id: string, estado: EstadoReserva) => {
    setSaving(true);
    const { error } = await supabase.from("camping_bookings").update({ estado, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) {
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, estado } : b));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, estado } : null);
      const labels: Record<EstadoReserva, string> = {
        confirmada: "Reserva confirmada — calendario actualizado",
        cancelada: "Reserva cancelada — parcela liberada",
        completada: "Reserva marcada como completada",
        pendiente: "Reserva restablecida a pendiente",
      };
      showSuccess(labels[estado]);
      if (estado === "confirmada" || estado === "cancelada") {
        const booking = bookings.find((b) => b.id === id);
        if (booking) {
          try {
            await supabase.functions.invoke("whatsapp-notify", {
              body: {
                tipo: "cambio_estado",
                estado_nuevo: estado === "confirmada" ? "✅ CONFIRMADA" : "❌ CANCELADA",
                propiedad: `Camping: ${booking.camping_nombre}`,
                huesped: booking.cliente_nombre,
                fecha_inicio: formatDate(booking.fecha_inicio),
                fecha_fin: formatDate(booking.fecha_fin),
                precio_total: booking.precio_total,
                num_huespedes: booking.num_personas,
                estado: estadoConfig[estado].label,
              },
            });
          } catch (e) { console.error("WhatsApp notify error:", e); }
        }
      }
    }
    setSaving(false);
  };

  const markAsPaid = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from("camping_bookings").update({ metodo_pago: metodoPago, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) {
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, metodo_pago: metodoPago } : b));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, metodo_pago: metodoPago } : null);
      showSuccess(`Pago registrado por ${metodoPago}`);
    }
    setSaving(false);
  };

  const handleCreateBooking = async () => {
    if (!newForm.camping_nombre || !newForm.cliente_nombre || !newForm.fecha_inicio || !newForm.fecha_fin) return;
    setNewSaving(true);
    const precioBase = newForm.precio_base || 0;
    const noches = diffDays(newForm.fecha_inicio, newForm.fecha_fin);
    const subtotal = precioBase * noches;
    const comision = Math.round(subtotal * 0.15);
    const ivaComision = Math.round(comision * 0.21);
    const total = subtotal + comision + ivaComision;

    const { data, error } = await supabase.from("camping_bookings").insert({
      camping_id: newForm.camping_nombre.toLowerCase().replace(/\s+/g, "-"),
      camping_nombre: newForm.camping_nombre,
      cliente_nombre: newForm.cliente_nombre,
      cliente_email: newForm.cliente_email || null,
      cliente_telefono: newForm.cliente_telefono || null,
      fecha_inicio: newForm.fecha_inicio,
      fecha_fin: newForm.fecha_fin,
      tipo_parcela: newForm.tipo_parcela,
      num_personas: newForm.num_personas,
      precio_base: precioBase,
      precio_total: total,
      comision_nexura: comision,
      iva_comision: ivaComision,
      notas: newForm.notas || null,
      estado: "pendiente",
    }).select().maybeSingle();

    if (!error && data) {
      setBookings((prev) => [data as CampingBooking, ...prev]);
      showSuccess("Reserva creada correctamente");
      setShowNewModal(false);
      setNewForm({ camping_nombre: "", cliente_nombre: "", cliente_email: "", cliente_telefono: "", fecha_inicio: "", fecha_fin: "", tipo_parcela: "Parcela tienda", num_personas: 2, precio_base: 0, notas: "" });
    }
    setNewSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
            <i className="ri-tent-line text-emerald-600"></i>
            Reservas de Camping
          </h2>
          <p className="text-stone-500 text-sm mt-0.5">{bookings.length} reservas · Calendario sincronizado en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${showCalendar ? "bg-emerald-600 text-white border-transparent" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"}`}
          >
            <i className="ri-calendar-2-line"></i> Vista calendario
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i> Nueva reserva
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
          <i className="ri-checkbox-circle-fill text-emerald-500 text-base flex-shrink-0"></i>
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(estadoConfig) as [EstadoReserva, typeof estadoConfig[EstadoReserva]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterEstado(filterEstado === key ? "todos" : key)}
            className={`bg-white rounded-xl border p-4 text-left transition-all cursor-pointer ${filterEstado === key ? "border-stone-400 ring-1 ring-stone-200" : "border-stone-100 hover:border-stone-200"}`}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${cfg.bg} ${cfg.color} mb-2`}>
              <i className={`${cfg.icon} text-sm`}></i>
            </div>
            <div className="text-2xl font-bold text-stone-900">{counts[key]}</div>
            <div className="text-xs text-stone-500">{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Vista calendario */}
      {showCalendar && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <i className="ri-calendar-2-line text-emerald-600"></i>
              Disponibilidad por camping
            </h3>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <i className="ri-refresh-line"></i> Actualización en tiempo real
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {campings.map((c) => (
              <button
                key={c.id}
                onClick={() => setCalendarCampingId(calendarCampingId === c.id ? null : c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${calendarCampingId === c.id ? "bg-emerald-600 text-white border-transparent" : "bg-white border-stone-200 text-stone-600 hover:border-emerald-300"}`}
              >
                <i className="ri-tent-line mr-1"></i>{c.nombre}
              </button>
            ))}
            {campings.length === 0 && <p className="text-xs text-stone-400">No hay campings con reservas aún</p>}
          </div>
          {calendarCampingId && (
            <div className="max-w-sm">
              <p className="text-xs font-semibold text-stone-600 mb-3">
                <i className="ri-tent-line mr-1 text-emerald-600"></i>
                {campings.find((c) => c.id === calendarCampingId)?.nombre}
              </p>
              <MiniCalendar campingId={calendarCampingId} bookings={bookings} />
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Reservas activas</p>
                {bookings
                  .filter((b) => b.camping_id === calendarCampingId && (b.estado === "confirmada" || b.estado === "pendiente"))
                  .map((b) => (
                    <div key={b.id} onClick={() => { setSelected(b); setShowCalendar(false); }} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-stone-100 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-stone-800">{b.cliente_nombre || "Cliente"}</p>
                        <p className="text-xs text-stone-500">{formatDate(b.fecha_inicio)} → {formatDate(b.fecha_fin)} · {b.tipo_parcela}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoConfig[b.estado].bg} ${estadoConfig[b.estado].color}`}>{estadoConfig[b.estado].label}</span>
                    </div>
                  ))}
                {bookings.filter((b) => b.camping_id === calendarCampingId && (b.estado === "confirmada" || b.estado === "pendiente")).length === 0 && (
                  <p className="text-xs text-stone-400 text-center py-3">Sin reservas activas</p>
                )}
              </div>
            </div>
          )}
          {!calendarCampingId && campings.length > 0 && <p className="text-xs text-stone-400 text-center py-6">Selecciona un camping para ver su calendario</p>}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
          <input type="text" placeholder="Buscar cliente o camping..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-full text-sm focus:outline-none focus:border-stone-400 bg-white" />
        </div>
        <select value={filterCamping} onChange={(e) => setFilterCamping(e.target.value)} className="border border-stone-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-white cursor-pointer text-stone-600">
          <option value="todos">Todos los campings</option>
          {campings.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <div className="flex bg-white border border-stone-200 rounded-full p-1 gap-1">
          {(["todos", "pendiente", "confirmada", "cancelada", "completada"] as const).map((f) => (
            <button key={f} onClick={() => setFilterEstado(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filterEstado === f ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"}`}>
              {f === "todos" ? "Todas" : estadoConfig[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-16 text-stone-400 text-sm bg-white rounded-xl border border-stone-100">
              <i className="ri-loader-4-line animate-spin text-2xl mb-2 block"></i>Cargando reservas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-stone-100">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-400 mx-auto mb-3">
                <i className="ri-tent-line text-2xl"></i>
              </div>
              <p className="text-stone-500 text-sm font-medium">No hay reservas</p>
              <p className="text-stone-400 text-xs mt-1">Crea la primera reserva con el botón de arriba</p>
            </div>
          ) : filtered.map((b) => {
            const cfg = estadoConfig[b.estado];
            const noches = b.fecha_inicio && b.fecha_fin ? diffDays(b.fecha_inicio, b.fecha_fin) : null;
            return (
              <div key={b.id} onClick={() => setSelected(b)} className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:border-stone-300 ${selected?.id === b.id ? "border-stone-400 ring-1 ring-stone-200" : "border-stone-100"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
                      <i className="ri-tent-line text-base"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="text-stone-900 font-semibold text-sm truncate">{b.camping_nombre || "Camping"}</div>
                      <div className="text-stone-500 text-xs truncate mt-0.5">
                        <i className="ri-user-line mr-1"></i>{b.cliente_nombre || "Cliente"}
                        {b.tipo_parcela && <span className="ml-2 text-stone-400">· {b.tipo_parcela}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-stone-500"><i className="ri-calendar-event-line mr-1"></i>{formatDate(b.fecha_inicio)} → {formatDate(b.fecha_fin)}</span>
                        {noches && <span className="text-xs text-stone-400">{noches} {noches === 1 ? "noche" : "noches"}</span>}
                        {b.num_personas && <span className="text-xs text-stone-400"><i className="ri-group-line mr-1"></i>{b.num_personas} pers.</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <i className={cfg.icon}></i> {cfg.label}
                    </span>
                    {b.precio_total && <span className="text-sm font-bold text-stone-800">{b.precio_total.toLocaleString("es-ES")}€</span>}
                    {b.metodo_pago && <span className="text-xs text-emerald-600 flex items-center gap-1"><i className={metodoPagoIcon[b.metodo_pago] || "ri-money-euro-circle-line"}></i>{b.metodo_pago}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel detalle */}
        {selected && (
          <div className="w-full lg:w-96 bg-white rounded-2xl border border-stone-100 p-6 h-fit sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-900 text-sm">Detalle de reserva</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400">
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>

            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${estadoConfig[selected.estado].bg}`}>
              <div className={`w-2 h-2 rounded-full ${estadoConfig[selected.estado].dot}`}></div>
              <span className={`text-sm font-semibold ${estadoConfig[selected.estado].color}`}>{estadoConfig[selected.estado].label}</span>
              <span className="text-xs text-stone-400 ml-auto">{formatDateTime(selected.created_at)}</span>
            </div>

            {/* Camping */}
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <i className="ri-tent-line text-emerald-600 text-sm"></i>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Camping</span>
              </div>
              <p className="text-stone-900 font-semibold text-sm">{selected.camping_nombre || "—"}</p>
              {selected.tipo_parcela && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mt-1 inline-block">{selected.tipo_parcela}</span>
              )}
            </div>

            {/* Cliente */}
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-user-line text-stone-500 text-sm"></i>
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Cliente</span>
              </div>
              <p className="text-stone-900 font-semibold text-sm">{selected.cliente_nombre || "—"}</p>
              {selected.cliente_email && (
                <a href={`mailto:${selected.cliente_email}`} className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 mt-1 cursor-pointer">
                  <i className="ri-mail-line"></i>{selected.cliente_email}
                </a>
              )}
              {selected.cliente_telefono && (
                <a href={`tel:${selected.cliente_telefono}`} className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 mt-0.5 cursor-pointer">
                  <i className="ri-phone-line"></i>{selected.cliente_telefono}
                </a>
              )}
              {selected.num_personas && <p className="text-xs text-stone-400 mt-1"><i className="ri-group-line mr-1"></i>{selected.num_personas} personas</p>}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-600 font-medium mb-1">Llegada</p>
                <p className="text-sm font-bold text-stone-900">{formatDate(selected.fecha_inicio)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-500 font-medium mb-1">Salida</p>
                <p className="text-sm font-bold text-stone-900">{formatDate(selected.fecha_fin)}</p>
              </div>
            </div>
            {selected.fecha_inicio && selected.fecha_fin && (
              <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                <span className="text-amber-700 text-sm font-semibold">
                  {diffDays(selected.fecha_inicio, selected.fecha_fin)} {diffDays(selected.fecha_inicio, selected.fecha_fin) === 1 ? "noche" : "noches"}
                </span>
              </div>
            )}

            {/* Precio */}
            {selected.precio_total && (
              <div className="bg-stone-900 rounded-xl p-4">
                <p className="text-stone-400 text-xs mb-2 text-center">Precio total</p>
                <p className="text-white text-2xl font-bold text-center">{selected.precio_total.toLocaleString("es-ES")}€</p>
                <div className="mt-3 pt-3 border-t border-stone-700 space-y-1.5">
                  {selected.precio_base && selected.precio_base > 0 && (
                    <div className="flex justify-between text-xs text-stone-400"><span>Base parcela</span><span>€{selected.precio_base.toLocaleString("es-ES")}</span></div>
                  )}
                  {selected.comision_nexura && selected.comision_nexura > 0 && (
                    <div className="flex justify-between text-xs text-stone-400"><span>Comisión NEXURA (15%)</span><span>€{selected.comision_nexura.toLocaleString("es-ES")}</span></div>
                  )}
                  {selected.iva_comision && selected.iva_comision > 0 && (
                    <div className="flex justify-between text-xs text-amber-400 font-semibold"><span>IVA 21% (mediación)</span><span>€{selected.iva_comision.toLocaleString("es-ES")}</span></div>
                  )}
                  {selected.servicios_extra && selected.servicios_extra.length > 0 && (
                    <div className="pt-1 border-t border-stone-700">
                      {selected.servicios_extra.map((s) => (
                        <div key={s.key} className="flex justify-between text-xs text-stone-500"><span>· {s.label}</span><span>€{s.precio}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selected.notas && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-stone-600">
                <span className="font-semibold text-amber-700 flex items-center gap-1 mb-1"><i className="ri-sticky-note-line"></i> Notas</span>
                {selected.notas}
              </div>
            )}

            {/* Pago */}
            <div>
              {selected.metodo_pago ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-fill text-emerald-600"></i>
                    <span className="text-xs font-semibold text-emerald-700">Pago recibido · {selected.metodo_pago}</span>
                  </div>
                  {selected.precio_total && (
                    <p className="text-xs text-emerald-600 mt-1">Propietario recibe: <strong>{(selected.precio_total * 0.85).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</strong></p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-stone-500 mb-2">Registrar método de pago</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {(["Revolut", "Bizum", "Efectivo", "Transferencia"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setMetodoPago(m)} className={`flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${metodoPago === m ? "bg-stone-900 text-white border-transparent" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"}`}>
                        <i className={metodoPagoIcon[m]}></i>{m}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => markAsPaid(selected.id)} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-full text-xs font-semibold hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50">
                    <i className="ri-money-euro-circle-line"></i>Marcar como pagado ({metodoPago})
                  </button>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cambiar estado</p>
              {selected.estado === "pendiente" && (
                <button onClick={() => updateEstado(selected.id, "confirmada")} disabled={saving} className="w-full bg-emerald-600 text-white py-3 rounded-full text-xs font-semibold hover:bg-emerald-500 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <i className="ri-check-double-line"></i>Confirmar reserva — bloquear parcela
                </button>
              )}
              {selected.estado === "confirmada" && (
                <button onClick={() => updateEstado(selected.id, "completada")} disabled={saving} className="w-full bg-stone-700 text-white py-3 rounded-full text-xs font-semibold hover:bg-stone-600 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <i className="ri-flag-line"></i>Marcar como completada
                </button>
              )}
              {(selected.estado === "pendiente" || selected.estado === "confirmada") && (
                <button onClick={() => updateEstado(selected.id, "cancelada")} disabled={saving} className="w-full border border-red-200 text-red-500 py-3 rounded-full text-xs font-medium hover:bg-red-50 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <i className="ri-close-circle-line"></i>Cancelar — liberar parcela en calendario
                </button>
              )}
              {(selected.estado === "cancelada" || selected.estado === "completada") && (
                <button onClick={() => updateEstado(selected.id, "pendiente")} disabled={saving} className="w-full border border-stone-200 text-stone-600 py-3 rounded-full text-xs font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50">
                  Restablecer a pendiente
                </button>
              )}
              {selected.cliente_telefono && (
                <a href={`https://wa.me/${selected.cliente_telefono.replace(/\D/g, "")}?text=Hola%20${encodeURIComponent(selected.cliente_nombre || "")}%2C%20te%20escribimos%20desde%20NEXURA%20sobre%20tu%20reserva%20en%20${encodeURIComponent(selected.camping_nombre || "el camping")}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 border border-stone-200 text-stone-600 py-3 rounded-full text-xs font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-whatsapp-line text-green-500"></i>Contactar por WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal nueva reserva */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                <i className="ri-tent-line text-emerald-600"></i>Nueva reserva de camping
              </h3>
              <button onClick={() => setShowNewModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Camping</label>
                <input type="text" placeholder="Nombre del camping" value={newForm.camping_nombre} onChange={(e) => setNewForm((f) => ({ ...f, camping_nombre: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Nombre del cliente</label>
                <input type="text" placeholder="Nombre completo" value={newForm.cliente_nombre} onChange={(e) => setNewForm((f) => ({ ...f, cliente_nombre: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">Email</label>
                  <input type="email" placeholder="cliente@email.com" value={newForm.cliente_email} onChange={(e) => setNewForm((f) => ({ ...f, cliente_email: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">Teléfono</label>
                  <input type="tel" placeholder="+34 600 000 000" value={newForm.cliente_telefono} onChange={(e) => setNewForm((f) => ({ ...f, cliente_telefono: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">Llegada</label>
                  <input type="date" value={newForm.fecha_inicio} onChange={(e) => setNewForm((f) => ({ ...f, fecha_inicio: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">Salida</label>
                  <input type="date" value={newForm.fecha_fin} min={newForm.fecha_inicio} onChange={(e) => setNewForm((f) => ({ ...f, fecha_fin: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                </div>
              </div>
              {newForm.fecha_inicio && newForm.fecha_fin && new Date(newForm.fecha_fin) > new Date(newForm.fecha_inicio) && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-sm text-amber-700 font-medium text-center">
                  <i className="ri-moon-line mr-1"></i>{diffDays(newForm.fecha_inicio, newForm.fecha_fin)} {diffDays(newForm.fecha_inicio, newForm.fecha_fin) === 1 ? "noche" : "noches"}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">Tipo de parcela</label>
                  <select value={newForm.tipo_parcela} onChange={(e) => setNewForm((f) => ({ ...f, tipo_parcela: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 cursor-pointer">
                    <option>Parcela tienda</option>
                    <option>Parcela autocaravana</option>
                    <option>Bungalow</option>
                    <option>Glamping</option>
                    <option>Cabaña</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">Nº personas</label>
                  <input type="number" min={1} value={newForm.num_personas} onChange={(e) => setNewForm((f) => ({ ...f, num_personas: parseInt(e.target.value) || 1 }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Precio por noche (€)</label>
                <input type="number" min={0} step={0.01} placeholder="0.00" value={newForm.precio_base || ""} onChange={(e) => setNewForm((f) => ({ ...f, precio_base: parseFloat(e.target.value) || 0 }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
              </div>
              {newForm.precio_base > 0 && newForm.fecha_inicio && newForm.fecha_fin && new Date(newForm.fecha_fin) > new Date(newForm.fecha_inicio) && (() => {
                const noches = diffDays(newForm.fecha_inicio, newForm.fecha_fin);
                const subtotal = newForm.precio_base * noches;
                const comision = Math.round(subtotal * 0.15);
                const iva = Math.round(comision * 0.21);
                const total = subtotal + comision + iva;
                return (
                  <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-2">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Desglose automático</p>
                    <div className="flex justify-between text-xs text-stone-600"><span>Parcela ({noches} noches × €{newForm.precio_base})</span><span>€{subtotal.toLocaleString("es-ES")}</span></div>
                    <div className="flex justify-between text-xs text-stone-600"><span>Comisión NEXURA (15%)</span><span>€{comision.toLocaleString("es-ES")}</span></div>
                    <div className="flex justify-between text-xs text-amber-700 font-semibold"><span>IVA 21% (mediación)</span><span>€{iva.toLocaleString("es-ES")}</span></div>
                    <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200 text-sm"><span>Total cliente</span><span>€{total.toLocaleString("es-ES")}</span></div>
                  </div>
                );
              })()}
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1.5 block">Notas</label>
                <textarea rows={2} maxLength={500} placeholder="Tipo de vehículo, mascotas, etc..." value={newForm.notas} onChange={(e) => setNewForm((f) => ({ ...f, notas: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewModal(false)} className="flex-1 border border-stone-200 text-stone-600 py-3 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap">Cancelar</button>
              <button onClick={handleCreateBooking} disabled={newSaving || !newForm.camping_nombre || !newForm.cliente_nombre || !newForm.fecha_inicio || !newForm.fecha_fin} className="flex-1 bg-stone-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {newSaving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Creando...</> : <><i className="ri-tent-line mr-1"></i>Crear reserva</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
