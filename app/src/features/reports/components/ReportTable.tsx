import React from 'react';
import { User, FileText, BarChart3 } from 'lucide-react';

interface ReportData {
  userId: string;
  username: string;
  printUser: string;
  a4Color: number;
  a4Bw: number;
  a3Color: number;
  a3Bw: number;
  sra3Color: number;
  sra3Bw: number;
  total: number;
}

interface ReportTableProps {
  data: ReportData[];
}

/**
 * ReportTable Component
 * 
 * Detailed view for monthly copy accumulation. 
 * Categorized by size and color.
 */
export const ReportTable: React.FC<ReportTableProps> = ({ data }) => {
  return (
    <div className="overflow-hidden bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5">
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Usuario / ID Print</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">A4 B/W</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center text-indigo-500">A4 Color</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">A3 B/W</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center text-[#f15a24]">A3 Color</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center">SRA3 B/W</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 text-center text-emerald-500">SRA3 Color</th>
            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Total Copias</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
          {data.map((item) => (
            <tr key={item.userId} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#f15a24] transition-colors">
                    <User size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-white/80">{item.username}</p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">{item.printUser}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5 text-center font-mono text-sm text-slate-600 dark:text-white/60">{item.a4Bw}</td>
              <td className="px-8 py-5 text-center font-mono text-sm font-bold text-indigo-500">{item.a4Color}</td>
              <td className="px-8 py-5 text-center font-mono text-sm text-slate-600 dark:text-white/60">{item.a3Bw}</td>
              <td className="px-8 py-5 text-center font-mono text-sm font-bold text-[#f15a24]">{item.a3Color}</td>
              <td className="px-8 py-5 text-center font-mono text-sm text-emerald-500/60 ">{item.sra3Bw}</td>
              <td className="px-8 py-5 text-center font-mono text-sm font-bold text-emerald-500">{item.sra3Color}</td>
              <td className="px-8 py-5 text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-black text-sm">
                  <FileText size={14} className="text-slate-400" />
                  {item.total}
                </div>
              </td>
            </tr>
          ))}
          {/* Summary Row */}
          <tr className="bg-slate-50/50 dark:bg-white/5 font-black border-t-2 border-slate-100 dark:border-white/5">
            <td className="px-8 py-6 text-xs uppercase tracking-widest text-slate-500 dark:text-white/40">Total Consumo Magma</td>
            <td className="px-8 py-6 text-center text-slate-700 dark:text-white">{data.reduce((acc, curr) => acc + curr.a4Bw, 0)}</td>
            <td className="px-8 py-6 text-center text-indigo-500">{data.reduce((acc, curr) => acc + curr.a4Color, 0)}</td>
            <td className="px-8 py-6 text-center text-slate-700 dark:text-white">{data.reduce((acc, curr) => acc + curr.a3Bw, 0)}</td>
            <td className="px-8 py-6 text-center text-[#f15a24]">{data.reduce((acc, curr) => acc + curr.a3Color, 0)}</td>
            <td className="px-8 py-6 text-center text-emerald-500/60">{data.reduce((acc, curr) => acc + curr.sra3Bw, 0)}</td>
            <td className="px-8 py-6 text-center text-emerald-500">{data.reduce((acc, curr) => acc + curr.sra3Color, 0)}</td>
            <td className="px-8 py-6 text-right">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                    <BarChart3 size={16} />
                    {data.reduce((acc, curr) => acc + curr.total, 0)}
                </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
