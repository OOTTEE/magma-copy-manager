import React, { useState } from 'react';
import type { SyncRecord, SyncItem } from '../../../store/syncStore';
import { 
  User, 
  Calendar, 
  ExternalLink, 
  Layers,
  Trash2,
  CheckSquare,
  Square,
  ChevronDown,
  CreditCard
} from 'lucide-react';
import { NexudusAccountBadge } from '../../users/components/NexudusAccountBadge';

interface SyncHistoryTableProps {
  data: SyncRecord[];
  onDelete?: (ids: string[]) => void;
  selectedRows?: Set<string>;
  onToggleRow?: (rowId: string) => void;
  onToggleAll?: () => void;
}

/**
 * SyncHistoryTable Component
 * 
 * Detailed list of synchronization events with Nexudus, grouped by session.
 * Features an Accordion Drill-down for multi-account transparency.
 */
export const SyncHistoryTable: React.FC<SyncHistoryTableProps> = ({ 
  data, 
  onDelete,
  selectedRows = new Set(),
  onToggleRow,
  onToggleAll
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const getRowId = (record: SyncRecord, index: number) => `${record.userId}-${record.saleDate}-${index}`;

  const toggleExpand = (e: React.MouseEvent, rowId: string) => {
    e.stopPropagation();
    setExpandedRowId(expandedRowId === rowId ? null : rowId);
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
    <div className="overflow-hidden bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <th className="px-6 py-6 w-10">
               <button 
                onClick={onToggleAll}
                className="text-slate-400 hover:text-indigo-500 transition-colors"
               >
                 {selectedRows.size > 0 && selectedRows.size === data.length ? (
                   <CheckSquare size={18} className="text-indigo-500" />
                 ) : (
                   <Square size={18} />
                 )}
               </button>
            </th>
            <th className="w-10"></th> {/* Expansion Toggle Spacer */}
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Coworker</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Mes Reportado</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">Cuentas</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">Total Páginas</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
          {data.map((record, idx) => {
            const rowId = getRowId(record, idx);
            const isSelected = selectedRows.has(rowId);
            const isExpanded = expandedRowId === rowId;

            // Group items by account for the expanded view
            const itemsByAccount = record.items.reduce((acc, item) => {
              const accId = item.nexudusCoworkerId || 'default';
              if (!acc[accId]) acc[accId] = [];
              acc[accId].push(item);
              return acc;
            }, {} as Record<string, SyncItem[]>);

            const accountCount = Object.keys(itemsByAccount).length;
            
            return (
              <React.Fragment key={rowId}>
                <tr 
                  onClick={() => onToggleRow?.(rowId)}
                  className={`group cursor-pointer transition-all ${isSelected ? 'bg-indigo-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-white/5'} ${isExpanded ? 'bg-slate-50/30 dark:bg-white/[0.02]' : ''}`}
                >
                  <td className="px-6 py-5">
                    <div className={`${isSelected ? 'text-indigo-500' : 'text-slate-300 dark:text-white/10 group-hover:text-indigo-300'}`}>
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                  </td>
                  <td className="px-2 py-5">
                    <button 
                      onClick={(e) => toggleExpand(e, rowId)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-500 text-white rotate-180 shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </td>
                  <td className="px-6 py-5">
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
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${accountCount > 1 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'}`}>
                        {accountCount > 1 ? 'Multi-cuenta' : 'Cuenta Única'}
                        <span className="opacity-50">({accountCount})</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-slate-800 dark:text-white text-lg tracking-tighter">
                    {record.totalQuantity}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(record.items.map(i => i.id));
                        }}
                        className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-red-500/30 active:scale-90"
                        title="Realizar Rollback de la Vinculación Completa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={7} className="px-8 py-0">
                      <div className="mb-6 mt-2 p-8 bg-slate-50/50 dark:bg-black/20 rounded-[2rem] border border-slate-200/50 dark:border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 mb-6 text-indigo-500">
                          <Layers size={18} />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Detalle de Vinculación por Cuenta</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Object.entries(itemsByAccount).map(([accId, items]) => (
                            <div key={accId} className="relative overflow-hidden bg-white dark:bg-[#1a1818] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm group/card hover:shadow-xl transition-all duration-300">
                              <div className="flex items-start justify-between mb-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-widest w-fit">
                                    <CreditCard size={10} />
                                    Nexudus Account
                                  </div>
                                  <div className="pt-1">
                                    <NexudusAccountBadge nexudusUserId={accId} />
                                  </div>
                                </div>
                                <a 
                                  href={`https://dashboard.nexudus.com/operations/coworkers/${accId}/sales/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-all active:scale-90 shadow-sm"
                                  title="Abrir historial en Nexudus"
                                >
                                  <ExternalLink size={18} />
                                </a>
                              </div>

                              <div className="space-y-2 mt-4">
                                {items.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-transparent hover:border-indigo-500/20 transition-all">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                                        {copyTypeLabels[item.type] || item.type}
                                      </span>
                                      <a 
                                        href={`https://dashboard.nexudus.com/operations/coworkers/${item.nexudusCoworkerId}/sales/coworkerProducts/${item.nexudusSaleId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] font-bold text-indigo-500/60 hover:text-indigo-500 underline underline-offset-4"
                                      >
                                        Ver Venta #{item.nexudusSaleId}
                                      </a>
                                    </div>
                                    <span className="text-lg font-black text-slate-800 dark:text-white">
                                      {item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
