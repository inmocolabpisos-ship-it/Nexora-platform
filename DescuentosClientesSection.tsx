import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { DbMember } from "@/lib/supabase";

type TipoDescuento = "vida" | "6_meses" | "1_ano" | "2_anos" | "3_anos";

interface DescuentoCliente {
  id: string;
  member_id: string;
  member_nombre: string;
  member_email: string;
  tipo_descuento: TipoDescuento;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  notas: string;
  created_at: string;
}

const TIPO_LABELS: Record<TipoDescuento, { label: string; icon: string; color: string }> = {
  vida: { label: "Comisión cero por vida", icon: "ri-infinity-line", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "6_meses": { label: "Comisión cero 6 meses", icon: "ri-calendar-line", color: "bg-amber-100 text-amber-700 border-amber-200" },
  "1_ano": { label: "Comisión cero 1 año", icon: "ri-calendar-2-line", color: "bg-stone-100 text-stone-700 border-stone-200" },
  "2_anos": { label: "Comisión cero 2 años", icon: "ri-calendar-2-line", color: "bg-stone-100 text-stone-700 border-stone-200" },
  "3_anos": { label: "Comisión cero 3 años", icon: "ri-calendar-2-line", color: "bg-stone-100 text-stone-700 border-stone-200" },
};

const calcFechaFin = (inicio: string, tipo: TipoDescuento): string | null => {
  if (tipo === "vida") return null;
  const d = new Date(inicio);
  if (tipo === "6_meses") d.setMonth(d.getMonth() + 6);
  else if (tipo === "1_ano") d.setFullYear(d.getFullYear() + 1);
  else if (tipo === "2_anos") d.setFullYear(d.getFullYear() + 2);
  else if (tipo === "3_anos") d.setFullYear(d.getFullYear() + 3);
  return d.toISOString().split("T")[0];
};

const isVigente = (d: DescuentoCliente): boolean => {
  if (!d.activo) return false;
  if (!d.fecha_fin) return true;
  return new Date(d.fecha_fin) >= new Date();
};

export default function DescuentosClientesSection() {
  const [descuentos, setDescuentos] = useState<DescuentoCliente[]>([]);
  const [clientes, setClientes] = useState<DbMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterActivo, setFilterActivo] = useState<"todos" | "activos" | "expirados">("todos");
  const [searchCliente, setSearchCliente] = useState("");
  const [form, setForm] = useState<{
    member_id: string;
    tipo_descuento: TipoDescuento;
    fecha_inicio: string;
    notas: string;
  }>({
    member_id: "",
    tipo_descuento: "vida",
    fecha_inicio: new Date().toISOString().split("T")[0],
    notas: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [descRes, clientesRes] = await Promise.all([
      supabase
        .from("commissions")
        .select("*")
        .eq("tipo", "descuento_cliente")
        .order("created_at", { ascending: false }),
      supabase
        .from("members")
        .select("id, nombre, apellidos, email, tipo")
        .eq("tipo", "huesped")
        .order("nombre"),
    ]);

    if (descRes.data) {
      setDescuentos(
        descRes.data.map((r) => ({
          id: r.id,
          member_id: r.target_id || "",
          member_nombre: r.target_nombre || "",
          member_email: r.notas?.split("|email:")?.[1]?.trim() || "",
          tipo_descuento: (r.duracion as TipoDescuento) || "vida",
          fecha_inicio: r.fecha_inicio || "",
          fecha_fin: r.fecha_fin || null,
          activo: r.activa,
          notas: r.notas?.split("|email:")?.[0]?.trim() || "",
          created_at: r.created_at,
        }))
      );
    }
    if (clientesRes.data) setClientes(clientesRes.data as DbMember[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.member_id) return;
    setSaving(true);
    const cliente = clientes.find((c) => c.id === form.member_id);
    const fechaFin = calcFechaFin(form.fecha_inicio, form.tipo_descuento);
    const { data, error } = await supabase
      .from("commissions")
      .insert({
        tipo: "descuento_cliente",
        target_id: form.member_id,
        target_nombre: cliente ? `${cliente.nombre} ${cliente.apellidos}` : "",
        target_tipo: "huesped",
        porcentaje: 0,
        duracion: form.tipo_descuento,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: fechaFin,
        activa: true,
        notas: `${form.notas}|email:${cliente?.email || ""}`,
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      setDescuentos((prev) => [
        {
          id: data.id,
          member_id: data.target_id || "",
          member_nombre: data.target_nombre || "",
          member_email: cliente?.email || "",
          tipo_descuento: data.duracion as TipoDescuento,
          fecha_inicio: data.fecha_inicio || "",
          fecha_fin: data.fecha_fin || null,
          activo: data.activa,
          notas: form.notas,
          created_at: data.created_at,
        },
        ...prev,
      ]);
      setShowModal(false);
      setForm({
        member_id: "",
        tipo_descuento: "vida",
        fecha_inicio: new Date().toISOString().split("T")[0],
        notas: "",
      });
    }
    setSaving(false);
  };

  const toggleActivo = async (id: string, current: boolean) => {
    await supabase
      .from("commissions")
      .update({ activa: !current, updated_at: new Date().toISOString() })
      .eq("id", id);
    setDescuentos((prev) => prev.map((d) => d.id === id ? { ...d, activo: !current } : d));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("commissions").update({ activa: false }).eq("id", id);
    setDescuentos((prev) => prev.filter((d) => d.id !== id));
  };

  const filtered = descuentos.filter((d) => {
    const matchFilter =
      filterActivo === "todos" ||
      (filterActivo === "activos" && isVigente(d)) ||
      (filterActivo === "expirados" && !isVigente(d));
    return matchFilter;
  });

  const vigentes = descuentos.filter(isVigente).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Descuentos de comisión — Clientes</h2>
          <p className="text-stone-500 text-sm">Gestiona los descuentos de comisión cero para tus clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line"></i> Nuevo descuento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total descuentos", value: descuentos.length, icon: "ri-coupon-line", color: "bg-stone-100 text-stone-600" },
          { label: "Vigentes", value: vigentes, icon: "ri-check-double-line", color: "bg-emerald-100 text-emerald-600" },
          { label: "Por vida", value: descuentos.filter((d) => d.tipo_descuento === "vida" && d.activo).length, icon: "ri-infinity-line", color: "bg-amber-100 text-amber-600" },
          { label: "Expirados/inactivos", value: descuentos.filter((d) => !isVigente(d)).length, icon: "ri-time-line", color: "bg-red-100 text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-stone-100 p-4">
            <div className={`w-9 h-9 flex items-center justify-center rounded-xl mb-3 ${stat.color}`}>
              <i className={stat.icon}></i>
            </div>
            <div className="text-2xl font-bold text-stone-900">{stat.value}</div>
            <div className="text-stone-500 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-200 text-stone-600 flex-shrink-0">
          <i className="ri-information-line text-sm"></i>
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">¿Cómo funcionan los descuentos de comisión cero?</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Al asignar un descuento de comisión cero a un cliente, ese cliente no pagará la comisión del 15% de la plataforma durante el período indicado.
            Solo tú como administrador puedes crear, activar o desactivar estos descuentos.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-white border border-stone-200 rounded-full p-1 gap-1">
          {(["todos", "activos", "expirados"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActivo(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filterActivo === f ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"}`}
            >
              {f === "todos" ? "Todos" : f === "activos" ? "Vigentes" : "Expirados"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchCliente}
            onChange={(e) => setSearchCliente(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-full text-sm bg-white focus:outline-none focus:border-stone-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            <i className="ri-loader-4-line animate-spin text-2xl mb-2 block"></i>
            Cargando descuentos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-stone-100 mx-auto mb-3">
              <i className="ri-coupon-line text-2xl"></i>
            </div>
            <p className="font-medium text-stone-600">No hay descuentos</p>
            <p className="text-xs mt-1">Crea el primer descuento de comisión cero para un cliente</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered
              .filter((d) =>
                searchCliente === "" ||
                d.member_nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
                d.member_email.toLowerCase().includes(searchCliente.toLowerCase())
              )
              .map((d) => {
                const tipoInfo = TIPO_LABELS[d.tipo_descuento];
                const vigente = isVigente(d);
                return (
                  <div key={d.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 ${vigente ? "bg-emerald-100 text-emerald-600" : "bg-stone-100 text-stone-400"}`}>
                        <i className="ri-user-line"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-stone-900 truncate">{d.member_nombre}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${tipoInfo.color}`}>
                            <i className={tipoInfo.icon}></i>
                            {tipoInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-stone-400">{d.member_email}</span>
                          <span className="text-xs text-stone-400">
                            Desde {new Date(d.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                            {d.fecha_fin ? ` · hasta ${new Date(d.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}` : " · sin caducidad"}
                          </span>
                          {!vigente && (
                            <span className="text-xs text-red-400 font-medium">
                              {!d.activo ? "Desactivado" : "Expirado"}
                            </span>
                          )}
                        </div>
                        {d.notas && <p className="text-xs text-stone-400 italic mt-0.5">{d.notas}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`text-lg font-bold ${vigente ? "text-emerald-600" : "text-stone-400"}`}>0%</div>
                      <button
                        onClick={() => toggleActivo(d.id, d.activo)}
                        title={d.activo ? "Desactivar" : "Activar"}
                        className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors ${d.activo ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-stone-100 text-stone-400 hover:bg-stone-200"}`}
                      >
                        <i className={d.activo ? "ri-toggle-fill" : "ri-toggle-line"}></i>
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        title="Eliminar"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 cursor-pointer transition-colors"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900">Nuevo descuento de comisión cero</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Cliente</label>
                <select
                  value={form.member_id}
                  onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 cursor-pointer"
                >
                  <option value="">Selecciona un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellidos} — {c.email}
                    </option>
                  ))}
                </select>
                {clientes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    <i className="ri-information-line mr-1"></i>
                    No hay clientes registrados aún.
                  </p>
                )}
              </div>

              {/* Tipo de descuento */}
              <div>
                <label className="text-xs text-stone-500 mb-2 block">Tipo de descuento</label>
                <div className="space-y-2">
                  {(Object.entries(TIPO_LABELS) as [TipoDescuento, typeof TIPO_LABELS[TipoDescuento]][]).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, tipo_descuento: key })}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${form.tipo_descuento === key ? "border-stone-900 bg-stone-50" : "border-stone-200 hover:border-stone-300"}`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${info.color}`}>
                        <i className={info.icon}></i>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-stone-800">{info.label}</span>
                        {key !== "vida" && (
                          <span className="text-xs text-stone-400 ml-2">
                            · hasta {calcFechaFin(form.fecha_inicio, key) ? new Date(calcFechaFin(form.fecha_inicio, key)!).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </span>
                        )}
                      </div>
                      {form.tipo_descuento === key && (
                        <i className="ri-check-line text-stone-900 flex-shrink-0"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha inicio */}
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Fecha de inicio</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50 cursor-pointer"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Notas (opcional)</label>
                <input
                  type="text"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Motivo del descuento..."
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 bg-stone-50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !form.member_id}
                className="flex-1 bg-stone-900 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Crear descuento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
