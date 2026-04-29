import React from 'react';
import { X, Zap, AlertTriangle, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface SyncResult {
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
    error,
}) => {
    if (!isOpen) return null;

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '---';
        return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const totalSalesCreated = results?.reduce((acc, r) => acc + (r.salesCreated || 0), 0) || 0;
    const totalErrors = results?.filter(r => r.status === 'failed').length || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => !isSyncing && onClose()}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white dark:bg-[#1a1818] rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-[#f15a24]/10 text-[#f15a24] border border-[#f15a24]/20">
                                <Zap size={22} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                    Vinculación Global
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mt-0.5">
                                    Sincronizar todo el reporte con Nexudus
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSyncing}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all disabled:opacity-40"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-8 py-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

                        {/* Confirmation state */}
                        {!results && !isSyncing && (
                            <div className="space-y-6">
                                <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 space-y-4">
                                    <div className="flex items-center gap-3 text-indigo-500">
                                        <Info size={20} />
                                        <p className="text-sm font-bold uppercase tracking-widest">Resumen del Filtro Activo</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modo</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-white">
                                                {filters.includeAllPending ? 'Todos los Pendientes' : 'Rango de Fechas'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Periodo</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-white">
                                                {filters.includeAllPending ? 'Completo' : `${formatDate(filters.from)} — ${formatDate(filters.to)}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-500 dark:text-white/40 text-sm leading-relaxed">
                                    Esta acción procesará el consumo de todos los usuarios del reporte y creará las ventas correspondientes en Nexudus. Los usuarios que ya hayan sido sincronizados para este periodo serán omitidos automáticamente.
                                </p>
                            </div>
                        )}

                        {/* Syncing state */}
                        {isSyncing && (
                            <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#f15a24]/20 blur-2xl animate-pulse rounded-full" />
                                    <Loader2 size={64} className="text-[#f15a24] animate-spin relative z-10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-black text-slate-800 dark:text-white">Sincronizando con Nexudus Cloud...</p>
                                    <p className="text-xs font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">No cierre esta ventana</p>
                                </div>
                            </div>
                        )}

                        {/* Results state */}
                        {results && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Success Banner */}
                                <div className={`p-6 rounded-[2rem] flex items-center justify-between ${totalErrors === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                                    <div className="flex items-center gap-4">
                                        {totalErrors === 0 ? (
                                            <CheckCircle2 size={32} className="text-emerald-500" />
                                        ) : (
                                            <AlertTriangle size={32} className="text-amber-500" />
                                        )}
                                        <div>
                                            <p className={`text-xl font-black ${totalErrors === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {totalErrors === 0 ? '¡Sincronización Exitosa!' : 'Sincronización Completada'}
                                            </p>
                                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                                {totalSalesCreated} Ventas generadas en total
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black">{results.length}</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Usuarios Procesados</p>
                                    </div>
                                </div>

                                {/* Detailed Results List */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-2">Detalle por Usuario</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {results.map((res, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-3">
                                                    {res.status === 'success' ? (
                                                        <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                    ) : res.status === 'failed' ? (
                                                        <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
                                                            <AlertCircle size={14} />
                                                        </div>
                                                    ) : (
                                                        <div className="p-1.5 bg-slate-200 dark:bg-white/10 text-slate-400 rounded-lg">
                                                            <Info size={14} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-white">{res.username}</p>
                                                        {res.error && <p className="text-[10px] text-red-500 font-medium">{res.error}</p>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-500 dark:text-white/40">
                                                        {res.salesCreated > 0 ? `+${res.salesCreated} ventas` : 'Omitido'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Global Error */}
                        {error && !isSyncing && (
                            <div className="p-6 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-start gap-4">
                                <AlertCircle size={24} className="text-red-500 shrink-0" />
                                <div>
                                    <p className="text-red-500 font-black text-sm">Error en la Sincronización Global</p>
                                    <p className="text-red-500/70 text-xs font-medium mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-8 pb-8">
                        <button
                            onClick={onClose}
                            disabled={isSyncing}
                            className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 transition-all disabled:opacity-40"
                        >
                            {results ? 'Cerrar' : 'Cancelar'}
                        </button>
                        
                        {!results && (
                            <button
                                onClick={onConfirm}
                                disabled={isSyncing}
                                className={`flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 disabled:opacity-40 ${
                                    isSyncing 
                                    ? 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-white/30'
                                    : 'bg-[#f15a24] text-white shadow-lg shadow-[#f15a24]/30 hover:brightness-110'
                                }`}
                            >
                                {isSyncing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Sincronizando...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={16} />
                                        Confirmar y Vincular Todo
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
