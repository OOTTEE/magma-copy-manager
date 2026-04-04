import React from 'react';
import { 
    X, 
    FileText, 
    Download, 
    Printer, 
    Trash2,
    Calendar,
    User as UserIcon,
    AlertCircle
} from 'lucide-react';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    onDelete?: (id: string) => void;
}

/**
 * InvoiceModal Component
 * 
 * Displays the details of a persisted invoice.
 * Allows for deletion and (mocked) export actions.
 */
export const InvoiceModal: React.FC<InvoiceModalProps> = ({ 
    isOpen, 
    onClose, 
    data,
    onDelete 
}) => {
    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
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
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Factura Emitida</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Ref: {data?.id.split('-')[0]}</p>
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
                    {/* Invoice Info Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Usuario</span>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white font-bold">
                                <UserIcon size={14} className="text-indigo-500" />
                                {data?.username}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Periodo</span>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white font-bold">
                                <Calendar size={14} className="text-indigo-500" />
                                {formatDate(data?.from)} - {formatDate(data?.to)}
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Detalle de Consumo</span>
                        <div className="space-y-2">
                            {data?.lines.map((line: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all group">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-white/80 group-hover:text-indigo-500 transition-colors">{line.concept}</p>
                                        <p className="text-xs text-slate-400 dark:text-white/20">{line.quantity} unidades x {line.unitPrice.toFixed(2)}€</p>
                                    </div>
                                    <p className="font-black text-slate-800 dark:text-white">{line.total.toFixed(2)}€</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Card */}
                    <div className="p-6 bg-indigo-500 rounded-3xl shadow-xl shadow-indigo-500/20 text-white flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Total Facturado</p>
                            <p className="text-sm font-bold text-white/60 italic">Nexudus Sync Próximamente</p>
                        </div>
                        <p className="text-4xl font-black tracking-tighter">{data?.total.toFixed(2)}€</p>
                    </div>

                    {/* Warnings */}
                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-3">
                        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-600/80 dark:text-amber-500/60 font-medium leading-relaxed">
                            Esta factura es un registro persistente. Si la eliminas, las copias asociadas volverán a estar disponibles para una nueva facturación.
                        </p>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <button 
                        onClick={() => onDelete?.(data.id)}
                        className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                    >
                        <Trash2 size={18} />
                        Eliminar Registro
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <button className="p-3 text-slate-400 hover:text-indigo-500 transition-all" title="Descargar PDF">
                            <Download size={22} />
                        </button>
                        <button className="p-3 text-slate-400 hover:text-indigo-500 transition-all" title="Imprimir">
                            <Printer size={22} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
