import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  email: string;
  nombre: string | null;
  activo: boolean;
  rol: string;
  created_at: string;
}

export default function AdminUsersSection() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("admin_users")
      .select("id, email, nombre, activo, rol, created_at")
      .order("created_at", { ascending: false });
    if (err) {
      setError("Error al cargar administradores.");
    } else {
      setAdmins(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newEmail.trim()) { setError("El email es obligatorio."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setError("Email no válido."); return; }

    setAddLoading(true);
    const { error: err } = await supabase
      .from("admin_users")
      .upsert({
        email: newEmail.trim().toLowerCase(),
        nombre: newName.trim() || null,
        activo: true,
        rol: "admin",
      }, { onConflict: "email" });

    setAddLoading(false);
    if (err) {
      setError("No se pudo añadir el administrador.");
    } else {
      setSuccess(`¡${newEmail} ahora tiene acceso al panel!`);
      setNewEmail("");
      setNewName("");
      setShowAddForm(false);
      fetchAdmins();
    }
  };

  const toggleAdmin = async (id: string, current: boolean) => {
    setError("");
    setSuccess("");
    const { error: err } = await supabase
      .from("admin_users")
      .update({ activo: !current })
      .eq("id", id);
    if (err) {
      setError("Error al actualizar el estado.");
    } else {
      setSuccess(`Administrador ${!current ? "activado" : "desactivado"}.`);
      fetchAdmins();
    }
  };

  const removeAdmin = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este acceso? El usuario perderá acceso al panel de administración.")) return;
    setError("");
    setSuccess("");
    const { error: err } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id)
      .eq("rol", "admin"); // Proteger master
    if (err) {
      setError("No se pudo eliminar el administrador.");
    } else {
      setSuccess("Administrador eliminado correctamente.");
      fetchAdmins();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Gestión de Administradores</h2>
          <p className="text-stone-500 text-sm mt-1">Añade o quita accesos al panel de control. Solo tú (Master) puedes gestionar esto.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className={showAddForm ? "ri-close-line" : "ri-user-add-line"}></i>
          {showAddForm ? "Cancelar" : "Añadir admin"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Email del nuevo administrador *</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="trabajador@nexura.es"
                required
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Nombre (opcional)</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="María García"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
              />
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addLoading ? <><i className="ri-loader-4-line animate-spin"></i> Añadiendo...</> : <><i className="ri-check-line"></i> Dar acceso</>}
            </button>
          </form>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2 text-sm text-red-600">
          <i className="ri-error-warning-line mt-0.5 flex-shrink-0"></i>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2 text-sm text-emerald-600">
          <i className="ri-checkbox-circle-line mt-0.5 flex-shrink-0"></i>
          <span>{success}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-stone-400">
                    <i className="ri-loader-4-line animate-spin mr-2"></i> Cargando...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-stone-400">
                    No hay administradores registrados.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 text-xs font-bold">
                          {(admin.nombre || admin.email).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-stone-800">{admin.nombre || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-stone-600">{admin.email}</td>
                    <td className="px-5 py-3.5">
                      {admin.rol === "master" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                          <i className="ri-vip-crown-line"></i> Master
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                          <i className="ri-shield-user-line"></i> Admin
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${admin.activo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${admin.activo ? "bg-emerald-500" : "bg-red-400"}`}></div>
                        {admin.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {admin.rol !== "master" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleAdmin(admin.id, admin.activo)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${admin.activo ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                            title={admin.activo ? "Desactivar" : "Activar"}
                          >
                            <i className={admin.activo ? "ri-close-circle-line" : "ri-checkbox-circle-line"}></i>
                          </button>
                          <button
                            onClick={() => removeAdmin(admin.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                            title="Eliminar acceso"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      )}
                      {admin.rol === "master" && (
                        <span className="text-stone-400 text-xs italic">Protegido</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i className="ri-information-line text-amber-600"></i>
        </div>
        <div className="text-sm text-amber-800 leading-relaxed">
          <p className="font-semibold mb-1">¿Cómo funciona?</p>
          <p>Al añadir un email aquí, esa persona podrá iniciar sesión en el panel de administración usando su cuenta de Google o email+contraseña. No necesitas crearles contraseña — ellos usan su propia cuenta de Supabase Auth.</p>
        </div>
      </div>
    </div>
  );
}