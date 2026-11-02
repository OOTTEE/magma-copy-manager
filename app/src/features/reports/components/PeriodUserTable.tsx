import React, { useState } from 'react';
import { 
  User, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  UploadCloud, 
  Layers,
  FileText,
  Zap
} from 'lucide-react';
import type { ReportUserData } from '../../../store/reportStore';
import { DistributionDraftManager } from './DistributionDraftManager';
import { UserCopiesLedger } from './UserCopiesLedger';
import { UserSyncAudit } from './UserSyncAudit';

interface PeriodUserTableProps {
  data: ReportUserData[];
  onCharge: (userId: string) => void;
  period: string;
  onRefresh?: () => void;
}

export const PeriodUserTable: React.FC<PeriodUserTableProps> = ({ 
  data, 
  onCharge,
  period,
  onRefresh
}) => {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'ledger' | 'distribution' | 'sync'>>({});

  const toggleExpand = (userId: string, defaultTab: 'ledger' | 'distribution' | 'sync' = 'ledger') => {
    if (expandedUserId === userId && activeTab[userId] === defaultTab) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      setActiveTab(prev => ({ ...prev, [userId]: defaultTab }));
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 dark:text-white/40">
        <p className="text-sm font-bold">No hay consumos vinculados en este período.</p>
        <p className="text-xs mt-1">Los usuarios sin cuenta Nexudus están filtrados por defecto.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
            <th className="py-4 px-6">Coworker</th>
            <th className="py-4 px-4 text-center">Copias Vinculadas</th>
            <th className="py-4 px-4 text-center">Pendientes de Asignar</th>
            <th className="py-4 px-4 text-center">Total Capturado</th>
            <th className="py-4 px-4 text-center">Estado de Cobro</th>
            <th className="py-4 px-6 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/60 dark:divide-white/[0.03]">
          {data.map(item => {
            const isExpanded = expandedUserId === item.id;
            const linkedCopies = item.copies?.linked ?? item.total;
            const pendingCopies = item.copies?.pending ?? 0;
            const syncedCopies = item.copies?.synced ?? 0;
            const isFullyBilled = item.status === 'billed';
            const isPartialBilled = item.status === 'partial';

            return (
              <React.Fragment key={item.id}>
                <tr className={`group transition-all ${isExpanded ? 'bg-indigo-50/40 dark:bg-white/[0.02]' : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.02]'}`}>
                  {/* Coworker Details */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(item.id, 'ledger')}
                        title="Ver capturas de impresora"
                        className={`p-1.5 rounded-xl transition-all ${
                          isExpanded 
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 rotate-90' 
                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-indigo-500'
                        }`}
                      >
                        <ChevronRight size={14} />
                      </button>

                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <User size={18} strokeWidth={1.5} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-white/90">
                            {item.username}
                          </span>
                          {item.accountsCount > 1 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              <Layers size={10} />
                              {item.accountsCount} cuentas
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-wider">
                          Impresora: {item.printUser}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Copias Vinculadas */}
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {linkedCopies}
                      </span>
                      {syncedCopies > 0 && (
                        <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">
                          <CheckCircle2 size={9} />
                          {syncedCopies} subidas
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Pendientes de Asignar */}
                  <td className="py-4 px-4 text-center">
                    {pendingCopies > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock size={11} />
                        {pendingCopies}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-300 dark:text-white/20">
                        0
                      </span>
                    )}
                  </td>

                  {/* Total Capturado */}
                  <td className="py-4 px-4 text-center font-mono text-xs font-bold text-slate-600 dark:text-white/60">
                    {item.total}
                  </td>

                  {/* Estado de Cobro */}
                  <td className="py-4 px-4 text-center">
                    {isFullyBilled ? (
                      <button
                        onClick={() => toggleExpand(item.id, 'sync')}
                        title="Ver ventas sincronizadas en Nexudus"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        <CheckCircle2 size={12} />
                        Facturado
                      </button>
                    ) : isPartialBilled ? (
                      <button
                        onClick={() => toggleExpand(item.id, 'sync')}
                        title="Ver ventas sincronizadas en Nexudus"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                      >
                        <Clock size={12} />
                        Parcial
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40">
                        Listo para Cobro
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(item.id, 'distribution')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          isExpanded && activeTab[item.id] === 'distribution'
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                            : 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10 hover:border-indigo-500/30 hover:text-indigo-500'
                        }`}
                      >
                        <Sliders size={12} />
                        <span>Repartir</span>
                      </button>

                      <button
                        onClick={() => onCharge(item.id)}
                        disabled={item.total === 0 || isFullyBilled}
                        title={
                          isFullyBilled 
                            ? 'Todas las copias ya están facturadas en Nexudus' 
                            : 'Subir copias vinculadas a Nexudus'
                        }
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f15a24] hover:bg-[#d94e1d] text-white shadow-md shadow-[#f15a24]/20 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                      >
                        <UploadCloud size={13} />
                        <span>Subir</span>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Inline Drawer with Tabs */}
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="p-0 bg-slate-50/70 dark:bg-black/40 border-b border-indigo-500/20">
                      <div className="flex flex-col">
                        {/* Tab Bar */}
                        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-200/60 dark:border-white/5 bg-slate-100/60 dark:bg-white/[0.02]">
                          <button
                            onClick={() => setActiveTab(prev => ({ ...prev, [item.id]: 'ledger' }))}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              (activeTab[item.id] || 'ledger') === 'ledger'
                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                : 'text-slate-600 dark:text-white/60 hover:bg-slate-200/60 dark:hover:bg-white/5'
                            }`}
                          >
                            <FileText size={13} />
                            <span>Capturas de Impresora</span>
                          </button>

                          <button
                            onClick={() => setActiveTab(prev => ({ ...prev, [item.id]: 'distribution' }))}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              activeTab[item.id] === 'distribution'
                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                : 'text-slate-600 dark:text-white/60 hover:bg-slate-200/60 dark:hover:bg-white/5'
                            }`}
                          >
                            <Sliders size={13} />
                            <span>Reparto de Consumos {item.accountsCount > 1 ? `(${item.accountsCount} cuentas)` : ''}</span>
                          </button>

                          <button
                            onClick={() => setActiveTab(prev => ({ ...prev, [item.id]: 'sync' }))}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              activeTab[item.id] === 'sync'
                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                : 'text-slate-600 dark:text-white/60 hover:bg-slate-200/60 dark:hover:bg-white/5'
                            }`}
                          >
                            <Zap size={13} />
                            <span>Ventas Sincronizadas</span>
                            {syncedCopies > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500 text-white font-bold">
                                {syncedCopies}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Tab Content */}
                        {(activeTab[item.id] || 'ledger') === 'ledger' ? (
                          <UserCopiesLedger
                            userId={item.id}
                            period={period}
                            username={item.username}
                          />
                        ) : activeTab[item.id] === 'distribution' ? (
                          <DistributionDraftManager
                            userId={item.id}
                            consumption={{
                              a4Bw: item.a4Bw,
                              a4Color: item.a4Color,
                              a3Bw: item.a3Bw,
                              a3Color: item.a3Color,
                              sra3Bw: item.sra3Bw,
                              sra3Color: item.sra3Color
                            }}
                            onSaveSuccess={() => {
                              onRefresh?.();
                            }}
                          />
                        ) : (
                          <UserSyncAudit
                            userId={item.id}
                            period={period}
                            username={item.username}
                            onRollbackSuccess={() => {
                              onRefresh?.();
                            }}
                          />
                        )}
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
