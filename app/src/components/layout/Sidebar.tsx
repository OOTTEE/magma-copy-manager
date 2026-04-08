import { NavLink } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/authStore";
import { BrandLogo } from "../BrandLogo";
import { 
  BarChart, 
  Users, 
  Settings, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { path: "/users", label: "Usuarios", icon: Users, adminOnly: true },
  { path: "/sync-history", label: "Ventas", icon: Zap, adminOnly: true },
  { path: "/reports", label: "Reporte Mensual", icon: BarChart, adminOnly: true },
  { path: "/settings", label: "Ajustes", icon: Settings, adminOnly: true },
];

/**
 * Sidebar Component
 * 
 * Always dark (#221f1f) with orange Magma accents (#f15a24).
 * Collapsible state managed via useUIStore.
 */
export const Sidebar = () => {
  const { isSidebarCollapsed, toggleSidebar, version } = useUIStore();
  const { logout, user, role } = useAuthStore();

  const filteredNavItems = NAV_ITEMS.filter(item => !item.adminOnly || role === 'admin');

  return (
    <aside
      className={`
        relative h-screen bg-[#221f1f] text-white flex flex-col pt-8 transition-all duration-300 ease-in-out border-r border-white/5 z-40
        ${isSidebarCollapsed ? "w-20" : "w-72"}
      `}
    >
      {/* Brand & Toggle Section */}
      <div className={`px-6 mb-12 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
        <BrandLogo showText={!isSidebarCollapsed} className="h-10 text-white" />
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200
              ${isActive 
                ? "bg-[#f15a24] text-white shadow-lg shadow-[#f15a24]/20" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={22} 
                  strokeWidth={1.5} 
                  className={isActive ? "text-white" : "text-white/40 group-hover:text-[#f15a24] transition-colors"} 
                />
                {!isSidebarCollapsed && (
                  <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-6 px-3 py-2 bg-[#221f1f] text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-2xl">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile Section */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/10">
        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? "justify-center" : "px-2"}`}>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
            {user?.charAt(0).toUpperCase() || "A"}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col flex-1 truncate">
              <span className="text-sm font-bold truncate">{user || "Administrador"}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold truncate">Magma Admin</span>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>
        {isSidebarCollapsed && (
          <button
            onClick={logout}
            className="w-full mt-4 p-3 flex justify-center text-white/20 hover:text-red-400 trasition-colors"
          >
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        )}

        {/* Global Version Info */}
        <div className={`mt-6 flex ${isSidebarCollapsed ? "justify-center" : "px-2 justify-between items-center"}`}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/5 italic">
                {isSidebarCollapsed ? `v${version?.split('.')[0] || '1'}` : `v${version || '1.0.0'}`}
            </span>
            {!isSidebarCollapsed && (
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/5">
                    Magma Core
                </span>
            )}
        </div>
      </div>
    </aside>
  );
};
