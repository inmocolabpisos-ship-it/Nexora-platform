import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import QRPago from "@/components/feature/QRPago";

type Inmobiliaria = {
  id: string;
  nombre_inmobiliaria: string;
  nombre_contacto: string;
  email: string;
  telefono: string;
  ciudad: string | null;
  plan: "basico" | "profesional" | "ilimitado";
  estado: "pendiente" | "activo" | "cancelado" | "suspendido";
  fecha_inicio: string | null;
  fecha_proximo_pago: string | null;
  metodo_pago: string | null;
  notas: string | null;
  max_propiedades: number | null;
  propiedades_activas: number;
  created_at: string;
};

const PLAN_INFO = {
  basico: { label: "Básico", precio: 25, max: 10, color: "bg-stone-100 text-stone-700", badge: "bg-stone-200 text-stone-700", mesesGratis: 1, permanenciaMeses: 24 },
  profesional: { label: "Profesional", precio: 50, max: 25, color: "bg-amber-100 text-amber-700", badge: "bg-amber-200 text-amber-700", mesesGratis: 3, permanenciaMeses: 24 },
  ilimitado: { label: "Ilimitado", precio: 95, max: null, color: "bg-stone-900 text-amber-400", badge: "bg-stone-800 text-amber-300", mesesGratis: 6, permanenciaMeses: 24 },
};

const ESTADO_COLOR = {
  pendiente: "bg-amber-100 text-amber-700",
  activo: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
  suspendido: "bg-orange-100 text-orange-700",
};

const EMPTY: Omit<Inmobiliaria, "id" | "created_at" | "propiedades_activas"> = {
  nombre_inmobiliaria: "",
  nombre_contacto: "",
  email: "",
  telefono: "",
  ciudad: "",
  plan: "basico",
  estado: "pendiente",
  fecha_inicio: null,
  fecha_proximo_pago: null,
  metodo_pago: "bizum",
  notas: "",
  max_propiedades: 10,
};

function diasParaPago(fechaStr: string | null): number | null {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr);
  fecha.setHours(0, 0, 0, 0);
  return Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function AlertaBadge({ dias }: { dias: number }) {
  if (dias < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <i className="ri-error-warning-fill text-xs"></i> Vencido {Math.abs(dias)}d
    </span>
  );
  if (dias === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
      <i className="ri-alarm-warning-fill text-xs"></i> Vence hoy
    </span>
  );
  if (dias <= 5) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <i className="ri-time-fill text-xs"></i> {dias}d
    </span>
  );
  return null;
}

export default function InmobiliariasSection() {
  const [lista, setLista] = useState<Inmobiliaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState<Inmobiliaria | null>(null);
  const [enviandoWa, setEnviandoWa] = useState<string | null>(null);
  const [waFeedback, setWaFeedback] = useState<{ id: string; ok: boolean } | null>(null);
  const [enviandoEmail, setEnviandoEmail] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ id: string; ok: boolean } | null>(null);
  const [tabAlerta, setTabAlerta] = useState(false);
  const [ejecutandoCron, setEjecutandoCron] = useState(false);
  const [cronResultado, setCronResultado] = useState<{ ok: boolean; total: number; msg: string } | null>(null);
  const [modalPermanencia, setModalPermanencia] = useState<Inmobiliaria | null>(null);

  const ejecutarRecordatorioMensual = async () => {
    setEjecutandoCron(true);
    setCronResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke("recordatorio-mensual", { body: {} });
      if (error) throw error;
      const total = data?.total_recordatorios ?? 0;
      setCronResultado({
        ok: true,
        total,
        msg: total === 0
          ? "Sin pagos pendientes este mes. Se ha notificado al admin por WhatsApp."
          : `${total} recordatorio${total !== 1 ? "s" : ""} enviado${total !== 1 ? "s" : ""} por email y WhatsApp.`,
      });
    } catch {
      setCronResultado({ ok: false, total: 0, msg: "Error al ejecutar los recordatorios. Inténtalo de nuevo." });
    } finally {
      setEjecutandoCron(false);
      setTimeout(() => setCronResultado(null), 6000);
    }
  };

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("inmobiliarias_suscripciones")
      .select("*")
      .order("created_at", { ascending: false });
    setLista((data as Inmobiliaria[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => {
    setEditId(null);
    setForm({ ...EMPTY });
    setModal(true);
  };

  const abrirEditar = (item: Inmobiliaria) => {
    setEditId(item.id);
    setForm({
      nombre_inmobiliaria: item.nombre_inmobiliaria,
      nombre_contacto: item.nombre_contacto,
      email: item.email,
      telefono: item.telefono,
      ciudad: item.ciudad || "",
      plan: item.plan,
      estado: item.estado,
      fecha_inicio: item.fecha_inicio || null,
      fecha_proximo_pago: item.fecha_proximo_pago || null,
      metodo_pago: item.metodo_pago || "bizum",
      notas: item.notas || "",
      max_propiedades: item.max_propiedades,
    });
    setModal(true);
  };

  const handlePlanChange = (plan: "basico" | "profesional" | "ilimitado") => {
    const maxMap = { basico: 10, profesional: 25, ilimitado: null };
    setForm((p) => ({ ...p, plan, max_propiedades: maxMap[plan] }));
  };

  const guardar = async () => {
    setSaving(true);
    const payload = { ...form };
    if (editId) {
      await supabase.from("inmobiliarias_suscripciones").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editId);
    } else {
      await supabase.from("inmobiliarias_suscripciones").insert([payload]);
    }
    setSaving(false);
    setModal(false);
    cargar();
  };

  const cambiarEstado = async (id: string, estado: Inmobiliaria["estado"]) => {
    await supabase.from("inmobiliarias_suscripciones").update({ estado, updated_at: new Date().toISOString() }).eq("id", id);
    cargar();
    if (detalle?.id === id) setDetalle((p) => p ? { ...p, estado } : null);
    const item = lista.find((i) => i.id === id);
    if (item) {
      if (estado === "activo" && item.estado === "pendiente") {
        enviarEmailRecordatorio({ ...item, estado }, "bienvenida");
      } else if (estado === "suspendido") {
        enviarEmailRecordatorio({ ...item, estado }, "suspension");
      } else if (estado === "activo" && item.estado === "suspendido") {
        enviarEmailRecordatorio({ ...item, estado }, "reactivacion");
      }
    }
  };

  const enviarEmailRecordatorio = async (item: Inmobiliaria, tipo: "recordatorio_pago" | "bienvenida" | "suspension" | "reactivacion" = "recordatorio_pago") => {
    setEnviandoEmail(item.id);
    const dias = diasParaPago(item.fecha_proximo_pago);
    try {
      await supabase.functions.invoke("email-inmobiliaria", {
        body: {
          tipo,
          email: item.email,
          nombre_inmobiliaria: item.nombre_inmobiliaria,
          nombre_contacto: item.nombre_contacto,
          plan: item.plan,
          precio_plan: PLAN_INFO[item.plan]?.precio,
          fecha_proximo_pago: item.fecha_proximo_pago
            ? new Date(item.fecha_proximo_pago).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
            : null,
          dias_para_pago: dias,
        },
      });
      setEmailFeedback({ id: item.id, ok: true });
    } catch {
      setEmailFeedback({ id: item.id, ok: false });
    } finally {
      setEnviandoEmail(null);
      setTimeout(() => setEmailFeedback(null), 3500);
    }
  };

  const enviarRecordatorioWa = async (item: Inmobiliaria) => {
    setEnviandoWa(item.id);
    const dias = diasParaPago(item.fecha_proximo_pago);
    try {
      await supabase.functions.invoke("whatsapp-notify", {
        body: {
          tipo: "recordatorio_pago",
          nombre_inmobiliaria: item.nombre_inmobiliaria,
          nombre_contacto: item.nombre_contacto,
          email_inmobiliaria: item.email,
          telefono_inmobiliaria: item.telefono,
          plan_inmobiliaria: item.plan,
          precio_plan: PLAN_INFO[item.plan]?.precio,
          fecha_proximo_pago: item.fecha_proximo_pago
            ? new Date(item.fecha_proximo_pago).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
            : null,
          dias_para_pago: dias,
        },
      });
      setWaFeedback({ id: item.id, ok: true });
    } catch {
      setWaFeedback({ id: item.id, ok: false });
    } finally {
      setEnviandoWa(null);
      setTimeout(() => setWaFeedback(null), 3000);
    }
  };

  const calcularSancion = (item: Inmobiliaria): { mesesRestantes: number; importeSancion: number } | null => {
    if (!item.fecha_inicio) return null;
    const inicio = new Date(item.fecha_inicio);
    const hoy = new Date();
    const mesesTranscurridos = Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const permanencia = PLAN_INFO[item.plan]?.permanenciaMeses || 24;
    const mesesRestantes = permanencia - mesesTranscurridos;
    if (mesesRestantes <= 0) return null;
    const precio = PLAN_INFO[item.plan]?.precio || 0;
    const importeSancion = Math.round(mesesRestantes * precio * 0.5);
    return { mesesRestantes, importeSancion };
  };

  const alertas = lista.filter((i) => {
    if (i.estado !== "activo") return false;
    const dias = diasParaPago(i.fecha_proximo_pago);
    return dias !== null && dias <= 5;
  }).sort((a, b) => {
    const da = diasParaPago(a.fecha_proximo_pago) ?? 999;
    const db = diasParaPago(b.fecha_proximo_pago) ?? 999;
    return da - db;
  });

  const filtradas = lista.filter((i) => {
    if (tabAlerta) {
      const dias = diasParaPago(i.fecha_proximo_pago);
      return i.estado === "activo" && dias !== null && dias <= 5;
    }
    const matchEstado = filtroEstado === "todos" || i.estado === filtroEstado;
    const matchBusqueda = !busqueda || i.nombre_inmobiliaria.toLowerCase().includes(busqueda.toLowerCase()) || i.email.toLowerCase().includes(busqueda.toLowerCase()) || i.nombre_contacto.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const activas = lista.filter((i) => i.estado === "activo");
  const pendientes = lista.filter((i) => i.estado === "pendiente");
  const ingresosMes = activas.reduce((a, i) => a + (PLAN_INFO[i.plan]?.precio || 0), 0);
  const fmt = (n: number) => n.toLocaleString("es-ES");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-stone-100 rounded animate-pulse"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Inmobiliarias</h2>
          <p className="text-stone-500 text-sm mt-0.5">Gestión de suscripciones y cuentas de inmobiliarias</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={ejecutarRecordatorioMensual}
            disabled={ejecutandoCron}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-4 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            {ejecutandoCron
              ? <><i className="ri-loader-4-line animate-spin"></i> Enviando...</>
              : <><i className="ri-send-plane-2-line"></i> Recordatorios mensuales</>}
          </button>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i> Nueva inmobiliaria
          </button>
        </div>
      </div>

      {/* Banner meses gratis por plan */}
      <div className="grid grid-cols-3 gap-3">
        {(["basico", "profesional", "ilimitado"] as const).map((p) => {
          const info = PLAN_INFO[p];
          return (
            <div key={p} className="bg-white border border-stone-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
                <i className="ri-gift-line text-base"></i>
              </div>
              <div>
                <div className="text-xs text-stone-500 font-medium">{info.label} — {info.precio}€/mes</div>
                <div className="text-sm font-bold text-emerald-600">
                  {info.mesesGratis === 1 ? "1 mes gratis" : `${info.mesesGratis} meses gratis`}
                </div>
                <div className="text-xs text-stone-400">Permanencia 24 meses</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback cron */}
      {cronResultado && (
        <div className={`rounded-2xl border px-5 py-4 flex items-center gap-3 transition-all ${cronResultado.ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className={`w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 ${cronResultado.ok ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
            <i className={cronResultado.ok ? "ri-check-double-line" : "ri-error-warning-line"}></i>
          </div>
          <div>
            <p className={`text-sm font-semibold ${cronResultado.ok ? "text-emerald-800" : "text-red-800"}`}>
              {cronResultado.ok ? "Recordatorios enviados" : "Error al enviar"}
            </p>
            <p className={`text-xs mt-0.5 ${cronResultado.ok ? "text-emerald-600" : "text-red-600"}`}>{cronResultado.msg}</p>
          </div>
        </div>
      )}

      {/* Banner alertas pago */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-100 text-red-600 flex-shrink-0 mt-0.5">
              <i className="ri-alarm-warning-line text-base"></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-red-800 text-sm">
                  {alertas.length === 1 ? "1 inmobiliaria con pago pendiente" : `${alertas.length} inmobiliarias con pago pendiente`}
                </span>
                <span className="px-2 py-0.5 bg-red-200 text-red-700 rounded-full text-xs font-bold">{alertas.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {alertas.map((item) => {
                  const dias = diasParaPago(item.fecha_proximo_pago);
                  return (
                    <div key={item.id} className="flex items-center gap-2 bg-white border border-red-200 rounded-xl px-3 py-2">
                      <div>
                        <div className="text-xs font-semibold text-stone-800">{item.nombre_inmobiliaria}</div>
                        <div className="text-xs text-stone-500">{PLAN_INFO[item.plan]?.precio}€/mes · {item.telefono}</div>
                      </div>
                      {dias !== null && <AlertaBadge dias={dias} />}
                      <button
                        onClick={() => enviarRecordatorioWa(item)}
                        disabled={enviandoWa === item.id}
                        className="ml-1 flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors disabled:opacity-60"
                      >
                        {enviandoWa === item.id ? <i className="ri-loader-4-line animate-spin text-xs"></i> : <i className="ri-whatsapp-line text-xs"></i>}
                        {waFeedback?.id === item.id ? (waFeedback.ok ? "¡Enviado!" : "Error") : "WA"}
                      </button>
                      <button
                        onClick={() => enviarEmailRecordatorio(item, "recordatorio_pago")}
                        disabled={enviandoEmail === item.id}
                        className="ml-1 flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors disabled:opacity-60"
                      >
                        {enviandoEmail === item.id ? <i className="ri-loader-4-line animate-spin text-xs"></i> : <i className="ri-mail-send-line text-xs"></i>}
                        {emailFeedback?.id === item.id ? (emailFeedback.ok ? "¡Enviado!" : "Error") : "Email"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-3">
            <i className="ri-building-2-line text-base"></i>
          </div>
          <div className="text-2xl font-bold text-stone-900">{activas.length}</div>
          <div className="text-stone-500 text-xs mt-0.5">Cuentas activas</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 mb-3">
            <i className="ri-time-line text-base"></i>
          </div>
          <div className="text-2xl font-bold text-stone-900">{pendientes.length}</div>
          <div className="text-stone-500 text-xs mt-0.5">Pendientes activar</div>
        </div>
        <div
          className="bg-white rounded-2xl border border-stone-100 p-5 cursor-pointer hover:border-red-200 transition-colors relative"
          onClick={() => setTabAlerta((v) => !v)}
        >
          <div className={`w-9 h-9 flex items-center justify-center rounded-xl mb-3 ${alertas.length > 0 ? "bg-red-100 text-red-600" : "bg-stone-100 text-stone-400"}`}>
            <i className="ri-alarm-warning-line text-base"></i>
          </div>
          <div className={`text-2xl font-bold ${alertas.length > 0 ? "text-red-600" : "text-stone-900"}`}>{alertas.length}</div>
          <div className="text-stone-500 text-xs mt-0.5">Pagos próximos/vencidos</div>
          {alertas.length > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/30 text-white mb-3">
            <i className="ri-money-euro-circle-line text-base"></i>
          </div>
          <div className="text-2xl font-bold text-white">{fmt(ingresosMes)}€</div>
          <div className="text-amber-100 text-xs mt-0.5">Ingresos/mes estimados</div>
        </div>
      </div>

      {/* Filtros */}
      {!tabAlerta && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, email o contacto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-amber-400 bg-white"
            />
          </div>
          <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1">
            {["todos", "pendiente", "activo", "suspendido", "cancelado"].map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${filtroEstado === e ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
              >
                {e === "todos" ? "Todos" : e}
              </button>
            ))}
          </div>
        </div>
      )}

      {tabAlerta && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2">
            <i className="ri-alarm-warning-fill text-red-500 text-sm"></i>
            <span className="text-sm font-semibold text-red-700">Mostrando pagos próximos / vencidos</span>
          </div>
          <button onClick={() => setTabAlerta(false)} className="text-stone-500 hover:text-stone-700 text-sm cursor-pointer underline whitespace-nowrap">
            Ver todas
          </button>
        </div>
      )}

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
          <i className="ri-building-2-line text-4xl text-stone-200 mb-3"></i>
          <p className="text-stone-400 text-sm">
            {tabAlerta ? "No hay pagos próximos ni vencidos" : "No hay inmobiliarias registradas"}
          </p>
          {!tabAlerta && (
            <button onClick={abrirNuevo} className="mt-4 text-amber-600 text-sm hover:underline cursor-pointer">
              Añadir la primera
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-stone-500">Inmobiliaria</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500">Contacto</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500">Próx. pago</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-stone-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((item) => {
                  const dias = diasParaPago(item.fecha_proximo_pago);
                  const esAlerta = item.estado === "activo" && dias !== null && dias <= 5;
                  return (
                    <tr key={item.id} className={`border-b border-stone-50 transition-colors ${esAlerta ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-stone-50"}`}>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-stone-900">{item.nombre_inmobiliaria}</div>
                        <div className="text-stone-400 text-xs">{item.ciudad || "—"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-stone-700 text-xs">{item.nombre_contacto}</div>
                        <div className="text-stone-400 text-xs">{item.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_INFO[item.plan]?.badge}`}>
                          {PLAN_INFO[item.plan]?.label} — {PLAN_INFO[item.plan]?.precio}€
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ESTADO_COLOR[item.estado]}`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-stone-500 text-xs">
                            {item.fecha_proximo_pago
                              ? new Date(item.fecha_proximo_pago).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </span>
                          {dias !== null && <AlertaBadge dias={dias} />}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.estado === "activo" && (
                            <>
                              <button
                                onClick={() => enviarRecordatorioWa(item)}
                                disabled={enviandoWa === item.id}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${waFeedback?.id === item.id && waFeedback.ok ? "bg-emerald-100 text-emerald-600" : "hover:bg-emerald-100 text-emerald-600"} disabled:opacity-50`}
                                title="Recordatorio por WhatsApp"
                              >
                                {enviandoWa === item.id ? <i className="ri-loader-4-line animate-spin text-sm"></i> : waFeedback?.id === item.id && waFeedback.ok ? <i className="ri-check-line text-sm"></i> : <i className="ri-whatsapp-line text-sm"></i>}
                              </button>
                              <button
                                onClick={() => enviarEmailRecordatorio(item, "recordatorio_pago")}
                                disabled={enviandoEmail === item.id}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${emailFeedback?.id === item.id && emailFeedback.ok ? "bg-amber-100 text-amber-600" : "hover:bg-amber-100 text-amber-600"} disabled:opacity-50`}
                                title="Recordatorio por email"
                              >
                                {enviandoEmail === item.id ? <i className="ri-loader-4-line animate-spin text-sm"></i> : emailFeedback?.id === item.id && emailFeedback.ok ? <i className="ri-check-line text-sm"></i> : <i className="ri-mail-send-line text-sm"></i>}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setModalPermanencia(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-500 cursor-pointer transition-colors"
                            title="Ver permanencia y sanción"
                          >
                            <i className="ri-file-list-3-line text-sm"></i>
                          </button>
                          <button
                            onClick={() => setDetalle(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer transition-colors"
                            title="Ver detalle"
                          >
                            <i className="ri-eye-line text-sm"></i>
                          </button>
                          <button
                            onClick={() => abrirEditar(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-600 cursor-pointer transition-colors"
                            title="Editar"
                          >
                            <i className="ri-edit-line text-sm"></i>
                          </button>
                          {item.estado === "pendiente" && (
                            <button
                              onClick={() => cambiarEstado(item.id, "activo")}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-100 text-emerald-600 cursor-pointer transition-colors"
                              title="Activar cuenta"
                            >
                              <i className="ri-check-line text-sm"></i>
                            </button>
                          )}
                          {item.estado === "activo" && (
                            <button
                              onClick={() => cambiarEstado(item.id, "suspendido")}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-orange-100 text-orange-500 cursor-pointer transition-colors"
                              title="Suspender"
                            >
                              <i className="ri-pause-line text-sm"></i>
                            </button>
                          )}
                          {item.estado === "suspendido" && (
                            <button
                              onClick={() => cambiarEstado(item.id, "activo")}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-100 text-emerald-600 cursor-pointer transition-colors"
                              title="Reactivar"
                            >
                              <i className="ri-play-line text-sm"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PERMANENCIA Y SANCIÓN */}
      {modalPermanencia && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalPermanencia(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-7 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalPermanencia(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-500">
              <i className="ri-close-line"></i>
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
                <i className="ri-file-list-3-line text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Permanencia y sanción</h3>
                <p className="text-stone-500 text-xs">{modalPermanencia.nombre_inmobiliaria}</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Meses gratis */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-gift-line text-amber-600"></i>
                  <span className="text-sm font-semibold text-stone-800">Meses gratis incluidos</span>
                </div>
                <p className="text-sm text-stone-700">
                  Plan <strong>{PLAN_INFO[modalPermanencia.plan].label}</strong>:{" "}
                  <strong className="text-emerald-600">
                    {PLAN_INFO[modalPermanencia.plan].mesesGratis === 1
                      ? "1 mes gratis"
                      : `${PLAN_INFO[modalPermanencia.plan].mesesGratis} meses gratis`}
                  </strong>{" "}
                  al inicio de la suscripción.
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white border border-stone-200 rounded-lg p-2 text-center">
                    <div className="text-stone-400">Básico</div>
                    <div className="font-bold text-emerald-600">1 mes</div>
                  </div>
                  <div className="bg-white border border-stone-200 rounded-lg p-2 text-center">
                    <div className="text-stone-400">Profesional</div>
                    <div className="font-bold text-emerald-600">3 meses</div>
                  </div>
                  <div className="bg-white border border-stone-200 rounded-lg p-2 text-center">
                    <div className="text-stone-400">Ilimitado</div>
                    <div className="font-bold text-emerald-600">6 meses</div>
                  </div>
                </div>
              </div>

              {/* Permanencia */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-time-line text-stone-600"></i>
                  <span className="text-sm font-semibold text-stone-800">Permanencia mínima — 2 años</span>
                </div>
                <p className="text-sm text-stone-700">
                  Todos los planes tienen una permanencia de <strong>24 meses</strong> desde la fecha de inicio.
                </p>
                {modalPermanencia.fecha_inicio && (
                  <p className="text-xs text-stone-500 mt-1">
                    Inicio: {new Date(modalPermanencia.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* Sanción */}
              {(() => {
                const sancion = calcularSancion(modalPermanencia);
                if (sancion) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="ri-error-warning-line text-red-500"></i>
                        <span className="text-sm font-semibold text-red-800">Sanción por cancelación anticipada</span>
                      </div>
                      <p className="text-sm text-red-700">
                        Quedan <strong>{sancion.mesesRestantes} meses</strong> de permanencia.
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Sanción estimada: <strong className="text-red-800 text-base">{sancion.importeSancion}€</strong>
                        <span className="text-xs text-red-500 ml-1">(50% de cuotas restantes)</span>
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <i className="ri-check-line text-emerald-600"></i>
                      <span className="text-sm font-semibold text-emerald-800">Permanencia cumplida — Sin sanción</span>
                    </div>
                  </div>
                );
              })()}

              {/* QR de pago del plan */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="ri-qr-code-line text-stone-600"></i>
                  <span className="text-sm font-semibold text-stone-800">QR de pago mensual</span>
                </div>
                <p className="text-xs text-stone-500 mb-3">
                  Comparte este QR con la inmobiliaria para que realice el pago mensual por Bizum.
                </p>
                <div className="flex justify-center">
                  <QRPago
                    importe={PLAN_INFO[modalPermanencia.plan].precio}
                    concepto={`Suscripción ${PLAN_INFO[modalPermanencia.plan].label} ${modalPermanencia.nombre_inmobiliaria}`}
                    nombreNegocio="NEXURA"
                    size={160}
                    showDownload={true}
                  />
                </div>
              </div>

              {/* Jurisdicción */}
              <div className="bg-stone-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-scales-3-line text-amber-400"></i>
                  <span className="text-sm font-semibold text-white">Jurisdicción competente</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  En caso de litigio, impago o incumplimiento del contrato, la jurisdicción competente son los{" "}
                  <strong className="text-amber-400">Juzgados de Figueres (Girona, CP 17600)</strong>, conforme a los Términos y Condiciones de NEXURA. Cualquier reclamación judicial se tramitará ante dichos juzgados.
                </p>
              </div>
            </div>

            <button
              onClick={() => setModalPermanencia(null)}
              className="mt-5 w-full bg-stone-800 hover:bg-stone-700 text-white py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {detalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-7 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetalle(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-500">
              <i className="ri-close-line"></i>
            </button>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
                <i className="ri-building-2-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg">{detalle.nombre_inmobiliaria}</h3>
                <p className="text-stone-500 text-sm">{detalle.ciudad || "Sin ciudad"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-stone-50 rounded-xl p-3">
                <div className="text-xs text-stone-400 mb-0.5">Contacto</div>
                <div className="text-sm font-medium text-stone-800">{detalle.nombre_contacto}</div>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <div className="text-xs text-stone-400 mb-0.5">Teléfono</div>
                <div className="text-sm font-medium text-stone-800">{detalle.telefono}</div>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <div className="text-xs text-stone-400 mb-0.5">Email</div>
                <div className="text-sm font-medium text-stone-800 truncate">{detalle.email}</div>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <div className="text-xs text-stone-400 mb-0.5">Método de pago</div>
                <div className="text-sm font-medium text-stone-800 capitalize">{detalle.metodo_pago || "Bizum"}</div>
              </div>
            </div>

            <div className="flex gap-3 mb-5">
              <div className={`flex-1 rounded-xl p-3 text-center ${PLAN_INFO[detalle.plan]?.color}`}>
                <div className="text-xs opacity-70 mb-0.5">Plan</div>
                <div className="font-bold">{PLAN_INFO[detalle.plan]?.label}</div>
                <div className="text-sm font-semibold">{PLAN_INFO[detalle.plan]?.precio}€/mes</div>
              </div>
              <div className={`flex-1 rounded-xl p-3 text-center ${ESTADO_COLOR[detalle.estado]}`}>
                <div className="text-xs opacity-70 mb-0.5">Estado</div>
                <div className="font-bold capitalize">{detalle.estado}</div>
              </div>
              <div className="flex-1 bg-stone-50 rounded-xl p-3 text-center">
                <div className="text-xs text-stone-400 mb-0.5">Próx. pago</div>
                <div className="font-medium text-stone-800 text-sm">
                  {detalle.fecha_proximo_pago
                    ? new Date(detalle.fecha_proximo_pago).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                    : "—"}
                </div>
                {(() => {
                  const dias = diasParaPago(detalle.fecha_proximo_pago);
                  return dias !== null && dias <= 5 ? <div className="mt-1"><AlertaBadge dias={dias} /></div> : null;
                })()}
              </div>
            </div>

            {detalle.notas && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
                <div className="text-xs text-amber-600 font-medium mb-1">Notas</div>
                <p className="text-xs text-amber-700 leading-relaxed">{detalle.notas}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {detalle.estado === "activo" && (
                <>
                  <button
                    onClick={() => enviarRecordatorioWa(detalle)}
                    disabled={enviandoWa === detalle.id}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {enviandoWa === detalle.id ? <><i className="ri-loader-4-line animate-spin"></i> Enviando...</> : waFeedback?.id === detalle.id && waFeedback.ok ? <><i className="ri-check-line"></i> ¡WA enviado!</> : <><i className="ri-whatsapp-line"></i> WhatsApp</>}
                  </button>
                  <button
                    onClick={() => enviarEmailRecordatorio(detalle, "recordatorio_pago")}
                    disabled={enviandoEmail === detalle.id}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {enviandoEmail === detalle.id ? <><i className="ri-loader-4-line animate-spin"></i> Enviando...</> : emailFeedback?.id === detalle.id && emailFeedback.ok ? <><i className="ri-check-line"></i> ¡Email enviado!</> : <><i className="ri-mail-send-line"></i> Email recordatorio</>}
                  </button>
                </>
              )}
              {detalle.estado === "pendiente" && (
                <button onClick={() => cambiarEstado(detalle.id, "activo")} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-check-line mr-1"></i> Activar cuenta
                </button>
              )}
              {detalle.estado === "activo" && (
                <button onClick={() => cambiarEstado(detalle.id, "suspendido")} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-pause-line mr-1"></i> Suspender
                </button>
              )}
              {detalle.estado === "suspendido" && (
                <button onClick={() => cambiarEstado(detalle.id, "activo")} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-play-line mr-1"></i> Reactivar
                </button>
              )}
              <button onClick={() => { setDetalle(null); abrirEditar(detalle); }} className="flex-1 border border-stone-200 text-stone-700 hover:bg-stone-50 py-2.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors">
                <i className="ri-edit-line mr-1"></i> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-500">
              <i className="ri-close-line"></i>
            </button>
            <h3 className="font-bold text-stone-900 text-lg mb-6">{editId ? "Editar inmobiliaria" : "Nueva inmobiliaria"}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Nombre inmobiliaria *</label>
                  <input type="text" value={form.nombre_inmobiliaria} onChange={(e) => setForm((p) => ({ ...p, nombre_inmobiliaria: e.target.value }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Nombre contacto *</label>
                  <input type="text" value={form.nombre_contacto} onChange={(e) => setForm((p) => ({ ...p, nombre_contacto: e.target.value }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Teléfono *</label>
                  <input type="tel" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Ciudad</label>
                  <input type="text" value={form.ciudad || ""} onChange={(e) => setForm((p) => ({ ...p, ciudad: e.target.value }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-2">Plan de suscripción</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["basico", "profesional", "ilimitado"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePlanChange(p)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer whitespace-nowrap ${form.plan === p ? "border-amber-400 bg-amber-50 text-amber-700" : "border-stone-200 text-stone-600 hover:border-stone-300"}`}
                    >
                      {PLAN_INFO[p].label}<br />
                      <span className="font-bold">{PLAN_INFO[p].precio}€/mes</span><br />
                      <span className="text-emerald-600">{PLAN_INFO[p].mesesGratis === 1 ? "1 mes gratis" : `${PLAN_INFO[p].mesesGratis}m gratis`}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Estado</label>
                <select value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as Inmobiliaria["estado"] }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 cursor-pointer">
                  <option value="pendiente">Pendiente</option>
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Fecha inicio</label>
                  <input type="date" value={form.fecha_inicio || ""} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value || null }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Próximo pago</label>
                  <input type="date" value={form.fecha_proximo_pago || ""} onChange={(e) => setForm((p) => ({ ...p, fecha_proximo_pago: e.target.value || null }))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Notas internas</label>
                <textarea value={form.notas || ""} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} rows={3} maxLength={500} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none" placeholder="Notas sobre el cliente, acuerdos especiales..."></textarea>
              </div>

              <button
                onClick={guardar}
                disabled={saving || !form.nombre_inmobiliaria || !form.email || !form.telefono}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><i className="ri-loader-4-line animate-spin"></i> Guardando...</> : <><i className="ri-save-line"></i> {editId ? "Guardar cambios" : "Crear inmobiliaria"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
