import { useState } from "react";

interface ViajeroDatos {
  id: string;
  nombre: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento: string;
  fecha_expedicion: string;
  nacionalidad: string;
  telefono: string;
  email: string;
  es_menor: boolean;
  parentesco: string;
  dni_frontal: string | null;
  dni_trasero: string | null;
  selfie: string | null;
}

interface ServicioExtra {
  key: string;
  label: string;
  precio: number;
}

interface Booking {
  id: string;
  propiedad_nombre: string | null;
  huesped_nombre: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  precio_total: number | null;
  subtotal_alojamiento: number | null;
  comision_nexura: number | null;
  subtotal_servicios: number | null;
  iva_servicios: number | null;
  servicios_extra: ServicioExtra[] | null;
  notas: string | null;
  num_huespedes: number | null;
  viajeros: ViajeroDatos[] | null;
  viajeros_completado: boolean;
}

interface Props {
  bookings: Booking[];
  loading: boolean;
}

function ViajerosModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [selectedViajero, setSelectedViajero] = useState<ViajeroDatos | null>(
    booking.viajeros?.[0] || null
  );
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const viajeros = booking.viajeros || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Viajeros registrados</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {booking.propiedad_nombre} · {viajeros.length} viajero{viajeros.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer transition-colors"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar — lista de viajeros */}
          <div className="w-48 flex-shrink-0 border-r border-stone-100 overflow-y-auto">
            {viajeros.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setSelectedViajero(v)}
                className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors cursor-pointer border-b border-stone-50 ${
                  selectedViajero?.id === v.id ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-700"
                }`}
              >
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                  selectedViajero?.id === v.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                }`}>
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{v.nombre || `Viajero ${idx + 1}`}</p>
                  {v.es_menor && (
                    <span className={`text-xs ${selectedViajero?.id === v.id ? "text-amber-300" : "text-amber-600"}`}>Menor</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="flex-1 overflow-y-auto p-5">
            {selectedViajero ? (
              <div className="space-y-5">
                {/* Datos personales */}
                <div>
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Datos personales</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Nombre completo", value: `${selectedViajero.nombre} ${selectedViajero.apellidos}` },
                      { label: "Fecha de nacimiento", value: selectedViajero.fecha_nacimiento ? new Date(selectedViajero.fecha_nacimiento).toLocaleDateString("es-ES") : "—" },
                      { label: "Nacionalidad", value: selectedViajero.nacionalidad || "—" },
                      { label: "Teléfono", value: selectedViajero.telefono || "—" },
                      { label: "Email", value: selectedViajero.email || "—" },
                      { label: "Parentesco", value: selectedViajero.parentesco || (selectedViajero === (booking.viajeros?.[0] || null) ? "Titular" : "—") },
                    ].map((f) => (
                      <div key={f.label}>
                        <p className="text-xs text-stone-400 mb-0.5">{f.label}</p>
                        <p className="text-sm font-medium text-stone-800">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documento */}
                <div>
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Documento de identidad</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Tipo", value: selectedViajero.tipo_documento?.toUpperCase() || "—" },
                      { label: "Número", value: selectedViajero.numero_documento || (selectedViajero.es_menor ? "Menor — no requerido" : "—") },
                      { label: "Fecha expedición", value: selectedViajero.fecha_expedicion ? new Date(selectedViajero.fecha_expedicion).toLocaleDateString("es-ES") : "—" },
                    ].map((f) => (
                      <div key={f.label}>
                        <p className="text-xs text-stone-400 mb-0.5">{f.label}</p>
                        <p className="text-sm font-medium text-stone-800">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fotos */}
                <div>
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Documentación fotográfica</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Frontal", url: selectedViajero.dni_frontal, icon: "ri-id-card-line" },
                      { label: "Trasero", url: selectedViajero.dni_trasero, icon: "ri-id-card-line" },
                      { label: "Selfie", url: selectedViajero.selfie, icon: "ri-camera-line" },
                    ].map((foto) => (
                      <div key={foto.label}>
                        <p className="text-xs text-stone-400 mb-1.5">{foto.label}</p>
                        {foto.url ? (
                          <button
                            onClick={() => setLightboxImg(foto.url!)}
                            className="w-full h-24 rounded-xl overflow-hidden border border-stone-200 cursor-pointer hover:opacity-90 transition-opacity relative group"
                          >
                            <img src={foto.url} alt={foto.label} className="w-full h-full object-cover object-top" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <i className="ri-zoom-in-line text-white text-lg"></i>
                            </div>
                          </button>
                        ) : (
                          <div className="w-full h-24 rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300">
                            <i className={`${foto.icon} text-xl mb-1`}></i>
                            <span className="text-xs">No subida</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                Selecciona un viajero
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="Documento" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReservasAnfitrion({ bookings, loading }: Props) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const estadoColors: Record<string, string> = {
    confirmada: "bg-emerald-100 text-emerald-700",
    pendiente: "bg-amber-100 text-amber-700",
    cancelada: "bg-red-100 text-red-600",
    bloqueada: "bg-stone-100 text-stone-600",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Reservas de mis propiedades</h2>
        <span className="text-sm text-stone-500">{bookings.length} en total</span>
      </div>

      {loading ? (
        <div className="text-center py-12"><i className="ri-loader-4-line animate-spin text-2xl text-stone-400"></i></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
          <i className="ri-calendar-line text-4xl text-stone-300 mb-3"></i>
          <p className="text-stone-500 text-sm">No hay reservas registradas todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const nights = Math.round((new Date(b.fecha_fin).getTime() - new Date(b.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24));
            const viajerosCount = b.viajeros?.length || 0;
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-stone-100 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-stone-900 truncate">{b.propiedad_nombre || "Propiedad"}</h3>
                    </div>
                    {b.huesped_nombre && (
                      <p className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                        <i className="ri-user-line"></i>{b.huesped_nombre}
                        {b.num_huespedes && <span className="text-stone-400">· {b.num_huespedes} huéspedes</span>}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-stone-400 flex-wrap">
                      <span>{new Date(b.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>→</span>
                      <span>{new Date(b.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>· {nights} {nights === 1 ? "noche" : "noches"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${estadoColors[b.estado] || "bg-stone-100 text-stone-600"}`}>{b.estado}</span>
                    {b.precio_total && <span className="text-sm font-bold text-stone-900">{b.precio_total.toLocaleString("es-ES")}€</span>}
                  </div>
                </div>

                {/* Desglose de precio con IVA */}
                {b.precio_total && (b.subtotal_alojamiento || b.subtotal_servicios) && (
                  <div className="bg-stone-50 rounded-xl border border-stone-100 p-3 mb-3 space-y-1.5">
                    {b.subtotal_alojamiento && b.subtotal_alojamiento > 0 && (
                      <div className="flex justify-between text-xs text-stone-500">
                        <span>Alojamiento (exento IVA)</span>
                        <span>€{b.subtotal_alojamiento.toLocaleString("es-ES")}</span>
                      </div>
                    )}
                    {b.comision_nexura && b.comision_nexura > 0 && (
                      <div className="flex justify-between text-xs text-stone-500">
                        <span>Comisión NEXURA (15%)</span>
                        <span>€{b.comision_nexura.toLocaleString("es-ES")}</span>
                      </div>
                    )}
                    {b.subtotal_servicios && b.subtotal_servicios > 0 && (
                      <>
                        <div className="flex justify-between text-xs text-stone-500">
                          <span>Servicios adicionales</span>
                          <span>€{b.subtotal_servicios.toLocaleString("es-ES")}</span>
                        </div>
                        <div className="flex justify-between text-xs text-amber-700 font-semibold">
                          <span>IVA 10% (servicios)</span>
                          <span>€{b.iva_servicios?.toLocaleString("es-ES") || "0"}</span>
                        </div>
                        {b.servicios_extra && b.servicios_extra.length > 0 && (
                          <div className="pl-2 space-y-0.5">
                            {b.servicios_extra.map((s) => (
                              <div key={s.key} className="flex justify-between text-xs text-stone-400">
                                <span>· {s.label}</span>
                                <span>€{s.precio}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between font-bold text-stone-900 pt-1.5 border-t border-stone-200 text-xs">
                      <span>Total</span>
                      <span>€{b.precio_total.toLocaleString("es-ES")}</span>
                    </div>
                  </div>
                )}

                {/* Viajeros status */}
                <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${b.viajeros_completado ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center gap-2">
                    <i className={`text-sm ${b.viajeros_completado ? "ri-check-double-line text-emerald-600" : "ri-group-line text-amber-600"}`}></i>
                    <div>
                      <span className={`text-xs font-medium ${b.viajeros_completado ? "text-emerald-700" : "text-amber-700"}`}>
                        {b.viajeros_completado
                          ? `${viajerosCount} viajero${viajerosCount !== 1 ? "s" : ""} registrado${viajerosCount !== 1 ? "s" : ""} — SES HOSPEDAJE`
                          : "Pendiente de registro de viajeros (RD 933/2021)"}
                      </span>
                    </div>
                  </div>
                  {b.viajeros_completado && viajerosCount > 0 && (
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-eye-line mr-1"></i>Ver viajeros
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal viajeros */}
      {selectedBooking && (
        <ViajerosModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
