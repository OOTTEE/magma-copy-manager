import { useState, useEffect } from 'react';
import { useReportStore } from '../../../store/reportStore';
import { ReportTable } from '../components/ReportTable';
import { ReportCard } from '../components/ReportCard';
import { ChargeModal } from '../components/ChargeModal';
import { useUserEnrichment } from '../hooks/useUserEnrichment';
import { api } from '../../../services/api';
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

interface SimulationResult {
    userId: string;
    username: string;
    period: { from: string; to: string };
    lines: Array<{ concept: string; quantity: number }>;
}

/**
 * MonthlyReportPage Component
 *
 * Main view for monitoring monthly copy consumption across all users.
 */
export const MonthlyReportPage = () => {
    const { monthlyReport: report, isLoading, isRefreshing, error, fetchMonthlyReport: fetchReport } = useReportStore();
    const { enrichedUsers, enrichUsers } = useUserEnrichment();
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    // Charge modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
    const [isLoadingSimulation, setIsLoadingSimulation] = useState(false);
    const [isCharging, setIsCharging] = useState(false);
    const [chargeError, setChargeError] = useState<string | null>(null);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Trigger enrichment when report data changes
    useEffect(() => {
        if (report?.data && report.data.length > 0) {
            const ids = report.data.map((u: any) => u.id);
            enrichUsers(ids);
        }
    }, [report?.data, enrichUsers]);

    const handleOpenCharge = async (userId: string) => {
        setSelectedUserId(userId);
        setSimulationData(null);
        setChargeError(null);
        setIsModalOpen(true);
        setIsLoadingSimulation(true);

        try {
            const { data, error } = await api.GET('/api/v1/billing/simulations/users/{id}', {
                params: { path: { id: userId } }
            });
            if (error) throw new Error((error as any).message || 'Error al calcular el consumo.');
            setSimulationData(data as SimulationResult);
        } catch (err: any) {
            setChargeError(err.message || 'No se pudo obtener el resumen de facturación.');
        } finally {
            setIsLoadingSimulation(false);
        }
    };

    const handleConfirmCharge = async () => {
        if (!selectedUserId) return;
        setIsCharging(true);
        setChargeError(null);

        try {
            const { error } = await api.POST('/api/v1/billing/sync' as any, {
                body: { userId: selectedUserId }
            });
            if (error) {
                const msg = (error as any).message || (error as any).error || 'Error desconocido durante el cobro.';
                throw new Error(msg);
            }
            handleCloseModal();
            fetchReport(true);
        } catch (err: any) {
            setChargeError(err.message || 'Error técnico al cobrar en Nexudus.');
        } finally {
            setIsCharging(false);
        }
    };

    const handleCloseModal = () => {
        if (isCharging) return;
        setIsModalOpen(false);
        setSelectedUserId(null);
        setSimulationData(null);
        setChargeError(null);
        setIsLoadingSimulation(false);
    };

    const totalA4 = report?.data.reduce((acc, curr) => acc + curr.a4Bw + curr.a4Color, 0) || 0;
    const totalA3 = report?.data.reduce((acc, curr) => acc + curr.a3Bw + curr.a3Color, 0) || 0;
    const grandTotal = report?.data.reduce((acc, curr) => acc + curr.total, 0) || 0;

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '---';
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
                        <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] mt-1 text-slate-400 dark:text-white/30">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" />
                                Periodo: {formatDate(report?.period.from)} — {formatDate(report?.period.to)}
                            </div>

                            {isRefreshing && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full animate-in fade-in zoom-in duration-300">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span className="text-[10px] font-black">Sincronizando</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-3 rounded-2xl transition-all ${viewMode === 'table' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 dark:text-white/20 hover:text-indigo-500'}`}
                    >
                        <TableIcon size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`p-3 rounded-2xl transition-all ${viewMode === 'cards' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 dark:text-white/20 hover:text-indigo-500'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-white/5 mx-1" />
                    <button
                        onClick={() => fetchReport(true)}
                        disabled={isLoading}
                        className="p-3 text-slate-400 dark:text-white/20 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
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
                    <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">
                        Agregando Registros Mensuales...
                    </p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 p-10 bg-red-500/5 rounded-[3rem] border border-red-500/10 text-center">
                    <AlertCircle size={48} className="text-red-500/40 mb-4" />
                    <h3 className="text-xl font-bold text-red-500 mb-2">Error en el Reporte</h3>
                    <p className="text-slate-400 dark:text-white/20 font-medium max-w-sm mb-8">{error}</p>
                    <button
                        onClick={() => fetchReport(true)}
                        className="px-8 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {viewMode === 'table' ? (
                        <ReportTable
                            data={report?.data || []}
                            onCharge={handleOpenCharge}
                            enrichedUsers={enrichedUsers}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {report?.data.map((item: any) => (
                                <ReportCard
                                    key={item.id}
                                    item={item}
                                    onCharge={handleOpenCharge}
                                    enrichedUser={enrichedUsers[item.id]}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Charge Confirmation Modal */}
            <ChargeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmCharge}
                data={simulationData}
                isLoadingData={isLoadingSimulation}
                isCharging={isCharging}
                error={chargeError}
            />
        </div>
    );
};

// Activity icon for footer
const Activity = ({ size, className }: { size: number; className?: string }) => (
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
