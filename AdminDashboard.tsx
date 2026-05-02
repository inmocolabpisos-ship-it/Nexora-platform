import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Stats = {
  totalMembers: number;
  totalAnfitriones: number;
  totalHuespedes: number;
  totalProperties: number;
  activeProperties: number;
  pendingVerification: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
};

type RecentMember = {
  id: string;
  nombre: string;
  apellidos: string;
  tipo: string;
  estado: string;
  created_at: string;
};

type RecentBooking = {
  id: string;
  propiedad_nombre: string | null;
  huesped_nombre: string | null;
  fecha_inicio: string;
  estado: string;
  precio_total: number | null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [membersRes, propertiesRes, bookingsRes] = await Promise.all([
        supabase.from("members").select("id,nombre,apellidos,tipo,estado,created_at").order("created_at", { ascending: false }),
        supabase.from("properties").select("id,estado"),
        supabase.from("bookings").select("id,propiedad_nombre,huesped_nombre,fecha_inicio,estado,precio_total").order("created_at", { ascending: false }),
      ]);

      const members = membersRes.data || [];
      const properties = propertiesRes.data || [];
      const bookings = bookingsRes.data || [];

      const confirmedBookings = bookings.filter((b: { estado: string }) => b.estado === "confirmada");
      const totalRevenue = confirmedBookings.reduce((acc: number, b: { precio_total: number | null }) => acc + (b.precio_total || 0), 0);

      setStats({
        totalMembers: members.length,
        totalAnfitriones: members.filter((m: { tipo: string }) => m.tipo === "propietario").length,
        totalHuespedes: members.filter((m: { tipo: string }) => m.tipo === "cliente").length,
        totalProperties: properties.length,
        activeProperties: properties.filter((p: { estado: string }) => p.estado === "activa").length,
        pendingVerification: members.filter((m: { estado: string }) => m.estado === "pendiente").length,
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: bookings.filter((b: { estado: string }) => b.estado === "pendiente").length,
        totalRevenue,
      });

      setRecentMembers((members as RecentMember[]).slice(0, 5));
      setRecentBookings((bookings as RecentBooking[]).slice(0, 5));
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 mb-1">Dashboard</h2>
          <p className="text-stone-500 text-sm">Cargando datos de la plataforma...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 animate-pulse">
              <div className="w-11 h-11 rounded-xl bg-stone-100 mb-4"></div>
              <div className="h-7 w-16 bg-stone-100 rounded mb-2"></div>
              <div className="h-4 w-32 bg-stone-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Miembros totales", value: stats?.totalMembers ?? 0, icon: "ri-user-line", color: "bg-stone-100 text-stone-600", sub: `${stats?.totalAnfitriones} anfitriones · ${stats?.totalHuespedes} huéspedes` },
    { label: "Propiedades listadas", value: stats?.totalProperties ?? 0, icon: "ri-building-line", color: "bg-amber-100 text-amber-600", sub: `${stats?.activeProperties} activas` },
    { label: "Reservas totales", value: stats?.totalBookings ?? 0, icon: "ri-calendar-check-line", color: "bg-emerald-100 text-emerald-600", sub: `${stats?.confirmedBookings} confirmadas · ${stats?.pendingBookings} pendientes` },
    { label: "Pendientes verificar", value: stats?.pendingVerification ?? 0, icon: "ri-time-line", color: "bg-orange-100 text-orange-600", sub: "Requieren atención" },
    { label: "Ingresos comisiones", value: stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString("es-ES")}€` : "—", icon: "ri-money-euro-circle-line", color: "bg-rose-100 text-rose-600", sub: "De reservas confirmadas" },
    { label: "Propiedades activas", value: stats?.activeProperties ?? 0, icon: "ri-home-4-line", color: "bg-violet-100 text-violet-600", sub: `De ${stats?.totalProperties} registradas` },
  ];

  const estadoColors: Record<string, string> = {
    pendiente: "bg-amber-100 text-amber-700",
    verificado: "bg-emerald-100 text-emerald-700",
    rechazado: "bg-red-100 text-red-700",
    confirmada: "bg-emerald-100 text-emerald-700",
    cancelada: "bg-red-100 text-red-700",
    bloqueada: "bg-stone-100 text-stone-600",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 mb-1">Dashboard</h2>
        <p className="text-stone-500 text-sm">Resumen general de la plataforma StayLux</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 flex items-center justify-center rounded-xl ${s.color}`}>
                <i className={`${s.icon} text-lg`}></i>
              </div>
              <span className="text-xs text-stone-400 text-right max-w-28">{s.sub}</span>
            </div>
            <div className="text-2xl font-bold text-stone-900 mb-0.5">{s.value}</div>
            <div className="text-stone-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos miembros */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">Últimos registros</h3>
            <span className="text-xs text-stone-400">{stats?.totalMembers} total</span>
          </div>
          {recentMembers.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-user-line text-3xl text-stone-300 mb-2"></i>
              <p className="text-stone-400 text-sm">Sin miembros registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 text-stone-700 font-semibold text-sm flex-shrink-0">
                      {m.nombre?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="text-stone-900 text-sm font-medium">{m.nombre} {m.apellidos}</div>
                      <div className="text-stone-400 text-xs capitalize">{m.tipo === "propietario" ? "Anfitrión" : "Huésped"} · {new Date(m.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoColors[m.estado] || "bg-stone-100 text-stone-600"}`}>
                    {m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas reservas */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">Últimas reservas</h3>
            <span className="text-xs text-stone-400">{stats?.totalBookings} total</span>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-calendar-line text-3xl text-stone-300 mb-2"></i>
              <p className="text-stone-400 text-sm">Sin reservas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
                      <i className="ri-calendar-line text-sm"></i>
                    </div>
                    <div>
                      <div className="text-stone-900 text-sm font-medium truncate max-w-36">{b.propiedad_nombre || "Propiedad"}</div>
                      <div className="text-stone-400 text-xs">
                        {b.huesped_nombre && <span>{b.huesped_nombre} · </span>}
                        {new Date(b.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoColors[b.estado] || "bg-stone-100 text-stone-600"}`}>
                      {b.estado.charAt(0).toUpperCase() + b.estado.slice(1)}
                    </span>
                    {b.precio_total && <span className="text-xs font-semibold text-stone-700">{b.precio_total.toLocaleString("es-ES")}€</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {(stats?.pendingVerification ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
            <i className="ri-alert-line text-lg"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {stats?.pendingVerification} {stats?.pendingVerification === 1 ? "miembro pendiente" : "miembros pendientes"} de verificación
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Revisa la sección de Verificación para aprobar o rechazar documentación.</p>
          </div>
        </div>
      )}

      {/* Contadores de oferta lanzamiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Anfitriones — primeros 300 */}
        <div className="bg-gradient-to-br from-amber-50 to-stone-50 border-2 border-amber-300 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-500 text-white flex-shrink-0">
                <i className="ri-vip-crown-line text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Oferta lanzamiento — Anfitriones</h3>
                <p className="text-xs text-stone-500 mt-0.5">Primeros 300 anfitriones con condiciones especiales</p>
              </div>
            </div>
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
              {Math.max(0, 300 - (stats?.totalAnfitriones ?? 0))} plazas libres
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-stone-500 mb-1.5">
              <span className="font-semibold text-stone-700">{stats?.totalAnfitriones ?? 0} anfitriones registrados</span>
              <span>Meta: 300</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, ((stats?.totalAnfitriones ?? 0) / 300) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-amber-600 font-semibold">{((( stats?.totalAnfitriones ?? 0) / 300) * 100).toFixed(1)}% completado</span>
              <span className="text-stone-400">{Math.max(0, 300 - (stats?.totalAnfitriones ?? 0))} restantes</span>
            </div>
          </div>

          {/* Beneficios */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { icon: "ri-percent-line", label: "5% comisión anfitrión" },
              { icon: "ri-star-line", label: "Perfil destacado" },
              { icon: "ri-customer-service-line", label: "Soporte prioritario" },
              { icon: "ri-gift-line", label: "Acceso anticipado" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 bg-white border border-amber-100 rounded-lg px-3 py-2">
                <i className={`${b.icon} text-amber-500 text-sm`}></i>
                <span className="text-xs text-stone-700 font-medium">{b.label}</span>
              </div>
            ))}
          </div>

          {(stats?.totalAnfitriones ?? 0) >= 300 && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
              <i className="ri-check-double-line text-emerald-600"></i>
              <span className="text-xs font-semibold text-emerald-700">Oferta completada — 300 anfitriones alcanzados</span>
            </div>
          )}
        </div>

        {/* Inmobiliarias — primeras 100 */}
        <div className="bg-gradient-to-br from-violet-50 to-stone-50 border-2 border-violet-300 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-violet-600 text-white flex-shrink-0">
                <i className="ri-building-2-line text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Oferta lanzamiento — Inmobiliarias</h3>
                <p className="text-xs text-stone-500 mt-0.5">Primeras 100 inmobiliarias con condiciones especiales</p>
              </div>
            </div>
            <span className="bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
              {Math.max(0, 100 - (stats?.totalAnfitriones ?? 0))} plazas libres
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-stone-500 mb-1.5">
              <span className="font-semibold text-stone-700">Contactos recibidos</span>
              <span>Meta: 100</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, ((stats?.totalAnfitriones ?? 0) / 100) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-violet-600 font-semibold">{Math.min(100, stats?.totalAnfitriones ?? 0)} / 100</span>
              <span className="text-stone-400">{Math.max(0, 100 - (stats?.totalAnfitriones ?? 0))} restantes</span>
            </div>
          </div>

          {/* Info contacto */}
          <div className="bg-white border border-violet-100 rounded-xl p-3 mt-4">
            <p className="text-xs font-semibold text-stone-700 mb-2">Contacto para inmobiliarias:</p>
            <a
              href="https://wa.me/34614976736?text=Hola,%20soy%20una%20inmobiliaria%20y%20quiero%20informaci%C3%B3n%20sobre%20NEXURA"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <i className="ri-whatsapp-line text-base text-emerald-600"></i>
              WhatsApp Business: 614 976 736
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
