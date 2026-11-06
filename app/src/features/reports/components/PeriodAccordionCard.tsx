import React, { useEffect } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  Zap, 
  AlertTriangle, 
  Loader2
} from 'lucide-react';
import { useReportStore, type PeriodSummary } from '../../../store/reportStore';
import { PeriodUserTable } from './PeriodUserTable';

interface PeriodAccordionCardProps {
  period: PeriodSummary;
  isExpanded: boolean;
  onToggle: () => void;
  onSyncPeriod: (period: PeriodSummary) => void;
  onOpenChargeUser: (userId: string, period: string) => void;
  onOpenOrphans: (period: string, periodName: string) => void;
}

export const PeriodAccordionCard: React.FC<PeriodAccordionCardProps> = ({
  period,
  isExpanded,
  onToggle,
  onSyncPeriod,
  onOpenChargeUser,
  onOpenOrphans
}) => {
  const { periodReports, loadingPeriodReports, fetchPeriodReport } = useReportStore();

  const reportData = periodReports[period.period];
  const isLoading = loadingPeriodReports[period.period];

  useEffect(() => {
    if (isExpanded && !reportData && !isLoading) {
      fetchPeriodReport(period.period);
    }
  }, [isExpanded, reportData, isLoading, period.period, fetchPeriodReport]);

  const { metrics } = period;
  const isFullyBilled = period.status === 'billed';
  const isPartial = period.status === 'partial';

  return (
    <div className={`rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${
      isExpanded 
        ? 'bg-white dark:bg-[#1a1818] border-indigo-500/30 shadow-2xl shadow-indigo-500/5' 
        : 'bg-white/80 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm'
    }`}>
      {/* Accordion Header */}
      <div 
        onClick={onToggle}
        className="px-8 py-6 cursor-pointer select-none flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      >
        {/* Left: Title & Status */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
            isFullyBilled 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : isPartial 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
          }`}>
            <Calendar size={22} strokeWidth={2} />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                {period.name}
              </h2>
              {period.isCurrent && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500 text-white shadow-sm shadow-indigo-500/30">
                  En Curso
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              {(metrics?.totalCopies ?? 0) === 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                  Sin actividad
                </span>
              ) : isFullyBilled ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-500">
                  <CheckCircle2 size={12} />
                  Completado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-500">
                  <Clock size={12} />
                  Pendiente
                </span>
              )}
              <span className="text-slate-300 dark:text-white/10">•</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-white/30">
                {new Date(period.from).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {new Date(period.to).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Macro KPIs */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          {/* Total Copias */}
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
              Copias Totales
            </p>
            <p className="text-base font-black font-mono text-slate-800 dark:text-white/90">
              {metrics?.totalCopies ?? 0} <span className="text-[10px] font-normal text-slate-400">copias</span>
            </p>
          </div>

          {/* Copias Publicadas */}
          <div className="px-4 py-2 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200/40 dark:border-indigo-500/10">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
              Copias Publicadas
            </p>
            <p className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
              {metrics?.syncedCopies ?? 0}
            </p>
          </div>

          {/* Copias Pendientes */}
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
              Copias Pendientes
            </p>
            <p className={`text-base font-black font-mono {((metrics?.totalCopies ?? 0) - (metrics?.syncedCopies ?? 0)) > 0 ? 'text-amber-500' : 'text-slate-400 dark:text-white/30'}`}>
              {Math.max(0, (metrics?.totalCopies ?? 0) - (metrics?.syncedCopies ?? 0))}
            </p>
          </div>

          {/* Huérfanos Badge (si existen) */}
          {(metrics?.unlinkedUsersCount ?? 0) > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenOrphans(period.period, period.name);
              }}
              title="Ver usuarios de la impresora sin cuenta asignada"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all active:scale-95"
            >
              <AlertTriangle size={13} className="animate-pulse" />
              <span>{metrics.unlinkedUsersCount} sin vincular</span>
            </button>
          )}
        </div>

        {/* Right: Action & Expand Toggle */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSyncPeriod(period);
            }}
            disabled={isFullyBilled || (metrics?.totalCopies ?? 0) === 0}
            title={
              isFullyBilled 
                ? 'El período ya está completamente sincronizado' 
                : 'Sincronizar consumos validados del mes a Nexudus'
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#f15a24] hover:bg-[#d94e1d] text-white shadow-lg shadow-[#f15a24]/20 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
          >
            <Zap size={14} />
            <span>Subir Mes a Nexudus</span>
          </button>

          <div className={`p-2 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`}>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* Accordion Body */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/10 animate-in fade-in duration-300">
          {!reportData && isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="animate-spin text-indigo-500" size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">Cargando desglose de usuarios...</span>
            </div>
          ) : (
            <div className="relative">
              {isLoading && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500/20 overflow-hidden z-10">
                  <div className="h-full bg-indigo-500 animate-pulse w-full" />
                </div>
              )}
              <PeriodUserTable
                data={reportData?.data || []}
                period={period.period}
                isClosed={!period.isCurrent}
                onCharge={(userId) => onOpenChargeUser(userId, period.period)}
                onRefresh={() => fetchPeriodReport(period.period, true, true)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
