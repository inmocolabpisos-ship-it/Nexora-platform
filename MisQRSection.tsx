import { useState, useEffect } from "react";
import { supabase, DbProperty } from "@/lib/supabase";
import QRPago from "@/components/feature/QRPago";
import { barcosData } from "@/mocks/barcos";
import { hostalesData } from "@/mocks/hostales";
import { campingsData } from "@/mocks/campings";

type Categoria = "propiedades" | "barcos" | "hostales" | "campings" | "inmobiliarias";

const PLAN_INFO = {
  basico: { label: "Básico", precio: 25 },
  profesional: { label: "Profesional", precio: 50 },
  ilimitado: { label: "Ilimitado", precio: 95 },
};

type Inmobiliaria = {
  id: string;
  nombre_inmobiliaria: string;
  plan: "basico" | "profesional" | "ilimitado";
  estado: string;
};

export default function MisQRSection() {
  const [categoria, setCategoria] = useState<Categoria>("propiedades");
  const [propiedades, setPropiedades] = useState<DbProperty[]>([]);
  const [inmobiliarias, setInmobiliarias] = useState<Inmobiliaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (categoria === "propiedades") fetchPropiedades();
    if (categoria === "inmobiliarias") fetchInmobiliarias();
  }, [categoria]);

  const fetchPropiedades = async () => {
    setLoading(true);
    const { data } = await supabase.from("properties").select("*").order("nombre");
    setPropiedades((data as DbProperty[]) || []);
    setLoading(false);
  };

  const fetchInmobiliarias = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inmobiliarias_suscripciones")
      .select("id,nombre_inmobiliaria,plan,estado")
      .eq("estado", "activo")
      .order("nombre_inmobiliaria");
    setInmobiliarias((data as Inmobiliaria[]) || []);
    setLoading(false);
  };

  const categorias: { id: Categoria; label: string; icon: string; count: number }[] = [
    { id: "propiedades", label: "Propiedades", icon: "ri-building-line", count: propiedades.length },
    { id: "barcos", label: "Barcos", icon: "ri-ship-line", count: barcosData.length },
    { id: "hostales", label: "Hostales", icon: "ri-hotel-line", count: hostalesData.length },
    { id: "campings", label: "Campings", icon: "ri-tent-line", count: campingsData.length },
    { id: "inmobiliarias", label: "Inmobiliarias", icon: "ri-building-2-line", count: inmobiliarias.length },
  ];

  const filtrar = (texto: string) =>
    !busqueda || texto.toLowerCase().includes(busqueda.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Mis QR de pago</h2>
          <p className="text-stone-500 text-sm mt-0.5">
            QR generados automáticamente con el precio de cada propiedad, habitación, barco, parcela e inmobiliaria
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <i className="ri-information-line text-amber-500 text-sm"></i>
          <span className="text-amber-700 text-xs font-medium">Descarga e imprime para poner en cada espacio</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-amber-400 bg-white"
        />
      </div>

      {/* Tabs categorías */}
      <div className="flex flex-wrap gap-2">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategoria(cat.id); setBusqueda(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              categoria === cat.id
                ? "bg-stone-900 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
            }`}
          >
            <i className={`${cat.icon} text-sm`}></i>
            {cat.label}
            {cat.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                categoria === cat.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
              }`}>
                {cat.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-stone-300"></i>
        </div>
      ) : (
        <>
          {/* PROPIEDADES */}
          {categoria === "propiedades" && (
            <div>
              {propiedades.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm bg-white rounded-2xl border border-stone-100">
                  <i className="ri-building-line text-3xl mb-2 block text-stone-200"></i>
                  No hay propiedades registradas
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {propiedades.filter((p) => filtrar(p.nombre)).map((prop) => (
                    <div key={prop.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col items-center gap-3">
                      <div className="text-center w-full">
                        <div className="font-semibold text-stone-900 text-xs truncate">{prop.nombre}</div>
                        <div className="text-stone-400 text-xs">{prop.ciudad}</div>
                      </div>
                      <QRPago
                        importe={prop.precio_noche}
                        concepto={`Reserva ${prop.nombre}`}
                        nombreNegocio="NEXURA"
                        size={140}
                        showDownload={true}
                        compact={false}
                      />
                      <div className="text-xs text-stone-400 text-center">Precio/noche</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BARCOS */}
          {categoria === "barcos" && (
            <div className="space-y-6">
              {barcosData.filter((b) => filtrar(b.nombre)).map((barco) => (
                <div key={barco.id} className="bg-white rounded-2xl border border-stone-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
                      <i className="ri-ship-line text-base"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">{barco.nombre}</div>
                      <div className="text-stone-400 text-xs">{barco.puerto} · {barco.ubicacion}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Día completo</div>
                      <QRPago
                        importe={barco.precio_dia}
                        concepto={`Reserva ${barco.nombre} - Día completo`}
                        nombreNegocio="NEXURA"
                        size={150}
                        showDownload={true}
                        compact={false}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Medio día</div>
                      <QRPago
                        importe={barco.precio_medio_dia}
                        concepto={`Reserva ${barco.nombre} - Medio día`}
                        nombreNegocio="NEXURA"
                        size={150}
                        showDownload={true}
                        compact={false}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HOSTALES */}
          {categoria === "hostales" && (
            <div className="space-y-6">
              {hostalesData.filter((h) => filtrar(h.nombre)).map((hostal) => (
                <div key={hostal.id} className="bg-white rounded-2xl border border-stone-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 text-stone-600 flex-shrink-0">
                      <i className="ri-hotel-line text-base"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">{hostal.nombre}</div>
                      <div className="text-stone-400 text-xs">{hostal.ubicacion}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {hostal.habitaciones.map((hab) => (
                      <div key={hab.key} className="flex flex-col items-center gap-2">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-stone-700">{hab.label}</div>
                          <div className="text-xs text-stone-400">{hab.camas}</div>
                        </div>
                        <QRPago
                          importe={hab.precio_noche}
                          concepto={`Reserva ${hostal.nombre} - ${hab.label}`}
                          nombreNegocio="NEXURA"
                          size={140}
                          showDownload={true}
                          compact={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CAMPINGS */}
          {categoria === "campings" && (
            <div className="space-y-6">
              {campingsData.filter((c) => filtrar(c.nombre)).map((camping) => (
                <div key={camping.id} className="bg-white rounded-2xl border border-stone-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
                      <i className="ri-tent-line text-base"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">{camping.nombre}</div>
                      <div className="text-stone-400 text-xs">{camping.ubicacion}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {camping.parcelas.map((parcela) => (
                      <div key={parcela.key} className="flex flex-col items-center gap-2">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-stone-700">{parcela.label}</div>
                          <div className="text-xs text-stone-400">{parcela.tipo_alojamiento}</div>
                        </div>
                        <QRPago
                          importe={parcela.precio_noche}
                          concepto={`Reserva ${camping.nombre} - ${parcela.label}`}
                          nombreNegocio="NEXURA"
                          size={140}
                          showDownload={true}
                          compact={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INMOBILIARIAS */}
          {categoria === "inmobiliarias" && (
            <div>
              {inmobiliarias.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm bg-white rounded-2xl border border-stone-100">
                  <i className="ri-building-2-line text-3xl mb-2 block text-stone-200"></i>
                  No hay inmobiliarias activas
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {inmobiliarias.filter((i) => filtrar(i.nombre_inmobiliaria)).map((inmo) => (
                    <div key={inmo.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col items-center gap-3">
                      <div className="text-center w-full">
                        <div className="font-semibold text-stone-900 text-xs truncate">{inmo.nombre_inmobiliaria}</div>
                        <div className="text-xs text-amber-600 font-semibold">
                          Plan {PLAN_INFO[inmo.plan]?.label} — {PLAN_INFO[inmo.plan]?.precio}€/mes
                        </div>
                      </div>
                      <QRPago
                        importe={PLAN_INFO[inmo.plan]?.precio}
                        concepto={`Suscripción ${PLAN_INFO[inmo.plan]?.label} ${inmo.nombre_inmobiliaria}`}
                        nombreNegocio="NEXURA"
                        size={140}
                        showDownload={true}
                        compact={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Info footer */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-200 text-stone-600 flex-shrink-0">
            <i className="ri-printer-line text-base"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 mb-1">Cómo usar los QR</p>
            <ul className="text-xs text-stone-500 space-y-1 leading-relaxed">
              <li><i className="ri-arrow-right-s-line text-amber-500"></i> Haz clic en <strong>"Descargar QR para imprimir"</strong> en cada tarjeta</li>
              <li><i className="ri-arrow-right-s-line text-amber-500"></i> Imprime y plastifica el QR para colocarlo en la habitación, barco o parcela</li>
              <li><i className="ri-arrow-right-s-line text-amber-500"></i> El cliente escanea con su móvil y se abre Bizum con el importe ya cargado</li>
              <li><i className="ri-arrow-right-s-line text-amber-500"></i> El QR incluye el precio/noche base — para reservas de varios días el cliente ajusta el importe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
