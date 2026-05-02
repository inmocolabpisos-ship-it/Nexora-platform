import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import { supabase, DbProperty } from "@/lib/supabase";
import { propertyTypeLabels, amenityLabels, PropertyType, AmenityFilter } from "./components/PropertyFilters";
import ReviewsList from "@/components/feature/ReviewsList";
import QRPago from "@/components/feature/QRPago";

type MetodoPago = "revolut" | "bizum" | "tarjeta";

const metodosInfo: Record<MetodoPago, { label: string; icon: string; color: string; bg: string; descripcion: string; detalle: string; link?: string }> = {
  revolut: {
    label: "Revolut",
    icon: "ri-send-plane-fill",
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
    descripcion: "Pago instantáneo por Revolut",
    detalle: "Haz clic en el botón para pagar directamente por Revolut",
    link: "https://revolut.me/mangelg8sg",
  },
  bizum: {
    label: "Bizum",
    icon: "ri-smartphone-line",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    descripcion: "Pago instantáneo por Bizum",
    detalle: "Envía el importe al número: 614 976 736",
  },
  tarjeta: {
    label: "Tarjeta",
    icon: "ri-bank-card-line",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    descripcion: "Tarjeta de crédito / débito",
    detalle: "El equipo de StayLux te contactará para procesar el pago con tarjeta de forma segura",
  },
};

const REVOLUT_URL = "https://revolut.me/mangelg8sg";
const REVOLUT_QR = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https%3A%2F%2Frevolut.me%2Fmangelg8sg&bgcolor=ffffff&color=1a1a1a&margin=10";

async function notifyRevolutClick(propiedad?: string, importeEstimado?: number) {
  try {
    await supabase.functions.invoke("whatsapp-notify", {
      body: {
        tipo: "revolut_click",
        pagina: propiedad ? `Propiedad: ${propiedad}` : "Página de propiedades",
        propiedad: propiedad || null,
        importe_estimado: importeEstimado || null,
      },
    });
  } catch (e) {
    console.error("WhatsApp notify error:", e);
  }
}

async function notifyBizumClick(propiedad?: string, importeEstimado?: number) {
  try {
    await supabase.functions.invoke("whatsapp-notify", {
      body: {
        tipo: "bizum_click",
        pagina: propiedad ? `Propiedad: ${propiedad}` : "Página de propiedades",
        propiedad: propiedad || null,
        importe_estimado: importeEstimado || null,
      },
    });
  } catch (e) {
    console.error("WhatsApp notify error:", e);
  }
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<DbProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("revolut");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [numHuespedes, setNumHuespedes] = useState(1);
  const [revolutNotified, setRevolutNotified] = useState(false);
  const [bizumNotified, setBizumNotified] = useState(false);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<Record<string, boolean>>({
    limpieza: false,
    sabanas: false,
    hosteleria: false,
  });

  const SERVICIOS_EXTRA = [
    { key: "limpieza", label: "Servicio de limpieza", icon: "ri-brush-line", precio: 60 },
    { key: "sabanas", label: "Cambio de sábanas", icon: "ri-hotel-bed-line", precio: 30 },
    { key: "hosteleria", label: "Servicio de hostelería", icon: "ri-restaurant-line", precio: 80 },
  ];

  const IVA_RATE = 0.10;

  const toggleServicio = (key: string) => {
    setServiciosSeleccionados((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calcNoches = () => {
    if (!fechaEntrada || !fechaSalida) return 0;
    const diff = new Date(fechaSalida).getTime() - new Date(fechaEntrada).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  };
  const noches = calcNoches();

  const precioAlojamiento = noches > 0 && property ? noches * (property.precio_noche || 0) : 0;
  const comision = Math.round(precioAlojamiento * 0.15);
  const subtotalServicios = SERVICIOS_EXTRA
    .filter((s) => serviciosSeleccionados[s.key])
    .reduce((acc, s) => acc + s.precio, 0);
  const ivaServicios = Math.round(subtotalServicios * IVA_RATE);
  const totalServicios = subtotalServicios + ivaServicios;
  const precioTotal = precioAlojamiento > 0 ? precioAlojamiento + comision + totalServicios : 0;

  useEffect(() => {
    if (!id) return;
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) setProperty(data as DbProperty);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <i className="ri-loader-4-line animate-spin text-3xl text-stone-400 block mb-3"></i>
            <p className="text-stone-400 text-sm">Cargando propiedad...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-stone-100 text-stone-400 mx-auto mb-4">
              <i className="ri-building-line text-2xl"></i>
            </div>
            <h2 className="text-stone-700 font-semibold mb-2">Propiedad no encontrada</h2>
            <p className="text-stone-400 text-sm mb-5">Esta propiedad no existe o no está disponible.</p>
            <Link to="/propiedades" className="bg-stone-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap hover:bg-stone-700 transition-colors">
              Ver todas las propiedades
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const amenityKeys = (Object.keys(property.amenities || {}) as (keyof AmenityFilter)[])
    .filter((k) => (property.amenities as Record<string, boolean>)[k]);

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      {/* Lightbox */}
      {lightbox && property.fotos?.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white cursor-pointer hover:bg-white/20 transition-colors" onClick={() => setLightbox(false)}>
            <i className="ri-close-line text-xl"></i>
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white cursor-pointer hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setActivePhoto((prev) => (prev - 1 + property.fotos.length) % property.fotos.length); }}>
            <i className="ri-arrow-left-s-line text-xl"></i>
          </button>
          <img src={property.fotos[activePhoto]} alt="" className="max-w-4xl max-h-[85vh] w-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white cursor-pointer hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setActivePhoto((prev) => (prev + 1) % property.fotos.length); }}>
            <i className="ri-arrow-right-s-line text-xl"></i>
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activePhoto + 1} / {property.fotos.length}
          </div>
        </div>
      )}

      <div className="pt-20">
        {/* Photo gallery */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-5">
            <Link to="/" className="hover:text-stone-600 cursor-pointer">Inicio</Link>
            <i className="ri-arrow-right-s-line"></i>
            <Link to="/propiedades" className="hover:text-stone-600 cursor-pointer">Propiedades</Link>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-stone-600 truncate">{property.nombre}</span>
          </div>

          {/* Gallery grid */}
          {property.fotos?.length > 0 ? (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] md:h-[500px] rounded-2xl overflow-hidden">
              {/* Main photo */}
              <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => { setActivePhoto(0); setLightbox(true); }}>
                <img src={property.fotos[0]} alt={property.nombre} className="w-full h-full object-cover object-top group-hover:brightness-90 transition-all" />
              </div>
              {/* Secondary photos */}
              {[1,2,3,4].map((i) => (
                <div key={i} className="relative cursor-pointer group overflow-hidden" onClick={() => { setActivePhoto(i); setLightbox(true); }}>
                  {property.fotos[i] ? (
                    <>
                      <img src={property.fotos[i]} alt="" className="w-full h-full object-cover object-top group-hover:brightness-90 transition-all" />
                      {i === 4 && property.fotos.length > 5 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">+{property.fotos.length - 5} fotos</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-300">
                      <i className="ri-image-line text-2xl"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 bg-stone-200 rounded-2xl flex items-center justify-center text-stone-300">
              <i className="ri-image-line text-4xl"></i>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Left: Details */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-gold-100 text-gold-700 text-xs font-semibold px-3 py-1 rounded-full font-body">
                    {propertyTypeLabels[property.tipo as PropertyType] || property.tipo}
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <i className="ri-shield-check-line text-xs"></i> Verificada SES
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-light text-charcoal-900 mb-2">
                  {property.nombre}
                </h1>
                <div className="flex items-center gap-1.5 text-charcoal-500 text-sm font-body">
                  <i className="ri-map-pin-line"></i>
                  <span>{property.direccion && `${property.direccion}, `}{property.ciudad}{property.provincia && `, ${property.provincia}`}</span>
                </div>
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 pb-8 border-b border-gold-100">
                {[
                  { icon: "ri-hotel-bed-line", value: property.habitaciones, label: "Habitaciones" },
                  { icon: "ri-drop-line", value: property.banos, label: "Baños" },
                  { icon: "ri-group-line", value: `${property.capacidad} pers.`, label: "Capacidad" },
                  { icon: "ri-ruler-line", value: `${property.metros_cuadrados}m²`, label: "Superficie" },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl border border-gold-100 p-4 text-center">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gold-100 text-gold-600 mx-auto mb-2">
                      <i className={`${item.icon} text-sm`}></i>
                    </div>
                    <div className="text-charcoal-900 font-bold text-lg font-body">{item.value}</div>
                    <div className="text-charcoal-400 text-xs font-body">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {property.descripcion && (
                <div className="mb-8 pb-8 border-b border-gold-100">
                  <h2 className="text-lg font-semibold text-charcoal-900 mb-3">Descripción</h2>
                  <p className="text-charcoal-600 text-sm leading-relaxed font-body">{property.descripcion}</p>
                </div>
              )}

              {/* Amenities */}
              {amenityKeys.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gold-100">
                  <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Servicios y características</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {amenityKeys.map((k) => (
                      <div key={k} className="flex items-center gap-3 bg-white rounded-xl border border-gold-100 p-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gold-100 text-gold-600 flex-shrink-0">
                          <i className={`${amenityLabels[k].icon} text-sm`}></i>
                        </div>
                        <span className="text-charcoal-700 text-sm font-medium font-body">{amenityLabels[k].label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registro turístico legal */}
              <div className="mb-8 pb-8 border-b border-gold-100">
                <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Registro Turístico</h2>
                {property.numero_registro_turistico ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0">
                      <i className="ri-government-line text-lg"></i>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wide">Número de Registro Turístico Oficial</div>
                      <div className="text-emerald-800 font-mono font-bold text-lg">{property.numero_registro_turistico}</div>
                      <div className="text-emerald-600 text-xs mt-1">
                        Propiedad registrada y verificada conforme al RD 1312/2024 sobre alojamientos turísticos
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-cream-100 border border-gold-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gold-100 text-gold-500 flex-shrink-0">
                      <i className="ri-time-line text-sm"></i>
                    </div>
                    <div className="text-charcoal-500 text-sm font-body">Registro turístico en proceso de verificación</div>
                  </div>
                )}
              </div>

              {/* Políticas de cancelación */}
              <div className="mb-8 pb-8 border-b border-gold-100">
                <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Política de cancelación</h2>
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0">
                      <i className="ri-check-line text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Cancelación gratuita hasta 7 días antes</p>
                      <p className="text-xs text-emerald-600 mt-0.5">Reembolso completo del 100% si cancelas con más de 7 días de antelación a la fecha de entrada.</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
                      <i className="ri-time-line text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Cancelación parcial entre 3 y 7 días antes</p>
                      <p className="text-xs text-amber-600 mt-0.5">Reembolso del 50% del importe total si cancelas entre 3 y 7 días antes de la entrada.</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 flex-shrink-0">
                      <i className="ri-close-line text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Sin reembolso con menos de 3 días</p>
                      <p className="text-xs text-red-500 mt-0.5">Si cancelas con menos de 72 horas de antelación, no se realizará ningún reembolso.</p>
                    </div>
                  </div>
                  <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
                    <p className="text-xs text-stone-500 leading-relaxed">
                      <i className="ri-information-line mr-1 text-stone-400"></i>
                      Los reembolsos se procesan en un plazo de 5-10 días hábiles. Para cancelar una reserva, contacta con el equipo de StayLux a través del chat interno o por email a <strong>soporte@staylux.es</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reseñas */}
              <div className="mb-8 pb-8 border-b border-gold-100">
                {property?.id && <ReviewsList propiedadId={property.id} />}
              </div>

              {/* Propietario */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Anfitrión</h2>
                <div className="flex items-center gap-4 bg-white rounded-xl border border-gold-100 p-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gold-100 text-gold-600 flex-shrink-0">
                    <i className="ri-user-line text-xl"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-charcoal-900 text-sm font-body">{property.propietario_nombre || "Anfitrión verificado"}</div>
                    <div className="text-stone-400 text-xs flex items-center gap-1 mt-0.5">
                      <i className="ri-shield-check-line text-emerald-500"></i>
                      Identidad verificada · Cumplimiento SES HOSPEDAJE
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Booking card */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="sticky top-28 bg-white rounded-2xl border border-gold-200 p-6">
                {/* Price */}
                <div className="flex items-end gap-2 mb-5 pb-5 border-b border-gold-100">
                  <span className="text-3xl font-bold text-charcoal-900">€{property.precio_noche}</span>
                  <span className="text-charcoal-400 text-sm mb-1 font-body">/ noche</span>
                  <span className="ml-auto text-xs text-charcoal-400 font-body">Alojamiento exento de IVA</span>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="border border-gold-200 rounded-xl p-3">
                    <label className="text-xs font-semibold text-charcoal-500 block mb-1 font-body">LLEGADA</label>
                    <input
                      type="date"
                      value={fechaEntrada}
                      onChange={(e) => setFechaEntrada(e.target.value)}
                      className="w-full text-sm text-charcoal-800 focus:outline-none cursor-pointer bg-transparent font-body"
                    />
                  </div>
                  <div className="border border-gold-200 rounded-xl p-3">
                    <label className="text-xs font-semibold text-charcoal-500 block mb-1 font-body">SALIDA</label>
                    <input
                      type="date"
                      value={fechaSalida}
                      onChange={(e) => setFechaSalida(e.target.value)}
                      className="w-full text-sm text-charcoal-800 focus:outline-none cursor-pointer bg-transparent font-body"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="border border-gold-200 rounded-xl p-3 mb-4">
                  <label className="text-xs font-semibold text-charcoal-500 block mb-1 font-body">HUÉSPEDES</label>
                  <select
                    value={numHuespedes}
                    onChange={(e) => setNumHuespedes(Number(e.target.value))}
                    className="w-full text-sm text-charcoal-800 focus:outline-none cursor-pointer bg-transparent font-body"
                  >
                    {Array.from({ length: property.capacidad }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "huésped" : "huéspedes"}</option>
                    ))}
                  </select>
                </div>

                {/* Servicios extra con IVA */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-charcoal-600 uppercase tracking-wide font-body">Servicios adicionales</p>
                    <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-body font-medium">+10% IVA</span>
                  </div>
                  <div className="space-y-2">
                    {SERVICIOS_EXTRA.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleServicio(s.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          serviciosSeleccionados[s.key]
                            ? "border-gold-400 bg-gold-50"
                            : "border-gold-100 bg-white hover:border-gold-300"
                        }`}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${
                          serviciosSeleccionados[s.key] ? "bg-gold-gradient text-white" : "bg-cream-100 text-gold-500"
                        }`}>
                          <i className={`${s.icon} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold font-body ${
                            serviciosSeleccionados[s.key] ? "text-gold-800" : "text-charcoal-700"
                          }`}>{s.label}</p>
                          <p className="text-xs text-charcoal-400 font-body">€{s.precio} + IVA 10%</p>
                        </div>
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 border-2 transition-all ${
                          serviciosSeleccionados[s.key]
                            ? "border-gold-500 bg-gold-500"
                            : "border-gold-200 bg-white"
                        }`}>
                          {serviciosSeleccionados[s.key] && (
                            <i className="ri-check-line text-white text-xs"></i>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-charcoal-400 mt-2 font-body">
                    <i className="ri-information-line mr-1 text-gold-500"></i>
                    El alojamiento está exento de IVA. Los servicios de limpieza, cambio de sábanas y hostelería tributan al 10% según la Ley 37/1992 del IVA.
                  </p>
                </div>

                {/* Precio calculado */}
                {noches > 0 && (
                  <div className="bg-cream-100 rounded-xl p-4 mb-4 space-y-2 border border-gold-100">
                    <div className="flex justify-between text-sm text-charcoal-600 font-body">
                      <span>€{property.precio_noche} × {noches} {noches === 1 ? "noche" : "noches"}</span>
                      <span>€{precioAlojamiento.toLocaleString("es-ES")}</span>
                    </div>
                    <div className="flex justify-between text-sm text-charcoal-600 font-body">
                      <span>Comisión de servicio (15%)</span>
                      <span>€{comision.toLocaleString("es-ES")}</span>
                    </div>
                    {subtotalServicios > 0 && (
                      <>
                        <div className="pt-2 border-t border-gold-200">
                          <p className="text-xs font-semibold text-gold-700 uppercase tracking-wide mb-1.5 font-body">Servicios adicionales</p>
                          {SERVICIOS_EXTRA.filter((s) => serviciosSeleccionados[s.key]).map((s) => (
                            <div key={s.key} className="flex justify-between text-xs text-charcoal-500 font-body mb-1">
                              <span>{s.label}</span>
                              <span>€{s.precio}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs text-gold-700 font-semibold font-body mt-1">
                            <span>IVA 10% (servicios)</span>
                            <span>€{ivaServicios}</span>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-bold text-charcoal-900 pt-2 border-t border-gold-200 font-body">
                      <span>Total</span>
                      <span className="text-gold-700">€{precioTotal.toLocaleString("es-ES")}</span>
                    </div>
                    {subtotalServicios === 0 && (
                      <p className="text-xs text-charcoal-400 font-body">
                        <i className="ri-shield-check-line mr-1 text-emerald-500"></i>
                        Alojamiento exento de IVA
                      </p>
                    )}
                  </div>
                )}

                {/* Métodos de pago */}
                <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 font-body">Forma de pago</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(Object.entries(metodosInfo) as [MetodoPago, typeof metodosInfo.bizum][]).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMetodoPago(key)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer font-body ${
                        metodoPago === key
                          ? "bg-gold-gradient text-white border-transparent"
                          : "bg-white text-charcoal-500 border-gold-200 hover:border-gold-400"
                      }`}
                    >
                      <i className={`${info.icon} text-base`}></i>
                      {info.label}
                    </button>
                  ))}
                </div>

                {/* Info del método seleccionado */}
                <div className={`rounded-xl border p-3 mb-4 ${metodosInfo[metodoPago].bg}`}>
                  <p className={`text-xs font-semibold ${metodosInfo[metodoPago].color} mb-0.5 font-body`}>
                    {metodosInfo[metodoPago].descripcion}
                  </p>
                  <p className={`text-xs ${metodosInfo[metodoPago].color} opacity-80 font-body`}>
                    {metodosInfo[metodoPago].detalle}
                  </p>
                  {metodoPago === "bizum" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`font-mono font-bold text-sm ${metodosInfo.bizum.color}`}>614 976 736</span>
                      <span className={`text-xs ${metodosInfo.bizum.color} opacity-70 font-body`}>· NEXURA</span>
                    </div>
                  )}
                  {metodoPago === "revolut" && (
                    <div className="mt-2">
                      <span className={`font-mono text-xs ${metodosInfo.revolut.color} opacity-80`}>revolut.me/mangelg8sg</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {metodoPago === "revolut" ? (
                  <a
                    href={REVOLUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (!revolutNotified) {
                        setRevolutNotified(true);
                        notifyRevolutClick(
                          property?.nombre,
                          precioTotal > 0 ? precioTotal : undefined
                        );
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gold-gradient text-white py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap mb-3 font-body"
                  >
                    <i className="ri-send-plane-fill"></i>
                    Pagar por Revolut
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setShowPagoModal(true);
                      if (metodoPago === "bizum" && !bizumNotified) {
                        setBizumNotified(true);
                        notifyBizumClick(
                          property?.nombre,
                          precioTotal > 0 ? precioTotal : undefined
                        );
                      }
                    }}
                    className="w-full block text-center bg-gold-gradient text-white py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap mb-3 font-body"
                  >
                    Reservar y pagar con {metodosInfo[metodoPago].label}
                  </button>
                )}
                <p className="text-center text-charcoal-400 text-xs font-body">
                  Necesitas registrarte como huésped para reservar
                </p>

                {/* QR de pago */}
                {precioTotal > 0 && (
                  <div className="mt-4 pt-4 border-t border-gold-100">
                    <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-3 font-body">QR de pago</p>
                    <div className="flex justify-center">
                      <QRPago
                        importe={precioTotal}
                        concepto={`Reserva ${property.nombre}`}
                        nombreNegocio="NEXURA"
                        size={160}
                        showDownload={true}
                      />
                    </div>
                  </div>
                )}

                {/* Trust badges */}
                <div className="mt-5 pt-5 border-t border-gold-100 space-y-2">
                  {property.numero_registro_turistico && (
                    <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                      <i className="ri-government-line text-emerald-600 text-sm flex-shrink-0"></i>
                      <span className="text-emerald-700 font-mono font-semibold">{property.numero_registro_turistico}</span>
                    </div>
                  )}
                  {[
                    { icon: "ri-shield-check-line", text: "Propiedad verificada SES HOSPEDAJE", color: "text-emerald-600" },
                    { icon: "ri-lock-line", text: "Pago seguro y protegido", color: "text-charcoal-500" },
                    { icon: "ri-customer-service-line", text: "Soporte 24/7 disponible", color: "text-charcoal-500" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 text-xs text-charcoal-500 font-body">
                      <i className={`${item.icon} ${item.color} text-sm flex-shrink-0`}></i>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPagoModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gold-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-charcoal-900 font-body">Cómo pagar con {metodosInfo[metodoPago].label}</h3>
              <button onClick={() => setShowPagoModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gold-50 cursor-pointer text-charcoal-400">
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Resumen reserva */}
            {noches > 0 && (
              <div className="bg-cream-100 rounded-xl p-4 mb-5 border border-gold-100">
                <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 font-body">Resumen</p>
                <p className="text-sm font-semibold text-charcoal-900 mb-1 font-body">{property.nombre}</p>
                <p className="text-xs text-charcoal-500 font-body">{noches} {noches === 1 ? "noche" : "noches"} · {numHuespedes} {numHuespedes === 1 ? "huésped" : "huéspedes"}</p>
                {subtotalServicios > 0 && (
                  <p className="text-xs text-gold-700 font-body mt-1">
                    Servicios: €{subtotalServicios} + IVA 10% (€{ivaServicios})
                  </p>
                )}
                <p className="text-lg font-bold text-gold-700 mt-2 font-body">€{precioTotal.toLocaleString("es-ES")}</p>
              </div>
            )}

            {/* Instrucciones por método */}
            {metodoPago === "revolut" && (
              <div className="space-y-3 mb-5">
                {/* QR Revolut */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                  <div className="flex-shrink-0">
                    <img
                      src={REVOLUT_QR}
                      alt="QR Revolut"
                      className="w-28 h-28 rounded-xl border border-violet-200"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-semibold text-stone-800 mb-1">Escanea con tu móvil</p>
                    <p className="text-xs text-stone-500 mb-2">Apunta la cámara al QR para abrir Revolut directamente</p>
                    <span className="text-xs font-mono text-violet-600 bg-white border border-violet-200 px-2 py-1 rounded-lg">revolut.me/mangelg8sg</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-100 text-violet-600 flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Envía el importe exacto</p>
                    <p className="text-xs text-stone-500">Indica en el concepto tu nombre y la propiedad</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-100 text-violet-600 flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">O haz clic en el botón</p>
                    <p className="text-xs text-stone-500">Te redirige directamente a Revolut en el navegador</p>
                  </div>
                </div>
                <a
                  href={REVOLUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (!revolutNotified) {
                      setRevolutNotified(true);
                      notifyRevolutClick(
                        property?.nombre,
                        noches > 0 && property ? Math.round(property.precio_noche * noches * 1.15) : undefined
                      );
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-send-plane-fill text-violet-400"></i>
                  Abrir Revolut y pagar
                  <span className="text-xs opacity-60 font-mono">revolut.me/mangelg8sg</span>
                </a>
              </div>
            )}
            {metodoPago === "bizum" && (
              <div className="space-y-3 mb-5">
                {/* QR Bizum */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex-shrink-0 flex justify-center">
                    <QRPago
                      importe={precioTotal > 0 ? precioTotal : (property?.precio_noche || 0)}
                      concepto={`Reserva ${property.nombre}`}
                      nombreNegocio="NEXURA"
                      size={120}
                      showDownload={false}
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-semibold text-stone-800 mb-1">Escanea con tu móvil</p>
                    <p className="text-xs text-stone-500 mb-2">Apunta la cámara al QR para abrir Bizum directamente</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700 text-base">614 976 736</span>
                      <span className="text-xs text-emerald-600 font-body">· NEXURA</span>
                    </div>
                    {precioTotal > 0 && (
                      <p className="text-xs text-emerald-700 font-semibold mt-1 font-body">
                        Importe: €{precioTotal.toLocaleString("es-ES")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Desglose legal IVA — Ley 37/1992 */}
                {precioTotal > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <i className="ri-file-text-line text-amber-500"></i>
                      Desglose legal del pago (Ley 37/1992 IVA)
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-stone-800">Alojamiento vacacional</p>
                          <p className="text-xs text-stone-400">Art. 20.Uno.23.b) Ley 37/1992 — Exento de IVA</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-stone-900">€{precioAlojamiento.toLocaleString("es-ES")}</p>
                          <p className="text-xs text-stone-400">Exento</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-start pt-2 border-t border-amber-200">
                        <div>
                          <p className="text-xs font-semibold text-stone-800">Comisión mediación NEXURA</p>
                          <p className="text-xs text-stone-400">Art. 69 Ley 37/1992 — Mediación digital</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-700">€{comision.toLocaleString("es-ES")}</p>
                          <p className="text-xs text-rose-500">+ IVA 21%: €{Math.round(comision * 0.21).toLocaleString("es-ES")}</p>
                        </div>
                      </div>
                      {subtotalServicios > 0 && (
                        <div className="flex justify-between items-start pt-2 border-t border-amber-200">
                          <div>
                            <p className="text-xs font-semibold text-stone-800">Servicios adicionales</p>
                            <p className="text-xs text-stone-400">Art. 91.Uno.2.2.º Ley 37/1992 — Hostelería</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-stone-700">€{subtotalServicios.toLocaleString("es-ES")}</p>
                            <p className="text-xs text-rose-500">+ IVA 10%: €{ivaServicios.toLocaleString("es-ES")}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-amber-300">
                        <p className="text-sm font-bold text-stone-900">TOTAL A PAGAR</p>
                        <p className="text-lg font-bold text-emerald-700">€{precioTotal.toLocaleString("es-ES")}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Abre tu app bancaria</p>
                    <p className="text-xs text-stone-500">Accede a la sección de Bizum</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Envía al número</p>
                    <p className="font-mono font-bold text-emerald-700 text-lg">614 976 736</p>
                    <p className="text-xs text-stone-500">NEXURA</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0 text-sm font-bold">3</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Indica en el concepto</p>
                    <p className="text-xs text-stone-500 font-mono bg-white border border-stone-200 rounded px-2 py-1 mt-1 inline-block">
                      Reserva {property.nombre}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metodoPago === "transferencia" && (
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-200 text-stone-600 flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Completa tu registro</p>
                    <p className="text-xs text-stone-500">Crea tu cuenta de huésped en StayLux</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-200 text-stone-600 flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Recibe los datos bancarios</p>
                    <p className="text-xs text-stone-500">Te los enviamos por email tras confirmar la reserva</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-200 text-stone-600 flex-shrink-0 text-sm font-bold">3</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Realiza la transferencia</p>
                    <p className="text-xs text-stone-500">Indica tu nombre y propiedad en el concepto</p>
                  </div>
                </div>
              </div>
            )}

            {metodoPago === "tarjeta" && (
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Completa tu registro</p>
                    <p className="text-xs text-stone-500">Crea tu cuenta de huésped en StayLux</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">El equipo te contacta</p>
                    <p className="text-xs text-stone-500">Te enviamos un enlace de pago seguro por email o WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0 text-sm font-bold">3</div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Pago 100% seguro</p>
                    <p className="text-xs text-stone-500">Visa, Mastercard y American Express aceptadas</p>
                  </div>
                </div>
              </div>
            )}

            {metodoPago !== "revolut" && (
              <div className="flex flex-col gap-3">
                <Link
                  to={`/confirmacion-bizum?importe=${precioTotal > 0 ? precioTotal : (property?.precio_noche || 0)}&concepto=${encodeURIComponent(`Reserva ${property.nombre}`)}&tipo=propiedad`}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap font-body"
                >
                  <i className="ri-upload-cloud-2-line"></i>
                  Ya pagué — Subir justificante
                </Link>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPagoModal(false)}
                    className="flex-1 border border-gold-200 text-charcoal-600 py-3 rounded-full text-sm font-medium hover:bg-cream-100 cursor-pointer whitespace-nowrap font-body"
                  >
                    Volver
                  </button>
                  <Link
                    to="/registro-huesped"
                    className="flex-1 bg-gold-gradient text-white py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap text-center font-body"
                  >
                    Crear cuenta y reservar
                  </Link>
                </div>
              </div>
            )}
            {metodoPago === "revolut" && (
              <button
                onClick={() => setShowPagoModal(false)}
                className="w-full border border-gold-200 text-charcoal-600 py-3 rounded-full text-sm font-medium hover:bg-cream-100 cursor-pointer whitespace-nowrap font-body"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
