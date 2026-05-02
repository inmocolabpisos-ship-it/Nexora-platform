export type PropertyType = "villa" | "chalet" | "casa_rural" | "apartamento" | "studio" | "habitacion" | "hostal";

export const propertyTypeLabels: Record<PropertyType, string> = {
  villa: "Villa", chalet: "Chalet", casa_rural: "Casa Rural",
  apartamento: "Apartamento", studio: "Studio", habitacion: "Habitación", hostal: "Hostal",
};

export const propertyTypeIcons: Record<PropertyType, string> = {
  villa: "ri-building-4-line", chalet: "ri-home-5-line", casa_rural: "ri-home-heart-line",
  apartamento: "ri-building-line", studio: "ri-door-line", habitacion: "ri-hotel-bed-line", hostal: "ri-community-line",
};

export interface AmenityFilter {
  calefaccion: boolean; chimenea: boolean; jardin: boolean; piscina: boolean;
  mascotas: boolean; ninos: boolean; wifi: boolean; tv: boolean;
  cerca_playa: boolean; montana: boolean; parking: boolean;
  aire_acondicionado: boolean; barbacoa: boolean; terraza: boolean;
}

export const amenityLabels: Record<keyof AmenityFilter, { label: string; icon: string }> = {
  calefaccion: { label: "Calefacción", icon: "ri-temp-hot-line" },
  chimenea: { label: "Chimenea", icon: "ri-fire-line" },
  jardin: { label: "Jardín", icon: "ri-plant-line" },
  piscina: { label: "Piscina", icon: "ri-water-flash-line" },
  mascotas: { label: "Mascotas", icon: "ri-bear-smile-line" },
  ninos: { label: "Niños", icon: "ri-user-smile-line" },
  wifi: { label: "WiFi", icon: "ri-wifi-line" },
  tv: { label: "TV", icon: "ri-tv-line" },
  cerca_playa: { label: "Playa", icon: "ri-sailboat-line" },
  montana: { label: "Montaña", icon: "ri-landscape-line" },
  parking: { label: "Parking", icon: "ri-parking-line" },
  aire_acondicionado: { label: "Aire acond.", icon: "ri-temp-cold-line" },
  barbacoa: { label: "Barbacoa", icon: "ri-restaurant-line" },
  terraza: { label: "Terraza", icon: "ri-sun-line" },
};

export interface FiltersState {
  search: string;
  tipo: PropertyType | "todos";
  precioMin: string;
  precioMax: string;
  habitaciones: string;
  banos: string;
  capacidad: string;
  valoracion: string;
  amenities: (keyof AmenityFilter)[];
  ordenar: "precio_asc" | "precio_desc" | "reciente" | "habitaciones" | "valoracion";
}

export const defaultFilters: FiltersState = {
  search: "", tipo: "todos", precioMin: "", precioMax: "",
  habitaciones: "", banos: "", capacidad: "", valoracion: "",
  amenities: [], ordenar: "reciente",
};

interface PropertyFiltersProps {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
  total: number;
}

const PILL_BTN = (active: boolean) =>
  `w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold border transition-all cursor-pointer whitespace-nowrap font-body ${
    active
      ? "bg-gold-gradient text-white border-gold-500"
      : "border-gold-200 text-charcoal-600 hover:border-gold-400 bg-white"
  }`;

const PILL_ANY = (active: boolean) =>
  `px-3 h-10 flex items-center justify-center rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap font-body ${
    active
      ? "bg-gold-gradient text-white border-gold-500"
      : "border-gold-200 text-charcoal-500 hover:border-gold-400 bg-white"
  }`;

export default function PropertyFilters({ filters, onChange, total }: PropertyFiltersProps) {
  const toggleAmenity = (key: keyof AmenityFilter) => {
    const current = filters.amenities;
    const updated = current.includes(key) ? current.filter((a) => a !== key) : [...current, key];
    onChange({ ...filters, amenities: updated });
  };

  const clearAll = () => onChange(defaultFilters);

  const hasActive =
    filters.tipo !== "todos" ||
    !!filters.search ||
    !!filters.precioMin ||
    !!filters.precioMax ||
    !!filters.habitaciones ||
    !!filters.banos ||
    !!filters.capacidad ||
    !!filters.valoracion ||
    filters.amenities.length > 0;

  const activeCount = [
    filters.tipo !== "todos",
    !!filters.precioMin || !!filters.precioMax,
    !!filters.habitaciones,
    !!filters.banos,
    !!filters.capacidad,
    !!filters.valoracion,
    ...filters.amenities.map(() => true),
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-gold-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gold-100">
        <div className="flex items-center gap-2">
          <i className="ri-equalizer-3-line text-gold-600"></i>
          <h3 className="font-semibold text-charcoal-900 text-sm font-body">Filtros</h3>
          {activeCount > 0 && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gold-500 text-white text-xs font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-charcoal-400 text-xs font-body">{total} prop.</span>
          {hasActive && (
            <button
              onClick={clearAll}
              className="text-xs text-charcoal-500 hover:text-red-500 cursor-pointer flex items-center gap-1 border border-gold-200 hover:border-red-200 px-2.5 py-1.5 rounded-full transition-colors font-body"
            >
              <i className="ri-close-line text-xs"></i> Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">

        {/* Búsqueda */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Buscar
          </label>
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
            <input
              type="text"
              placeholder="Ciudad, nombre..."
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="w-full border border-gold-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold-400 bg-cream-50 font-body"
            />
            {filters.search && (
              <button
                onClick={() => onChange({ ...filters, search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer w-4 h-4 flex items-center justify-center"
              >
                <i className="ri-close-line text-xs"></i>
              </button>
            )}
          </div>
        </div>

        {/* Tipo */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Tipo de alojamiento
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onChange({ ...filters, tipo: "todos" })}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border col-span-2 justify-center font-body ${
                filters.tipo === "todos"
                  ? "bg-gold-gradient text-white border-gold-500"
                  : "border-gold-200 text-charcoal-600 hover:border-gold-400"
              }`}
            >
              <i className="ri-apps-line text-sm"></i> Todos los tipos
            </button>
            {(Object.keys(propertyTypeLabels) as PropertyType[]).map((t) => (
              <button
                key={t}
                onClick={() => onChange({ ...filters, tipo: t })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border font-body ${
                  filters.tipo === t
                    ? "bg-gold-gradient text-white border-gold-500"
                    : "border-gold-200 text-charcoal-600 hover:border-gold-400"
                }`}
              >
                <i className={`${propertyTypeIcons[t]} text-sm`}></i>
                {propertyTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Precio por noche (€)
          </label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 text-xs">€</span>
              <input
                type="number"
                placeholder="Mín"
                value={filters.precioMin}
                onChange={(e) => onChange({ ...filters, precioMin: e.target.value })}
                className="w-full border border-gold-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold-400 bg-cream-50 font-body"
              />
            </div>
            <span className="text-gold-300 text-sm">—</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 text-xs">€</span>
              <input
                type="number"
                placeholder="Máx"
                value={filters.precioMax}
                onChange={(e) => onChange({ ...filters, precioMax: e.target.value })}
                className="w-full border border-gold-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold-400 bg-cream-50 font-body"
              />
            </div>
          </div>
          {/* Quick price presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { label: "−100€", min: "", max: "100" },
              { label: "100–300€", min: "100", max: "300" },
              { label: "300–600€", min: "300", max: "600" },
              { label: "+600€", min: "600", max: "" },
            ].map((p) => {
              const isActive = filters.precioMin === p.min && filters.precioMax === p.max;
              return (
                <button
                  key={p.label}
                  onClick={() =>
                    isActive
                      ? onChange({ ...filters, precioMin: "", precioMax: "" })
                      : onChange({ ...filters, precioMin: p.min, precioMax: p.max })
                  }
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap font-body ${
                    isActive
                      ? "bg-gold-gradient text-white border-gold-500"
                      : "border-gold-200 text-charcoal-500 hover:border-gold-400"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Habitaciones */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Habitaciones (mínimo)
          </label>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => onChange({ ...filters, habitaciones: "" })}
              className={PILL_ANY(!filters.habitaciones)}
            >
              Todas
            </button>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() =>
                  onChange({ ...filters, habitaciones: filters.habitaciones === String(n) ? "" : String(n) })
                }
                className={PILL_BTN(filters.habitaciones === String(n))}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() =>
                onChange({ ...filters, habitaciones: filters.habitaciones === "7" ? "" : "7" })
              }
              className={PILL_BTN(filters.habitaciones === "7")}
              title="7 o más"
            >
              7+
            </button>
          </div>
        </div>

        {/* Baños */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Baños (mínimo)
          </label>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => onChange({ ...filters, banos: "" })}
              className={PILL_ANY(!filters.banos)}
            >
              Todos
            </button>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() =>
                  onChange({ ...filters, banos: filters.banos === String(n) ? "" : String(n) })
                }
                className={PILL_BTN(filters.banos === String(n))}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Capacidad */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Capacidad (personas)
          </label>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => onChange({ ...filters, capacidad: "" })}
              className={PILL_ANY(!filters.capacidad)}
            >
              Cualquiera
            </button>
            {[2, 4, 6, 8, 10, 12].map((n) => (
              <button
                key={n}
                onClick={() =>
                  onChange({ ...filters, capacidad: filters.capacidad === String(n) ? "" : String(n) })
                }
                className={`px-3 h-10 flex items-center justify-center rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap font-body ${
                  filters.capacidad === String(n)
                    ? "bg-gold-gradient text-white border-gold-500"
                    : "border-gold-200 text-charcoal-600 hover:border-gold-400 bg-white"
                }`}
              >
                {n}+
              </button>
            ))}
          </div>
        </div>

        {/* Valoración */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Valoración mínima
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => onChange({ ...filters, valoracion: "" })}
              className={PILL_ANY(!filters.valoracion)}
            >
              Todas
            </button>
            {[3, 4, 4.5].map((v) => {
              const isActive = filters.valoracion === String(v);
              return (
                <button
                  key={v}
                  onClick={() => onChange({ ...filters, valoracion: isActive ? "" : String(v) })}
                  className={`flex items-center gap-1 px-3 h-10 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap font-body ${
                    isActive
                      ? "bg-gold-gradient text-white border-gold-500"
                      : "border-gold-200 text-charcoal-600 hover:border-gold-400 bg-white"
                  }`}
                >
                  <i className="ri-star-fill text-xs"></i>
                  {v}+
                </button>
              );
            })}
          </div>
        </div>

        {/* Servicios */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Servicios y características
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(amenityLabels) as (keyof AmenityFilter)[]).map((k) => {
              const active = filters.amenities.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggleAmenity(k)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border font-body ${
                    active
                      ? "bg-gold-gradient text-white border-gold-500"
                      : "border-gold-200 text-charcoal-600 hover:border-gold-400 bg-white"
                  }`}
                >
                  <i className={`${amenityLabels[k].icon} text-xs`}></i>
                  {amenityLabels[k].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ordenar */}
        <div>
          <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block font-body">
            Ordenar por
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { value: "reciente", label: "Más recientes", icon: "ri-time-line" },
              { value: "precio_asc", label: "Precio: menor a mayor", icon: "ri-sort-asc" },
              { value: "precio_desc", label: "Precio: mayor a menor", icon: "ri-sort-desc" },
              { value: "habitaciones", label: "Más habitaciones", icon: "ri-hotel-bed-line" },
              { value: "valoracion", label: "Mejor valorados", icon: "ri-star-line" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...filters, ordenar: opt.value as FiltersState["ordenar"] })}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left font-body ${
                  filters.ordenar === opt.value
                    ? "bg-gold-gradient text-white border-gold-500"
                    : "border-gold-200 text-charcoal-600 hover:border-gold-400 bg-white"
                }`}
              >
                <i className={`${opt.icon} text-sm flex-shrink-0`}></i>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}