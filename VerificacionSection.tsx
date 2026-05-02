import { useState, useEffect } from "react";
import { supabase, DbMember } from "@/lib/supabase";
import { generateMemberPdf } from "@/lib/generateSesPdf";

type Status = "pendiente" | "verificado" | "rechazado";

const statusConfig: Record<Status, { label: string; color: string; icon: string }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: "ri-time-line" },
  verificado: { label: "Verificado", color: "bg-emerald-100 text-emerald-700", icon: "ri-check-line" },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-700", icon: "ri-close-line" },
};

export default function VerificacionSection() {
  const [members, setMembers] = useState<DbMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DbMember | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | Status>("pendiente");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMembers(data as DbMember[]);
    setLoading(false);
  };

  const filtered = members.filter((m) => statusFilter === "todos" || m.estado === statusFilter);

  const updateStatus = async (id: string, estado: Status) => {
    const { error } = await supabase
      .from("members")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, estado } : m));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, estado } : null);
    }
  };

  const handleExport = async (member: DbMember) => {
    setExporting(true);
    await generateMemberPdf(member);
    setExporting(false);
  };

  const pendingCount = members.filter((m) => m.estado === "pendiente").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Verificación de Miembros</h2>
          <p className="text-stone-500 text-sm">Revisa documentación y verifica identidades para SES HOSPEDAJE</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-amber-700 text-xs font-semibold">{pendingCount} pendiente{pendingCount > 1 ? "s" : ""} de revisión</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex bg-white border border-stone-200 rounded-full p-1 gap-1 w-fit">
        {(["todos", "pendiente", "verificado", "rechazado"] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${statusFilter === f ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"}`}>
            {f === "todos" ? `Todos (${members.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${members.filter((m) => m.estado === f).length})`}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* List */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm bg-white rounded-xl border border-stone-100">
              <i className="ri-loader-4-line animate-spin text-2xl mb-2 block"></i>
              Cargando miembros...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm bg-white rounded-xl border border-stone-100">
              Sin resultados para este filtro
            </div>
          ) : filtered.map((m) => {
            const sc = statusConfig[m.estado];
            const hasDocs = !!(m.dni_frontal || m.dni_trasero || m.selfie);
            return (
              <div key={m.id} onClick={() => setSelected(m)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:border-stone-300 ${selected?.id === m.id ? "border-stone-400 ring-1 ring-stone-200" : "border-stone-100"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {m.selfie ? (
                      <img src={m.selfie} alt={m.nombre} className="w-10 h-10 rounded-full object-cover object-top border border-stone-200 flex-shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 ${m.tipo === "propietario" ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-600"}`}>
                        <i className={m.tipo === "propietario" ? "ri-home-4-line" : "ri-user-line"}></i>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-stone-900 font-semibold text-sm truncate">{m.nombre} {m.apellidos}</div>
                      <div className="text-stone-400 text-xs truncate flex items-center gap-1.5">
                        {m.tipo === "propietario" ? "Propietario" : "Huésped"} ·
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                          (m as any).tipo_documento === "pasaporte" ? "bg-stone-100 text-stone-600" :
                          (m as any).tipo_documento === "nie" ? "bg-amber-100 text-amber-700" :
                          "bg-stone-100 text-stone-700"
                        }`}>
                          {(m as any).tipo_documento === "pasaporte" ? "Pasaporte" : (m as any).tipo_documento === "nie" ? "NIE" : "DNI"}
                        </span>
                        {m.dni_numero}
                        {hasDocs && <span className="ml-1 text-emerald-600"><i className="ri-image-line"></i> Docs</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${sc.color}`}>
                    <i className={sc.icon}></i> {sc.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full lg:w-96 bg-white rounded-2xl border border-stone-100 p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900 text-sm">Documentación</h3>
              <button onClick={() => setSelected(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400">
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>

            {/* Header info */}
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-stone-100">
              {selected.selfie ? (
                <img src={selected.selfie} alt="Selfie" className="w-14 h-14 rounded-full object-cover object-top border border-stone-200 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-user-line text-stone-400 text-xl"></i>
                </div>
              )}
              <div>
                <div className="font-semibold text-stone-900 text-sm">{selected.nombre} {selected.apellidos}</div>
                <div className="text-stone-400 text-xs">{selected.tipo === "propietario" ? "Propietario" : "Huésped"} · {selected.nacionalidad}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    (selected as any).tipo_documento === "pasaporte"
                      ? "bg-stone-100 text-stone-600"
                      : (selected as any).tipo_documento === "nie"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-stone-100 text-stone-700"
                  }`}>
                    <i className={(selected as any).tipo_documento === "pasaporte" ? "ri-passport-line mr-1" : "ri-id-card-line mr-1"}></i>
                    {(selected as any).tipo_documento === "pasaporte" ? "Pasaporte" : (selected as any).tipo_documento === "nie" ? "NIE" : "DNI"}
                  </span>
                  <span className="text-stone-500 text-xs font-medium">{selected.dni_numero}</span>
                </div>
                <div className="text-stone-400 text-xs">Registrado: {selected.fecha_registro}</div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4 mb-5">
              {selected.dni_frontal ? (
                <div>
                  <p className="text-xs text-stone-500 mb-1.5 font-semibold flex items-center gap-1">
                    <i className={(selected as any).tipo_documento === "pasaporte" ? "ri-passport-line text-stone-400" : "ri-id-card-line text-stone-400"}></i>
                    {(selected as any).tipo_documento === "pasaporte" ? "Pasaporte" : (selected as any).tipo_documento === "nie" ? "NIE" : "DNI"} — Parte frontal
                  </p>
                  <img src={selected.dni_frontal} alt="DNI Frontal" className="w-full rounded-xl border border-stone-200 object-cover h-28 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(selected.dni_frontal, "_blank")} />
                </div>
              ) : (
                <div className="bg-stone-50 rounded-xl p-3 text-center text-stone-400 text-xs border border-dashed border-stone-200">
                  <i className="ri-id-card-line text-lg block mb-1"></i>Documento frontal no disponible
                </div>
              )}

              {selected.dni_trasero ? (
                <div>
                  <p className="text-xs text-stone-500 mb-1.5 font-semibold flex items-center gap-1">
                    <i className={(selected as any).tipo_documento === "pasaporte" ? "ri-passport-line text-stone-400" : "ri-id-card-line text-stone-400"}></i>
                    {(selected as any).tipo_documento === "pasaporte" ? "Pasaporte" : (selected as any).tipo_documento === "nie" ? "NIE" : "DNI"} — Parte trasera
                  </p>
                  <img src={selected.dni_trasero} alt="DNI Trasero" className="w-full rounded-xl border border-stone-200 object-cover h-28 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(selected.dni_trasero, "_blank")} />
                </div>
              ) : (
                <div className="bg-stone-50 rounded-xl p-3 text-center text-stone-400 text-xs border border-dashed border-stone-200">
                  <i className="ri-id-card-line text-lg block mb-1"></i>Documento trasero no disponible
                </div>
              )}

              {selected.selfie ? (
                <div>
                  <p className="text-xs text-stone-500 mb-1.5 font-semibold flex items-center gap-1">
                    <i className="ri-user-smile-line text-stone-400"></i> Selfie de verificación
                  </p>
                  <img src={selected.selfie} alt="Selfie" className="w-full rounded-xl border border-stone-200 object-cover h-36 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(selected.selfie, "_blank")} />
                </div>
              ) : (
                <div className="bg-stone-50 rounded-xl p-3 text-center text-stone-400 text-xs border border-dashed border-stone-200">
                  <i className="ri-user-smile-line text-lg block mb-1"></i>Selfie no disponible
                </div>
              )}
            </div>

            {/* Actions */}
            {selected.estado === "pendiente" && (
              <div className="flex gap-2 mb-2">
                <button onClick={() => updateStatus(selected.id, "verificado")}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-full text-xs font-semibold hover:bg-emerald-500 cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-check-line mr-1"></i> Verificar
                </button>
                <button onClick={() => updateStatus(selected.id, "rechazado")}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-xs font-semibold hover:bg-red-400 cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-close-line mr-1"></i> Rechazar
                </button>
              </div>
            )}
            {selected.estado !== "pendiente" && (
              <button onClick={() => updateStatus(selected.id, "pendiente")}
                className="w-full mb-2 border border-stone-200 text-stone-600 py-2.5 rounded-full text-xs font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap transition-colors">
                Restablecer a pendiente
              </button>
            )}
            <button
              onClick={() => handleExport(selected)}
              disabled={exporting}
              className="w-full border border-stone-200 text-stone-600 py-2.5 rounded-full text-xs font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {exporting ? (
                <><i className="ri-loader-4-line animate-spin"></i> Generando PDF...</>
              ) : (
                <><i className="ri-file-pdf-2-line text-red-500"></i> Exportar SES HOSPEDAJE</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
