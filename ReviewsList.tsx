import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StarRating } from "@/components/feature/ReviewModal";

interface Review {
  id: string;
  huesped_nombre: string | null;
  puntuacion: number;
  titulo: string | null;
  comentario: string;
  puntuacion_limpieza: number | null;
  puntuacion_comunicacion: number | null;
  puntuacion_ubicacion: number | null;
  puntuacion_calidad_precio: number | null;
  respuesta_anfitrion: string | null;
  respuesta_fecha: string | null;
  created_at: string;
}

interface ReviewsListProps {
  propiedadId: string;
  showTitle?: boolean;
}

function ReviewCard({ review }: { review: Review }) {
  const categorias = [
    { label: "Limpieza", value: review.puntuacion_limpieza, icon: "ri-sparkling-line" },
    { label: "Comunicación", value: review.puntuacion_comunicacion, icon: "ri-chat-3-line" },
    { label: "Ubicación", value: review.puntuacion_ubicacion, icon: "ri-map-pin-line" },
    { label: "Calidad-precio", value: review.puntuacion_calidad_precio, icon: "ri-money-euro-circle-line" },
  ].filter((c) => c.value !== null);

  const initials = (review.huesped_nombre || "H")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-900 text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">{review.huesped_nombre || "Huésped"}</p>
            <p className="text-xs text-stone-400">
              {new Date(review.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StarRating value={review.puntuacion} size="sm" />
          <span className="text-sm font-bold text-stone-800">{review.puntuacion}.0</span>
        </div>
      </div>

      {/* Título */}
      {review.titulo && (
        <p className="text-sm font-semibold text-stone-800 mb-1">{review.titulo}</p>
      )}

      {/* Comentario */}
      <p className="text-sm text-stone-600 leading-relaxed mb-3">{review.comentario}</p>

      {/* Categorías */}
      {categorias.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {categorias.map((cat) => (
            <div key={cat.label} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <i className={`${cat.icon} text-stone-400 text-xs`}></i>
                <span className="text-xs text-stone-500">{cat.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="ri-star-fill text-amber-400 text-xs"></i>
                <span className="text-xs font-semibold text-stone-700">{cat.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Respuesta del anfitrión */}
      {review.respuesta_anfitrion && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-2">
          <div className="flex items-center gap-2 mb-1.5">
            <i className="ri-home-4-line text-amber-600 text-sm"></i>
            <span className="text-xs font-semibold text-amber-800">Respuesta del anfitrión</span>
            {review.respuesta_fecha && (
              <span className="text-xs text-amber-600 ml-auto">
                {new Date(review.respuesta_fecha).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{review.respuesta_anfitrion}</p>
        </div>
      )}
    </div>
  );
}

export default function ReviewsList({ propiedadId, showTitle = true }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propiedadId) return;
    supabase
      .from("reviews")
      .select("*")
      .eq("propiedad_id", propiedadId)
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReviews((data as Review[]) || []);
        setLoading(false);
      });
  }, [propiedadId]);

  const avgPuntuacion = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.puntuacion, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="py-8 text-center">
      <i className="ri-loader-4-line animate-spin text-xl text-stone-300"></i>
    </div>
  );

  return (
    <div>
      {showTitle && (
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-semibold text-stone-900">Reseñas</h2>
          {avgPuntuacion && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
              <i className="ri-star-fill text-amber-400 text-sm"></i>
              <span className="text-sm font-bold text-stone-800">{avgPuntuacion}</span>
              <span className="text-xs text-stone-500">· {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl border border-stone-100 p-8 text-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 text-stone-400 mx-auto mb-3">
            <i className="ri-star-line text-xl"></i>
          </div>
          <p className="text-stone-500 text-sm font-medium">Sin reseñas todavía</p>
          <p className="text-stone-400 text-xs mt-1">Sé el primero en dejar una reseña tras tu estancia.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
