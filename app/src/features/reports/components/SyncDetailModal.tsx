import React from 'react';
import { 
    X, 
    Zap, 
    ExternalLink, 
    Calendar,
    User as UserIcon,
    CheckCircle2,
    Hash,
    Layers
} from 'lucide-react';

interface SyncDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

/**
 * SyncDetailModal Component
 * 
 * Displays the details of a synchronization event with Nexudus.
 * Direct link to the Nexudus administration panel for auditing.
 */
export const SyncDetailModal: React.FC<SyncDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    data
}) => {
    if (!isOpen || !data) return null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const copyTypeLabels: Record<string, string> = {
        'a4Bw': 'A4 B/N (Con Papel)',
        'a4Color': 'A4 Color (Con Papel)',
        'a3Bw': 'A3 B/N (Con Papel)',
        'a3Color': 'A3 Color (Con Papel)',
        'sra3Bw': 'SRA3 B/N (Sin Papel)',
        'sra3Color': 'SRA3 Color (Sin Papel)',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1818] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Detalle de Sincronización</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Ref Magma: {data.id.split('-')[0]}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:text-white/20 dark:hover:text-white transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Sync Info Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Usuario Coworker</span>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white font-bold">
                                <UserIcon size={14} className="text-indigo-500" />
                                {data.username}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Fecha Reporte</span>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white font-bold">
                                <Calendar size={14} className="text-indigo-500" />
                                {formatDate(data.createdOn)}
                            </div>
                        </div>
                    </div>

                    {/* Nexudus Data */}
                    <div className="p-6 bg-slate-100 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4">
                        <div className="flex justify-between items-center text-slate-500 dark:text-white/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Estado en Nexudus</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-white/60">Consumo Vinculado Exitosamente</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-widest">
                                Sincronizado
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/5">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400/60 flex items-center gap-1">
                                    <Hash size={10} /> ID Venta Nexudus
                                </span>
                                <p className="font-mono text-sm font-bold text-slate-700 dark:text-white/80">{data.nexudusSaleId}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400/60 flex items-center gap-1">
                                    <Layers size={10} /> ID Producto Nexudus
                                </span>
                                <p className="font-mono text-sm font-bold text-slate-700 dark:text-white/80">{data.nexudusProductId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Consumption Breakdown */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Resumen de Consumo Reportado</span>
                        <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/10 flex justify-between items-center">
                            <div>
                                <p className="font-black text-slate-800 dark:text-white">{copyTypeLabels[data.type] || data.type}</p>
                                <p className="text-xs text-slate-500 dark:text-white/40">Cantidad total en el reporte</p>
                            </div>
                            <div className="text-2xl font-black text-indigo-500">
                                {data.quantity}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <p className="text-[10px] font-medium text-slate-400 dark:text-white/20 max-w-[240px]">
                        Este registro es inmutable para garantizar la consistencia con el sistema de facturación.
                    </p>
                    
                    <a 
                        href={`https://dashboard.nexudus.com/operations/coworkers/${data.nexudusCoworkerId}/sales/coworkerProducts/${data.nexudusSaleId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        Ver en Nexudus
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
};
