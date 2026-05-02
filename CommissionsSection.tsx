import { useState, useEffect } from "react";
import { supabase, DbCommission } from "@/lib/supabase";

const COMMISSION_OPTIONS = [0, 3, 5, 10, 15, 20];
type DurationType = "vida" | "3_meses" | "6_meses" | "1_ano" | "2_anos" | "personalizado";
const durationLabels: Record<DurationType, string> = {
  vida: "Por vida", "3_meses": "3 meses", "6_meses": "6 meses",
  "1_ano": "1 año", "2_anos": "2 años", personalizado: "Personalizado",
};
const DURATION_OPTIONS: DurationType[] = ["vida", "3_meses", "6_meses", "1_ano", "2_anos", "personalizado"];

export default function CommissionsSection() {
  const [commissions, setCommissions] = useState<DbCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [globalAnfitrion, setGlobalAnfitrion] = useState(5);
  const [globalHuesped, setGlobalHuesped] = useState(15);
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [tempAnfitrion, setTempAnfitrion] = useState(5);
  const [tempHuesped, setTempHuesped] = useState(15);
  const [newRule, setNewRule] = useState<Partial<DbCommission>>({
    porcentaje: 5, duracion: "1_ano", target_tipo: "anfitrion",
    activa: true, fecha_inicio: new Date().toISOString().split("T")[0],
  });

  useEffect(() => { fetchCommissions(); }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    const { data } = await supabase.from("commissions").select("*").eq("tipo", "custom").order("created_at", { ascending: false });
    if (data) setCommissions(data as DbCommission[]);
    const { data: globals } = await supabase.from("commissions").select("*").eq("tipo", "global");
    if (globals) {
      const a = globals.find((g) => g.target_tipo === "anfitrion");
      const h = globals.find((g) => g.target_tipo === "huesped");
      if (a) { setGlobalAnfitrion(a.porcentaje); setTempAnfitrion(a.porcentaje); }
      if (h) { setGlobalHuesped(h.porcentaje); setTempHuesped(h.porcentaje); }
    }
    setLoading(false);
  };

  const saveGlobalRates = async () => {
    setSaving(true);
    for (const [tipo, pct] of [["anfitrion", tempAnfitrion], ["huesped", tempHuesped]] as [string, number][]) {
      const { data: existing } = await supabase.from("commissions").select("id").eq("tipo", "global").eq("target_tipo", tipo).maybeSingle();
      if (existing) {
        await supabase.from("commissions").update({ porcentaje: pct, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("commissions").insert({ tipo: "global", target_tipo: tipo, porcentaje: pct, duracion: "vida", activa: true });
      }
    }
    setGlobalAnfitrion(tempAnfitrion);
    setGlobalHuesped(tempHuesped);
    setEditingGlobal(false);
    setSaving(false);
  };

  const calcFechaFin = (inicio: string, duracion: DurationType): string | null => {
    if (duracion === "vida" || duracion === "personalizado") return null;
    const d = new Date(inicio);
    if (duracion === "3_meses") d.setMonth(d.getMonth() + 3);
    else if (duracion === "6_meses") d.setMonth(d.getMonth() + 6);
    else if (duracion === "1_ano") d.setFullYear(d.getFullYear() + 1);
    else if (duracion === "2_anos") d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split("T")[0];
  };

  const handleAddRule = async () => {
    setSaving(true);
    const fechaFin = newRule.duracion !== "personalizado"
      ? calcFechaFin(newRule.fecha_inicio || "", newRule.duracion as DurationType)
      : newRule.fecha_fin || null;
    const rule = {
      tipo: "custom", target_id: null,
      target_nombre: newRule.target_nombre || "",
      target_tipo: newRule.target_tipo || "anfitrion",
      porcentaje: Number(newRule.porcentaje) || 5,
      duracion: newRule.duracion || "1_ano",
      fecha_inicio: newRule.fecha_inicio || new Date().toISOString().split("T")[0],
      fecha_fin: fechaFin, activa: true,
      notas: newRule.notas || "",
    };
    const { data, error } = await supabase.from("commissions").insert(rule).select().maybeSingle();
    if (!error && data) {
      setCommissions((prev) => [data as DbCommission, ...prev]);
      setShowAddModal(false);
      setNewRule({ porcentaje: 5, duracion: "1_ano", target_tipo: "anfitrion", activa: true, fecha_inicio: new Date().toISOString().split("T")[0] });
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("commissions").update({ activa: !current, updated_at: new Date().toISOString() }).eq("id", id);
    setCommissions((prev) => prev.map((c) => c.id === id ? { ...c, activa: !current } : c));
  };

  const deleteRule = async (id: string) => {
    await supabase.from("commissions").update({ activa: false, updated_at: new Date().toISOString() }).eq("id", id);
    setCommissions((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Comisiones</h2>
          <p className="text-stone-500 text-sm">Gestión de tarifas y descuentos personalizados</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-add-line"></i> Nueva regla
        </button>
      </div>

      {/* Bloque política inmobiliarias */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
            <i className="ri-building-2-line text-lg"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-emerald-800 text-sm mb-1">Política de comisiones para Inmobiliarias</h3>
            <p className="text-xs text-emerald-700 leading-relaxed mb-3">
              Las inmobiliarias pagan una cuota mensual fija por su plan (25€ / 50€ / 95€ IVA incluido).
              <strong> No se les cobra el 5% de comisión</strong> que aplica a los anfitriones particulares.
              Solo se cobra el <strong>15% al huésped</strong> como tarifa de servicio de la plataforma.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Comisión anfitrión", value: "0%", desc: "Inmobiliarias exentas", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "ri-building-2-line" },
                { label: "Comisión huésped", value: "15%", desc: "Tarifa de servicio", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "ri-user-line" },
                { label: "Cuota mensual", value: "Fija", desc: "25€ / 50€ / 95€ IVA inc.", color: "bg-stone-100 text-stone-700 border-stone-200", icon: "ri-calendar-line" },
              ].map((item) => (
                <div key={item.label} className={`border rounded-xl p-3 text-center ${item.color}`}>
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white mx-auto mb-2">
                    <i className={`${item.icon} text-sm`}></i>
                  </div>
                  <div className="text-xl font-bold">{item.value}</div>
                  <div className="text-xs font-semibold mt-0.5">{item.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Tarifas globales por defecto</h3>
            <p className="text-stone-400 text-xs mt-0.5">Se aplican a todos los miembros sin regla personalizada (anfitriones particulares)</p>
          </div>
          {!editingGlobal ? (
            <button onClick={() => { setTempAnfitrion(globalAnfitrion); setTempHuesped(globalHuesped); setEditingGlobal(true); }} className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer flex items-center gap-1 border border-stone-200 px-3 py-1.5 rounded-full">
              <i className="ri-edit-line"></i> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditingGlobal(false)} className="text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-full cursor-pointer">Cancelar</button>
              <button onClick={saveGlobalRates} disabled={saving} className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-50">{saving ? "..." : "Guardar"}</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[{ key: "anfitrion", label: "Comisión Anfitrión", icon: "ri-home-4-line", color: "text-amber-600 bg-amber-50 border-amber-200", val: editingGlobal ? tempAnfitrion : globalAnfitrion, set: setTempAnfitrion },
            { key: "huesped", label: "Comisión Huésped", icon: "ri-user-line", color: "text-stone-600 bg-stone-50 border-stone-200", val: editingGlobal ? tempHuesped : globalHuesped, set: setTempHuesped }
          ].map(({ key, label, icon, color, val, set }) => (
            <div key={key} className={`border rounded-xl p-4 ${color}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white"><i className={`${icon} text-sm`}></i></div>
                <span className="text-sm font-medium">{label}</span>
              </div>
              {editingGlobal ? (
                <div className="flex flex-wrap gap-1.5">
                  {COMMISSION_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => set(opt)} className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${val === opt ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"}`}>{opt}%</button>
                  ))}
                </div>
              ) : <div className="text-3xl font-bold">{val}%</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-semibold text-stone-900 text-sm mb-4">Reglas personalizadas ({commissions.length})</h3>
        {loading ? <div className="text-center py-8 text-stone-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl block mb-2"></i>Cargando...</div> : (
          <div className="space-y-3">
            {commissions.map((c) => (
              <div key={c.id} className={`border rounded-xl p-4 transition-all ${c.activa ? "border-stone-100" : "border-stone-100 opacity-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 ${c.target_tipo === "anfitrion" ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-600"}`}>
                      <i className={c.target_tipo === "anfitrion" ? "ri-home-4-line" : "ri-user-line"}></i>
                    </div>
                    <div className="min-w-0">
                      <div className="text-stone-900 font-semibold text-sm truncate">{c.target_nombre}</div>
                      <div className="text-stone-400 text-xs">{c.target_tipo === "anfitrion" ? "Propietario" : "Cliente"} · {durationLabels[c.duracion as DurationType]}{c.fecha_fin ? ` · hasta ${c.fecha_fin}` : " · sin caducidad"}</div>
                      {c.notas && <div className="text-stone-400 text-xs italic mt-0.5">{c.notas}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`text-xl font-bold ${c.porcentaje === 0 ? "text-emerald-600" : "text-stone-900"}`}>{c.porcentaje}%</div>
                    <button onClick={() => toggleActive(c.id, c.activa)} className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors ${c.activa ? "bg-emerald-100 text-emerald-600" : "bg-stone-100 text-stone-400"}`}><i className="ri-toggle-line"></i></button>
                    <button onClick={() => deleteRule(c.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 cursor-pointer transition-colors"><i className="ri-delete-bin-line text-sm"></i></button>
                  </div>
                </div>
              </div>
            ))}
            {commissions.length === 0 && <div className="text-center py-8 text-stone-400 text-sm">No hay reglas personalizadas</div>}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-stone-900">Nueva regla de comisión</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer text-stone-400"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs text-stone-500 mb-1 block">Nombre del miembro</label><input value={newRule.target_nombre || ""} onChange={(e) => setNewRule({ ...newRule, target_nombre: e.target.value })} placeholder="Nombre completo" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50" /></div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Tipo</label>
                <div className="flex bg-stone-50 border border-stone-200 rounded-full p-1 gap-1 w-fit">
                  {(["anfitrion", "huesped"] as const).map((t) => (
                    <button key={t} onClick={() => setNewRule({ ...newRule, target_tipo: t })} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${newRule.target_tipo === t ? "bg-stone-900 text-white" : "text-stone-500"}`}>{t === "anfitrion" ? "Propietario" : "Cliente"}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-2 block">Porcentaje</label>
                <div className="flex flex-wrap gap-2">
                  {COMMISSION_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => setNewRule({ ...newRule, porcentaje: opt })} className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${newRule.porcentaje === opt ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{opt}%</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-2 block">Duración</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button key={d} onClick={() => setNewRule({ ...newRule, duracion: d })} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${newRule.duracion === d ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{durationLabels[d]}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-stone-500 mb-1 block">Fecha inicio</label><input type="date" value={newRule.fecha_inicio || ""} onChange={(e) => setNewRule({ ...newRule, fecha_inicio: e.target.value })} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50 cursor-pointer" /></div>
                {newRule.duracion === "personalizado" && <div><label className="text-xs text-stone-500 mb-1 block">Fecha fin</label><input type="date" value={newRule.fecha_fin || ""} onChange={(e) => setNewRule({ ...newRule, fecha_fin: e.target.value })} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50 cursor-pointer" /></div>}
              </div>
              <div><label className="text-xs text-stone-500 mb-1 block">Notas</label><input value={newRule.notas || ""} onChange={(e) => setNewRule({ ...newRule, notas: e.target.value })} placeholder="Motivo del descuento..." className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-stone-50" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap">Cancelar</button>
              <button onClick={handleAddRule} disabled={saving} className="flex-1 bg-stone-900 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-stone-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50">{saving ? "Guardando..." : "Crear regla"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
