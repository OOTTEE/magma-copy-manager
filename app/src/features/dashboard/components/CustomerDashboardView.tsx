import { useEffect, useState } from 'react';
import { YTDExpenseChart } from './widgets/YTDExpenseChart';
import { StatCards } from './widgets/StatCards';
import { RecentInvoicesWidget } from './widgets/RecentInvoicesWidget';
import { api } from '../../../services/api';
import { Activity, Loader2, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DistributionModal } from '../../billing/components/DistributionModal';

export const CustomerDashboardView = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showDistModal, setShowDistModal] = useState(false);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const { data: dashboardData, error } = await api.GET("/api/v1/dashboard/customer", {});
            if (error) throw error;
            setData(dashboardData);
        } catch (e) {
            console.error("Error loading customer dashboard:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 size={48} className="text-indigo-500 animate-spin" />
                <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">Cargando Tablero...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <p className="text-red-500 font-bold">Error loading dashboard data.</p>
            </div>
        );
    }

    console.log(data.pendingConsumption);
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-7xl mx-auto">
            {/* Aesthetic Header Pattern */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <Activity size={32} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                        Mi Consumo
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mt-1">
                        Resumen mensual y facturas recientes
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2">
                    <YTDExpenseChart data={data.ytdMonthlyExpenses} />
                </div>
                
                {/* Stats */}
                <div className="lg:col-span-1">
                    <StatCards currentMonth={data.currentMonthUsage} ytdTotalPages={data.ytdTotal} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <RecentInvoicesWidget invoices={data.recentInvoices} />
                </div>

                <div className="lg:col-span-1">
                    {data.pendingConsumption && data.pendingConsumption.total > 0 ? (
                        <div className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2.5rem] text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                           <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <Zap size={24} />
                                    </div>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">Pendiente</span>
                                </div>
                                <h3 className="text-xl font-black mb-2 tracking-tight">Distribución de Facturación</h3>
                                <p className="text-xs font-bold text-white/70 mb-8 leading-relaxed">
                                    Tienes {data.pendingConsumption.total} copias sin asignar. Repártelas entre tus cuentas Nexudus antes del cierre de mes.
                                </p>
                                <button 
                                    onClick={() => setShowDistModal(true)}
                                    className="mt-auto flex items-center justify-center gap-3 w-full py-4 bg-white text-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95 shadow-lg"
                                >
                                    Configurar Reparto <ArrowRight size={16} />
                                </button>
                           </div>
                           <Zap className="absolute -bottom-10 -left-10 text-white/10 w-40 h-40 -rotate-12" />
                        </div>
                    ) : (
                        <div className="p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10 flex flex-col items-center justify-center text-center group">
                            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl mb-4 group-hover:scale-110 transition-transform">
                                <CheckCircle2 size={32} />
                            </div>
                            <h4 className="text-sm font-black text-slate-700 dark:text-white/80 uppercase tracking-widest mb-2">Todo en Orden</h4>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest leading-loose">
                                No tienes consumos pendientes de asignar en este periodo.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showDistModal && (
                <DistributionModal 
                    userId={data.pendingConsumption?.userId}
                    username={data.pendingConsumption?.username}
                    totalConsumption={data.pendingConsumption}
                    onClose={() => setShowDistModal(false)}
                    onSaveSuccess={fetchDashboard}
                />
            )}
        </div>
    );
};
