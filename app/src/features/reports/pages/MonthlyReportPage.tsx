import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { ReportTable } from '../components/ReportTable';
import { ReportCard } from '../components/ReportCard';
import { 
    LayoutGrid, 
    Table as TableIcon, 
    RefreshCw, 
    Calendar,
    BarChart3,
    Loader2,
    AlertCircle,
    ArrowUpRight
} from 'lucide-react';

/**
 * MonthlyReportPage Component
 * 
 * Main view for monitoring monthly copy consumption across all users.
 * Periods are calculated from 27th to 27th.
 */
export const MonthlyReportPage = () => {
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [report, setReport] = useState<{ period: any, data: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: apiError } = await api.GET("/api/v1/reports/monthly", {});
            if (apiError) throw apiError;
            
            // Sort by total descending to facilitate reading
            const sortedData = (data?.data || []).sort((a: any, b: any) => b.total - a.total);
            setReport({ ...data, data: sortedData } as any);
        } catch (err: any) {
            setError(err.message || "Error al cargar el reporte mensual.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const totalA4 = report?.data.reduce((acc, curr) => acc + curr.a4Bw + curr.a4Color, 0) || 0;
    const totalA3 = report?.data.reduce((acc, curr) => acc + curr.a3Bw + curr.a3Color, 0) || 0;
    const grandTotal = report?.data.reduce((acc, curr) => acc + curr.total, 0) || 0;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "---";
        return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-3xl bg-[#f15a24]/10 text-[#f15a24] border border-[#f15a24]/20">
                        <BarChart3 size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                            Reporte Mensual
                        </h1>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mt-1">
                            <Calendar size={14} className="text-indigo-500" />
                            Periodo: {formatDate(report?.period.from)} — {formatDate(report?.period.to)}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-3 rounded-2xl transition-all ${viewMode === 'table' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 dark:text-white/20 hover:text-indigo-500"}`}
                    >
                        <TableIcon size={20} />
                    </button>
                    <button 
                        onClick={() => setViewMode('cards')}
                        className={`p-3 rounded-2xl transition-all ${viewMode === 'cards' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 dark:text-white/20 hover:text-indigo-500"}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-white/5 mx-1" />
                    <button 
                        onClick={fetchReport}
                        disabled={isLoading}
                        className="p-3 text-slate-400 dark:text-white/20 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* General Stats Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-indigo-500/5">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Consumo A4</p>
                        <ArrowUpRight size={20} className="text-slate-300 dark:text-white/10" />
                    </div>
                    <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{totalA4}</p>
                    <div className="mt-4 h-1.5 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[65%]" />
                    </div>
                </div>
                <div className="p-8 bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-[#f15a24]/5">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Consumo A3</p>
                        <ArrowUpRight size={20} className="text-slate-300 dark:text-white/10" />
                    </div>
                    <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{totalA3}</p>
                    <div className="mt-4 h-1.5 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#f15a24] w-[45%]" />
                    </div>
                </div>
                <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30 text-white overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 relative z-10">Total Periodo</p>
                    <p className="text-6xl font-black tracking-tighter relative z-10">{grandTotal}</p>
                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-white/60 relative z-10">
                        <Activity size={14} className="animate-pulse" />
                        Sincronizado con Magma Cloud
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {isLoading && !report ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 size={48} className="text-indigo-500 animate-spin" />
                    <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">Agregando Registros Mensuales...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 p-10 bg-red-500/5 rounded-[3rem] border border-red-500/10 text-center">
                    <AlertCircle size={48} className="text-red-500/40 mb-4" />
                    <h3 className="text-xl font-bold text-red-500 mb-2">Error en el Reporte</h3>
                    <p className="text-slate-400 dark:text-white/20 font-medium max-w-sm mb-8">{error}</p>
                    <button onClick={fetchReport} className="px-8 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all">
                        Intentar de nuevo
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {viewMode === 'table' ? (
                        <ReportTable data={report?.data || []} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {report?.data.map(item => (
                                <ReportCard key={item.userId} item={item} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Activity icon for footer
const Activity = ({ size, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
