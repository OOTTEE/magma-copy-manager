import React from 'react';
import { 
    AlertCircle, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    ChevronRight, 
    Loader2
} from 'lucide-react';
import { useAutomationStore } from '../../../store/automationStore';

export const AutomationLogList: React.FC = () => {
    const { 
        logs, 
        selectedLogId, 
        isLoading, 
        selectLog 
    } = useAutomationStore();

    if (isLoading && logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl min-h-[400px]">
                <Loader2 className="animate-spin text-indigo-500 mb-3" size={28} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Cargando ejecuciones...
                </p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl min-h-[400px] text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
                    <Clock size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-white/80">
                    Sin ejecuciones registradas
                </h3>
                <p className="text-xs text-slate-400 dark:text-white/40 mt-1 max-w-[220px]">
                    No se encontraron registros que coincidan con los filtros seleccionados.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2.5 max-h-[750px] overflow-y-auto pr-1 select-none">
            {logs.map((log) => {
                const isSelected = selectedLogId === log.id;
                const isFailed = log.status === 'failed';
                const isPartial = log.status === 'partial';

                const isSync = log.processType === 'sync';
                const dateObj = new Date(log.datetime);
                const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

                return (
                    <div
                        key={log.id}
                        onClick={() => selectLog(log.id)}
                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                                ? 'bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-500/40 shadow-md shadow-indigo-500/5'
                                : 'bg-white/80 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-50/60 dark:hover:bg-white/[0.04]'
                        }`}
                    >
                        {/* Selected Indicator Pill */}
                        {isSelected && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full" />
                        )}

                        <div className="flex items-start justify-between gap-3">
                            {/* Left: Icon & Title */}
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                    isFailed
                                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                        : isPartial
                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                }`}>
                                    {isFailed ? (
                                        <AlertCircle size={16} />
                                    ) : isPartial ? (
                                        <AlertTriangle size={16} />
                                    ) : (
                                        <CheckCircle2 size={16} />
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-800 dark:text-white/90">
                                            {isSync ? 'Lectura Impresora' : 'Facturación'}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 dark:text-white/40">
                                            {timeStr}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 dark:text-white/40 capitalize">
                                        {dateStr} · {log.triggerType === 'manual' ? 'Manual' : 'Automático'}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Chevron */}
                            <ChevronRight 
                                size={14} 
                                className={`transition-transform shrink-0 mt-1 ${
                                    isSelected 
                                        ? 'text-indigo-500 translate-x-0.5' 
                                        : 'text-slate-300 dark:text-white/20 group-hover:text-slate-500'
                                }`} 
                            />
                        </div>

                        {/* Summary Badges Footer */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 flex-wrap">
                            {log.stats?.errorsCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    {log.stats.errorsCount} {log.stats.errorsCount === 1 ? 'error' : 'errores'}
                                </span>
                            )}
                            {log.stats?.changedCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    {log.stats.changedCount} con actividad
                                </span>
                            )}
                            {log.stats?.unchangedCount > 0 && log.stats.errorsCount === 0 && log.stats.changedCount === 0 && (
                                <span className="text-[9px] font-bold text-slate-400 dark:text-white/30">
                                    {log.stats.unchangedCount} sin cambios
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
