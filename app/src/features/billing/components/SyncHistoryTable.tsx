import React from 'react';
import { 
  User, 
  Calendar, 
  Hash, 
  ExternalLink, 
  Layers,
  Zap,
  Trash2
} from 'lucide-react';

interface SyncRecord {
  id: string;
  userId: string;
  username: string;
  month: string;
  type: string;
  quantity: number;
  nexudusSaleId: string;
  createdOn: string;
}

interface SyncHistoryTableProps {
  data: SyncRecord[];
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * SyncHistoryTable Component
 * 
 * Detailed list of synchronization events with Nexudus.
 * Focuses on auditability and direct links to the external system.
 */
export const SyncHistoryTable: React.FC<SyncHistoryTableProps> = ({ 
  data, 
  onView,
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
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Concepto Sincronizado</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">Cantidad</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Nexudus ID</th>
            <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
          {data.map((record) => (
            <tr key={record.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-500/10">
                  <Layers size={12} />
                  {copyTypeLabels[record.type] || record.type}
                </div>
              </td>
              <td className="px-8 py-5 text-center font-black text-slate-800 dark:text-white">
                {record.quantity}
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-400 dark:text-white/20 group-hover:text-slate-600 dark:group-hover:text-white/60 transition-colors">
                  <Hash size={12} />
                  {record.nexudusSaleId}
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={() => onView?.(record.id)}
                    className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-indigo-500/30 active:scale-90"
                    title="Ver Detalle"
                  >
                    <Zap size={18} />
                  </button>
                  <a 
                    href={`https://magma-admin.nexudus.com/admin/billing/coworkerproducts/${record.nexudusSaleId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all active:scale-90"
                    title="Abrir en Nexudus"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button 
                    onClick={() => onDelete?.(record.id)}
                    className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-red-500/30 active:scale-90"
                    title="Realizar Rollback (Eliminar)"
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
