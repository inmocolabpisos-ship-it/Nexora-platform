import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { DbProperty } from "@/lib/supabase";
import { uploadToStorage } from "@/hooks/useStorageUpload";
import { propertyTypeLabels, propertyTypeIcons, type PropertyType, amenityLabels, type AmenityFilter } from "@/pages/propiedades/components/PropertyFilters";

const comunidades = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria",
  "Castilla y León", "Castilla-La Mancha", "Cataluña", "Extremadura", "Galicia",
  "Madrid", "Murcia", "Navarra", "País Vasco", "La Rioja", "Valencia", "Ceuta", "Melilla",
];

const tiposVia = [
  "Calle", "Avenida", "Plaza", "Paseo", "Carretera", "Camino", "Ronda", "Travesía", "Glorieta", "Urbanización",
];

interface Props {
  property: DbProperty;
  onClose: () => void;
  onSaved: (updated: DbProperty) => void;
}

export default function EditarPropiedadModal({ property, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Parse existing address
  const existingParts = property.direccion?.split(" ") || ["", ""];
  const existingTipoVia = tiposVia.find((t) => property.direccion?.startsWith(t)) || "";
  const existingDireccion = existingTipoVia ? property.direccion?.replace(`${existingTipoVia} `, "") || "" : property.direccion || "";

  // Form state
  const [nombre, setNombre] = useState(property.nombre || "");
  const [tipoVia, setTipoVia] = useState(existingTipoVia);
  const [direccion, setDireccion] = useState(existingDireccion);
  const [ciudad, setCiudad] = useState(property.ciudad || "");
  const [provincia, setProvincia] = useState(property.provincia || "");
  const [comunidad, setComunidad] = useState(property.comunidad_autonoma || "");
  const [tipo, setTipo] = useState<PropertyType>((property.tipo as PropertyType) || "apartamento");
  const [habitaciones, setHabitaciones] = useState(property.habitaciones || 1);
  const [banos, setBanos] = useState(property.banos || 1);
  const [capacidad, setCapacidad] = useState(property.capacidad || 2);
  const [metros, setMetros] = useState(property.metros_cuadrados || 50);
  const [precio, setPrecio] = useState(property.precio_noche || 80);
  const [descripcion, setDescripcion] = useState(property.descripcion || "");
  const [registroTuristico, setRegistroTuristico] = useState(property.numero_registro_turistico || "");
  const [estado, setEstado] = useState(property.estado || "pendiente");
  const [amenities, setAmenities] = useState<AmenityFilter>({
    calefaccion: false, chimenea: false, jardin: false, piscina: false,
    mascotas: false, ninos: false, wifi: false, tv: false,
    cerca_playa: false, montana: false, parking: false,
    aire_acondicionado: false, barbacoa: false, terraza: false,
    ...((property.amenities as AmenityFilter) || {}),
  });
  const [photos, setPhotos] = useState<{ file?: File; preview: string; url?: string; uploading?: boolean }[]>(
    (property.fotos || []).map((url) => ({ preview: url, url }))
  );

  const toggleAmenity = (key: keyof AmenityFilter) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const p = prev[index];
      if (p.preview && !p.url) URL.revokeObjectURL(p.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const movePhoto = (index: number, direction: "up" | "down") => {
    setPhotos((prev) => {
      const newArr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= newArr.length) return prev;
      [newArr[index], newArr[target]] = [newArr[target], newArr[index]];
      return newArr;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      // Upload new photos
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.url) { photoUrls.push(p.url); continue; }
        if (!p.file) continue;
        setPhotos((prev) => prev.map((ph, idx) => idx === i ? { ...ph, uploading: true } : ph));
        const url = await uploadToStorage(p.file, "propiedades", `${property.propietario_id}_${Date.now()}_${i}`);
        if (url) {
          photoUrls.push(url);
          setPhotos((prev) => prev.map((ph, idx) => idx === i ? { ...ph, uploading: false, url } : ph));
        }
      }

      const { data, error: updateError } = await supabase
        .from("properties")
        .update({
          nombre: nombre.trim(),
          tipo,
          descripcion: descripcion.trim(),
          direccion: `${tipoVia} ${direccion.trim()}`,
          ciudad: ciudad.trim(),
          provincia: provincia.trim(),
          comunidad_autonoma: comunidad,
          tipo_via: tipoVia,
          metros_cuadrados: metros,
          habitaciones,
          banos,
          capacidad,
          precio_noche: precio,
          estado,
          amenities,
          fotos: photoUrls,
          numero_registro_turistico: registroTuristico.trim() || null,
        })
        .eq("id", property.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      onSaved(data as DbProperty);
      onClose();
    } catch (err) {
      setError("Error inesperado. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Editar propiedad</h2>
            <p className="text-xs text-stone-500">{property.nombre}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer transition-colors">
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <i className="ri-error-warning-line text-red-500 mt-0.5"></i>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">Nombre de la propiedad</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white" />
          </div>

          {/* Estado */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">Estado</label>
            <div className="flex gap-2">
              {(["activa", "pendiente", "inactiva"] as const).map((s) => (
                <button key={s} onClick={() => setEstado(s)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border-2 transition-all cursor-pointer capitalize ${
                    estado === s
                      ? s === "activa" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : s === "pendiente" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-stone-500 bg-stone-100 text-stone-700"
                      : "border-stone-200 text-stone-500 hover:border-stone-400"
                  }`}>
                  {s === "activa" ? "Activa" : s === "pendiente" ? "Pendiente" : "Inactiva"}
                </button>
              ))}
            </div>
          </div>

          {/* Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-stone-600 mb-2 block">Tipo de vía</label>
              <select value={tipoVia} onChange={(e) => setTipoVia(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white cursor-pointer">
                <option value="">Selecciona...</option>
                {tiposVia.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-stone-600 mb-2 block">Dirección</label>
              <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 mb-2 block">Ciudad</label>
              <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 mb-2 block">Provincia</label>
              <input type="text" value={provincia} onChange={(e) => setProvincia(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 mb-2 block">Comunidad</label>
              <select value={comunidad} onChange={(e) => setComunidad(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white cursor-pointer">
                <option value="">Selecciona...</option>
                {comunidades.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">Tipo de alojamiento</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(propertyTypeLabels) as PropertyType[]).map((t) => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    tipo === t ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}>
                  <i className={`${propertyTypeIcons[t]} text-lg`}></i>
                  <span className="text-xs font-medium">{propertyTypeLabels[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Habitaciones", value: habitaciones, min: 1, max: 20, setter: setHabitaciones },
              { label: "Baños", value: banos, min: 1, max: 10, setter: setBanos },
              { label: "Capacidad", value: capacidad, min: 1, max: 50, setter: setCapacidad },
              { label: "m²", value: metros, min: 15, max: 500, setter: setMetros },
            ].map((item) => (
              <div key={item.label} className="border border-stone-200 rounded-xl p-3">
                <p className="text-xs text-stone-500 mb-2">{item.label}</p>
                <div className="flex items-center justify-between">
                  <button onClick={() => item.setter(Math.max(item.min, item.value - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:border-stone-500 cursor-pointer transition-colors">
                    <i className="ri-subtract-line text-xs"></i>
                  </button>
                  <span className="text-sm font-semibold text-stone-900">{item.value}</span>
                  <button onClick={() => item.setter(Math.min(item.max, item.value + 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:border-stone-500 cursor-pointer transition-colors">
                    <i className="ri-add-line text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Precio */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">Precio por noche (€)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">€</span>
              <input type="number" value={precio} onChange={(e) => setPrecio(Math.max(1, Number(e.target.value)))}
                className="w-full border border-stone-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white" />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">Servicios</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(amenityLabels) as (keyof AmenityFilter)[]).map((key) => {
                const active = amenities[key];
                return (
                  <button key={key} onClick={() => toggleAmenity(key)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-xs ${
                      active ? "border-amber-500 bg-amber-50 text-amber-700" : "border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}>
                    <i className={`${amenityLabels[key].icon} text-sm`}></i>
                    <span className="font-medium">{amenityLabels[key].label}</span>
                    {active && <i className="ri-check-line ml-auto text-amber-500"></i>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fotos */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">Fotos</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:border-stone-500 hover:bg-stone-50 transition-all cursor-pointer mb-3"
            >
              <i className="ri-upload-cloud-2-line text-stone-400 text-xl mb-1"></i>
              <p className="text-xs text-stone-500">Haz clic para añadir más fotos</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-stone-100">
                    <img src={p.preview} alt="" className="w-full h-full object-cover object-top" />
                    {p.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <i className="ri-loader-4-line animate-spin text-white text-lg"></i>
                      </div>
                    )}
                    {i === 0 && (
                      <div className="absolute top-1.5 left-1.5 bg-stone-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Portada</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                      {i > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); movePhoto(i, "up"); }}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-stone-700 hover:bg-white cursor-pointer">
                          <i className="ri-arrow-up-line text-xs"></i>
                        </button>
                      )}
                      {i < photos.length - 1 && (
                        <button onClick={(e) => { e.stopPropagation(); movePhoto(i, "down"); }}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-stone-700 hover:bg-white cursor-pointer">
                          <i className="ri-arrow-down-line text-xs"></i>
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/90 text-white hover:bg-red-500 cursor-pointer">
                        <i className="ri-delete-bin-line text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">Descripción</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} maxLength={1000}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white resize-none" />
            <p className="text-xs text-stone-400 mt-1 text-right">{descripcion.length}/1000</p>
          </div>

          {/* Registro turístico */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">Registro Turístico</label>
            <input type="text" value={registroTuristico} onChange={(e) => setRegistroTuristico(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 flex-shrink-0">
          <button onClick={onClose} className="text-sm text-stone-500 hover:text-stone-700 cursor-pointer transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !nombre.trim()}
            className="flex items-center gap-2 bg-amber-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-amber-500 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40">
            {saving ? <><i className="ri-loader-4-line animate-spin"></i> Guardando...</> : <><i className="ri-check-line"></i> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}