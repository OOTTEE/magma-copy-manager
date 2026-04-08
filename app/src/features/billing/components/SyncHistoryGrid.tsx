import React from 'react';
import { 
  User, 
  Hash, 
  ExternalLink, 
  Layers,
  CheckCircle2,
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

interface SyncHistoryGridProps {
  data: SyncRecord[];
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * SyncHistoryGrid Component
 * 
 * Visual grid for synchronization events. 
 * High visual impact with Nexudus-centric auditing cards.
 */
export const SyncHistoryGrid: React.FC<SyncHistoryGridProps> = ({ 
  data, 
  onView,
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
      {data.map((record) => (
        <div 
          key={record.id} 
          className="group relative bg-white dark:bg-[#1a1818] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
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
                <h3 className="font-black text-slate-800 dark:text-white tracking-tighter">{record.username}</h3>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <CheckCircle2 size={10} />
                    Sincronizado
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">
               {record.month}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    <Layers size={10} className="text-indigo-500" />
                    Concepto Reportado
                </div>
                <div className="flex justify-between items-end">
                    <p className="font-bold text-slate-700 dark:text-white/80">{copyTypeLabels[record.type] || record.type}</p>
                    <p className="text-3xl font-black text-indigo-500 leading-none">{record.quantity}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400/60">Nexudus ID</span>
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                        <Hash size={12} />
                        {record.nexudusSaleId}
                    </div>
                </div>
                <div className="flex-1 space-y-1 text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400/60">Fecha Sync</span>
                    <p className="text-xs font-bold text-slate-400">{formatDate(record.createdOn)}</p>
                </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex gap-3">
            <button 
              onClick={() => onView?.(record.id)}
              className="flex-1 px-6 py-3 rounded-2xl bg-indigo-500 text-white font-black text-xs shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
            >
              Auditar
            </button>
            <a 
              href={`https://magma-admin.nexudus.com/admin/billing/coworkerproducts/${record.nexudusSaleId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-[#f15a24] hover:bg-[#f15a24]/10 transition-all active:scale-90"
              title="Abrir en Nexudus"
            >
              <ExternalLink size={20} />
            </a>
            <button 
              onClick={() => onDelete?.(record.id)}
              className="p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
              title="Realizar Rollback (Eliminar)"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
