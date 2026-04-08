import { useEffect, useState } from 'react';
import { YTDExpenseChart } from './widgets/YTDExpenseChart';
import { StatCards } from './widgets/StatCards';
import { RecentInvoicesWidget } from './widgets/RecentInvoicesWidget';
import { api } from '../../../services/api';
import { Activity, Loader2 } from 'lucide-react';

export const CustomerDashboardView = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
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
            </div>
        </div>
    );
};
