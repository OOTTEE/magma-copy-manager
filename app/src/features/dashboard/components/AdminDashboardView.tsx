import { 
    AlertTriangle, 
    ArrowRight, 
    RefreshCcw, 
    CreditCard, 
    History,
    CheckCircle2,
    XCircle,
    Info,
    TrendingUp
} from 'lucide-react';
import { useSystemStore } from '../../../store/systemStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from './widgets/NotificationCenter';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

/**
 * AdminDashboardView
 * 
 * The main "Orchestrator" view for administrators.
 * Redesigned for active management and clear operational transparency.
 */
export const AdminDashboardView = () => {
    const navigate = useNavigate();
    const { 
        autoSyncError, 
        stats, 
        activity, 
        isSyncing,
        isBilling,
        fetchDashboardData,
        triggerManualSync,
        triggerManualBilling
    } = useSystemStore();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <NotificationCenter />
            {/* 1. Critical Alerts */}
            {autoSyncError && (
                <div 
                    onClick={() => navigate('/settings')}
                    className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center justify-between cursor-pointer group hover:bg-red-500/15 transition-all shadow-xl shadow-red-500/5"
                >
                        <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/30">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-500 tracking-tight">
                                Error en Sincronización Automática
                            </h3>
                            <p className="text-sm text-red-500/70 font-medium">
                                {autoSyncError}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-red-500 font-bold group-hover:translate-x-2 transition-transform">
                        <span>Configurar</span>
                        <ArrowRight size={18} />
                    </div>
                </div>
            )}

            {/* 2. Top Action Orchestrator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sync Card */}
                <div className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl overflow-hidden hover:border-indigo-500/30 transition-all duration-500 shadow-2xl shadow-slate-200 dark:shadow-indigo-500/5">
                    <div className="absolute top-0 right-0 p-12 bg-indigo-500/10 rounded-full -mr-6 -mt-6 blur-3xl group-hover:bg-indigo-500/20 transition-all" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl shadow-inner shadow-indigo-500/10">
                                <RefreshCcw size={28} className={isSyncing ? "animate-spin" : ""} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Manual Sync</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Sincronización de Conteo</p>
                            </div>
                        </div>
                        
                        <p className="text-slate-600 dark:text-white/60 mb-8 leading-relaxed font-medium">
                            Descarga los últimos conteos de copias directamente desde el servidor de impresión para actualizar los registros locales.
                        </p>

                        <button 
                            onClick={triggerManualSync}
                            disabled={isSyncing || isBilling}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-500/60 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
                            {isSyncing ? "Sincronizando..." : "Ejecutar Sincronización Ahora"}
                        </button>
                    </div>
                </div>

                {/* Billing Card */}
                <div className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl overflow-hidden hover:border-[#f15a24]/30 transition-all duration-500 shadow-2xl shadow-slate-200 dark:shadow-[#f15a24]/5">
                    <div className="absolute top-0 right-0 p-12 bg-[#f15a24]/10 rounded-full -mr-6 -mt-6 blur-3xl group-hover:bg-[#f15a24]/20 transition-all" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-[#f15a24]/20 text-[#f15a24] rounded-2xl shadow-inner shadow-[#f15a24]/10">
                                {isBilling ? <RefreshCcw size={28} className="animate-spin" /> : <CreditCard size={28} />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Process Billing</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Sincronización Nexudus</p>
                            </div>
                        </div>
                        
                        <p className="text-slate-600 dark:text-white/60 mb-8 leading-relaxed font-medium">
                            Procesa el cobro de copias para todos los usuarios con registros pendientes en el ciclo actual de facturación.
                        </p>

                        <button 
                            onClick={triggerManualBilling}
                            disabled={isSyncing || isBilling}
                            className="w-full py-4 bg-[#f15a24] hover:bg-[#d84a1a] disabled:opacity-50 text-white font-bold rounded-2xl shadow-2xl shadow-[#f15a24]/40 hover:shadow-[#f15a24]/60 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isBilling ? <RefreshCcw size={18} className="animate-spin" /> : <CreditCard size={18} />}
                            {isBilling ? "Procesando..." : "Cobrar Pendientes Ahora"}
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Main Analytics & Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Historical Chart */}
                <div className="xl:col-span-2 p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-2xl shadow-slate-200 dark:shadow-indigo-500/5 group hover:border-indigo-500/20 transition-colors">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <TrendingUp className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Volumen Histórico de Copias</h3>
                        </div>
                        <span className="px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-md text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30 border border-slate-200 dark:border-white/5">
                            Últimos 6 meses
                        </span>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="#ffffff20" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dy={15}
                                    style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                />
                                <YAxis 
                                    stroke="#ffffff10" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dx={-10}
                                />
                                <Tooltip 
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(30, 27, 75, 0.8)', 
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '1rem',
                                        boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.25)'
                                    }}
                                    itemStyle={{ color: '#818cf8', fontWeight: 800 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#818cf8" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorTotal)" 
                                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff', opacity: 0 }}
                                    activeDot={{ r: 6, fill: '#fff', strokeWidth: 3, stroke: '#6366f1' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex flex-col shadow-2xl shadow-slate-200 dark:shadow-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                            <History className="text-slate-500 dark:text-white/60" size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Actividad Reciente</h3>
                    </div>

                    <div className="space-y-6 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                        {activity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-white/10">
                                <Info size={40} className="mb-3 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-[0.2em] italic">Sin registros</p>
                            </div>
                        ) : (
                            activity.map((event) => (
                                <div key={event.id} className="relative pl-8 pb-4 border-l border-white/5 last:border-0 group">
                                    <div className={`absolute left-[-9px] top-0 p-1.5 rounded-full z-10 transition-transform group-hover:scale-125 shadow-lg ${
                                        event.status === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                                        event.status === 'failed' ? 'bg-red-500 shadow-red-500/20' : 'bg-amber-500 shadow-amber-500/20'
                                    }`}>
                                        {event.status === 'success' ? <CheckCircle2 size={12} className="text-white" /> : 
                                         event.status === 'failed' ? <XCircle size={12} className="text-white" /> :
                                         <Info size={12} className="text-white" />}
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">
                                                {new Date(event.datetime).toLocaleString('es-ES', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit',
                                                    day: '2-digit',
                                                    month: 'short'
                                                })}
                                            </span>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.15em] border ${
                                                event.type === 'sync' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/10' : 'bg-[#f15a24]/10 text-[#f15a24] border-[#f15a24]/10'
                                            }`}>
                                                {event.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-white/80 font-medium leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            {event.message}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
