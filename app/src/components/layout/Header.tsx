import { useState } from "react";
import { useUIStore } from "../../store/uiStore";
import { useSystemStore } from "../../store/systemStore";
import { useAuthStore } from "../../store/authStore";
import { useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, Bell, X, AlertCircle } from "lucide-react";

/**
 * Header Component
 * 
 * Top navigation bar with dynamic title and dark mode toggle.
 */
export const Header = () => {
    const { toggleDarkMode, isDarkMode } = useUIStore();
    const { autoSyncError } = useSystemStore();
    const { role } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const isAdmin = role === 'admin';
    const hasError = isAdmin && !!autoSyncError;

    // Map path to section title
    const getPageTitle = (pathname: string) => {
        switch (pathname) {
            case "/dashboard": return "Inicio";
            case "/users": return "Gestión de Usuarios";
            case "/reports": return "Reporte Mensual";
            case "/settings": return "Ajustes del Sistema";
            default: return "Magma Espacio";
        }
    };

    return (
        <header className="h-20 px-8 flex items-center justify-between bg-white dark:bg-[#1a1818] border-b border-slate-200 dark:border-white/5 transition-colors duration-300 relative z-50">
            {/* Title Section */}
            <div className="flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                    {getPageTitle(location.pathname)}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f15a24]" />
                    <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-[0.2em]">
                        Magma Operations
                    </span>
                </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-4">
                {/* Notifications Wrapper */}
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`relative p-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${
                            hasError 
                            ? "text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20" 
                            : "text-slate-400 hover:text-slate-600 dark:text-white/20 dark:hover:text-white bg-slate-100 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                        }`}
                        title="Notificaciones"
                    >
                        <Bell size={20} strokeWidth={hasError ? 2 : 1.5} />
                        {hasError && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1818]" />
                        )}
                    </button>

                    {/* Notifications Dropdown (UX Improvement) */}
                    {showNotifications && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowNotifications(false)} 
                            />
                            <div className="absolute top-full right-0 mt-4 w-80 bg-white/80 dark:bg-[#1a1818]/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-black/20 dark:shadow-indigo-500/10 z-50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">
                                        Notificaciones
                                    </span>
                                    <button 
                                        onClick={() => setShowNotifications(false)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {hasError ? (
                                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 group">
                                            <div className="flex gap-3">
                                                <AlertCircle size={18} className="text-red-500 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                                                        Error de Sincronización
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 dark:text-white/40 mt-1">
                                                        Nexudus no pudo sincronizar las facturas.
                                                    </p>
                                                    <button 
                                                        onClick={() => {
                                                            setShowNotifications(false);
                                                            navigate('/settings');
                                                        }}
                                                        className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
                                                    >
                                                        Ir a Ajustes →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-xs font-medium text-slate-400 dark:text-white/20">
                                                No tienes notificaciones pendientes
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="flex items-center gap-3 p-1.5 pr-4 pl-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                    <div className={`p-2 rounded-xl transition-all ${isDarkMode ? "bg-[#f15a24] text-white shadow-lg shadow-[#f15a24]/30" : "bg-white text-[#f15a24] shadow-sm"}`}>
                        {isDarkMode ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isDarkMode ? "Noche" : "Día"}
                    </span>
                </button>
            </div>
        </header>
    );
};
