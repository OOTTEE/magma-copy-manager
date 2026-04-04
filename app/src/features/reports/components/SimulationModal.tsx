import React from 'react';
import { 
  X, 
  Receipt, 
  User, 
  Calendar, 
  ArrowRight,
  Info,
  ShieldAlert,
  Download
} from 'lucide-react';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

interface SimulationLine {
  concept: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SimulationData {
  userId: string;
  username: string;
  period: { from: string; to: string };
  lines: SimulationLine[];
  total: number;
}

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SimulationData | null;
  onPersist?: (userId: string) => void;
}

/**
 * SimulationModal Component
 * 
 * Premium modal for displaying on-the-fly invoice calculations.
 * Features a clean, high-contrast design with glassmorphism touches.
 */
export const SimulationModal: React.FC<SimulationModalProps> = ({ 
  isOpen, 
  onClose, 
  data,
  onPersist 
}) => {
  const [showConfirm, setShowConfirm] = React.useState(false);
  
  if (!isOpen || !data) return null;

  const handleApply = () => {
    setShowConfirm(true);
  };

  const handleConfirmPersist = () => {
    onPersist?.(data.userId);
    setShowConfirm(false);
    onClose();
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1818] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Receipt size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Simulación de Factura</h2>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cálculo Efímero (No Persistente)
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-10 py-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* User & Period Info */}
          <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titular del Consumo</span>
              <div className="flex items-center gap-2 text-slate-700 dark:text-white/80 font-bold">
                <User size={14} className="text-indigo-500" />
                {data.username}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Periodo de Facturación</span>
              <div className="flex items-center gap-2 text-slate-700 dark:text-white/80 font-bold">
                <Calendar size={14} className="text-[#f15a24]" />
                {formatDate(data.period.from)} <ArrowRight size={10} className="mx-1 opacity-40" /> {formatDate(data.period.to)}
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 dark:text-white/90 uppercase tracking-widest flex items-center gap-2">
              <Info size={14} className="text-indigo-500" />
              Desglose de Conceptos
            </h3>
            
            <div className="border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-xs">Concepto</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Unidades</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Precio Ud.</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {data.lines.map((line, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-white/70 text-sm">{line.concept}</td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-slate-500 dark:text-slate-400">{line.quantity}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400">{line.unitPrice.toFixed(3)}€</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white/90 text-sm">{line.total.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-500/5 dark:bg-emerald-500/10">
                    <td colSpan={3} className="px-6 py-6 text-right font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 text-xs">Total Simulación</td>
                    <td className="px-6 py-6 text-right font-black text-emerald-600 dark:text-emerald-400 text-lg">{data.total.toFixed(2)}€</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Warnings */}
          <div className="flex gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400/80">
            <ShieldAlert size={20} className="shrink-0 mt-1" />
            <p className="text-xs font-medium leading-relaxed">
              Esta simulación se basa en las lecturas de Magma hasta el momento actual. 
              El total podría variar al cierre oficial del periodo si se realizan nuevas copias o se modifican las tarifas en ajustes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
          <button 
            disabled
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/20 font-bold text-sm cursor-not-allowed"
          >
            <Download size={18} />
            PDF (Pronto)
          </button>
          
          <button 
            onClick={handleApply}
            className="px-8 py-3 rounded-2xl bg-[#f15a24] text-white font-bold text-sm shadow-xl shadow-[#f15a24]/20 hover:scale-105 active:scale-95 transition-all"
          >
            Emitir Factura
          </button>
          
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-2xl bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Confirmation Overlay */}
      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmPersist}
        title="¿Emitir Factura Real?"
        message="Esta acción vinculará definitivamente las copias del periodo actual a una nueva factura. No podrás deshacerlo sin eliminar la factura manualmente."
        confirmText="Sí, Emitir Factura"
        variant="primary"
      />
    </div>
  );
};
