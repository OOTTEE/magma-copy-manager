import React, { useState, useEffect, useMemo } from 'react';
import { 
    Save, 
    Loader2, 
    AlertCircle, 
    Plus, 
    Minus, 
    CheckCircle2, 
    Info,
    LayoutGrid,
    Share2,
    Calculator,
    Zap
} from 'lucide-react';
import { api } from '../../../services/api';
import { NexudusAccountBadge } from '../../users/components/NexudusAccountBadge';

const ALL_COPY_TYPES = [
    { key: 'a4Bw', label: 'A4 B/N', color: 'slate' },
    { key: 'a4Color', label: 'A4 Color', color: 'indigo' },
    { key: 'a3Bw', label: 'A3 B/N', color: 'slate' },
    { key: 'a3Color', label: 'A3 Color', color: 'orange' },
    { key: 'sra3Bw', label: 'SRA3 B/N', color: 'emerald' },
    { key: 'sra3Color', label: 'SRA3 Color', color: 'teal' }, // Teal to contrast with SRA3 BW
];

interface Distribution {
    nexudusAccountId: string;
    type: string;
    quantity: number;
}

interface NexudusAccount {
    id: string;
    userId: string;
    nexudusUserId: string;
    isDefault: number;
}

interface DistributionDraftManagerProps {
    userId: string;
    consumption: Record<string, any>;
    onBalanceChange?: (isBalanced: boolean) => void;
    onSaveSuccess?: () => void;
}

export const DistributionDraftManager: React.FC<DistributionDraftManagerProps> = ({ 
    userId, 
    consumption,
    onBalanceChange,
    onSaveSuccess
}) => {
    const [accounts, setAccounts] = useState<NexudusAccount[]>([]);
    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [accountsRes, distRes] = await Promise.all([
                    api.GET('/api/v1/users/{id}/nexudus-accounts', { params: { path: { id: userId } } }),
                    api.GET("/api/v1/billing/distributions", { params: { query: { userId } } })
                ]);
                
                setAccounts((accountsRes.data as any) || []);
                setDistributions((distRes.data as any) || []);
            } catch (err) {
                setError("Error al cargar datos de reparto.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [userId]);

    // Calculate totals assigned per type
    const totals = useMemo(() => {
        const assigned: Record<string, number> = {};
        distributions.forEach(d => {
            assigned[d.type] = (assigned[d.type] || 0) + d.quantity;
        });

        // Check if balanced for all types with consumption > 0
        const relevantTypes = ALL_COPY_TYPES.filter(t => (consumption[t.key] || 0) > 0);
        let isAllBalanced = true;
        relevantTypes.forEach(type => {
            if (assigned[type.key] !== (consumption[type.key] || 0)) {
                isAllBalanced = false;
            }
        });

        // Corner case: Multi-account user MUST have some distribution
        if (accounts.length > 1 && distributions.length === 0 && relevantTypes.length > 0) {
            isAllBalanced = false;
        }

        return { assigned, isAllBalanced };
    }, [distributions, consumption, accounts]);

    // Notify parent about balance status
    useEffect(() => {
        onBalanceChange?.(totals.isAllBalanced);
    }, [totals.isAllBalanced, onBalanceChange]);

    const handleUpdateQuantity = (accountId: string, type: string, value: number) => {
        const newQty = Math.max(0, value);
        
        // Total reported consumption for this type
        const totalForType = consumption[type] || 0;
        
        // Quantity already distributed to OTHER accounts for this same type
        const otherAccountsQty = (totals.assigned[type] || 0) - (distributions.find(d => d.nexudusAccountId === accountId && d.type === type)?.quantity || 0);
        
        // Cap to total consumption
        const finalQty = (otherAccountsQty + newQty > totalForType) ? totalForType - otherAccountsQty : newQty;

        setDistributions(prev => {
            const filtered = prev.filter(d => !(d.nexudusAccountId === accountId && d.type === type));
            if (finalQty === 0) return filtered;
            return [...filtered, { nexudusAccountId: accountId, type, quantity: finalQty }];
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const { error: apiError } = await api.POST("/api/v1/billing/distributions", {
                body: { userId, distributions }
            });
            if (apiError) throw apiError;
            onSaveSuccess?.();
            setError(null);
        } catch (err: any) {
            setError(err.message || "Error al guardar el reparto.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAutoFill = () => {
        const defaultAcc = accounts.find(a => a.isDefault === 1) || accounts[0];
        if (!defaultAcc) return;

        const newDistributions: Distribution[] = [];
        ALL_COPY_TYPES.forEach(type => {
            if (consumption[type.key] > 0) {
                newDistributions.push({
                    nexudusAccountId: defaultAcc.id,
                    type: type.key,
                    quantity: consumption[type.key]
                });
            }
        });
        setDistributions(newDistributions);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Cargando borrador...</span>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 bg-slate-50/50 dark:bg-black/20">
            {/* Header / Summary */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-6 gap-3">
                    {ALL_COPY_TYPES.filter(t => (consumption[t.key] || 0) > 0).map(type => {
                        const isBalanced = (totals.assigned[type.key] || 0) === (consumption[type.key] || 0);
                        return (
                            <div key={type.key} className={`p-4 rounded-2xl border transition-all ${isBalanced ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{type.label}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-lg font-black ${isBalanced ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {totals.assigned[type.key] || 0}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">/ {consumption[type.key]}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className={`shrink-0 md:w-64 p-6 rounded-3xl border flex flex-col justify-center items-center text-center gap-2 transition-all ${totals.isAllBalanced ? 'bg-emerald-600 shadow-xl shadow-emerald-500/20 border-emerald-500' : 'bg-amber-500 shadow-xl shadow-amber-500/20 border-amber-400'}`}>
                    {totals.isAllBalanced ? (
                        <>
                            <CheckCircle2 size={32} className="text-white" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Balance Correcto</p>
                                <p className="text-white font-black text-xs">Listo para sincronizar</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Calculator size={32} className="text-white" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Balance Pendiente</p>
                                <p className="text-white font-black text-xs">Ajuste requerido</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Editor Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LayoutGrid size={18} className="text-indigo-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Distribución por Cuenta Nexudus</h3>
                    </div>
                    <button 
                        onClick={handleAutoFill}
                        className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-white flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 hover:bg-indigo-500 rounded-xl border border-indigo-500/10 transition-all hover:scale-105 active:scale-95"
                    >
                        <Zap size={12} />
                        Auto-llenar Remanente
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {accounts.map(account => (
                        <div key={account.id} className={`p-6 rounded-[2rem] border transition-all ${account.isDefault ? 'bg-white dark:bg-white/[0.04] border-indigo-500/30' : 'bg-white/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5'}`}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-center gap-4 min-w-[240px]">
                                    <div className={`p-3 rounded-2xl ${account.isDefault ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                                        <Share2 size={18} />
                                    </div>
                                    <div>
                                        <NexudusAccountBadge nexudusUserId={account.nexudusUserId} />
                                        {account.isDefault === 1 && (
                                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 block mt-1">Cuenta Principal</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-6">
                                    {ALL_COPY_TYPES.filter(type => (consumption[type.key] || 0) > 0).map(type => (
                                        <div key={type.key} className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase">{type.label}</label>
                                                {totals.assigned[type.key] > consumption[type.key] && (
                                                    <AlertCircle size={10} className="text-red-500" />
                                                )}
                                            </div>
                                            <div className="flex items-center bg-slate-100 dark:bg-black/40 rounded-xl p-1 border border-slate-200 dark:border-white/5 shadow-inner">
                                                <button 
                                                    onClick={() => handleUpdateQuantity(account.id, type.key, (distributions.find(d => d.nexudusAccountId === account.id && d.type === type.key)?.quantity || 0) - 1)}
                                                    className="p-1 hover:text-indigo-500 text-slate-400 transition-colors"
                                                ><Minus size={14} /></button>
                                                <input 
                                                    type="number"
                                                    value={distributions.find(d => d.nexudusAccountId === account.id && d.type === type.key)?.quantity ?? ''}
                                                    onChange={(e) => handleUpdateQuantity(account.id, type.key, parseInt(e.target.value || '0'))}
                                                    placeholder="0"
                                                    className="w-full bg-transparent border-none text-center text-xs font-black text-slate-700 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button 
                                                    onClick={() => handleUpdateQuantity(account.id, type.key, (distributions.find(d => d.nexudusAccountId === account.id && d.type === type.key)?.quantity || 0) + 1)}
                                                    className="p-1 hover:text-indigo-500 text-slate-400 transition-colors"
                                                ><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-start gap-3">
                    <Info className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold leading-relaxed max-w-lg">
                        Cualquier copia sin repartir aquí será facturada a la <strong className="text-indigo-500 uppercase">Cuenta Principal</strong> automáticamente si el saldo es cero. Utiliza este editor para <strong className="text-slate-600 dark:text-white/40">planificar repartos específicos</strong> antes de sincronizar.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-3 px-10 py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Borrador
                    </button>
                </div>
            </div>
        </div>
    );
};
