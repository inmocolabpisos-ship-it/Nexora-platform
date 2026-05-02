import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Justificante {
  id: string;
  nombre_inmobiliaria: string;
  nombre_contacto: string | null;
  email: string;
  plan: string;
  metodo_pago: string;
  justificante_url: string;
  justificante_fecha: string;
  justificante_estado: string;
  justificante_notas: string | null;
  estado: string;
  fecha_proximo_pago: string | null;
  created_at: string;
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pendiente_revision: { label: "Pendiente revisión", color: "text-amber-700", bg: "bg-amber-100", icon: "ri-time-line" },
  aprobado: { label: "Aprobado", color: "text-emerald-700", bg: "bg-emerald-100", icon: "ri-check-line" },
  rechazado: { label: "Rechazado", color: "text-red-700", bg: "bg-red-100", icon: "ri-close-line" },
  sin_justificante: { label: "Sin justificante", color: "text-stone-500", bg: "bg-stone-100", icon: "ri-file-unknow-line" },
};

const PLAN_LABELS: Record<string, string> = {
  basico: "Básico — 25€/mes",
  profesional: "Profesional — 50€/mes",
  ilimitado: "Ilimitado — 95€/mes",
};

const PLAN_PRECIO: Record<string, number> = {
  basico: 25,
  profesional: 50,
  ilimitado: 95,
};

const MOTIVOS_RECHAZO = [
  "El importe no coincide con el plan contratado",
  "La imagen no es legible o está borrosa",
  "El justificante está incompleto (falta fecha, importe o destinatario)",
  "El pago no aparece como completado/enviado",
  "El número de destino no corresponde a NEXURA",
  "El justificante parece duplicado o ya fue procesado",
];

type EmailFeedback = { id: string; tipo: "aprobado" | "rechazado"; ok: boolean; msg: string } | null;

export default function JustificantesSection() {
  const [justificantes, setJustificantes] = useState<Justificante[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("pendiente_revision");
  const [busqueda, setBusqueda] = useState("");
  const [selected, setSelected] = useState<Justificante | null>(null);
  const [updating, setUpdating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Modal rechazo
  const [rechazarModal, setRechazarModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");

  // Feedback email
  const [emailFeedback, setEmailFeedback] = useState<EmailFeedback>(null);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const fetchJustificantes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inmobiliarias_suscripciones")
      .select("id, nombre_inmobiliaria, nombre_contacto, email, plan, metodo_pago, justificante_url, justificante_fecha, justificante_estado, justificante_notas, estado, fecha_proximo_pago, created_at")
      .not("justificante_url", "is", null)
      .order("justificante_fecha", { ascending: false });
    setJustificantes((data as Justificante[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchJustificantes(); }, []);

  const enviarEmailJustificante = async (
    j: Justificante,
    tipo: "justificante_aprobado" | "justificante_rechazado",
    motivo?: string
  ) => {
    setEnviandoEmail(true);
    try {
      await supabase.functions.invoke("email-inmobiliaria", {
        body: {
          tipo,
          email: j.email,
          nombre_inmobiliaria: j.nombre_inmobiliaria,
          nombre_contacto: j.nombre_contacto || j.nombre_inmobiliaria,
          plan: j.plan,
          precio_plan: PLAN_PRECIO[j.plan] ?? null,
          metodo_pago: j.metodo_pago,
          fecha_proximo_pago: j.fecha_proximo_pago
            ? new Date(j.fecha_proximo_pago).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
            : null,
          ...(motivo ? { motivo_rechazo: motivo } : {}),
        },
      });
      setEmailFeedback({
        id: j.id,
        tipo: tipo === "justificante_aprobado" ? "aprobado" : "rechazado",
        ok: true,
        msg: tipo === "justificante_aprobado"
          ? "Email de confirmación enviado al cliente"
          : "Email de rechazo enviado al cliente",
      });
    } catch {
      setEmailFeedback({
        id: j.id,
        tipo: tipo === "justificante_aprobado" ? "aprobado" : "rechazado",
        ok: false,
        msg: "No se pudo enviar el email (el estado sí se actualizó)",
      });
    } finally {
      setEnviandoEmail(false);
      setTimeout(() => setEmailFeedback(null), 5000);
    }
  };

  const handleAprobar = async (j: Justificante) => {
    setUpdating(true);
    await supabase
      .from("inmobiliarias_suscripciones")
      .update({ justificante_estado: "aprobado", estado: "activo" })
      .eq("id", j.id);
    await fetchJustificantes();
    setSelected((prev) => prev?.id === j.id ? { ...prev, justificante_estado: "aprobado", estado: "activo" } : prev);
    setUpdating(false);
    // Enviar email automático
    await enviarEmailJustificante(j, "justificante_aprobado");
  };

  const handleRechazarConfirm = async () => {
    if (!selected) return;
    const motivo = motivoPersonalizado.trim() || motivoRechazo;
    setUpdating(true);
    setRechazarModal(false);
    await supabase
      .from("inmobiliarias_suscripciones")
      .update({ justificante_estado: "rechazado" })
      .eq("id", selected.id);
    await fetchJustificantes();
    setSelected((prev) => prev?.id === selected.id ? { ...prev, justificante_estado: "rechazado" } : prev);
    setUpdating(false);
    // Enviar email automático con motivo
    await enviarEmailJustificante(selected, "justificante_rechazado", motivo || undefined);
    setMotivoRechazo("");
    setMotivoPersonalizado("");
  };

  const handleRevertir = async (id: string) => {
    setUpdating(true);
    await supabase
      .from("inmobiliarias_suscripciones")
      .update({ justificante_estado: "pendiente_revision" })
      .eq("id", id);
    await fetchJustificantes();
    setSelected((prev) => prev?.id === id ? { ...prev, justificante_estado: "pendiente_revision" } : prev);
    setUpdating(false);
  };

  const filtered = justificantes.filter((j) => {
    const matchEstado = filtroEstado === "todos" || j.justificante_estado === filtroEstado;
    const matchBusqueda = !busqueda ||
      j.nombre_inmobiliaria?.toLowerCase().includes(busqueda.toLowerCase()) ||
      j.email?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const counts = {
    pendiente_revision: justificantes.filter((j) => j.justificante_estado === "pendiente_revision").length,
    aprobado: justificantes.filter((j) => j.justificante_estado === "aprobado").length,
    rechazado: justificantes.filter((j) => j.justificante_estado === "rechazado").length,
    todos: justificantes.length,
  };

  const isPdf = (url: string) => url?.toLowerCase().includes(".pdf");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900">Justificantes de pago</h2>
          <p className="text-charcoal-500 text-sm mt-0.5">Revisa y aprueba los justificantes — se envía email automático al cliente</p>
        </div>
        <button
          onClick={fetchJustificantes}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-charcoal-700 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-refresh-line"></i>
          Actualizar
        </button>
      </div>

      {/* Banner info email automático */}
      <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
          <i className="ri-mail-send-line text-base"></i>
        </div>
        <div>
          <p className="text-xs font-bold text-charcoal-800 mb-0.5">Email automático activado</p>
          <p className="text-xs text-charcoal-500 leading-relaxed">
            Al <strong className="text-emerald-700">aprobar</strong> un justificante → el cliente recibe email de confirmación con acceso a NEXURA y detalles del plan.<br />
            Al <strong className="text-red-600">rechazar</strong> → recibe email con el motivo, instrucciones para corregirlo y enlace para subir nuevo justificante.
          </p>
        </div>
      </div>

      {/* Feedback email */}
      {emailFeedback && (
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
          emailFeedback.ok
            ? emailFeedback.tipo === "aprobado" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            : "bg-stone-50 border-stone-200"
        }`}>
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${
            emailFeedback.ok
              ? emailFeedback.tipo === "aprobado" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
              : "bg-stone-100 text-stone-500"
          }`}>
            <i className={emailFeedback.ok ? "ri-mail-check-line" : "ri-mail-close-line"}></i>
          </div>
          <div>
            <p className="text-xs font-semibold text-charcoal-800">
              {emailFeedback.ok ? "Email enviado" : "Error al enviar email"}
            </p>
            <p className="text-xs text-charcoal-500">{emailFeedback.msg}</p>
          </div>
          <button onClick={() => setEmailFeedback(null)} className="ml-auto text-charcoal-400 hover:text-charcoal-600 cursor-pointer">
            <i className="ri-close-line text-sm"></i>
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: "pendiente_revision", label: "Pendientes", icon: "ri-time-line", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { key: "aprobado", label: "Aprobados", icon: "ri-check-double-line", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { key: "rechazado", label: "Rechazados", icon: "ri-close-circle-line", color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { key: "todos", label: "Total", icon: "ri-file-list-3-line", color: "text-stone-600", bg: "bg-stone-50 border-stone-200" },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFiltroEstado(stat.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              filtroEstado === stat.key ? stat.bg + " ring-2 ring-offset-1 ring-amber-300" : "bg-white border-stone-100 hover:border-stone-200"
            }`}
          >
            <div className={`w-9 h-9 flex items-center justify-center rounded-lg mb-2 ${filtroEstado === stat.key ? "" : "bg-stone-100"}`}>
              <i className={`${stat.icon} text-lg ${filtroEstado === stat.key ? stat.color : "text-stone-500"}`}></i>
            </div>
            <p className="text-2xl font-bold text-charcoal-900">{counts[stat.key as keyof typeof counts]}</p>
            <p className="text-xs text-charcoal-500 mt-0.5">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative max-w-xs">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
        <input
          type="text"
          placeholder="Buscar inmobiliaria o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white"
        />
      </div>

      {/* Lista + Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Lista */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <i className="ri-loader-4-line animate-spin text-2xl text-stone-400"></i>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-100">
              <i className="ri-file-unknow-line text-3xl text-stone-300 mb-2 block"></i>
              <p className="text-charcoal-500 text-sm">No hay justificantes en esta categoría</p>
            </div>
          ) : (
            filtered.map((j) => {
              const cfg = ESTADO_CONFIG[j.justificante_estado] || ESTADO_CONFIG.sin_justificante;
              return (
                <button
                  key={j.id}
                  onClick={() => setSelected(j)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selected?.id === j.id ? "border-amber-400 bg-amber-50" : "border-stone-100 bg-white hover:border-stone-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-charcoal-900 truncate">{j.nombre_inmobiliaria}</p>
                      <p className="text-xs text-charcoal-500 truncate">{j.email}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                      <i className={`${cfg.icon} text-xs`}></i>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-charcoal-400">
                    <span className="flex items-center gap-1">
                      <i className={`${j.metodo_pago === "bizum" ? "ri-smartphone-line text-emerald-500" : "ri-send-plane-fill text-violet-500"}`}></i>
                      {j.metodo_pago === "bizum" ? "Bizum" : "Revolut"}
                    </span>
                    <span>·</span>
                    <span>{PLAN_LABELS[j.plan] || j.plan}</span>
                  </div>
                  {j.justificante_fecha && (
                    <p className="text-xs text-charcoal-300 mt-1">
                      {new Date(j.justificante_fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Detalle */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-stone-100 text-center">
              <i className="ri-file-search-line text-4xl text-stone-300 mb-3"></i>
              <p className="text-charcoal-500 text-sm font-medium">Selecciona un justificante</p>
              <p className="text-charcoal-400 text-xs mt-1">para ver los detalles y tomar acción</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-stone-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-charcoal-900 text-base">{selected.nombre_inmobiliaria}</h3>
                    <p className="text-xs text-charcoal-500 mt-0.5">{selected.email}</p>
                    {selected.nombre_contacto && (
                      <p className="text-xs text-charcoal-400 mt-0.5">Contacto: {selected.nombre_contacto}</p>
                    )}
                  </div>
                  {(() => {
                    const cfg = ESTADO_CONFIG[selected.justificante_estado] || ESTADO_CONFIG.sin_justificante;
                    return (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        <i className={cfg.icon}></i>
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Plan", value: PLAN_LABELS[selected.plan] || selected.plan },
                    { label: "Método de pago", value: selected.metodo_pago === "bizum" ? "Bizum" : "Revolut" },
                    { label: "Fecha justificante", value: selected.justificante_fecha ? new Date(selected.justificante_fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
                    { label: "Estado cuenta", value: selected.estado },
                  ].map((row) => (
                    <div key={row.label} className="bg-stone-50 rounded-xl p-3">
                      <p className="text-xs text-charcoal-400 mb-0.5">{row.label}</p>
                      <p className="text-sm font-semibold text-charcoal-800 capitalize">{row.value}</p>
                    </div>
                  ))}
                </div>

                {selected.justificante_notas && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Notas del cliente:</p>
                    <p className="text-xs text-charcoal-700">{selected.justificante_notas}</p>
                  </div>
                )}

                {/* Preview justificante */}
                <div>
                  <p className="text-xs font-semibold text-charcoal-700 mb-2">Justificante adjunto:</p>
                  {isPdf(selected.justificante_url) ? (
                    <a
                      href={selected.justificante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <i className="ri-file-pdf-line text-red-500 text-2xl"></i>
                      <div>
                        <p className="text-sm font-semibold text-charcoal-800">Ver PDF</p>
                        <p className="text-xs text-charcoal-500">Haz clic para abrir en nueva pestaña</p>
                      </div>
                      <i className="ri-external-link-line text-charcoal-400 ml-auto"></i>
                    </a>
                  ) : (
                    <div
                      className="relative cursor-pointer rounded-xl overflow-hidden border border-stone-200 group"
                      onClick={() => setPreviewOpen(true)}
                    >
                      <img
                        src={selected.justificante_url}
                        alt="Justificante"
                        className="w-full max-h-56 object-contain bg-stone-50"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold text-charcoal-800">
                          <i className="ri-zoom-in-line"></i>
                          Ver completo
                        </div>
                      </div>
                    </div>
                  )}
                  <a
                    href={selected.justificante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-amber-600 hover:underline mt-2 cursor-pointer"
                  >
                    <i className="ri-download-line"></i>
                    Descargar justificante
                  </a>
                </div>

                {/* Acciones — pendiente */}
                {selected.justificante_estado === "pendiente_revision" && (
                  <div className="space-y-3 pt-1">
                    {/* Info email */}
                    <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-100 rounded-xl">
                      <i className="ri-mail-send-line text-amber-500 text-sm flex-shrink-0"></i>
                      <p className="text-xs text-charcoal-500">
                        Al aprobar o rechazar se enviará un <strong>email automático</strong> a <strong>{selected.email}</strong>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAprobar(selected)}
                        disabled={updating || enviandoEmail}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {updating || enviandoEmail
                          ? <><i className="ri-loader-4-line animate-spin"></i> Procesando...</>
                          : <><i className="ri-check-double-line"></i> Aprobar y notificar</>
                        }
                      </button>
                      <button
                        onClick={() => setRechazarModal(true)}
                        disabled={updating || enviandoEmail}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        <i className="ri-close-line"></i>
                        Rechazar y notificar
                      </button>
                    </div>
                  </div>
                )}

                {/* Estado aprobado */}
                {selected.justificante_estado === "aprobado" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <i className="ri-check-double-line text-emerald-600"></i>
                      <div className="flex-1">
                        <p className="text-xs text-emerald-700 font-semibold">Pago aprobado — Cuenta activada</p>
                        <p className="text-xs text-emerald-600">Email de confirmación enviado al cliente</p>
                      </div>
                      <button
                        onClick={() => handleRevertir(selected.id)}
                        className="text-xs text-charcoal-400 hover:text-charcoal-600 cursor-pointer whitespace-nowrap"
                      >
                        Revertir
                      </button>
                    </div>
                    {/* Reenviar email */}
                    <button
                      onClick={() => enviarEmailJustificante(selected, "justificante_aprobado")}
                      disabled={enviandoEmail}
                      className="w-full flex items-center justify-center gap-2 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {enviandoEmail ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-mail-send-line"></i>}
                      Reenviar email de confirmación
                    </button>
                  </div>
                )}

                {/* Estado rechazado */}
                {selected.justificante_estado === "rechazado" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <i className="ri-close-circle-line text-red-500"></i>
                      <div className="flex-1">
                        <p className="text-xs text-red-700 font-semibold">Pago rechazado</p>
                        <p className="text-xs text-red-500">Email de rechazo enviado al cliente con instrucciones</p>
                      </div>
                      <button
                        onClick={() => handleRevertir(selected.id)}
                        className="text-xs text-charcoal-400 hover:text-charcoal-600 cursor-pointer whitespace-nowrap"
                      >
                        Revertir
                      </button>
                    </div>
                    {/* Reenviar email */}
                    <button
                      onClick={() => setRechazarModal(true)}
                      disabled={enviandoEmail}
                      className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {enviandoEmail ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-mail-send-line"></i>}
                      Reenviar email de rechazo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal rechazo con motivo */}
      {rechazarModal && selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-charcoal-900 text-base">Rechazar justificante</h3>
                <p className="text-xs text-charcoal-500 mt-0.5">{selected.nombre_inmobiliaria} · {selected.email}</p>
              </div>
              <button
                onClick={() => { setRechazarModal(false); setMotivoRechazo(""); setMotivoPersonalizado(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-charcoal-500 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <i className="ri-mail-send-line text-red-500 flex-shrink-0 mt-0.5"></i>
              <p className="text-xs text-red-700 leading-relaxed">
                Se enviará un email automático al cliente con el motivo del rechazo e instrucciones para corregirlo y subir un nuevo justificante.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-2">Motivo del rechazo (opcional)</label>
              <div className="space-y-2 mb-3">
                {MOTIVOS_RECHAZO.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMotivoRechazo(m); setMotivoPersonalizado(""); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      motivoRechazo === m && !motivoPersonalizado
                        ? "border-red-400 bg-red-50 text-red-700 font-semibold"
                        : "border-stone-200 text-charcoal-600 hover:border-stone-300"
                    }`}
                  >
                    {motivoRechazo === m && !motivoPersonalizado && <i className="ri-check-line mr-1.5 text-red-500"></i>}
                    {m}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-charcoal-500 mb-1">O escribe un motivo personalizado:</label>
                <textarea
                  value={motivoPersonalizado}
                  onChange={(e) => { setMotivoPersonalizado(e.target.value); if (e.target.value) setMotivoRechazo(""); }}
                  rows={2}
                  maxLength={300}
                  placeholder="Describe el motivo específico del rechazo..."
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-charcoal-800 focus:outline-none focus:border-red-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setRechazarModal(false); setMotivoRechazo(""); setMotivoPersonalizado(""); }}
                className="flex-1 border border-stone-200 text-charcoal-600 py-3 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazarConfirm}
                disabled={updating}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating
                  ? <><i className="ri-loader-4-line animate-spin"></i> Procesando...</>
                  : <><i className="ri-mail-send-line"></i> Rechazar y enviar email</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview imagen */}
      {previewOpen && selected && !isPdf(selected.justificante_url) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 cursor-pointer"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
            <img
              src={selected.justificante_url}
              alt="Justificante completo"
              className="w-full rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
