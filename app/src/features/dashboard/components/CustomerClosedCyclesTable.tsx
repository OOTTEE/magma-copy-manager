import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  CheckCircle2,
  Layers,
  FileText,
  User,
  Sparkles
} from 'lucide-react';

export interface HistoricalCycleAccount {
  accountId: string;
  nexudusUserId: string;
  accountName: string;
  isDefault: number;
  totalCopies: number;
  a4Bw: number;
  a4Color: number;
  a3Bw: number;
  a3Color: number;
  sra3Bw: number;
  sra3Color: number;
  concepts: string[];
}

export interface HistoricalCycle {
  month: string;
  periodName: string;
  saleDate: string;
  totalCopies: number;
  accountsCount: number;
  accounts: HistoricalCycleAccount[];
}

interface CustomerClosedCyclesTableProps {
  cycles: HistoricalCycle[];
}

export const CustomerClosedCyclesTable: React.FC<CustomerClosedCyclesTableProps> = ({ cycles }) => {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const toggleExpand = (month: string) => {
    setExpandedMonth(prev => (prev === month ? null : month));
  };

  if (!cycles || cycles.length === 0) {
    return (
      <div className="p-8 rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
          <Calendar size={22} strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-black text-slate-700 dark:text-white/80">Sin ciclos cerrados anteriores</h4>
        <p className="text-xs text-slate-400 dark:text-white/40 mt-1 max-w-sm">
          Aún no se han ejecutado cierres contables mensuales. Tus consumos facturados aparecerán aquí tras cada cierre de período.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 shadow-xl shadow-slate-100 dark:shadow-none">
      <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-1.5">
              <Calendar size={13} />
              Histórico Contable
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
            Cierres de Ciclos Anteriores
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            Consulta el histórico de facturación y el desglose de copias asignadas por cada cuenta vinculada.
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 border border-slate-200 dark:border-white/5">
          {cycles.length} {cycles.length === 1 ? 'Ciclo' : 'Ciclos'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 bg-slate-50/50 dark:bg-white/[0.01]">
              <th className="py-4 px-6">Período</th>
              <th className="py-4 px-4 text-center">Cuentas</th>
              <th className="py-4 px-4 text-center">Copias Facturadas</th>
              <th className="py-4 px-4 text-center">Fecha de Cierre</th>
              <th className="py-4 px-4 text-center">Estado</th>
              <th className="py-4 px-6 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03] text-xs">
            {cycles.map(cycle => {
              const isExpanded = expandedMonth === cycle.month;
              const formattedDate = cycle.saleDate
                ? new Date(cycle.saleDate).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : '---';

              return (
                <React.Fragment key={cycle.month}>
                  <tr
                    onClick={() => toggleExpand(cycle.month)}
                    className={`cursor-pointer transition-colors duration-200 ${
                      isExpanded
                        ? 'bg-indigo-50/40 dark:bg-indigo-500/5'
                        : 'hover:bg-slate-50/70 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isExpanded
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/60'
                          }`}
                        >
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white leading-tight capitalize">
                            {cycle.periodName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-white/30">
                            {cycle.month}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-slate-600 dark:text-white/70">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                        <Layers size={11} className="text-slate-400" />
                        {cycle.accountsCount} {cycle.accountsCount === 1 ? 'cuenta' : 'cuentas'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                        {cycle.totalCopies}{' '}
                        <span className="text-[10px] font-normal text-slate-400">copias</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center font-mono text-[11px] text-slate-500 dark:text-white/50">
                      {formattedDate}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={11} />
                        Cerrado
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-500">
                        <span className="text-[11px]">{isExpanded ? 'Ocultar' : 'Desglosar'}</span>
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-300 ${
                            isExpanded ? 'rotate-180 text-indigo-500' : ''
                          }`}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Accordion: Accounts Breakdown Drill-down */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="p-0 bg-slate-50/70 dark:bg-black/30 border-y border-indigo-500/10">
                        <div className="p-6 md:p-8 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80 flex items-center gap-2">
                              <Sparkles size={14} className="text-indigo-500" />
                              <span>Desglose de Facturación por Cuenta vinculada ({cycle.accounts.length})</span>
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400">
                              Total Ciclo: <strong className="text-indigo-600 dark:text-indigo-400">{cycle.totalCopies}</strong> copias
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cycle.accounts.map(acc => {
                              const isDefault = acc.isDefault === 1;

                              return (
                                <div
                                  key={acc.accountId}
                                  className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col justify-between gap-3 shadow-sm hover:border-indigo-500/30 transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                          isDefault
                                            ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40'
                                        }`}
                                      >
                                        {isDefault ? 'Cuenta Principal' : 'Cuenta Secundaria'}
                                      </span>
                                      <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                                        {acc.totalCopies} <span className="text-[10px] font-normal text-slate-400">copias</span>
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2.5 mt-1">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                        <User size={15} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                          {acc.accountName}
                                        </p>
                                        <code className="text-[9px] font-mono text-slate-400">
                                          ID: {acc.nexudusUserId}
                                        </code>
                                      </div>
                                    </div>

                                    {/* Modalidades de copias */}
                                    <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-center">
                                      {acc.a4Bw > 0 && (
                                        <div className="p-1 rounded bg-slate-50 dark:bg-white/[0.02]">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase block">A4 B/N</span>
                                          <span className="text-[11px] font-mono font-black">{acc.a4Bw}</span>
                                        </div>
                                      )}
                                      {acc.a4Color > 0 && (
                                        <div className="p-1 rounded bg-slate-50 dark:bg-white/[0.02]">
                                          <span className="text-[8px] font-bold text-indigo-400 uppercase block">A4 Col</span>
                                          <span className="text-[11px] font-mono font-black text-indigo-500">{acc.a4Color}</span>
                                        </div>
                                      )}
                                      {acc.a3Bw > 0 && (
                                        <div className="p-1 rounded bg-slate-50 dark:bg-white/[0.02]">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase block">A3 B/N</span>
                                          <span className="text-[11px] font-mono font-black">{acc.a3Bw}</span>
                                        </div>
                                      )}
                                      {acc.a3Color > 0 && (
                                        <div className="p-1 rounded bg-slate-50 dark:bg-white/[0.02]">
                                          <span className="text-[8px] font-bold text-orange-400 uppercase block">A3 Col</span>
                                          <span className="text-[11px] font-mono font-black text-orange-500">{acc.a3Color}</span>
                                        </div>
                                      )}
                                      {acc.sra3Bw > 0 && (
                                        <div className="p-1 rounded bg-slate-50 dark:bg-white/[0.02]">
                                          <span className="text-[8px] font-bold text-emerald-400 uppercase block">SRA3 B/N</span>
                                          <span className="text-[11px] font-mono font-black text-emerald-500">{acc.sra3Bw}</span>
                                        </div>
                                      )}
                                      {acc.sra3Color > 0 && (
                                        <div className="p-1 rounded bg-slate-50 dark:bg-white/[0.02]">
                                          <span className="text-[8px] font-bold text-teal-400 uppercase block">SRA3 Col</span>
                                          <span className="text-[11px] font-mono font-black text-teal-500">{acc.sra3Color}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Conceptos asociados */}
                                  {acc.concepts && acc.concepts.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                        Conceptos registrados:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {acc.concepts.map((concept, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70"
                                          >
                                            {concept}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
    </div>
  );
};
