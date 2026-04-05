import { DownloadCloud, Receipt } from 'lucide-react';

export const RecentInvoicesWidget = ({ invoices }: { invoices: any[] }) => {
    return (
        <div className="p-10 bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10 h-full">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400">
                    <Receipt size={18} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Facturas Recientes</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mt-1">Últimos Cobros</p>
                </div>
            </div>
            
            <div className="space-y-4">
                {invoices.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-white/40 font-medium">No hay facturas recientes.</div>
                ) : (
                    invoices.map((inv, idx) => (
                        <div key={inv.id || idx} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-1">{inv.from} - {inv.to}</div>
                                <div className="text-2xl font-black text-slate-800 dark:text-white">${inv.total?.toFixed(2) || '0.00'}</div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                                    Pagado
                                </span>
                                <button className="p-3 text-indigo-500 dark:text-indigo-400 hover:text-white hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-transparent hover:shadow-indigo-500/30 active:scale-95" title="Descargar PDF">
                                    <DownloadCloud size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {invoices.length > 0 && (
                <button className="w-full mt-8 py-4 px-4 rounded-2xl text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-white/40 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 border border-slate-100 dark:border-white/5">
                    Ver Historial Completo
                </button>
            )}
        </div>
    );
};
