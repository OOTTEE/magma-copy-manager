import React from 'react';
import { User } from 'lucide-react';

interface ReportData {
  id: string;
  username: string;
  printUser: string;
  a4Color: number;
  a4Bw: number;
  a3Color: number;
  a3Bw: number;
  total: number;
}

interface ReportCardProps {
  item: ReportData;
  onSimulate?: (userId: string) => void;
  onViewSync?: (syncId: string) => void;
  syncStatus?: { synced: boolean, id?: string } | null;
}

/**
 * ReportCard Component
 * 
 * Grid item for monthly user consumption. 
 * Shows a breakdown by category with high visual impact.
 */
export const ReportCard: React.FC<ReportCardProps> = ({ 
  item, 
  onSimulate, 
  onViewSync, 
  syncStatus 
}) => {
  const colorTotal = item.a4Color + item.a3Color;
  const colorPercentage = item.total > 0 ? (colorTotal / item.total) * 100 : 0;

  return (
    <div className="group bg-white dark:bg-[#1a1818] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-2xl transition-all duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-[#f15a24]/10 group-hover:text-[#f15a24] transition-all">
          <User size={28} strokeWidth={1} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">{item.username}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">{item.printUser}</p>
        </div>
      </div>

      {/* Progress / Status Bar */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
          <span>Mix Color</span>
          <span className="text-indigo-500">{Math.round(colorPercentage)}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-[#f15a24] transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/20"
            style={{ width: `${colorPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-1">A4 Total</p>
            <p className="text-lg font-black text-slate-700 dark:text-white">{item.a4Bw + item.a4Color}</p>
            <div className="mt-2 flex gap-1 h-1">
                <div className="flex-1 bg-slate-300 dark:bg-white/10 rounded-full" />
                <div className="flex-1 bg-indigo-400 rounded-full" />
            </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-1">A3 Total</p>
            <p className="text-lg font-black text-slate-700 dark:text-white">{item.a3Bw + item.a3Color}</p>
            <div className="mt-2 flex gap-1 h-1">
                <div className="flex-1 bg-slate-300 dark:bg-white/10 rounded-full" />
                <div className="flex-1 bg-[#f15a24]/60 rounded-full" />
            </div>
        </div>
      </div>

      {/* Footer Total & Actions */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Total Copias</span>
            <span className="text-2xl font-black text-indigo-500 tracking-tighter">{item.total}</span>
        </div>
        
        {syncStatus?.synced ? (
          <button 
            onClick={() => syncStatus.id && onViewSync?.(syncStatus.id)}
            className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 border border-emerald-400/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Sincronizado
          </button>
        ) : (
          <button 
            onClick={() => onSimulate?.(item.id)}
            disabled={item.total === 0}
            className={`px-6 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all ${
              item.total === 0
                ? "bg-slate-200 text-slate-400 dark:bg-white/5 dark:text-white/20 cursor-not-allowed opacity-50 grayscale"
                : "bg-indigo-500 text-white shadow-indigo-500/20 hover:scale-105 active:scale-95"
            }`}
            title={item.total === 0 ? "No hay consumos registrados para sincronizar" : "Sincronizar con Nexudus"}
          >
            Sincronizar
          </button>
        )}
      </div>
    </div>
  );
};
