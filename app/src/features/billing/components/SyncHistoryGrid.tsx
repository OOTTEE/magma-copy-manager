import type { SyncRecord } from '../../../store/syncStore';
import { 
  User, 
  ExternalLink, 
  Layers,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { NexudusAccountBadge } from '../../users/components/NexudusAccountBadge';

interface SyncHistoryGridProps {
  data: SyncRecord[];
  onDelete?: (ids: string[]) => void;
}

/**
 * SyncHistoryGrid Component
 * 
 * Visual grid for synchronization events. 
 * High visual impact with Nexudus-centric auditing cards.
 */
export const SyncHistoryGrid: React.FC<SyncHistoryGridProps> = ({ 
  data, 
  onDelete
}) => {
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  const copyTypeLabels: Record<string, string> = {
    'a4Bw': 'A4 B/N',
    'a4Color': 'A4 Color',
    'a3Bw': 'A3 B/N',
    'a3Color': 'A3 Color',
    'sra3Bw': 'SRA3 B/N',
    'sra3Color': 'SRA3 Color',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {data.map((record, idx) => {
        const accountIds = Object.keys(record.items.reduce((acc: any, item: any) => {
          const id = item.nexudusCoworkerId || 'default';
          acc[id] = true;
          return acc;
        }, {} as Record<string, boolean>));
        const isMultiAccount = accountIds.length > 1;

        return (
          <div 
            key={`${record.userId}-${record.saleDate}-${idx}`} 
            className="group relative bg-white dark:bg-[#1a1818] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
          >
            {/* Background Decorative Element */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-all">
                  <User size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1">{record.username}</h3>
                  {!isMultiAccount && record.nexudusCoworkerId && (
                    <div className="mb-2">
                      <NexudusAccountBadge 
                        nexudusUserId={record.nexudusCoworkerId} 
                        className="scale-90 origin-left"
                        hideEmail
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      <CheckCircle2 size={10} />
                      Sincronizado
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {record.month}
                </div>
                {isMultiAccount && (
                  <div className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border border-amber-500/20">
                    Multi-cuenta
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 flex-1">
              <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      <Layers size={10} className="text-indigo-500" />
                      Conceptos Sincronizados
                  </div>
                  <div className="space-y-2">
                      {record.items.map(item => (
                         <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-600 dark:text-white/60">{copyTypeLabels[item.type] || item.type}</span>
                            <span className="font-black text-indigo-500">{item.quantity}</span>
                         </div>
                      ))}
                      <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                         <span className="text-xl font-black text-slate-800 dark:text-white">{record.totalQuantity}</span>
                      </div>
                  </div>
              </div>

              <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400/60 leading-none">Fecha Sync</span>
                      <p className="text-[10px] font-bold text-slate-400">{formatDate(record.createdOn)}</p>
                  </div>
                  <div className="flex -space-x-2">
                      {record.items.map((item, i) => (
                        <a 
                          key={item.id}
                          href={`https://dashboard.nexudus.com/operations/coworkers/${item.nexudusCoworkerId || record.nexudusCoworkerId}/sales/coworkerProducts/${item.nexudusSaleId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 rounded-lg bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-[7px] font-black text-slate-400 hover:text-indigo-500 hover:z-10 transition-all shadow-sm"
                          title={`Ver ${copyTypeLabels[item.type] || item.type} en Nexudus`}
                        >
                          {i + 1}
                        </a>
                      ))}
                  </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex gap-3">
              <button 
                onClick={() => onDelete?.(record.items.map(i => i.id))}
                className="flex-1 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/5 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Revertir Cobro
              </button>
              <a 
                href={`https://dashboard.nexudus.com/operations/coworkers/${record.nexudusCoworkerId}/sales/`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-indigo-500 transition-all active:scale-90"
                title="Ver todo en Nexudus"
              >
                <ExternalLink size={20} />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};
