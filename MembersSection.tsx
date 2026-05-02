import { useState, useEffect } from "react";
import { supabase, DbMember } from "@/lib/supabase";
import { generateMemberPdf, generateBulkSesPdf } from "@/lib/generateSesPdf";

type Status = "pendiente" | "verificado" | "rechazado";

const statusConfig: Record<Status, { label: string; color: string; icon: string }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: "ri-time-line" },
  verificado: { label: "Verificado", color: "bg-emerald-100 text-emerald-700", icon: "ri-check-line" },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-700", icon: "ri-close-line" },
};

interface MembersSectionProps {
  tipo: "cliente" | "propietario";
}

export default function MembersSection({ tipo }: MembersSectionProps) {
  // "cliente" en el admin corresponde a "huesped" en la BD
  const dbTipo = tipo === "cliente" ? "huesped" : "propietario";

  const [members, setMembers] = useState<DbMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingBulk, setExportingBulk] = useState(false);
  const [selected, setSelected] = useState<DbMember | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | Status>("todos");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<DbMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [newMember, setNewMember] = useState<Partial<DbMember>>({
    tipo: dbTipo,
    estado: "pendiente",
    cuenta_bancaria: { titular: "", iban: "", banco: "", swift: "" },
  });

  useEffect(() => {
    fetchMembers();
  }, [tipo]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("tipo", dbTipo)
      .order("created_at", { ascending: false });
    if (!error && data) setMembers(data as DbMember[]);
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

  const handleSaveEdit = async () => {
    if (!editData) return;
    setSaving(true);
    const { error } = await supabase
      .from("members")
      .update({ ...editData, updated_at: new Date().toISOString() })
      .eq("id", editData.id);
    if (!error) {
      setMembers((prev) => prev.map((m) => m.id === editData.id ? editData : m));
      if (selected?.id === editData.id) setSelected(editData);
      setEditMode(false);
      setEditData(null);
    }
    setSaving(false);
  };

  const handleAddMember = async () => {
    setSaving(true);
    const member = {
      tipo: dbTipo,
      nombre: newMember.nombre || "",
      apellidos: newMember.apellidos || "",
      email: newMember.email || "",
      telefono: newMember.telefono || "",
      dni_numero: newMember.dni_numero || "",
      nacionalidad: newMember.nacionalidad || "Española",
      fecha_nacimiento: newMember.fecha_nacimiento || "",
      direccion: newMember.direccion || "",
      ciudad: newMember.ciudad || "",
      codigo_postal: newMember.codigo_postal || "",
      pais: newMember.pais || "España",
      fecha_registro: new Date().toISOString().split("T")[0],
      estado: "pendiente" as Status,
      dni_frontal: "",
      dni_trasero: "",
      selfie: "",
      cuenta_bancaria: newMember.cuenta_bancaria || { titular: "", iban: "", banco: "", swift: "" },
      notas: newMember.notas || "",
    };
    const { data, error } = await supabase.from("members").insert(member).select().maybeSingle();
    if (!error && data) {
      setMembers((prev) => [data as DbMember, ...prev]);
      setShowAddModal(false);
      setNewMember({ tipo, estado: "pendiente", cuenta_bancaria: { titular: "", iban: "", banco: "", swift: "" } });
    }
    setSaving(false);
  };

  const handleExportSingle = async (member: DbMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExportingId(member.id);
    await generateMemberPdf(member);
    setExportingId(null);
  };

  const handleExportBulk = async () => {
    setExportingBulk(true);
    await generateBulkSesPdf(filtered);
    setExportingBulk(false);
  };

  const label = tipo === "cliente" ? "Cliente" : "Propietario";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">{tipo === "cliente" ? "Clientes / Huéspedes" : "Propietarios"}</h2>
          <p className="text-stone-500 text-sm">{filtered.length} {label.toLowerCase()}s registrados</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPaymentInfo(!showPaymentInfo)}
            className="flex items-center gap-2 border border-amber-200 text-amber-700 bg-amber-50 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-bank-card-line"></i> Info de pago
          </button>
          <button
            onClick={handleExportBulk}
            disabled={exportingBulk || filtered.length === 0}
            className="flex items-center gap-2 border border-stone-200 text-stone-600 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exportingBulk ? (
              <><i className="ri-loader-4-line animate-spin"></i> Generando...</>
            ) : (
              <><i className="ri-file-pdf-2-line text-red-500"></i> Exportar todos ({filtered.length})</>
            )}
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-add-line"></i> Añadir {label}
          </button>
        </div>
      </div>

      {/* Payment info banner */}
      {showPaymentInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <i className="ri-bank-card-line text-sm"></i>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Datos de pago — Revolut</h3>
                <p className="text-xs text-amber-600">Transferencia bancaria y pago con tarjeta</p>
              </div>
            </div>
            <button onClick={() => setShowPaymentInfo(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-amber-100 cursor-pointer text-amber-500">
              <i className="ri-close-line text-sm"></i>
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Cuenta principal</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Titular", value: "Youssef Ait Brahim" },
                { label: "Revolut", value: "revolut.me/youssefaitbrahim" },
                { label: "Banco", value: "Revolut Bank UAB" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-3 border border-amber-100">
                  <div className="text-xs text-amber-600 mb-0.5">{item.label}</div>
                  <div className="text-sm font-semibold text-stone-800 font-mono">{item.value}</div>
                </div>
              ))}
            </div>
            <a
              href="https://revolut.me/youssefaitbrahim"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-stone-900 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-send-plane-fill text-violet-400"></i>
              Abrir Revolut — Cuenta principal
            </a>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide pt-1">Cuenta alternativa</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Titular", value: "Maria Angeles Herrera Martin" },
                { label: "Revolut", value: "revolut.me/mangelg8sg" },
                { label: "Banco", value: "Revolut Bank UAB" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-3 border border-amber-100">
                  <div className="text-xs text-amber-600 mb-0.5">{item.label}</div>
                  <div className="text-sm font-semibold text-stone-800 font-mono">{item.value}</div>
                </div>
              ))}
            </div>
            <a
              href="https://revolut.me/mangelg8sg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-stone-100 text-stone-800 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-send-plane-fill text-violet-500"></i>
              Abrir Revolut — Cuenta alternativa
            </a>
          </div>
          <p className="text-xs text-amber-600 mt-3">
            <i className="ri-information-line mr-1"></i>
            Estos datos aparecen automáticamente en cada PDF que descargues para la policía.
          </p>
        </div>
      )}

      {/* SES info banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-200 text-stone-600 flex-shrink-0">
          <i className="ri-shield-check-line text-sm"></i>
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">Fichas para la policía — SES HOSPEDAJE</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Descarga el PDF de cada huésped antes de que entren a la propiedad. El documento incluye sus datos personales, fotos del DNI, selfie de verificación e información de pago. Cumple con el RD 933/2021.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex bg-white border border-stone-200 rounded-full p-1 gap-1 w-fit">
        {(["todos", "pendiente", "verificado", "rechazado"] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${statusFilter === f ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"}`}>
            {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm bg-white rounded-xl border border-stone-100">
              <i className="ri-loader-4-line animate-spin text-2xl mb-2 block"></i>
              Cargando {label.toLowerCase()}s...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm bg-white rounded-xl border border-stone-100">
              No hay {label.toLowerCase()}s con este filtro
            </div>
          ) : filtered.map((m) => {
            const sc = statusConfig[m.estado];
            const isExporting = exportingId === m.id;
            return (
              <div key={m.id} onClick={() => { setSelected(m); setEditMode(false); }}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:border-stone-300 ${selected?.id === m.id ? "border-stone-400 ring-1 ring-stone-200" : "border-stone-100"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 ${tipo === "propietario" ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-600"}`}>
                      <i className={tipo === "propietario" ? "ri-home-4-line" : "ri-user-line"}></i>
                    </div>
                    <div className="min-w-0">
                      <div className="text-stone-900 font-semibold text-sm truncate">{m.nombre} {m.apellidos}</div>
                      <div className="text-stone-400 text-xs truncate">{m.email} · DNI: {m.dni_numero || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                      <i className={sc.icon}></i> {sc.label}
                    </span>
                    {/* Quick PDF download button */}
                    <button
                      onClick={(e) => handleExportSingle(m, e)}
                      disabled={isExporting}
                      title="Descargar ficha policial PDF"
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isExporting ? (
                        <i className="ri-loader-4-line animate-spin text-stone-400 text-sm"></i>
                      ) : (
                        <i className="ri-file-pdf-2-line text-red-500 text-sm"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selected && !editMode && (
          <div className="w-full lg:w-96 bg-white rounded-2xl border border-stone-100 p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900 text-sm">Ficha de {label}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditData({ ...selected }); setEditMode(true); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-500">
                  <i className="ri-edit-line text-sm"></i>
                </button>
                <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400">
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>
            </div>
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
                <div className="text-stone-400 text-xs">{selected.nacionalidad} · {selected.ciudad}</div>
                <div className="text-stone-400 text-xs">DNI: {selected.dni_numero}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              {[
                { label: "Email", value: selected.email },
                { label: "Teléfono", value: selected.telefono },
                { label: "Fecha nac.", value: selected.fecha_nacimiento },
                { label: "Dirección", value: selected.direccion },
                { label: "Ciudad", value: selected.ciudad },
                { label: "C.P.", value: selected.codigo_postal },
              ].map((item) => (
                <div key={item.label} className="bg-stone-50 rounded-lg p-2.5">
                  <div className="text-stone-400 mb-0.5">{item.label}</div>
                  <div className="text-stone-800 font-medium truncate">{item.value || "—"}</div>
                </div>
              ))}
            </div>
            {(selected as DbMember & { forma_pago?: string }).forma_pago && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <i className="ri-bank-card-line text-amber-600 text-sm"></i>
                  <span className="text-amber-700 text-xs font-semibold">Forma de pago preferida</span>
                </div>
                <p className="text-xs text-stone-700 font-medium">
                  {(selected as DbMember & { forma_pago?: string }).forma_pago}
                </p>
              </div>
            )}
            {(selected.dni_frontal || selected.dni_trasero) && (
              <div className="space-y-2 mb-4">
                {selected.dni_frontal && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1 font-medium">DNI Frontal</p>
                    <img src={selected.dni_frontal} alt="DNI Frontal" className="w-full rounded-lg border border-stone-200 object-cover h-24" />
                  </div>
                )}
                {selected.dni_trasero && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1 font-medium">DNI Trasero</p>
                    <img src={selected.dni_trasero} alt="DNI Trasero" className="w-full rounded-lg border border-stone-200 object-cover h-24" />
                  </div>
                )}
              </div>
            )}
            {selected.notas && (
              <div className="bg-stone-50 rounded-xl p-3 mb-4 text-xs text-stone-600">
                <span className="font-medium text-stone-700">Notas: </span>{selected.notas}
              </div>
            )}
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
              onClick={() => handleExportSingle(selected)}
              disabled={exportingId === selected.id}
              className="w-full bg-stone-900 text-white py-2.5 rounded-full text-xs font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exportingId === selected.id ? (
                <><i className="ri-loader-4-line animate-spin"></i> Generando PDF...</>
              ) : (
                <><i className="ri-file-pdf-2-line"></i> Descargar ficha policial PDF</>
              )}
            </button>
            <p className="text-xs text-stone-400 text-center mt-2">
              Incluye datos personales, DNI, selfie e info de pago
            </p>
          </div>
        )}

        {editMode && editData && (
          <div className="w-full lg:w-96 bg-white rounded-2xl border border-stone-100 p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900 text-sm">Editar {label}</h3>
              <button onClick={() => setEditMode(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400">
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {[
                { key: "nombre", label: "Nombre" }, { key: "apellidos", label: "Apellidos" },
                { key: "email", label: "Email" }, { key: "telefono", label: "Teléfono" },
                { key: "dni_numero", label: "DNI/NIE" }, { key: "nacionalidad", label: "Nacionalidad" },
                { key: "fecha_nacimiento", label: "Fecha nacimiento" }, { key: "direccion", label: "Dirección" },
                { key: "ciudad", label: "Ciudad" }, { key: "codigo_postal", label: "Código postal" },
              ].map(({ key, label: lbl }) => (
                <div key={key}>
                  <label className="text-xs text-stone-500 mb-1 block">{lbl}</label>
                  <input type="text" value={(editData as Record<string, string>)[key] || ""}
                    onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                </div>
              ))}
              <div className="pt-2 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-700 mb-2">Cuenta bancaria</p>
                {[{ key: "titular", label: "Titular" }, { key: "iban", label: "IBAN" }, { key: "banco", label: "Banco" }, { key: "swift", label: "SWIFT/BIC" }].map(({ key, label: lbl }) => (
                  <div key={key} className="mb-2">
                    <label className="text-xs text-stone-500 mb-1 block">{lbl}</label>
                    <input type="text" value={editData.cuenta_bancaria?.[key as keyof typeof editData.cuenta_bancaria] || ""}
                      onChange={(e) => setEditData({ ...editData, cuenta_bancaria: { ...editData.cuenta_bancaria, [key]: e.target.value } })}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Notas internas</label>
                <textarea value={editData.notas || ""} onChange={(e) => setEditData({ ...editData, notas: e.target.value })}
                  rows={3} maxLength={500}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 resize-none" />
              </div>
            </div>
            <button onClick={handleSaveEdit} disabled={saving}
              className="w-full mt-4 bg-stone-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900">Añadir {label}</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "nombre", label: "Nombre" }, { key: "apellidos", label: "Apellidos" },
                { key: "email", label: "Email" }, { key: "telefono", label: "Teléfono" },
                { key: "dni_numero", label: "DNI/NIE" }, { key: "nacionalidad", label: "Nacionalidad" },
                { key: "fecha_nacimiento", label: "Fecha nacimiento" }, { key: "direccion", label: "Dirección" },
                { key: "ciudad", label: "Ciudad" }, { key: "codigo_postal", label: "Código postal" },
              ].map(({ key, label: lbl }) => (
                <div key={key} className={key === "direccion" || key === "email" ? "col-span-2" : ""}>
                  <label className="text-xs text-stone-500 mb-1 block">{lbl}</label>
                  <input type="text" value={(newMember as Record<string, string>)[key] || ""}
                    onChange={(e) => setNewMember({ ...newMember, [key]: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                </div>
              ))}
              <div className="col-span-2 pt-2 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-700 mb-2">Cuenta bancaria</p>
                <div className="grid grid-cols-2 gap-3">
                  {[{ key: "titular", label: "Titular" }, { key: "banco", label: "Banco" }, { key: "iban", label: "IBAN" }, { key: "swift", label: "SWIFT/BIC" }].map(({ key, label: lbl }) => (
                    <div key={key} className={key === "iban" ? "col-span-2" : ""}>
                      <label className="text-xs text-stone-500 mb-1 block">{lbl}</label>
                      <input type="text" value={newMember.cuenta_bancaria?.[key as keyof typeof newMember.cuenta_bancaria] || ""}
                        onChange={(e) => setNewMember({ ...newMember, cuenta_bancaria: { ...newMember.cuenta_bancaria!, [key]: e.target.value } })}
                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-stone-50" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap">
                Cancelar
              </button>
              <button onClick={handleAddMember} disabled={saving}
                className="flex-1 bg-stone-900 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : `Añadir ${label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
