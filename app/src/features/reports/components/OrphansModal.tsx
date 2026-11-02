import React, { useState, useEffect } from 'react';
import { 
  X, 
  EyeOff, 
  Printer, 
  Loader2, 
  CheckCircle2, 
  HelpCircle
} from 'lucide-react';
import { useReportStore, type OrphanUser } from '../../../store/reportStore';

interface OrphansModalProps {
  isOpen: boolean;
  onClose: () => void;
  period?: string;
  periodName?: string;
}

export const OrphansModal: React.FC<OrphansModalProps> = ({
  isOpen,
  onClose,
  period,
  periodName
}) => {
  const { orphans, isLoadingOrphans, fetchOrphans, toggleUserIgnored } = useReportStore();
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cacheKey = period || 'all';
  const orphanList: OrphanUser[] = orphans[cacheKey] || [];

  useEffect(() => {
    if (isOpen) {
      fetchOrphans(period);
    }
  }, [isOpen, period, fetchOrphans]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSuccessMessage(null);
    onClose();
  };

  const handleIgnore = async (userId: string, username: string) => {
    setIgnoringId(userId);
    try {
      await toggleUserIgnored(userId, true);
      await fetchOrphans(period);
      setSuccessMessage(`Usuario "${username}" marcado como ignorado. No volverá a generar ruido en reportes.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      console.error('Error al ignorar usuario:', err);
    } finally {
      setIgnoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Printer size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                Usuarios de Impresora sin Vincular
              </h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                {periodName ? `Período: ${periodName}` : 'Todos los períodos'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informative Note */}
        <div className="mx-8 mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3 text-amber-700 dark:text-amber-400">
          <HelpCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            Estos usuarios registraron copias en la máquina pero <strong>no tienen cuenta Nexudus asignada</strong>. Para mantener la vista contable limpia, no se listan en el reporte mensual. Puedes marcarlos como <strong>Ignorados</strong> (ej. staff, limpieza o mantenimiento) para archivarlos de forma permanente.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mx-8 mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-bold animate-in fade-in duration-300">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-3">
          {isLoadingOrphans ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">Buscando usuarios sin vincular...</span>
            </div>
          ) : orphanList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-white/80">
                ¡Sin usuarios huérfanos!
              </p>
              <p className="text-xs text-slate-400 dark:text-white/40 max-w-sm mx-auto">
                Todos los usuarios con copias en este período están vinculados a Nexudus o archivados como ignorados.
              </p>
            </div>
          ) : (
            orphanList.map(user => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40 font-mono text-sm font-bold">
                    {(user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-white/90">
                      {user.username}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-wider">
                      Usuario físico: {user.printUser}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-black font-mono text-indigo-500">
                      {user.totalCopies ?? 0} copias
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-white/30">
                      Sin imputar
                    </p>
                  </div>

                  <button
                    onClick={() => handleIgnore(user.id, user.username)}
                    disabled={ignoringId === user.id}
                    title="Excluir permanentemente este usuario de los reportes de cobro"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-200/70 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-50"
                  >
                    {ignoringId === user.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <EyeOff size={13} />
                    )}
                    <span>Ignorar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
