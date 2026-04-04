import React from 'react';
import { User, Calendar, Eye, Trash2, ArrowRight } from 'lucide-react';

interface InvoiceCardProps {
    invoice: any;
    onView: (id: string) => void;
    onDelete: (id: string) => void;
}

/**
 * InvoiceCard Component
 * 
 * Individual invoice item for Grid view.
 * High visual impact with glassmorphism.
 */
export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onView, onDelete }) => {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
    };

    return (
        <div className="group bg-white dark:bg-[#1a1818] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-500" />
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-all duration-300">
                    <User size={28} strokeWidth={1} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">{invoice.username}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Miembro de coworking</p>
                </div>
            </div>

            {/* Cycle Info */}
            <div className="mb-8 space-y-3">
                <div className="flex items-center gap-2 text-slate-400 dark:text-white/20">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ciclo de Facturación</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-white">
                        {formatDate(invoice.from)}
                    </div>
                    <ArrowRight size={12} className="text-slate-300 dark:text-white/10" />
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-white">
                        {formatDate(invoice.to)}
                    </div>
                </div>
            </div>

            {/* Footer Total & Actions */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Total Facturado</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-500 tracking-tighter">
                            {invoice.total.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-500">€</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => onView(invoice.id)}
                        className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Eye size={18} />
                    </button>
                    <button 
                        onClick={() => onDelete(invoice.id)}
                        className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
