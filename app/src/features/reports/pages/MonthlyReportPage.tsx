import { useState, useEffect } from 'react';
import { useReportStore, type PeriodSummary } from '../../../store/reportStore';
import { PeriodAccordionCard } from '../components/PeriodAccordionCard';
import { ChargeModal } from '../components/ChargeModal';
import { BulkChargeModal, type SyncResult } from '../components/BulkChargeModal';
import { OrphansModal } from '../components/OrphansModal';
import { api } from '../../../services/api';
import {
    Loader2,
    AlertCircle,
    Calendar,
    RefreshCw
} from 'lucide-react';

interface SimulationResult {
    userId: string;
    username: string;
    period: { from: string; to: string; month?: string; allPending?: boolean };
    isClosedPeriod?: boolean;
    targetPeriod?: string;
    lines: Array<{ concept: string; quantity: number }>;
}

/**
 * MonthlyReportPage Component
 *
 * Primary administrative view for managing monthly billing cycles,
 * auditing linked vs pending copy distributions, and syncing to Nexudus.
 */
export const MonthlyReportPage = () => {
    const {
        periods,
        isLoadingPeriods,
        error: storeError,
        expandedPeriods,
        fetchPeriods,
        fetchPeriodReport,
        togglePeriodExpanded
    } = useReportStore();

    // Individual Charge Modal State
    const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null);
    const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
    const [isLoadingSimulation, setIsLoadingSimulation] = useState(false);
    const [isCharging, setIsCharging] = useState(false);
    const [chargeError, setChargeError] = useState<string | null>(null);

    // Period Bulk Sync Modal State
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [syncTargetPeriod, setSyncTargetPeriod] = useState<PeriodSummary | null>(null);
    const [isBulkSyncing, setIsBulkSyncing] = useState(false);
    const [bulkResults, setBulkResults] = useState<SyncResult[] | null>(null);
    const [bulkError, setBulkError] = useState<string | null>(null);

    // Orphans Resolution Modal State
    const [orphansModal, setOrphansModal] = useState<{
        isOpen: boolean;
        period?: string;
        periodName?: string;
    }>({ isOpen: false });

    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    // Handler to open individual user charge
    const handleOpenChargeUser = async (userId: string, period: string) => {
        setSelectedUserId(userId);
        setSelectedPeriodKey(period);
        setSimulationData(null);
        setChargeError(null);
        setIsChargeModalOpen(true);
        setIsLoadingSimulation(true);

        try {
            const { data, error } = await api.GET('/api/v1/billing/simulations/users/{id}', {
                params: {
                    path: { id: userId },
                    query: {
                        period,
                        from: undefined,
                        to: undefined,
                        includeAllPending: false
                    }
                }
            });
            if (error) {
                const apiErr = error as { message?: string };
                throw new Error(apiErr.message || 'Error al calcular el consumo del usuario.');
            }
            setSimulationData(data as unknown as SimulationResult);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'No se pudo obtener el resumen de facturación.';
            setChargeError(msg);
        } finally {
            setIsLoadingSimulation(false);
        }
    };

    // Handler to confirm individual user sync
    const handleConfirmChargeUser = async (note: string, nexudusAccountId?: string) => {
        if (!selectedUserId) return;
        setIsCharging(true);
        setChargeError(null);

        try {
            const { error } = await api.POST('/api/v1/billing/sync', {
                body: {
                    userId: selectedUserId,
                    note,
                    nexudusAccountId,
                    period: selectedPeriodKey || undefined,
                    partial: true
                }
            });

            if (error) {
                const apiErr = error as { message?: string };
                throw new Error(apiErr.message || 'Error al sincronizar el consumo con Nexudus.');
            }

            setIsChargeModalOpen(false);
            // Refresh periods & expanded report
            await fetchPeriods(true);
            if (selectedPeriodKey) {
                await fetchPeriodReport(selectedPeriodKey, true);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al sincronizar el consumo con Nexudus.';
            setChargeError(msg);
        } finally {
            setIsCharging(false);
        }
    };

    // Handler to trigger period bulk sync
    const handleOpenPeriodBulkSync = (period: PeriodSummary) => {
        setSyncTargetPeriod(period);
        setBulkResults(null);
        setBulkError(null);
        setIsBulkModalOpen(true);
    };

    // Handler to confirm period bulk sync
    const handleConfirmBulkSync = async () => {
        if (!syncTargetPeriod) return;
        setIsBulkSyncing(true);
        setBulkError(null);

        try {
            const { data: result, error: apiError } = await api.POST('/api/v1/billing/sync/nexudus', {
                body: {
                    period: syncTargetPeriod.period,
                    from: syncTargetPeriod.from,
                    to: syncTargetPeriod.to,
                    partial: true
                }
            });

            if (apiError) {
                const errObj = apiError as { message?: string };
                throw new Error(errObj.message || 'Error durante la sincronización periódica.');
            }
            setBulkResults((result?.results as unknown as SyncResult[]) || []);

            // Refresh data
            await fetchPeriods(true);
            await fetchPeriodReport(syncTargetPeriod.period, true);
        } catch (err: unknown) {
            console.error('Bulk sync error:', err);
            const msg = err instanceof Error ? err.message : 'Error durante la sincronización periódica.';
            setBulkError(msg);
        } finally {
            setIsBulkSyncing(false);
        }
    };

    // Handler to open orphans modal
    const handleOpenOrphans = (period: string, periodName: string) => {
        setOrphansModal({
            isOpen: true,
            period,
            periodName
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Top Navigation & Executive Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                            Auditoría de Cierre
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                        Reportes Mensuales
                    </h1>
                    <p className="text-slate-500 dark:text-white/40 text-sm font-medium mt-1">
                        Períodos contables agrupados por mes, auditoría de vinculaciones y cobro desatendido a Nexudus.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchPeriods(true)}
                        disabled={isLoadingPeriods}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/10 font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-95"
                    >
                        <RefreshCw size={14} className={isLoadingPeriods ? 'animate-spin text-indigo-500' : ''} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {storeError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3 text-xs font-bold animate-in fade-in">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{storeError}</span>
                </div>
            )}

            {/* Content Area: Vertical Period Accordions */}
            {isLoadingPeriods && periods.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <Loader2 className="animate-spin text-indigo-500" size={36} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                        Cargando períodos contables...
                    </span>
                </div>
            ) : periods.length === 0 ? (
                <div className="p-16 rounded-[2.5rem] bg-white dark:bg-[#1a1818] border border-slate-200 dark:border-white/5 text-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-2">
                        <Calendar size={28} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">
                        No hay períodos registrados
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-white/40 max-w-md mx-auto">
                        Cuando el sistema capture copias de la impresora física o se registren ciclos de facturación, aparecerán aquí agrupados mes por mes.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {periods.map(period => (
                        <PeriodAccordionCard
                            key={period.period}
                            period={period}
                            isExpanded={Boolean(expandedPeriods[period.period])}
                            onToggle={() => togglePeriodExpanded(period.period)}
                            onSyncPeriod={handleOpenPeriodBulkSync}
                            onOpenChargeUser={handleOpenChargeUser}
                            onOpenOrphans={handleOpenOrphans}
                        />
                    ))}
                </div>
            )}

            {/* Individual Coworker Charge Modal */}
            <ChargeModal
                isOpen={isChargeModalOpen}
                onClose={() => setIsChargeModalOpen(false)}
                onConfirm={handleConfirmChargeUser}
                data={simulationData}
                isLoadingData={isLoadingSimulation}
                isCharging={isCharging}
                error={chargeError}
            />

            {/* Period Bulk Sync Modal */}
            <BulkChargeModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleConfirmBulkSync}
                filters={{
                    from: syncTargetPeriod?.from,
                    to: syncTargetPeriod?.to,
                    includeAllPending: false
                }}
                results={bulkResults}
                isSyncing={isBulkSyncing}
                error={bulkError}
            />

            {/* Orphans Resolution Modal */}
            <OrphansModal
                isOpen={orphansModal.isOpen}
                onClose={() => setOrphansModal({ isOpen: false })}
                period={orphansModal.period}
                periodName={orphansModal.periodName}
            />
        </div>
    );
};
