import React, { useEffect, useState } from 'react';
import { X, Zap, AlertTriangle, Loader2, FileText, Share2, Check } from 'lucide-react';
import { api } from '../../../services/api';
import { NexudusAccountBadge } from '../../users/components/NexudusAccountBadge';

interface NexudusAccount {
  id: string;
  userId: string;
  nexudusUserId: string;
  isDefault: number;
  createdOn: string;
}

interface SimulationLine {
  concept: string;
  quantity: number;
}

interface SimulationResult {
  userId: string;
  username: string;
  period: { from: string; to: string };
  lines: SimulationLine[];
}

export interface NexudusCoworker {
  id?: number;
  fullName?: string;
  email?: string;
}

interface ChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string, nexudusAccountId?: string) => Promise<void>;
  data: SimulationResult | null;
  isLoadingData: boolean;
  isCharging: boolean;
  error: string | null;
}

export const ChargeModal: React.FC<ChargeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  isLoadingData,
  isCharging,
  error,
}) => {
  const [note, setNote] = useState('');
  const [accounts, setAccounts] = useState<NexudusAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const formatDateDDMMYYYY = (iso: string) => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  };

  const getDefaultNote = (
    period: { from: string; to: string } | undefined,
    lastSyncDate?: string | null
  ) => {
    if (!period) return '';
    
    // El inicio es la última vinculación o el inicio del ciclo
    const startDate = lastSyncDate || period.from;
    const endDate = new Date().toISOString();
    
    return `Periodo: ${formatDateDDMMYYYY(startDate)} - ${formatDateDDMMYYYY(endDate)}`;
  };

  // Reset note and fetch accounts when data changes
  useEffect(() => {
    if (data) {
      setNote(getDefaultNote(data.period, (data as any).lastSyncDate));
      
      const fetchAccounts = async () => {
        setIsLoadingAccounts(true);
        try {
          const { data: accs, error: apiError } = await api.GET("/api/v1/users/{id}/nexudus-accounts" as any, {
            params: { path: { id: data.userId } }
          });
          if (apiError) throw apiError;
          const typedAccs = accs as NexudusAccount[];
          setAccounts(typedAccs || []);
          const def = typedAccs?.find(a => a.isDefault === 1);
          if (def) setSelectedAccountId(def.id);
          else if (typedAccs?.length > 0) setSelectedAccountId(typedAccs[0].id);
        } catch (err) {
          console.error("Error fetching user accounts:", err);
        } finally {
          setIsLoadingAccounts(false);
        }
      };
      
      fetchAccounts();
    }
  }, [data]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCharging) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCharging, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  const totalQuantity = data?.lines.reduce((acc, l) => acc + l.quantity, 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isCharging && onClose()}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-[#1a1818] rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#f15a24]/10 text-[#f15a24] border border-[#f15a24]/20">
                <Zap size={22} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                  Vincular Copias
                </h2>
                {data && (
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mt-0.5">
                    {data.username}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isCharging}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-6">

            {/* Loading simulation */}
            {isLoadingData && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 size={36} className="text-[#f15a24] animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                  Calculando consumo...
                </p>
              </div>
            )}

            {/* Simulation lines */}
            {!isLoadingData && data && (
              <>
                {/* Period badge */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">
                  <span>Periodo:</span>
                  <span className="text-indigo-500">
                    {formatDate(data.period.from)} — {formatDate(data.period.to)}
                  </span>
                </div>

                {/* Lines */}
                <div className="space-y-2">
                  {data.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={14} className="text-slate-400 dark:text-white/20 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-white/70">
                          {line.concept}
                        </span>
                      </div>
                      <span className="font-black text-slate-800 dark:text-white font-mono text-sm">
                        {line.quantity} uds
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Quantity Helper */}
                <div className="flex items-center justify-between px-5 py-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Total calculado</span>
                  <span className="text-lg font-black text-indigo-500">{totalQuantity} uds</span>
                </div>

                {/* Account Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-2">
                    Cuenta Nexudus de Destino
                  </label>
                  {isLoadingAccounts ? (
                    <div className="flex items-center gap-2 px-5 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl animate-pulse">
                      <Loader2 size={14} className="animate-spin text-slate-300" />
                      <span className="text-xs font-bold text-slate-400">Cargando cuentas...</span>
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="flex items-center gap-3 px-5 py-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                      <AlertTriangle size={16} className="text-red-500" />
                      <p className="text-xs font-bold text-red-500">No hay cuentas Nexudus vinculadas.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {accounts.map(acc => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-all ${
                            selectedAccountId === acc.id 
                              ? 'bg-[#f15a24]/10 border-[#f15a24] text-[#f15a24] shadow-md shadow-[#f15a24]/5' 
                              : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-600 dark:text-white/40 hover:border-[#f15a24]/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Share2 size={14} className={selectedAccountId === acc.id ? 'text-[#f15a24]' : 'text-slate-400'} />
                            <div className="flex-1">
                              <NexudusAccountBadge nexudusUserId={acc.nexudusUserId} hideEmail />
                            </div>
                          </div>
                          {selectedAccountId === acc.id && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Note field */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                      Nota en Nexudus
                    </label>
                    <button 
                      onClick={() => setNote(getDefaultNote(data.period))}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                    >
                      Restablecer
                    </button>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={isCharging}
                    placeholder="Escribe una nota para Nexudus..."
                    className="w-full h-24 px-5 py-4 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-semibold text-slate-700 dark:text-white/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 px-5 py-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-500">{error}</p>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-8 pb-8">
            <button
              onClick={onClose}
              disabled={isCharging}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 transition-all disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(note, selectedAccountId)}
              disabled={isLoadingData || isCharging || !data || !!error || !selectedAccountId}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                !isCharging && data && !error && selectedAccountId
                  ? 'bg-[#f15a24] text-white shadow-lg shadow-[#f15a24]/30 hover:brightness-110'
                  : 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-white/30'
              }`}
            >
              {isCharging ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Vincular en Nexudus
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
