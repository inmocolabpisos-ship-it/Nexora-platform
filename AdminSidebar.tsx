interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  isMaster?: boolean;
}

const allMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: "ri-dashboard-line" },
  { id: "reservas", label: "Reservas", icon: "ri-calendar-check-line" },
  { id: "barcos-reservas", label: "Reservas Barcos", icon: "ri-ship-line" },
  { id: "hostales-reservas", label: "Reservas Hostales", icon: "ri-building-2-line" },
  { id: "camping-reservas", label: "Reservas Camping", icon: "ri-tent-line" },
  { id: "clientes", label: "Clientes", icon: "ri-user-line" },
  { id: "propietarios", label: "Propietarios", icon: "ri-home-4-line" },
  { id: "propiedades", label: "Propiedades", icon: "ri-building-line" },
  { id: "comisiones", label: "Comisiones", icon: "ri-percent-line" },
  { id: "descuentos", label: "Descuentos clientes", icon: "ri-coupon-line" },
  { id: "calendario", label: "Calendario", icon: "ri-calendar-line" },
  { id: "verificacion", label: "Verificación", icon: "ri-shield-check-line" },
  { id: "liquidaciones", label: "Liquidaciones", icon: "ri-money-euro-circle-line" },
  { id: "finanzas", label: "Finanzas", icon: "ri-pie-chart-2-line" },
  { id: "inmobiliarias", label: "Inmobiliarias", icon: "ri-building-2-line" },
  { id: "pagos-bizum", label: "Pagos Bizum", icon: "ri-smartphone-line" },
  { id: "justificantes", label: "Justificantes pago", icon: "ri-file-upload-line" },
  { id: "chat", label: "Chat", icon: "ri-chat-3-line" },
  { id: "mis-qr", label: "Mis QR de pago", icon: "ri-qr-code-line" },
  { id: "gestion-admins", label: "Gestión admins", icon: "ri-team-line", masterOnly: true },
];

export default function AdminSidebar({ activeSection, onSectionChange, onLogout, userName, userEmail, userAvatar, isMaster }: AdminSidebarProps) {
  const menuItems = isMaster ? allMenuItems : allMenuItems.filter((item) => !item.masterOnly);
  return (
    <aside className="w-64 bg-stone-900 min-h-screen flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-stone-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500 text-white flex-shrink-0">
            <i className="ri-shield-keyhole-line text-base"></i>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">NEXURA Admin</div>
            <div className="text-stone-400 text-xs">Panel de control</div>
          </div>
        </div>
      </div>

      {/* User info */}
      {(userName || userEmail) && (
        <div className="px-4 py-4 border-b border-stone-700">
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-stone-600" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0">
                <i className="ri-user-line text-stone-400 text-base"></i>
              </div>
            )}
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">{userName}</div>
              <div className="text-stone-400 text-xs truncate">{userEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isMaster ? "bg-amber-400" : "bg-emerald-400"}`}></div>
            <span className={`text-xs ${isMaster ? "text-amber-400 font-semibold" : "text-emerald-400"}`}>
              {isMaster ? "Admin Master" : "Administrador verificado"}
            </span>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap text-left ${
              activeSection === item.id
                ? "bg-amber-500 text-white"
                : "text-stone-400 hover:bg-stone-800 hover:text-white"
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className={`${item.icon} text-base`}></i>
            </div>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-stone-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-white transition-all cursor-pointer whitespace-nowrap"
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <i className="ri-logout-box-line text-base"></i>
          </div>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
