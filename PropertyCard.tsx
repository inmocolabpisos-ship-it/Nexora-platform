import { Link } from "react-router-dom";
import { DbProperty } from "@/lib/supabase";
import { propertyTypeLabels, amenityLabels, PropertyType, AmenityFilter } from "./PropertyFilters";
import type { PropertyRating } from "@/pages/propiedades/page";

interface PropertyCardProps {
  property: DbProperty;
  rating?: PropertyRating | null;
}

export default function PropertyCard({ property: p, rating }: PropertyCardProps) {
  const amenityKeys = (Object.keys(p.amenities || {}) as (keyof AmenityFilter)[])
    .filter((k) => (p.amenities as Record<string, boolean>)[k])
    .slice(0, 3);

  const totalAmenities = (Object.keys(p.amenities || {}) as (keyof AmenityFilter)[])
    .filter((k) => (p.amenities as Record<string, boolean>)[k]).length;

  const ratingStars = rating && rating.count > 0 ? rating.avg : null;

  return (
    <Link
      to={`/propiedades/${p.id}`}
      className="group bg-white rounded-2xl border border-gold-100 overflow-hidden hover:border-gold-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer block"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-stone-100">
        {p.fotos?.[0] ? (
          <img
            src={p.fotos[0]}
            alt={p.nombre}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <i className="ri-image-line text-4xl"></i>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-charcoal-700 text-xs font-semibold px-3 py-1.5 rounded-full font-body">
            {propertyTypeLabels[p.tipo as PropertyType] || p.tipo}
          </span>
        </div>

        {/* Rating badge */}
        {ratingStars !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
            <i className="ri-star-fill text-gold-500 text-xs"></i>
            <span className="text-xs font-bold text-charcoal-800 font-body">{ratingStars.toFixed(1)}</span>
            <span className="text-xs text-charcoal-400 font-body">({rating!.count})</span>
          </div>
        )}

        {/* Price bottom-left */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-baseline gap-1">
            <span className="text-white font-bold text-lg leading-none">€{p.precio_noche}</span>
            <span className="text-white/70 text-xs">/noche</span>
          </div>
        </div>

        {/* Photo count bottom-right */}
        {p.fotos?.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <i className="ri-image-line text-xs"></i> {p.fotos.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-charcoal-900 text-sm leading-snug group-hover:text-gold-700 transition-colors mb-1 line-clamp-1 font-body">
          {p.nombre}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-charcoal-400 text-xs mb-3 font-body">
          <i className="ri-map-pin-line text-xs"></i>
          <span className="truncate">
            {p.ciudad}{p.provincia && p.provincia !== p.ciudad ? `, ${p.provincia}` : ""}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1 mb-3 pb-3 border-b border-gold-100">
          {[
            { icon: "ri-hotel-bed-line", value: p.habitaciones, label: "hab." },
            { icon: "ri-drop-line", value: p.banos, label: "baños" },
            { icon: "ri-group-line", value: p.capacidad, label: "pers." },
            { icon: "ri-ruler-line", value: `${p.metros_cuadrados}`, label: "m²" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center bg-cream-100 rounded-lg py-1.5 px-1">
              <i className={`${s.icon} text-gold-500 text-xs mb-0.5`}></i>
              <span className="text-charcoal-800 font-bold text-xs font-body">{s.value}</span>
              <span className="text-charcoal-400 text-xs leading-none font-body">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Amenities + rating row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {amenityKeys.map((k) => (
              <span
                key={k}
                className="flex items-center gap-1 bg-cream-100 text-charcoal-500 px-2 py-1 rounded-full text-xs whitespace-nowrap font-body"
              >
                <i className={`${amenityLabels[k].icon} text-xs`}></i>
                {amenityLabels[k].label}
              </span>
            ))}
            {totalAmenities > 3 && (
              <span className="bg-cream-100 text-charcoal-400 px-2 py-1 rounded-full text-xs whitespace-nowrap font-body">
                +{totalAmenities - 3}
              </span>
            )}
          </div>

          {/* SES badge */}
          <div className="flex-shrink-0">
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
              <i className="ri-shield-check-line text-xs"></i>
              SES
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}