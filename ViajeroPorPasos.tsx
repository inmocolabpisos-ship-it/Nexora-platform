import { useRef, useState } from "react";

export interface ViajeroDatos {
  id: string;
  nombre: string;
  apellidos: string;
  tipo_documento: "dni" | "pasaporte" | "nie";
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

export function newViajeroDatos(): ViajeroDatos {
  return {
    id: crypto.randomUUID(),
    nombre: "",
    apellidos: "",
    tipo_documento: "dni",
    numero_documento: "",
    fecha_nacimiento: "",
    fecha_expedicion: "",
    nacionalidad: "Española",
    telefono: "",
    email: "",
    es_menor: false,
    parentesco: "",
    dni_frontal: null,
    dni_trasero: null,
    selfie: null,
  };
}

interface PhotoUploadBoxProps {
  label: string;
  icon: string;
  hint: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  required?: boolean;
}

function PhotoUploadBox({ label, icon, hint, value, onChange, required }: PhotoUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
          dragging ? "border-amber-400 bg-amber-50" : value ? "border-stone-200 bg-stone-50" : "border-stone-200 hover:border-stone-400 bg-stone-50"
        }`}
        style={{ minHeight: "120px" }}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-32 object-cover object-top" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-full">
                <i className="ri-refresh-line mr-1"></i>Cambiar foto
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <i className="ri-close-line text-xs"></i>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-200 text-stone-500 mb-2">
              <i className={`${icon} text-lg`}></i>
            </div>
            <p className="text-xs font-medium text-stone-600 mb-0.5">Subir foto</p>
            <p className="text-xs text-stone-400">{hint}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
    </div>
  );
}

interface Props {
  viajero: ViajeroDatos;
  index: number;
  total: number;
  onChange: (id: string, field: keyof ViajeroDatos, value: string | boolean | null) => void;
  onRemove: (id: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ViajeroPorPasos({ viajero, index, total, onChange, onRemove, isExpanded, onToggle }: Props) {
  const isComplete = !!(
    viajero.nombre.trim() &&
    viajero.apellidos.trim() &&
    viajero.fecha_nacimiento &&
    (viajero.es_menor || viajero.numero_documento.trim()) &&
    viajero.dni_frontal
  );

  const docLabel = viajero.tipo_documento === "pasaporte" ? "Pasaporte" : viajero.tipo_documento.toUpperCase();

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${isComplete ? "border-emerald-200" : "border-stone-100"}`}>
      {/* Header — siempre visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${
            isComplete ? "bg-emerald-500 text-white" : viajero.es_menor ? "bg-amber-100 text-amber-700" : "bg-stone-900 text-white"
          }`}>
            {isComplete ? <i className="ri-check-line"></i> : index + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {viajero.nombre && viajero.apellidos
                ? `${viajero.nombre} ${viajero.apellidos}`
                : index === 0 ? "Titular de la reserva" : `Viajero ${index + 1}`}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {viajero.es_menor && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Menor de 14</span>
              )}
              {isComplete ? (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <i className="ri-check-double-line"></i> Datos completos
                </span>
              ) : (
                <span className="text-xs text-stone-400">Pendiente de completar</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(viajero.id); }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line text-sm"></i>
            </button>
          )}
          {isExpanded ? <i className="ri-arrow-up-s-line text-stone-400"></i> : <i className="ri-arrow-down-s-line text-stone-400"></i>}
        </div>
      </button>

      {/* Body — expandible */}
      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Tipo menor */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2">
              <i className="ri-parent-line text-amber-600"></i>
              <span className="text-xs font-medium text-amber-800">¿Es menor de 14 años?</span>
            </div>
            <button
              type="button"
              onClick={() => onChange(viajero.id, "es_menor", !viajero.es_menor)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${viajero.es_menor ? "bg-amber-500" : "bg-stone-300"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${viajero.es_menor ? "translate-x-5" : "translate-x-0.5"}`}></span>
            </button>
          </div>

          {/* Datos personales */}
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Datos personales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Nombre <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={viajero.nombre}
                  onChange={(e) => onChange(viajero.id, "nombre", e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Apellidos <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Apellidos"
                  value={viajero.apellidos}
                  onChange={(e) => onChange(viajero.id, "apellidos", e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Fecha de nacimiento <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={viajero.fecha_nacimiento}
                  onChange={(e) => onChange(viajero.id, "fecha_nacimiento", e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Nacionalidad</label>
                <input
                  type="text"
                  placeholder="Española"
                  value={viajero.nacionalidad}
                  onChange={(e) => onChange(viajero.id, "nacionalidad", e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                />
              </div>
              {!viajero.es_menor && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Teléfono</label>
                    <input
                      type="tel"
                      placeholder="+34 600 000 000"
                      value={viajero.telefono}
                      onChange={(e) => onChange(viajero.id, "telefono", e.target.value)}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={viajero.email}
                      onChange={(e) => onChange(viajero.id, "email", e.target.value)}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                    />
                  </div>
                </>
              )}
              {index > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Parentesco / Relación con el titular</label>
                  <input
                    type="text"
                    placeholder="Ej: Cónyuge, Hijo/a, Amigo/a..."
                    value={viajero.parentesco}
                    onChange={(e) => onChange(viajero.id, "parentesco", e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Documento */}
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
              Documento de identidad {viajero.es_menor ? "(opcional para menores de 14)" : ""}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Tipo de documento</label>
                <div className="flex gap-2">
                  {(["dni", "nie", "pasaporte"] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => onChange(viajero.id, "tipo_documento", tipo)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        viajero.tipo_documento === tipo
                          ? "bg-stone-900 border-stone-900 text-white"
                          : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                      }`}
                    >
                      {tipo.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Nº {docLabel} {!viajero.es_menor && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={viajero.es_menor ? "Opcional" : viajero.tipo_documento === "pasaporte" ? "AB1234567" : "12345678A"}
                  value={viajero.numero_documento}
                  onChange={(e) => onChange(viajero.id, "numero_documento", e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Fecha de expedición</label>
                <input
                  type="date"
                  value={viajero.fecha_expedicion}
                  onChange={(e) => onChange(viajero.id, "fecha_expedicion", e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                />
              </div>
            </div>
          </div>

          {/* Fotos del documento */}
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Fotos del documento <span className="text-red-400">*</span>
            </h4>
            <p className="text-xs text-stone-400 mb-3">
              Sube fotos claras del {docLabel}. Asegúrate de que todos los datos sean legibles.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <PhotoUploadBox
                label={`${docLabel} — Parte frontal`}
                icon="ri-id-card-line"
                hint="Foto delantera del documento"
                value={viajero.dni_frontal}
                onChange={(v) => onChange(viajero.id, "dni_frontal", v)}
                required
              />
              <PhotoUploadBox
                label={`${docLabel} — Parte trasera`}
                icon="ri-id-card-line"
                hint={viajero.tipo_documento === "pasaporte" ? "Página de datos biométricos" : "Foto trasera del documento"}
                value={viajero.dni_trasero}
                onChange={(v) => onChange(viajero.id, "dni_trasero", v)}
              />
              <PhotoUploadBox
                label="Selfie con el documento"
                icon="ri-camera-line"
                hint="Foto tuya sosteniendo el documento"
                value={viajero.selfie}
                onChange={(v) => onChange(viajero.id, "selfie", v)}
              />
            </div>
            <div className="mt-3 bg-stone-50 rounded-xl p-3 border border-stone-100">
              <p className="text-xs text-stone-500 flex items-start gap-2">
                <i className="ri-lock-line text-stone-400 mt-0.5 flex-shrink-0"></i>
                <span>Las fotos se almacenan de forma segura y cifrada. Solo son accesibles por el anfitrión y las autoridades competentes según el RD 933/2021.</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
