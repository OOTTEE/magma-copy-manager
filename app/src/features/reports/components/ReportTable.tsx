import React, { useState, useMemo } from 'react';
import { User, FileText, BarChart3, ChevronDown, ChevronUp, Eye, EyeOff, Zap, Share2 } from 'lucide-react';

interface ReportData {
  id: string;
  username: string;
  printUser: string;
  a4Color: number;
  a4Bw: number;
  a3Color: number;
  a3Bw: number;
  sra3Color: number;
  sra3Bw: number;
  total: number;
  nexudusUser: string | null;
}

interface ReportTableProps {
  data: ReportData[];
  onCharge: (userId: string) => void;
  onDistribute?: (userId: string, username: string, totalConsumption: any) => void;
  enrichedUsers?: Record<string, any>;
}

/**
 * ReportTable Component
 *
 * Detailed view for monthly copy accumulation.
 * Categorized by size and color.
 */
export const ReportTable: React.FC<ReportTableProps> = ({ data, onCharge, onDistribute, enrichedUsers = {} }) => {
  const [showHidden, setShowHidden] = useState(false);

  const { visibleData, hiddenData } = useMemo(() => {
    const active = data
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
    const inactive = data.filter((item) => item.total === 0);
    return { visibleData: active, hiddenData: inactive };
  }, [data]);

  const getChargeTooltip = (item: ReportData): string => {
    if (item.total === 0) return 'No hay consumos registrados para vincular';
    
    const enrichedUser = enrichedUsers[item.id];
    if (!enrichedUser) return 'Cargando información de usuario...';
    if (!enrichedUser.nexudusUser) return 'Usuario sin cuenta de Nexudus vinculada';
    
    return 'Vincular copias en Nexudus';
  };

  const isChargeDisabled = (item: ReportData) => {
    if (item.total === 0) return true;
    const enrichedUser = enrichedUsers[item.id];
    return !enrichedUser || !enrichedUser.nexudusUser;
  };

  const renderRow = (item: ReportData) => (
    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#f15a24] transition-colors">
            <User size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-white/80">{item.username}</p>
            <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
              {item.printUser}
            </p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5 text-center font-mono text-sm text-slate-600 dark:text-white/60">{item.a4Bw}</td>
      <td className="px-8 py-5 text-center font-mono text-sm font-bold text-indigo-500">{item.a4Color}</td>
      <td className="px-8 py-5 text-center font-mono text-sm text-slate-600 dark:text-white/60">{item.a3Bw}</td>
      <td className="px-8 py-5 text-center font-mono text-sm font-bold text-[#f15a24]">{item.a3Color}</td>
      <td className="px-8 py-5 text-center font-mono text-sm text-emerald-500/60">{item.sra3Bw}</td>
      <td className="px-8 py-5 text-center font-mono text-sm font-bold text-emerald-500">{item.sra3Color}</td>
      <td className="px-8 py-5 text-right">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-black text-sm">
          <FileText size={14} className="text-slate-400" />
          {item.total}
        </div>
      </td>
      <td className="px-8 py-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onDistribute?.(item.id, item.username, item)}
            disabled={isChargeDisabled(item)}
            title="Configurar reparto multi-cuenta"
            className={`p-3 rounded-xl transition-all active:scale-90 ${
              isChargeDisabled(item)
                ? 'bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-white/10 cursor-not-allowed'
                : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 shadow-indigo-500/10 shadow-sm'
            }`}
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={() => onCharge(item.id)}
            disabled={isChargeDisabled(item)}
            title={getChargeTooltip(item)}
            className={`p-3 rounded-xl transition-all active:scale-90 ${
              isChargeDisabled(item)
                ? 'bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-white/10 cursor-not-allowed'
                : 'bg-[#f15a24]/10 text-[#f15a24] hover:bg-[#f15a24] hover:text-white border border-[#f15a24]/20 shadow-[#f15a24]/20 shadow-sm'
            }`}
          >
            <Zap size={18} strokeWidth={2.5} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="overflow-hidden bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5">
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
              Usuario / ID Print
            </th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">
              A4 B/W
            </th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center text-indigo-500">
              A4 Color
            </th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">
              A3 B/W
            </th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center text-[#f15a24]">
              A3 Color
            </th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">
              SRA3 B/W
            </th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center text-emerald-500">
              SRA3 Color
            </th>
            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
              Total Copias
            </th>
            <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
              Vincular
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
          {visibleData.map(renderRow)}

          {hiddenData.length > 0 && (
            <>
              <tr className="bg-slate-50/30 dark:bg-white/[0.02]">
                <td colSpan={9} className="px-8 py-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowHidden(!showHidden)}
                      className="group flex items-center gap-3 px-6 py-2.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#f15a24]/50 dark:hover:border-[#f15a24]/50 transition-all shadow-sm active:scale-95"
                    >
                      <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#f15a24] transition-colors">
                        {showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-white/40 group-hover:text-slate-700 dark:group-hover:text-white transition-colors">
                        {showHidden
                          ? 'Ocultar usuarios sin actividad'
                          : `Mostrar ${hiddenData.length} usuarios sin actividad`}
                      </span>
                      <div className="text-slate-300 dark:text-white/10">
                        {showHidden ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>
                  </div>
                </td>
              </tr>
              {showHidden && hiddenData.map(renderRow)}
            </>
          )}

          {/* Summary Row */}
          <tr className="bg-slate-50/50 dark:bg-white/5 font-black border-t-2 border-slate-100 dark:border-white/5">
            <td className="px-8 py-6 text-xs uppercase tracking-widest text-slate-500 dark:text-white/40">
              Total Consumo Magma
            </td>
            <td className="px-8 py-6 text-center text-slate-700 dark:text-white">
              {data.reduce((acc, curr) => acc + curr.a4Bw, 0)}
            </td>
            <td className="px-8 py-6 text-center text-indigo-500">
              {data.reduce((acc, curr) => acc + curr.a4Color, 0)}
            </td>
            <td className="px-8 py-6 text-center text-slate-700 dark:text-white">
              {data.reduce((acc, curr) => acc + curr.a3Bw, 0)}
            </td>
            <td className="px-8 py-6 text-center text-[#f15a24]">
              {data.reduce((acc, curr) => acc + curr.a3Color, 0)}
            </td>
            <td className="px-8 py-6 text-center text-emerald-500/60">
              {data.reduce((acc, curr) => acc + curr.sra3Bw, 0)}
            </td>
            <td className="px-8 py-6 text-center text-emerald-500">
              {data.reduce((acc, curr) => acc + curr.sra3Color, 0)}
            </td>
            <td className="px-8 py-6 text-right">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                <BarChart3 size={16} />
                {data.reduce((acc, curr) => acc + curr.total, 0)}
              </div>
            </td>
            <td className="bg-white dark:bg-[#1a1818]" />
          </tr>
        </tbody>
      </table>
    </div>
  );
};
