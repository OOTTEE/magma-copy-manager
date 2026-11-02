import React from 'react';
import { X, Zap, AlertTriangle, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface SyncResult {
    userId: string;
    username: string;
    salesCreated: number;
    skipped: number;
    errors: number;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
}

interface BulkChargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    filters: { from?: string; to?: string; includeAllPending: boolean };
    results: SyncResult[] | null;
    isSyncing: boolean;
    error: string | null;
}

export const BulkChargeModal: React.FC<BulkChargeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    filters,
    results,
    isSyncing,
    error
}) => {
    if (!isOpen) return null;

    const totalSuccess = results?.filter(r => r.status === 'success').length ?? 0;
    const totalSkipped = results?.filter(r => r.status === 'skipped').length ?? 0;
    const totalFailed = results?.filter(r => r.status === 'failed').length ?? 0;
    const isCompleted = results !== null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={isSyncing ? undefined : onClose}
            />

            {/* Modal Dialog */}
            <div className="relative z-10 w-full max-w-xl bg-white dark:bg-[#1a1818] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#f15a24]/10 flex items-center justify-center text-[#f15a24]">
                            <Zap size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white">
                                {isCompleted ? 'Resultado de Sincronización' : 'Sincronizar Mes a Nexudus'}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {filters.includeAllPending
                                    ? 'Todas las copias pendientes acumuladas'
                                    : filters.from && filters.to
                                        ? `${filters.from} al ${filters.to}`
                                        : 'Período actual'
                                }
                            </p>
                        </div>
                    </div>
                    {!isSyncing && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3 text-xs font-bold">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* BEFORE SYNC: Confirmation State */}
                    {!isCompleted && !isSyncing && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                    <p className="font-bold">Acción de Facturación Masiva</p>
                                    <p>
                                        Se sincronizarán todas las copias de los usuarios vinculados para este período.
                                        Esta operación creará líneas de cobro en Nexudus para cada usuario con consumo.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60">
                                    <Info size={14} className="text-indigo-500" />
                                    <span>¿Qué ocurrirá a continuación?</span>
                                </div>
                                <ul className="text-xs text-slate-400 dark:text-white/40 space-y-1 list-disc list-inside">
                                    <li>Se calculará el desglose A4/A3 color y B/N de cada usuario.</li>
                                    <li>Se crearán las órdenes de venta en Nexudus.</li>
                                    <li>Los registros de copias sincronizados quedarán marcados como cobrados.</li>
                                    <li>Los usuarios sin cuenta Nexudus serán omitidos automáticamente.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* DURING SYNC: Loading State */}
                    {isSyncing && (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                            <Loader2 size={36} className="animate-spin text-[#f15a24]" />
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-800 dark:text-white">
                                    Sincronizando con Nexudus...
                                </p>
                                <p className="text-xs text-slate-400">
                                    Esto puede tomar unos segundos. Por favor no cierres la ventana.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AFTER SYNC: Results Summary */}
                    {isCompleted && (
                        <div className="space-y-4">
                            {/* Status Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                    <span className="text-2xl font-black text-emerald-500">{totalSuccess}</span>
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">Exitosos</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-center">
                                    <span className="text-2xl font-black text-slate-500">{totalSkipped}</span>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Omitidos</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                                    <span className="text-2xl font-black text-red-500">{totalFailed}</span>
                                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mt-1">Fallidos</p>
                                </div>
                            </div>

                            {/* Detailed List */}
                            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                {results.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                                        <div className="flex items-center gap-2">
                                            {r.status === 'success' && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                                            {r.status === 'failed' && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                                            {r.status === 'skipped' && <Info size={14} className="text-slate-400 shrink-0" />}
                                            <span className="font-bold text-slate-700 dark:text-white/80">{r.username}</span>
                                        </div>
                                        <div className="text-right">
                                            {r.status === 'success' && (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                    +{r.salesCreated} venta(s)
                                                </span>
                                            )}
                                            {r.status === 'skipped' && (
                                                <span className="text-slate-400">Sin copias</span>
                                            )}
                                            {r.status === 'failed' && (
                                                <span className="text-red-500 font-bold truncate max-w-[150px] inline-block" title={r.error}>
                                                    {r.error || 'Error desconocido'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                    {!isCompleted ? (
                        <>
                            <button
                                onClick={onClose}
                                disabled={isSyncing}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isSyncing}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#f15a24] hover:bg-[#d94e1d] text-white shadow-lg shadow-[#f15a24]/20 transition-all disabled:opacity-50"
                            >
                                {isSyncing ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={14} />
                                        <span>Confirmar Sincronización</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            Entendido
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
