import React from 'react';
import { Eye, Trash2 } from 'lucide-react';

interface InvoicesTableProps {
    data: any[];
    onView: (id: string) => void;
    onDelete: (id: string) => void;
}

/**
 * InvoicesTable Component
 * 
 * Dense tabular view for quick audit.
 */
export const InvoicesTable: React.FC<InvoicesTableProps> = ({ data, onView, onDelete }) => {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Usuario</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Periodo</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Importe</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {data.map((invoice) => (
                            <tr key={invoice.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-bold border border-indigo-500/20">
                                            {invoice.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-white">{invoice.username}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">
                                        {formatDate(invoice.from)} — {formatDate(invoice.to)}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-black text-slate-800 dark:text-white">{invoice.total.toFixed(2)}</span>
                                        <span className="text-[10px] font-bold text-indigo-500">€</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onView(invoice.id)}
                                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(invoice.id)}
                                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
