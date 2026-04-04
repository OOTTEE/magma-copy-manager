import { useUIStore } from "../../store/uiStore";
import { useLocation } from "react-router-dom";
import { Sun, Moon, Bell } from "lucide-react";

/**
 * Header Component
 * 
 * Top navigation bar with dynamic title and dark mode toggle.
 */
export const Header = () => {
    const { toggleDarkMode, isDarkMode } = useUIStore();
    const location = useLocation();

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
        <header className="h-20 px-8 flex items-center justify-between bg-white dark:bg-[#1a1818] border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
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
                {/* Notifications (Mock) */}
                <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:text-white/20 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                    <Bell size={20} strokeWidth={1.5} />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="flex items-center gap-3 p-1.5 pr-4 pl-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all group"
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
