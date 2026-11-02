import React, { useState } from 'react';
import { 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    User, 
    Copy, 
    Check, 
    ChevronDown, 
    ChevronUp,
    Terminal,
    ArrowUpRight,
    FileText
} from 'lucide-react';
import { useAutomationStore } from '../../../store/automationStore';
import { useNavigate } from 'react-router-dom';

export const AutomationLogDetail: React.FC = () => {
    const { logs, selectedLogId } = useAutomationStore();
    const navigate = useNavigate();

    const [isUnchangedExpanded, setIsUnchangedExpanded] = useState(false);
    const [copiedTrace, setCopiedTrace] = useState(false);

    const log = logs.find(l => l.id === selectedLogId);

    if (!log) {
        return (
            <div className="flex flex-col items-center justify-center p-16 bg-white/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl min-h-[500px] text-center">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-4">
                    <FileText size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-white/80">
                    Selecciona una ejecución
                </h3>
                <p className="text-xs text-slate-400 dark:text-white/40 mt-1 max-w-[280px]">
                    Elige un evento de la lista izquierda para inspeccionar sus detalles, incidencias y traza técnica.
                </p>
            </div>
        );
    }

    const { details } = log;
    const isFailed = log.status === 'failed';
    const isPartial = log.status === 'partial';

    const dateFormatted = new Date(log.datetime).toLocaleString('es-ES', {
        dateStyle: 'full',
        timeStyle: 'medium'
    });

    const handleCopyTrace = () => {
        const fullTrace = details?.trace || JSON.stringify(details, null, 2);
        navigator.clipboard.writeText(fullTrace);
        setCopiedTrace(true);
        setTimeout(() => setCopiedTrace(false), 2000);
    };

    // Clean summary to avoid multi-line raw error dumps or ASCII banners in the heading
    const summaryTitle = log.summary ? log.summary.split('\n')[0].trim() : 'Ejecución de automatismo';

    return (
        <div className="flex flex-col gap-6 bg-white/80 dark:bg-white/[0.02] backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm w-full min-w-0 overflow-hidden">
            
            {/* Header / Event Overview */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5 min-w-0">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            isFailed
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : isPartial
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                            {isFailed ? 'Fallo Crítico' : isPartial ? 'Fallo Parcial' : 'Completado con Éxito'}
                        </span>

                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 shrink-0">
                            {log.processType === 'sync' ? 'Sincronización de Impresora' : 'Facturación Automática'}
                        </span>
                        
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 shrink-0">
                            • Disparo {log.triggerType === 'manual' ? 'Manual' : 'Automático'}
                        </span>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-2 break-all [overflow-wrap:anywhere]">
                        {summaryTitle}
                    </h2>

                    <p className="text-xs font-mono text-slate-400 dark:text-white/40 mt-1">
                        {dateFormatted}
                    </p>
                </div>

                {/* Duration & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {details?.durationMs > 0 && (
                        <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                                Duración
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-700 dark:text-white/80">
                                {(details.durationMs / 1000).toFixed(2)}s
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleCopyTrace}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10 text-xs font-bold transition-all active:scale-95 shrink-0"
                    >
                        {copiedTrace ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copiedTrace ? '¡Traza Copiada!' : 'Copiar Registro'}
                    </button>
                </div>
            </div>

            {/* SECTION 1: INCIDENCIAS (PRIORIDAD ALTA) */}
            {details?.errors && details.errors.length > 0 && (
                <div className="flex flex-col gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                            Usuarios con Incidencias ({details.errors.length})
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 min-w-0">
                        {details.errors.map((err, idx) => (
                            <div 
                                key={idx}
                                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 min-w-0"
                            >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <User size={15} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                {err.username || err.printUser || 'Usuario'}
                                            </span>
                                            {err.printUser && err.printUser !== err.username && (
                                                <span className="text-[10px] font-mono text-slate-400 truncate">
                                                    (Impresora: {err.printUser})
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/15 overflow-x-auto max-w-full">
                                            <p className="text-xs text-rose-700 dark:text-rose-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
                                                {err.error}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {err.userId && (
                                    <button
                                        onClick={() => navigate('/users')}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-500/20 transition-colors shrink-0 self-start sm:self-center"
                                    >
                                        Revisar Usuario <ArrowUpRight size={13} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 2: ACTIVIDAD / USUARIOS MODIFICADOS */}
            {details?.changed && details.changed.length > 0 && (
                <div className="flex flex-col gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                            Usuarios con Nuevos Consumos ({details.changed.length})
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
                        {details.changed.map((userItem, idx) => (
                            <div 
                                key={idx}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 min-w-0"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                        <User size={15} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-xs font-black text-slate-800 dark:text-white/90 truncate block">
                                            {userItem.username}
                                        </span>
                                        {userItem.printUser && userItem.printUser !== userItem.username && (
                                            <p className="text-[10px] font-mono text-slate-400 truncate">
                                                {userItem.printUser}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {userItem.delta ? (
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                                            +{userItem.delta.total} copias
                                        </span>
                                        <p className="text-[9px] font-mono text-slate-400">
                                            {userItem.delta.a4Bw} B/N · {userItem.delta.a4Color} Color
                                        </p>
                                    </div>
                                ) : userItem.details ? (
                                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-white/50 shrink-0">
                                        {userItem.details}
                                    </span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTION 3: USUARIOS SIN VARIACIÓN (COLAPSADOS) */}
            {details?.unchangedCount > 0 && (
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] overflow-hidden min-w-0">
                    <button
                        onClick={() => setIsUnchangedExpanded(!isUnchangedExpanded)}
                        className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Clock size={14} className="shrink-0" />
                            {details.unchangedCount} coworkers sin variación en esta pasada
                        </span>
                        {isUnchangedExpanded ? <ChevronUp size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
                    </button>

                    {isUnchangedExpanded && (
                        <div className="px-4 pb-4 text-xs text-slate-400 dark:text-white/30 border-t border-slate-200/40 dark:border-white/5 pt-3">
                            <p>
                                Los contadores de estos {details.unchangedCount} usuarios fueron verificados y no presentaron ningún cambio de páginas impresas respecto a la última lectura registrada.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* SECTION 4: TRAZA TÉCNICA / LOG COMPLETO */}
            <div className="flex flex-col gap-2 pt-2 min-w-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-white/40">
                        <Terminal size={14} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            Traza de Ejecución y Diagnóstico
                        </span>
                    </div>

                    <button
                        onClick={handleCopyTrace}
                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 transition-colors shrink-0"
                    >
                        {copiedTrace ? 'Copiado al portapapeles' : 'Copiar Registro'}
                    </button>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto max-h-[250px] overflow-y-auto select-text min-w-0 max-w-full">
                    {details?.trace ? (
                        <pre className="whitespace-pre-wrap break-all leading-relaxed">{details.trace}</pre>
                    ) : (
                        <pre className="whitespace-pre-wrap break-all leading-relaxed text-slate-400">
                            {JSON.stringify(details, null, 2)}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};
