import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import {
  Activity,
  Loader2,
  Calendar,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DistributionDraftManager } from '../../reports/components/DistributionDraftManager';
import { CustomerClosedCyclesTable } from './CustomerClosedCyclesTable';
import { YTDExpenseChart } from './widgets/YTDExpenseChart';

export const CustomerDashboardView = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: dashboardData, error } = await api.GET('/api/v1/dashboard/customer', {});
      if (error) throw error;
      setData(dashboardData);
    } catch (e) {
      console.error('Error loading customer dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 size={48} className="text-indigo-500 animate-spin" />
        <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">
          Cargando tu espacio...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <p className="text-red-500 font-bold">Error al cargar la información de tu cuenta.</p>
      </div>
    );
  }

  const currentPeriod = data.currentPeriod || {};
  const isMultiAccount = Boolean(data.isMultiAccount);
  const totalPhysical = currentPeriod.total || 0;
  const isOverAllocated = Boolean(currentPeriod.isOverAllocated);

  const formatMonthTitle = (monthStr?: string) => {
    if (!monthStr) return 'Ciclo Activo';
    const [y, m] = monthStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-7xl mx-auto">
      {/* Aesthetic Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
          <Activity size={32} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
            Mi Consumo
          </h1>
          <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mt-1">
            Gestión del ciclo en curso y auditoría de facturación
          </p>
        </div>
      </div>

      {/* 1. HERO: Ciclo Activo en Curso */}
      <div className="rounded-[2.5rem] bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 p-6 md:p-8 shadow-xl shadow-slate-100 dark:shadow-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  Ciclo en Curso
                </span>
                {isMultiAccount && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    Multicuenta ({data.accountsCount} vinculadas)
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight capitalize mt-0.5">
                {formatMonthTitle(currentPeriod.month)}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isOverAllocated ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                <AlertTriangle size={13} />
                Sobreasignado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} />
                En curso
              </span>
            )}
          </div>
        </div>

        {/* Breakdown de copias del ciclo activo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Total Físico
            </span>
            <p className="text-2xl font-black font-mono text-slate-800 dark:text-white">
              {totalPhysical}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              A4 Blanco/Negro
            </span>
            <p className="text-2xl font-black font-mono text-slate-700 dark:text-white/80">
              {currentPeriod.a4Bw || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 block mb-1">
              A4 Color
            </span>
            <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {currentPeriod.a4Color || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              A3 Blanco/Negro
            </span>
            <p className="text-2xl font-black font-mono text-slate-700 dark:text-white/80">
              {currentPeriod.a3Bw || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 block mb-1">
              A3 Color
            </span>
            <p className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
              {currentPeriod.a3Color || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 block mb-1">
              SRA3
            </span>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {(currentPeriod.sra3Bw || 0) + (currentPeriod.sra3Color || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. HERRAMIENTA DE REPARTO DE COPIAS (Exclusiva para perfiles Multicuenta en el ciclo actual) */}
      {isMultiAccount && (
        <div className="rounded-[2.5rem] bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 overflow-hidden shadow-xl shadow-slate-100 dark:shadow-none">
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-1.5">
                  <Sliders size={13} />
                  Planificación In-Situ
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                Reparto de Copias del Ciclo
              </h3>
              <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                Desvía copias hacia tus cuentas secundarias con su motivo antes del cierre contable. La cuenta principal absorbe automáticamente el remanente.
              </p>
            </div>
          </div>

          <DistributionDraftManager
            userId={data.userId}
            period={currentPeriod.month}
            consumption={{
              a4Bw: currentPeriod.a4Bw,
              a4Color: currentPeriod.a4Color,
              a3Bw: currentPeriod.a3Bw,
              a3Color: currentPeriod.a3Color,
              sra3Bw: currentPeriod.sra3Bw,
              sra3Color: currentPeriod.sra3Color
            }}
            onSaveSuccess={fetchDashboard}
          />
        </div>
      )}

      {/* 3. HISTÓRICO DE CIERRES ANTERIORES (Acordeón Drill-Down con desglose por cuenta) */}
      <CustomerClosedCyclesTable cycles={data.historicalCycles || []} />

      {/* 4. Gráfica de Evolución Anual (YTD) */}
      {data.ytdMonthlyExpenses && data.ytdMonthlyExpenses.length > 0 && (
        <div className="pt-4">
          <YTDExpenseChart data={data.ytdMonthlyExpenses} />
        </div>
      )}
    </div>
  );
};

