import { useState, useEffect, useCallback } from 'react';
import { 
    Activity, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    History,
    Loader2,
    Database,
    Banknote,
    Cable,
    Calendar
} from 'lucide-react';
import { automationService, type AutoBillingLog } from '../services/automation.service';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

/**
 * AutoBillingLogs Component
 * 
 * Displays the history of automated processes (Billing & Sync).
 * Provides manual trigger buttons for both.
 */
export const AutoBillingLogs = () => {
    const [logs, setLogs] = useState<AutoBillingLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTriggering, setIsTriggering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'sync' | 'billing' | null;
    }>({
        isOpen: false,
        type: null
    });

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await automationService.getLogs();
            setLogs(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar el historial.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleConfirmAction = async () => {
        const actionType = modalConfig.type;
        setModalConfig({ isOpen: false, type: null });
        
        setIsTriggering(true);
        try {
            if (actionType === 'billing') {
                await automationService.triggerNow();
            } else if (actionType === 'sync') {
                await automationService.triggerSync();
            }
            setTimeout(fetchLogs, 1500);
        } catch (err: any) {
            setError(`Error al ejecutar ${actionType}: ${err.message}`);
        } finally {
            setIsTriggering(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'success':
                return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case 'partial':
                return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case 'failed':
                return "bg-red-500/10 text-red-500 border-red-500/20";
            default:
                return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 size={14} />;
            case 'partial':
                return <Activity size={14} />;
            case 'failed':
                return <AlertCircle size={14} />;
            default:
                return <Clock size={14} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <History size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Historial de Ejecuciones</h3>
                        <p className="text-xs text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest mt-0.5">Auditoría de automatización global</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setModalConfig({ isOpen: true, type: 'sync' })}
                        disabled={isTriggering || isLoading}
                        className={`
                            flex items-center justify-center gap-2 px-6 h-12 rounded-2xl font-bold transition-all border
                            ${isTriggering 
                                ? "bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent" 
                                : "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20 active:scale-95 text-[10px] uppercase tracking-widest"
                            }
                        `}
                    >
                        {isTriggering ? <Loader2 size={16} className="animate-spin" /> : <Cable size={16} />}
                        Sync Contadores
                    </button>

                    <button
                        onClick={() => setModalConfig({ isOpen: true, type: 'billing' })}
                        disabled={isTriggering || isLoading}
                        className={`
                            flex items-center justify-center gap-2 px-6 h-12 rounded-2xl font-bold transition-all
                            ${isTriggering 
                                ? "bg-slate-100 dark:bg-white/5 text-slate-400" 
                                : "bg-[#f15a24] text-white shadow-lg shadow-[#f15a24]/20 hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest"
                            }
                        `}
                    >
                        {isTriggering ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                        Disparar Facturación
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-hidden bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/5 transition-all">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Fecha</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Tipo</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Origen</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Estado</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Resumen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 size={32} className="text-indigo-500 animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consultando Base de Datos...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 dark:text-white/10 italic">
                                    No se han encontrado registros de ejecución previa.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                                <Calendar size={14} />
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-white/60 text-xs">
                                                {new Date(log.datetime).toLocaleString('es-ES', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {log.jobType === 'billing' ? (
                                                <Banknote size={14} className="text-indigo-500" />
                                            ) : (
                                                <Cable size={14} className="text-orange-500" />
                                            )}
                                            <span className="font-bold text-slate-700 dark:text-white/60 text-[10px] uppercase tracking-wider">
                                                {log.jobType === 'billing' ? 'Facturación' : 'Sincro'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`
                                            px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                                            ${log.triggerType === 'manual' 
                                                ? "bg-purple-500/10 text-purple-500 border-purple-500/20" 
                                                : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"}
                                        `}>
                                            {log.triggerType === 'manual' ? 'Manual' : 'Automático'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`
                                            inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wide
                                            ${getStatusStyles(log.status)}
                                        `}>
                                            {getStatusIcon(log.status)}
                                            {log.status === 'success' ? 'Éxito' : log.status === 'partial' ? 'Parcial' : 'Fallido'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium text-slate-600 dark:text-white/50 line-clamp-1">{log.summary}</p>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                    <Database size={12} strokeWidth={2.5} />
                                                    <span className="opacity-60 uppercase">JOB_ID:</span>
                                                    <code className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-indigo-500 text-[9px]">{log.id.slice(0, 8)}</code>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500 flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            {/* Premium Confirmation Modal */}
            <ConfirmationModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ isOpen: false, type: null })}
                onConfirm={handleConfirmAction}
                variant={modalConfig.type === 'sync' ? 'warning' : 'primary'}
                title={modalConfig.type === 'sync' ? "Sincronizar Contadores" : "Disparar Facturación"}
                message={modalConfig.type === 'sync' 
                    ? "¿Seguro que deseas conectar con el servidor de impresión y sincronizar los contadores ahora? Este proceso puede tardar unos segundos."
                    : "¿Estás seguro de que deseas iniciar el proceso de facturación mensual? Se generarán facturas en Nexudus para todos los usuarios con actividad."
                }
                confirmText={modalConfig.type === 'sync' ? "Sincronizar ahora" : "Iniciar Proceso"}
                cancelText="Cerrar"
            />
        </div>
    );
};
