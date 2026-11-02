import React, { useEffect } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { useAutomationStore } from '../../../store/automationStore';
import { AutomationFilterBar } from '../components/AutomationFilterBar';
import { AutomationLogList } from '../components/AutomationLogList';
import { AutomationLogDetail } from '../components/AutomationLogDetail';

export const AutomationDiagnosticsPage: React.FC = () => {
    const { fetchPeriods, fetchLogs, error } = useAutomationStore();

    useEffect(() => {
        const init = async () => {
            await fetchPeriods();
            await fetchLogs();
        };
        init();
    }, [fetchPeriods, fetchLogs]);

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-500">
                            <Activity size={14} />
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
                            Observabilidad y Auditoría
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Centro de Automatismos
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                        Diagnóstico de lecturas automáticas del servidor de impresión y sincronización contable con Nexudus.
                    </p>
                </div>
            </div>

            {/* Error Banner if any */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter Bar */}
            <AutomationFilterBar />

            {/* Split Screen Master-Detail (2 Columns) */}
            <div className="flex flex-col lg:flex-row items-start gap-6 w-full min-w-0">
                {/* Left Column: Log Feed (~35%) */}
                <div className="w-full lg:w-[35%] shrink-0 min-w-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                            Historial de Ejecuciones
                        </span>
                    </div>
                    <AutomationLogList />
                </div>

                {/* Right Column: Deep Inspection Detail (~65%) */}
                <div className="w-full lg:w-[65%] flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                            Detalle del Evento
                        </span>
                    </div>
                    <AutomationLogDetail />
                </div>
            </div>
        </div>
    );
};
