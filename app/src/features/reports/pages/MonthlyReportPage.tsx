import { useState, useEffect } from 'react';
import { useReportStore } from '../../../store/reportStore';
import { ReportTable } from '../components/ReportTable';
import { ReportCard } from '../components/ReportCard';
import { ChargeModal } from '../components/ChargeModal';
import { BulkChargeModal } from '../components/BulkChargeModal';
import { useUserEnrichment } from '../hooks/useUserEnrichment';
import { api } from '../../../services/api';
import {
    Loader2,
    AlertCircle,
    ArrowUpRight,
    BarChart3,
    Calendar,
    Table as TableIcon,
    LayoutGrid,
    RefreshCw,
    Settings2,
    Zap
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
    const { 
        monthlyReport: report, 
        isLoading, 
        isRefreshing, 
        error, 
        filters,
        fetchMonthlyReport: fetchReport,
        setFilters
    } = useReportStore();
    const { enrichedUsers, enrichUsers } = useUserEnrichment();
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [showFilters, setShowFilters] = useState(false);

    // Charge modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
    const [isLoadingSimulation, setIsLoadingSimulation] = useState(false);
    const [isCharging, setIsCharging] = useState(false);
    const [chargeError, setChargeError] = useState<string | null>(null);

    // Global Charge Modal state
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isBulkSyncing, setIsBulkSyncing] = useState(false);
    const [bulkResults, setBulkResults] = useState<any[] | null>(null);
    const [bulkError, setBulkError] = useState<string | null>(null);

    const handleBulkSyncConfirm = async () => {
        setIsBulkSyncing(true);
        setBulkError(null);
        try {
            const { data: result, error: apiError } = await api.POST("/api/v1/billing/sync/nexudus" as any, {
                body: filters
            });

            if (apiError) throw apiError;
            setBulkResults((result as any).results || []);
            // Refresh the report to reflect updated sync status
            fetchReport();
        } catch (err: any) {
            console.error("Bulk sync error:", err);
            setBulkError(err.message || "Error during global synchronization");
        } finally {
            setIsBulkSyncing(false);
        }
    };

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
                params: { 
                    path: { id: userId },
                    query: {
                        from: filters.from,
                        to: filters.to,
                        includeAllPending: filters.includeAllPending
                    }
                }
            });
            if (error) throw new Error((error as any).message || 'Error al calcular el consumo.');
            setSimulationData(data as SimulationResult);
        } catch (err: any) {
            setChargeError(err.message || 'No se pudo obtener el resumen de facturación.');
        } finally {
            setIsLoadingSimulation(false);
        }
    };

    const handleConfirmCharge = async (note: string, nexudusAccountId?: string) => {
        if (!selectedUserId) return;
        setIsCharging(true);
        setChargeError(null);

        try {
            const { error } = await api.POST('/api/v1/billing/sync' as any, {
                body: { 
                    userId: selectedUserId,
                    note,
                    nexudusAccountId,
                    from: filters.from,
                    to: filters.to,
                    includeAllPending: filters.includeAllPending
                }
            });
            if (error) {
                const msg = (error as any).message || (error as any).error || 'Error desconocido durante la vinculación.';
                throw new Error(msg);
            }
            handleCloseModal();
            fetchReport(true);
        } catch (err: any) {
            setChargeError(err.message || 'Error técnico al vincular en Nexudus.');
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

    const totalA4 = report?.data.reduce((acc: number, curr: any) => acc + curr.a4Bw + curr.a4Color, 0) || 0;
    const totalA3 = report?.data.reduce((acc: number, curr: any) => acc + curr.a3Bw + curr.a3Color, 0) || 0;
    const grandTotal = report?.data.reduce((acc: number, curr: any) => acc + curr.total, 0) || 0;

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
                                {report?.period.allPending ? (
                                    <span className="text-indigo-500">Todo lo pendiente</span>
                                ) : (
                                    <>Periodo: {formatDate(report?.period.from)} — {formatDate(report?.period.to)}</>
                                )}
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
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-2xl transition-all ${showFilters ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 dark:text-white/20 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        <Settings2 size={20} />
                    </button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-white/5 mx-1" />
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

                    <button
                        onClick={() => {
                            setBulkResults(null);
                            setBulkError(null);
                            setIsBulkModalOpen(true);
                        }}
                        disabled={isLoading || !report || report.data.length === 0}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#f15a24] text-white font-black text-sm transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-[#f15a24]/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        <Zap size={16} />
                        <span>Vincular Todo</span>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="p-6 bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-1">
                                Rango de Fechas
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date"
                                    value={filters.from || ''}
                                    onChange={(e) => setFilters({ from: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                                <span className="text-slate-300 dark:text-white/10">—</span>
                                <input 
                                    type="date"
                                    value={filters.to || ''}
                                    onChange={(e) => setFilters({ to: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] h-[52px]">
                            <div className="flex flex-col">
                                <span className="text-xs font-black dark:text-white uppercase tracking-tighter">Incluir Pendientes</span>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-white/20">Abarca todos los meses anteriores</span>
                            </div>
                            <button
                                onClick={() => setFilters({ includeAllPending: !filters.includeAllPending })}
                                className={`w-12 h-6 rounded-full p-1 transition-all ${filters.includeAllPending ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-white/10'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-all ${filters.includeAllPending ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setFilters({ from: undefined, to: undefined, includeAllPending: false })}
                                className="flex-1 py-3 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        <PulseActivity size={14} className="animate-pulse" />
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

            <BulkChargeModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleBulkSyncConfirm}
                filters={filters}
                results={bulkResults}
                isSyncing={isBulkSyncing}
                error={bulkError}
            />
        </div>
    );
};

// Activity icon for footer
const PulseActivity = ({ size, className }: { size: number; className?: string }) => (
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
