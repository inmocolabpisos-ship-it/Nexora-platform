import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ReviewModalProps {
  bookingId: string;
  propiedadId: string | null;
  propiedadNombre: string | null;
  huespedId: string | null;
  huespedNombre: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const CATEGORIAS = [
  { key: "puntuacion_limpieza", label: "Limpieza", icon: "ri-sparkling-line" },
  { key: "puntuacion_comunicacion", label: "Comunicación", icon: "ri-chat-3-line" },
  { key: "puntuacion_ubicacion", label: "Ubicación", icon: "ri-map-pin-line" },
  { key: "puntuacion_calidad_precio", label: "Calidad-precio", icon: "ri-money-euro-circle-line" },
] as const;

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`${sizeClass} transition-colors ${onChange ? "cursor-pointer" : "cursor-default"} ${
            star <= (hovered || value) ? "text-amber-400" : "text-stone-200"
          }`}
        >
          <i className="ri-star-fill"></i>
        </button>
      ))}
    </div>
  );
}

export { StarRating };

export default function ReviewModal({
  bookingId,
  propiedadId,
  propiedadNombre,
  huespedId,
  huespedNombre,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [comentario, setComentario] = useState("");
  const [categorias, setCategorias] = useState<Record<string, number>>({
    puntuacion_limpieza: 0,
    puntuacion_comunicacion: 0,
    puntuacion_ubicacion: 0,
    puntuacion_calidad_precio: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labelForPuntuacion = (p: number) => {
    if (p === 0) return "Selecciona una puntuación";
    if (p === 1) return "Muy malo";
    if (p === 2) return "Malo";
    if (p === 3) return "Aceptable";
    if (p === 4) return "Muy bueno";
    return "Excelente";
  };

  const handleSubmit = async () => {
    if (puntuacion === 0) { setError("Por favor selecciona una puntuación general."); return; }
    if (!comentario.trim()) { setError("Por favor escribe un comentario."); return; }
    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      propiedad_id: propiedadId,
      propiedad_nombre: propiedadNombre,
      huesped_id: huespedId,
      huesped_nombre: huespedNombre,
      puntuacion,
      titulo: titulo.trim() || null,
      comentario: comentario.trim(),
      puntuacion_limpieza: categorias.puntuacion_limpieza || null,
      puntuacion_comunicacion: categorias.puntuacion_comunicacion || null,
      puntuacion_ubicacion: categorias.puntuacion_ubicacion || null,
      puntuacion_calidad_precio: categorias.puntuacion_calidad_precio || null,
    });

    if (dbError) {
      setError("Error al guardar la reseña. Inténtalo de nuevo.");
      setSaving(false);
      return;
    }

    setSaving(false);
    onSubmitted();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Deja tu reseña</h2>
            <p className="text-xs text-stone-500 mt-0.5">{propiedadNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Puntuación general */}
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-700 mb-3">Puntuación general</p>
            <StarRating value={puntuacion} onChange={setPuntuacion} size="lg" />
            <p className={`text-sm mt-2 font-medium transition-colors ${puntuacion > 0 ? "text-amber-600" : "text-stone-400"}`}>
              {labelForPuntuacion(puntuacion)}
            </p>
          </div>

          {/* Categorías */}
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIAS.map((cat) => (
              <div key={cat.key} className="bg-stone-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <i className={`${cat.icon} text-stone-500 text-sm`}></i>
                  <span className="text-xs font-medium text-stone-600">{cat.label}</span>
                </div>
                <StarRating
                  value={categorias[cat.key]}
                  onChange={(v) => setCategorias((prev) => ({ ...prev, [cat.key]: v }))}
                  size="sm"
                />
              </div>
            ))}
          </div>

          {/* Título */}
          <div>
            <label className="text-xs font-medium text-stone-600 mb-1.5 block">
              Título <span className="text-stone-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Resume tu experiencia en una frase..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
            />
          </div>

          {/* Comentario */}
          <div>
            <label className="text-xs font-medium text-stone-600 mb-1.5 block">
              Tu experiencia <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Cuéntanos cómo fue tu estancia: la propiedad, el anfitrión, el entorno..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 resize-none"
            />
            <p className="text-xs text-stone-400 text-right mt-1">{comentario.length}/500</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-red-600">
              <i className="ri-error-warning-line flex-shrink-0"></i>
              {error}
            </div>
          )}

          {/* Aviso privacidad */}
          <p className="text-xs text-stone-400 text-center">
            <i className="ri-shield-check-line mr-1"></i>
            Tu reseña será pública y visible en la página de la propiedad.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 border border-stone-200 text-stone-600 py-3 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || puntuacion === 0 || !comentario.trim()}
            className="flex-1 bg-stone-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><i className="ri-loader-4-line animate-spin mr-1"></i> Enviando...</>
            ) : (
              <><i className="ri-send-plane-line mr-1"></i> Publicar reseña</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
