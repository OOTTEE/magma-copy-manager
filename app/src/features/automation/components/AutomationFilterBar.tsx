import React, { useState } from 'react';
import { 
    Calendar, 
    RefreshCw, 
    Zap, 
    Banknote, 
    AlertTriangle, 
    CheckCircle2, 
    Play
} from 'lucide-react';
import { useAutomationStore } from '../../../store/automationStore';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

export const AutomationFilterBar: React.FC = () => {
    const { 
        periods, 
        filters, 
        isLoading, 
        isTriggering, 
        setFilter, 
        triggerSync, 
        triggerBilling,
        fetchLogs 
    } = useAutomationStore();

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'sync' | 'billing' | null;
    }>({
        isOpen: false,
        type: null
    });

    const handleConfirmTrigger = async () => {
        if (modalState.type === 'sync') {
            await triggerSync();
        } else if (modalState.type === 'billing') {
            await triggerBilling();
        }
        setModalState({ isOpen: false, type: null });
    };

    return (
        <div className="flex flex-col gap-4 bg-white/80 dark:bg-white/[0.02] backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left: Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Period Dropdown */}
                    <div className="relative min-w-[220px]">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Calendar size={16} />
                        </div>
                        <select
                            value={filters.period}
                            onChange={(e) => setFilter('period', e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                        >
                            <option value="">Todos los Ciclos</option>
                            {periods.map(p => (
                                <option key={p.period} value={p.period}>
                                    {p.name} {p.isCurrent ? '(En curso)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Pill Selector */}
                    <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200 dark:border-white/10">
                        <button
                            onClick={() => setFilter('status', 'all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                filters.status === 'all'
                                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('status', 'failed')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                filters.status === 'failed'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm'
                                    : 'text-slate-500 dark:text-white/40 hover:text-rose-500'
                            }`}
                        >
                            <AlertTriangle size={13} />
                            Incidentes
                        </button>
                        <button
                            onClick={() => setFilter('status', 'success')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                filters.status === 'success'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
                                    : 'text-slate-500 dark:text-white/40 hover:text-emerald-500'
                            }`}
                        >
                            <CheckCircle2 size={13} />
                            Exitosos
                        </button>
                    </div>

                    {/* Process Type Selector */}
                    <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200 dark:border-white/10">
                        <button
                            onClick={() => setFilter('processType', 'all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                filters.processType === 'all'
                                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Cualquier Tipo
                        </button>
                        <button
                            onClick={() => setFilter('processType', 'sync')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                filters.processType === 'sync'
                                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm'
                                    : 'text-slate-500 dark:text-white/40 hover:text-indigo-500'
                            }`}
                        >
                            <Zap size={13} />
                            Impresora
                        </button>
                        <button
                            onClick={() => setFilter('processType', 'billing')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                filters.processType === 'billing'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm'
                                    : 'text-slate-500 dark:text-white/40 hover:text-amber-500'
                            }`}
                        >
                            <Banknote size={13} />
                            Facturación
                        </button>
                    </div>
                </div>

                {/* Right: Manual Execution Actions */}
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => fetchLogs()}
                        disabled={isLoading}
                        title="Recargar registros"
                        className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin text-indigo-500" : ""} />
                    </button>

                    <button
                        onClick={() => setModalState({ isOpen: true, type: 'sync' })}
                        disabled={isTriggering}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        <Zap size={14} />
                        Sincronizar Impresora
                    </button>

                    <button
                        onClick={() => setModalState({ isOpen: true, type: 'billing' })}
                        disabled={isTriggering}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black shadow-md shadow-slate-900/10 dark:shadow-white/5 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        <Play size={14} />
                        Ejecutar Facturación
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, type: null })}
                onConfirm={handleConfirmTrigger}
                title={modalState.type === 'sync' ? "¿Lanzar Sincronización Manual?" : "¿Lanzar Facturación Manual?"}
                message={
                    modalState.type === 'sync'
                        ? "Esto forzará una conexión inmediata con la impresora para capturar las últimas lecturas de contadores de todos los usuarios."
                        : "Esto ejecutará el proceso de cálculo de consumos y subida de ventas a Nexudus para el ciclo actual."
                }
                confirmText={isTriggering ? "Ejecutando..." : "Ejecutar Ahora"}
                variant={modalState.type === 'billing' ? "danger" : "primary"}
            />
        </div>
    );
};
