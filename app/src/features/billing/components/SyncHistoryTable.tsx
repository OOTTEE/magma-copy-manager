import type { SyncRecord } from '../../../store/syncStore';
import { 
  User, 
  Calendar, 
  ExternalLink, 
  Layers,
  Trash2
} from 'lucide-react';

interface SyncHistoryTableProps {
  data: SyncRecord[];
  onDelete?: (ids: string[]) => void;
}

/**
 * SyncHistoryTable Component
 * 
 * Detailed list of synchronization events with Nexudus, grouped by session.
 */
export const SyncHistoryTable: React.FC<SyncHistoryTableProps> = ({ 
  data, 
  onDelete
}) => {
  

  const copyTypeLabels: Record<string, string> = {
    'a4Bw': 'A4 B/N',
    'a4Color': 'A4 Color',
    'a3Bw': 'A3 B/N',
    'a3Color': 'A3 Color',
    'sra3Bw': 'SRA3 B/N',
    'sra3Color': 'SRA3 Color',
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Coworker</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Mes Reportado</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Conceptos Sincronizados</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">Total Páginas</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
          {data.map((record, idx) => (
            <tr key={`${record.userId}-${record.saleDate}-${idx}`} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <User size={18} strokeWidth={1.5} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-white/80">{record.username}</span>
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-2 text-slate-600 dark:text-white/40 font-bold text-xs uppercase tracking-widest">
                  <Calendar size={14} className="text-indigo-500/60" />
                  {record.month}
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex flex-wrap gap-2">
                  {record.items.map((item) => (
                    <div key={item.id} className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-indigo-500/5 text-indigo-500 text-[9px] font-bold uppercase tracking-wider border border-indigo-500/10">
                      <Layers size={10} />
                      {copyTypeLabels[item.type] || item.type} ({item.quantity})
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-8 py-5 text-center font-black text-slate-800 dark:text-white">
                {record.totalQuantity}
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center justify-center gap-3">
                  {record.items.length === 1 && (
                    <a 
                      href={`https://dashboard.nexudus.com/operations/coworkers/${record.nexudusCoworkerId}/sales/coworkerProducts/${record.items[0].nexudusSaleId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all active:scale-90"
                      title="Abrir en Nexudus"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                  {record.items.length > 1 && (
                    <div className="flex -space-x-2">
                       {record.items.slice(0, 3).map((item, i) => (
                         <a 
                            key={item.id}
                            href={`https://dashboard.nexudus.com/operations/coworkers/${record.nexudusCoworkerId}/sales/coworkerProducts/${item.nexudusSaleId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-white dark:border-[#1a1818] flex items-center justify-center text-[8px] font-bold text-slate-400 hover:text-indigo-500 hover:z-10 transition-all"
                            title={`Ver ${copyTypeLabels[item.type]} en Nexudus`}
                          >
                            {i + 1}
                          </a>
                       ))}
                    </div>
                  )}
                  <button 
                    onClick={() => onDelete?.(record.items.map(i => i.id))}
                    className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-red-500/30 active:scale-90"
                    title="Realizar Rollback del Cobro Completo"
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
  );
};
