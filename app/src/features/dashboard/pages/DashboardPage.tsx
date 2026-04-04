import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

/**
 * DashboardPage Component
 * 
 * Main entry point for the authenticated user experience.
 * Displays a welcome message and quick actions.
 */
export const DashboardPage = () => {
    return (
        <div className="space-y-6">
            <div className="p-10 bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10 transition-all">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-[#f15a24]/10 text-[#f15a24] shrink-0">
                        <BarChart3 size={24} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-tight">
                        ¡Bienvenido al Panel de Magma!
                    </h1>
                </div>
                
                <p className="mt-4 text-slate-500 dark:text-white/40 max-w-2xl leading-relaxed font-medium">
                    Desde aquí podrás gestionar el conteo de copias de tus clientes, 
                    generar reportes mensuales de facturación y sincronizar datos con Nexudus de forma automática.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                    <button className="px-8 py-4 bg-[#f15a24] text-white rounded-2xl font-bold shadow-lg shadow-[#f15a24]/30 hover:scale-105 active:scale-95 transition-all">
                        Nueva Sincronización
                    </button>
                    <Link 
                        to="/reports" 
                        className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-center min-w-[160px]"
                    >
                        Ver Reportes
                    </Link>
                </div>
            </div>

            {/* Quick Stats Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className="h-48 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 animate-pulse flex items-center justify-center"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/20">
                            Cargando métrica...
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
