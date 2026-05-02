import { useState, useEffect } from "react";
import { supabase, DbBooking, DbProperty } from "@/lib/supabase";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS = ["L","M","X","J","V","S","D"];
const tipoConfig = {
  reserva: { label: "Reserva", color: "bg-amber-500", textColor: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  mantenimiento: { label: "Mantenimiento", color: "bg-stone-400", textColor: "text-stone-600", bg: "bg-stone-50 border-stone-200" },
  bloqueado: { label: "Bloqueado", color: "bg-red-400", textColor: "text-red-700", bg: "bg-red-50 border-red-200" },
};

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function dateStr(y: number, m: number, d: number) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

export default function CalendarSection() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [blocks, setBlocks] = useState<DbBooking[]>([]);
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newBlock, setNewBlock] = useState<Partial<DbBooking>>({ tipo: "reserva", fecha_inicio: "", fecha_fin: "", estado: "confirmada" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: bData }, { data: pData }] = await Promise.all([
      supabase.from("bookings").select("*").order("fecha_inicio", { ascending: true }),
      supabase.from("properties").select("id, nombre, propietario_nombre").order("nombre"),
    ]);
    if (bData) setBlocks(bData as DbBooking[]);
    if (pData) {
      setProperties(pData as DbProperty[]);
      if (pData.length > 0) setNewBlock((prev) => ({ ...prev, propiedad_id: pData[0].id, propiedad_nombre: pData[0].nombre }));
    }
    setLoading(false);
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const getBlocksForDay = (day: number) => {
    const ds = dateStr(year, month, day);
    return blocks.filter((b) => b.fecha_inicio <= ds && b.fecha_fin >= ds);
  };

  const handleAddBlock = async () => {
    if (!newBlock.fecha_inicio || !newBlock.fecha_fin) return;
    setSaving(true);
    const prop = properties.find((p) => p.id === newBlock.propiedad_id);
    const record = {
      propiedad_id: newBlock.propiedad_id || null,
      propiedad_nombre: prop?.nombre || newBlock.propiedad_nombre || "",
      huesped_id: null, huesped_nombre: newBlock.huesped_nombre || null,
      fecha_inicio: newBlock.fecha_inicio, fecha_fin: newBlock.fecha_fin,
      tipo: newBlock.tipo || "reserva", estado: "confirmada",
      precio_total: null, notas: newBlock.notas || null,
    };
    const { data, error } = await supabase.from("bookings").insert(record).select().maybeSingle();
    if (!error && data) {
      setBlocks((prev) => [...prev, data as DbBooking]);
      setShowAddModal(false);
      setNewBlock({ tipo: "reserva", fecha_inicio: "", fecha_fin: "", estado: "confirmada", propiedad_id: properties[0]?.id, propiedad_nombre: properties[0]?.nombre });
      // Send WhatsApp notification for new booking
      try {
        const newBooking = data as DbBooking;
        const nights = newBooking.fecha_inicio && newBooking.fecha_fin
          ? Math.max(1, Math.round((new Date(newBooking.fecha_fin).getTime() - new Date(newBooking.fecha_inicio).getTime()) / 86400000))
          : null;
        await supabase.functions.invoke("whatsapp-notify", {
          body: {
            propiedad: newBooking.propiedad_nombre,
            huesped: newBooking.huesped_nombre,
            fecha_inicio: newBooking.fecha_inicio ? new Date(newBooking.fecha_inicio).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—",
            fecha_fin: newBooking.fecha_fin ? new Date(newBooking.fecha_fin).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—",
            noches: nights,
            precio_total: newBooking.precio_total,
            num_huespedes: newBooking.num_huespedes,
            estado: "Confirmada",
            mensaje_huesped: newBooking.notas,
          },
        });
      } catch (e) {
        console.error("WhatsApp notify error:", e);
      }
    }
    setSaving(false);
  };

  const handleUnblock = async (id: string) => {
    await supabase.from("bookings").update({ estado: "cancelada", updated_at: new Date().toISOString() }).eq("id", id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Calendario de Reservas</h2>
          <p className="text-stone-500 text-sm">Gestiona bloqueos y reservas de propiedades</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-add-line"></i> Nuevo bloqueo
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {(Object.entries(tipoConfig) as [DbBooking["tipo"], typeof tipoConfig.reserva][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${cfg.color}`}></div><span className="text-xs text-stone-500">{cfg.label}</span></div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-600"><i className="ri-arrow-left-s-line text-lg"></i></button>
            <h3 className="font-semibold text-stone-900">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-600"><i className="ri-arrow-right-s-line text-lg"></i></button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-stone-400 py-2">{d}</div>)}
          </div>
          {loading ? (
            <div className="text-center py-8 text-stone-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl block mb-2"></i>Cargando...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const ds = dateStr(year, month, day);
                const dayBlocks = getBlocksForDay(day);
                const isToday = ds === today.toISOString().split("T")[0];
                const isSelected = ds === selectedDate;
                return (
                  <button key={day} onClick={() => setSelectedDate(ds)}
                    className={`relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm transition-all cursor-pointer ${isSelected ? "bg-stone-900 text-white" : isToday ? "bg-amber-50 text-amber-700 font-semibold" : "hover:bg-stone-50 text-stone-700"}`}>
                    <span className="text-xs font-medium leading-none">{day}</span>
                    {dayBlocks.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayBlocks.slice(0, 3).map((b) => <div key={b.id} className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : tipoConfig[b.tipo]?.color || "bg-stone-400"}`}></div>)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 space-y-4">
          {selectedDate && (
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <h4 className="font-semibold text-stone-900 text-sm mb-3">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </h4>
              {getBlocksForDay(parseInt(selectedDate.split("-")[2])).length === 0 ? (
                <div className="text-stone-400 text-xs text-center py-4">Sin bloqueos este día</div>
              ) : getBlocksForDay(parseInt(selectedDate.split("-")[2])).map((b) => {
                const cfg = tipoConfig[b.tipo];
                return (
                  <div key={b.id} className={`border rounded-xl p-3 mb-2 ${cfg.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-xs font-semibold ${cfg.textColor} mb-0.5`}>{cfg.label}</div>
                        <div className="text-stone-800 text-sm font-medium">{b.propiedad_nombre}</div>
                        {b.huesped_nombre && <div className="text-stone-500 text-xs">{b.huesped_nombre}</div>}
                        <div className="text-stone-400 text-xs">{b.fecha_inicio} → {b.fecha_fin}</div>
                      </div>
                      <button onClick={() => handleUnblock(b.id)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-stone-200 text-red-400 hover:bg-red-50 cursor-pointer flex-shrink-0"><i className="ri-lock-unlock-line text-xs"></i></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h4 className="font-semibold text-stone-900 text-sm mb-3">Todos los bloqueos ({blocks.length})</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 py-2 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tipoConfig[b.tipo]?.color || "bg-stone-400"}`}></div>
                    <div className="min-w-0">
                      <div className="text-stone-800 text-xs font-medium truncate">{b.propiedad_nombre}</div>
                      <div className="text-stone-400 text-xs">{b.fecha_inicio} → {b.fecha_fin}</div>
                    </div>
                  </div>
                  <button onClick={() => handleUnblock(b.id)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 cursor-pointer flex-shrink-0"><i className="ri-delete-bin-line text-xs"></i></button>
                </div>
              ))}
              {blocks.length === 0 && <div className="text-stone-400 text-xs text-center py-4">Sin bloqueos</div>}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900">Nuevo bloqueo / reserva</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Propiedad</label>
                <select value={newBlock.propiedad_id || ""} onChange={(e) => { const p = properties.find((x) => x.id === e.target.value); setNewBlock({ ...newBlock, propiedad_id: e.target.value, propiedad_nombre: p?.nombre || "" }); }} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50 cursor-pointer">
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  {properties.length === 0 && <option value="">Sin propiedades</option>}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-2 block">Tipo</label>
                <div className="flex gap-2">
                  {(["reserva","mantenimiento","bloqueado"] as const).map((t) => (
                    <button key={t} onClick={() => setNewBlock({ ...newBlock, tipo: t })} className={`flex-1 py-2 rounded-full text-xs font-medium cursor-pointer transition-all ${newBlock.tipo === t ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{tipoConfig[t].label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-stone-500 mb-1 block">Fecha inicio</label><input type="date" value={newBlock.fecha_inicio || ""} onChange={(e) => setNewBlock({ ...newBlock, fecha_inicio: e.target.value })} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50 cursor-pointer" /></div>
                <div><label className="text-xs text-stone-500 mb-1 block">Fecha fin</label><input type="date" value={newBlock.fecha_fin || ""} onChange={(e) => setNewBlock({ ...newBlock, fecha_fin: e.target.value })} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50 cursor-pointer" /></div>
              </div>
              {newBlock.tipo === "reserva" && <div><label className="text-xs text-stone-500 mb-1 block">Nombre del huésped</label><input value={newBlock.huesped_nombre || ""} onChange={(e) => setNewBlock({ ...newBlock, huesped_nombre: e.target.value })} placeholder="Nombre completo" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50" /></div>}
              <div><label className="text-xs text-stone-500 mb-1 block">Notas</label><input value={newBlock.notas || ""} onChange={(e) => setNewBlock({ ...newBlock, notas: e.target.value })} placeholder="Notas adicionales..." className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap">Cancelar</button>
              <button onClick={handleAddBlock} disabled={saving} className="flex-1 bg-stone-900 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50">{saving ? "Guardando..." : "Crear bloqueo"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
