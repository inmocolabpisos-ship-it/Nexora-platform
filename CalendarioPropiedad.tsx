import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { DbProperty } from "@/lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;

interface Props {
  property: DbProperty;
  onClose: () => void;
}

// ─── iCal Sync Component ───────────────────────────────────────────────────
function ICalSync({ property }: { property: DbProperty }) {
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importSaving, setImportSaving] = useState(false);
  const [importSaved, setImportSaved] = useState(false);
  const [externalCalendars, setExternalCalendars] = useState<{ url: string; nombre: string }[]>(
    (property as DbProperty & { ical_imports?: { url: string; nombre: string }[] }).ical_imports || []
  );

  const exportUrl = `${SUPABASE_URL}/functions/v1/ical-export?property_id=${property.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddImport = async () => {
    if (!importUrl.trim()) return;
    setImportSaving(true);
    const newList = [...externalCalendars, { url: importUrl.trim(), nombre: importUrl.includes("airbnb") ? "Airbnb" : importUrl.includes("booking") ? "Booking.com" : importUrl.includes("vrbo") ? "VRBO" : "Plataforma externa" }];
    await supabase.from("properties").update({ ical_imports: newList } as Partial<DbProperty>).eq("id", property.id);
    setExternalCalendars(newList);
    setImportUrl("");
    setImportSaving(false);
    setImportSaved(true);
    setTimeout(() => setImportSaved(false), 3000);
  };

  const handleRemoveImport = async (idx: number) => {
    const newList = externalCalendars.filter((_, i) => i !== idx);
    await supabase.from("properties").update({ ical_imports: newList } as Partial<DbProperty>).eq("id", property.id);
    setExternalCalendars(newList);
  };

  const platformIcons: Record<string, string> = {
    Airbnb: "ri-home-heart-line",
    "Booking.com": "ri-hotel-line",
    VRBO: "ri-building-line",
    "Plataforma externa": "ri-calendar-line",
  };

  return (
    <div className="border-t border-stone-100 pt-5 space-y-4">
      <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
        <i className="ri-calendar-2-line text-amber-600"></i>
        Sincronización de calendarios
      </h4>

      {/* Exportar iCal */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-stone-700 mb-1">Exportar a otras plataformas</p>
        <p className="text-xs text-stone-500 mb-3">
          Copia este enlace y pégalo en Airbnb, Booking.com, VRBO u otras plataformas para sincronizar tus reservas automáticamente y evitar dobles reservas.
        </p>
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2">
          <i className="ri-link-m text-stone-400 text-sm flex-shrink-0"></i>
          <span className="text-xs text-stone-600 font-mono truncate flex-1">{exportUrl}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            {copied ? (
              <><i className="ri-check-line"></i> Copiado</>
            ) : (
              <><i className="ri-file-copy-line"></i> Copiar</>
            )}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { name: "Airbnb", icon: "ri-home-heart-line", color: "text-rose-600 bg-rose-50 border-rose-100" },
            { name: "Booking.com", icon: "ri-hotel-line", color: "text-blue-600 bg-blue-50 border-blue-100" },
            { name: "VRBO", icon: "ri-building-line", color: "text-stone-600 bg-stone-50 border-stone-200" },
          ].map((p) => (
            <span key={p.name} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${p.color}`}>
              <i className={p.icon}></i> {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Importar calendarios externos */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-stone-700">Importar desde otras plataformas</p>
          <button
            onClick={() => setShowImport(!showImport)}
            className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer font-medium"
          >
            {showImport ? "Cancelar" : "+ Añadir"}
          </button>
        </div>
        <p className="text-xs text-stone-500 mb-3">
          Pega el enlace iCal de Airbnb, Booking u otras plataformas para bloquear automáticamente las fechas ya reservadas.
        </p>

        {showImport && (
          <div className="mb-3 space-y-2">
            <input
              type="url"
              placeholder="https://www.airbnb.com/calendar/ical/...ics"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-400 bg-white font-mono"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddImport}
                disabled={importSaving || !importUrl.trim()}
                className="flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-500 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {importSaving ? <><i className="ri-loader-4-line animate-spin"></i> Guardando...</> : <><i className="ri-add-line"></i> Guardar enlace</>}
              </button>
              {importSaved && <span className="text-xs text-emerald-600 flex items-center gap-1"><i className="ri-check-line"></i> Guardado</span>}
            </div>
          </div>
        )}

        {externalCalendars.length > 0 ? (
          <div className="space-y-2">
            {externalCalendars.map((cal, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
                <div className="w-6 h-6 flex items-center justify-center text-stone-500">
                  <i className={`${platformIcons[cal.nombre] || "ri-calendar-line"} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-700">{cal.nombre}</p>
                  <p className="text-xs text-stone-400 truncate font-mono">{cal.url}</p>
                </div>
                <button
                  onClick={() => handleRemoveImport(idx)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 cursor-pointer flex-shrink-0"
                >
                  <i className="ri-delete-bin-line text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-stone-400 text-center py-2">
            <i className="ri-calendar-line mr-1"></i>Sin calendarios externos conectados
          </div>
        )}
      </div>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function CalendarioPropiedad({ property, onClose }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch bookings for this property
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select("fecha_inicio, fecha_fin, estado")
        .eq("propiedad_id", property.id)
        .in("estado", ["confirmada", "pendiente"]);

      const booked: string[] = [];
      (data || []).forEach((b) => {
        const start = new Date(b.fecha_inicio);
        const end = new Date(b.fecha_fin);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          booked.push(d.toISOString().split("T")[0]);
        }
      });
      setBookedDates(booked);
      setBlockedDates(property.fechas_bloqueadas || []);
      setLoading(false);
    };
    fetchBookings();
  }, [property.id, property.fechas_bloqueadas]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isBooked = (day: number) => bookedDates.includes(getDateStr(day));
  const isBlocked = (day: number) => blockedDates.includes(getDateStr(day));
  const isSelected = (day: number) => selectedDates.includes(getDateStr(day));
  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const toggleDate = (day: number) => {
    if (isPast(day) || isBooked(day)) return;
    const dateStr = getDateStr(day);
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // Merge with existing blocked dates (remove selected if they were blocked, add if they weren't)
    const newBlocked = blockedDates.filter((d) => !selectedDates.includes(d));
    const toAdd = selectedDates.filter((d) => !blockedDates.includes(d));
    const finalBlocked = [...newBlocked, ...toAdd];

    const { error } = await supabase
      .from("properties")
      .update({ fechas_bloqueadas: finalBlocked })
      .eq("id", property.id);

    if (!error) {
      setBlockedDates(finalBlocked);
      setSelectedDates([]);
    }
    setSaving(false);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Calendario de disponibilidad</h2>
            <p className="text-xs text-stone-500">{property.nombre}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer transition-colors">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8"><i className="ri-loader-4-line animate-spin text-2xl text-stone-400"></i></div>
          ) : (
            <div className="space-y-4">
              {/* Month nav */}
              <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 cursor-pointer transition-colors">
                  <i className="ri-arrow-left-s-line"></i>
                </button>
                <h3 className="text-sm font-semibold text-stone-800">{monthNames[month]} {year}</h3>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 cursor-pointer transition-colors">
                  <i className="ri-arrow-right-s-line"></i>
                </button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const booked = isBooked(day);
                  const blocked = isBlocked(day);
                  const selected = isSelected(day);
                  const past = isPast(day);

                  let classes = "aspect-square flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all ";
                  if (booked) {
                    classes += "bg-rose-100 text-rose-700 cursor-not-allowed";
                  } else if (selected) {
                    classes += "bg-amber-500 text-white";
                  } else if (blocked) {
                    classes += "bg-stone-200 text-stone-500";
                  } else if (past) {
                    classes += "text-stone-300 cursor-not-allowed";
                  } else {
                    classes += "hover:bg-stone-100 text-stone-700";
                  }

                  return (
                    <button
                      key={day}
                      onClick={() => toggleDate(day)}
                      disabled={past || booked}
                      className={classes}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></div>
                  <span className="text-xs text-stone-500">Reservado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-stone-200 border border-stone-300"></div>
                  <span className="text-xs text-stone-500">Bloqueado (no disponible)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-500"></div>
                  <span className="text-xs text-stone-500">Seleccionado</span>
                </div>
              </div>

              {selectedDates.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 mb-1">
                    {selectedDates.length} fecha{selectedDates.length !== 1 ? "s" : ""} seleccionada{selectedDates.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-amber-600 mb-3">
                    Haz clic en <strong>Guardar</strong> para {selectedDates.some((d) => blockedDates.includes(d)) ? "desbloquearlas" : "bloquearlas"}.
                  </p>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-amber-500 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40"
                  >
                    {saving ? <><i className="ri-loader-4-line animate-spin"></i> Guardando...</> : <><i className="ri-check-line"></i> Guardar cambios</>}
                  </button>
                </div>
              )}

              {/* Sincronización iCal */}
              <ICalSync property={property} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}