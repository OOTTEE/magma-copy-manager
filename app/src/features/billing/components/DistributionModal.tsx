import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, 
    Zap, 
    Save, 
    Loader2, 
    AlertCircle, 
    Plus, 
    Minus, 
    CheckCircle2, 
    Info,
    LayoutGrid,
    Share2
} from 'lucide-react';
import { api } from '../../../services/api';
import { NexudusAccountBadge } from '../../users/components/NexudusAccountBadge';

const COPY_TYPES = [
    { key: 'a4Bw', label: 'A4 B/N', color: 'slate' },
    { key: 'a4Color', label: 'A4 Color', color: 'indigo' },
    { key: 'a3Bw', label: 'A3 B/N', color: 'slate' },
    { key: 'a3Color', label: 'A3 Color', color: 'orange' },
];

interface Distribution {
    nexudusAccountId: string;
    type: string;
    quantity: number;
}

interface NexudusAccount {
    id?: string;
    userId?: string;
    nexudusUserId?: string;
    isDefault?: number;
    createdOn?: string;
}

interface DistributionModalProps {
    userId: string;
    username: string;
    totalConsumption: Record<string, number>;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

export const DistributionModal: React.FC<DistributionModalProps> = ({ 
    userId, 
    username, 
    totalConsumption, 
    onClose,
    onSaveSuccess
}) => {
    const [accounts, setAccounts] = useState<NexudusAccount[]>([]);
    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const defaultAccountId = useMemo(() => accounts.find(a => a.isDefault === 1)?.id, [accounts]);

    // Fetch account details and current distributions
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Accounts — use path param via openapi-fetch
                const { data: accountsData } = await api.GET('/api/v1/users/{id}/nexudus-accounts', {
                    params: { path: { id: userId } }
                });
                setAccounts((accountsData as any) || []);

                // 2. Fetch Existing Distributions
                const { data: distData } = await api.GET("/api/v1/billing/distributions", {
                    params: { query: { userId } }
                });
                setDistributions((distData as any) || []);
            } catch (err) {
                console.error("Failed to load distribution data:", err);
                setError("Error al cargar la información de reparto.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [userId]);

    // Calculate totals assigned per type
    const assignedTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        distributions.forEach(d => {
            if (d.type !== undefined) {
                totals[d.type] = (totals[d.type] || 0) + d.quantity;
            }
        });
        return totals;
    }, [distributions]);

    const handleUpdateQuantity = (accountId: string | undefined, type: string, delta: number) => {
        if (!accountId || !defaultAccountId) return;
        
        const isDefaultAccount = accountId === defaultAccountId;
        const currentQty = distributions.find(d => d.nexudusAccountId === accountId && d.type === type)?.quantity || 0;
        const totalForType = totalConsumption[type] || 0;
        const diff = delta; // In this modal delta is already the diff (+1 or -1 or user input diff)

        const newQty = Math.max(0, currentQty + diff);
        if (newQty === currentQty) return;

        setDistributions(prev => {
            const currentDistributions = [...prev];
            
            if (diff > 0) {
                // INCREMENT LOGIC
                if (isDefaultAccount) {
                    const currentTotalAssigned = assignedTotals[type] || 0;
                    const unassignedPool = Math.max(0, totalForType - currentTotalAssigned);
                    if (unassignedPool <= 0) return prev;

                    const actualIncrement = Math.min(diff, unassignedPool);
                    let found = false;
                    const nextDistributions = currentDistributions.map(d => {
                        if (d.nexudusAccountId === accountId && d.type === type) {
                            found = true;
                            return { ...d, quantity: d.quantity + actualIncrement };
                        }
                        return d;
                    });
                    if (!found) nextDistributions.push({ nexudusAccountId: accountId, type, quantity: actualIncrement });
                    return nextDistributions;
                } else {
                    const defaultDistIdx = currentDistributions.findIndex(d => d.nexudusAccountId === defaultAccountId && d.type === type);
                    const defaultQty = defaultDistIdx >= 0 ? currentDistributions[defaultDistIdx].quantity : 0;
                    if (defaultQty <= 0) return prev;

                    const actualIncrement = Math.min(diff, defaultQty);
                    let secondaryFound = false;
                    const nextDistributions = currentDistributions.map(d => {
                        if (d.nexudusAccountId === accountId && d.type === type) {
                            secondaryFound = true;
                            return { ...d, quantity: d.quantity + actualIncrement };
                        }
                        if (d.nexudusAccountId === defaultAccountId && d.type === type) {
                            return { ...d, quantity: d.quantity - actualIncrement };
                        }
                        return d;
                    }).filter(d => d.quantity > 0);

                    if (!secondaryFound) nextDistributions.push({ nexudusAccountId: accountId, type, quantity: actualIncrement });
                    return nextDistributions;
                }
            } else {
                // DECREMENT LOGIC
                return prev.map(d => {
                    if (d.nexudusAccountId === accountId && d.type === type) {
                        return { ...d, quantity: newQty };
                    }
                    return d;
                }).filter(d => d.quantity > 0);
            }
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
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al guardar el reparto.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-[#1a1818] p-10 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-orange-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preparando configuración de reparto...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#110f0f] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] border border-white/5 shadow-2xl flex flex-col relative">
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                                Distribuir Consumo
                            </h2>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest italic opacity-60">
                                {username} • Configuración de Facturación Granular
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    
                    {/* Summary Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {COPY_TYPES.map(type => (
                            <div key={type.key} className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{type.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black text-slate-800 dark:text-white">
                                        {assignedTotals[type.key] || 0}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">/ {totalConsumption[type.key] || 0}</span>
                                </div>
                                <div className="mt-3 w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full bg-orange-500 transition-all duration-500`} 
                                        style={{ width: `${Math.min(100, ((assignedTotals[type.key] || 0) / (totalConsumption[type.key] || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Distribution Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <LayoutGrid size={18} className="text-orange-500" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Asignación por Cuenta</h3>
                        </div>

                        {accounts.map(account => (
                            <div key={account.id} className={`p-6 rounded-[2rem] border transition-all ${account.isDefault ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white dark:bg-white/[0.02] border-white/5'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${account.isDefault ? 'bg-orange-500 text-white' : 'bg-slate-800 dark:bg-white/10 text-slate-400'}`}>
                                            <Share2 size={16} />
                                        </div>
                                        <div>
                                            <NexudusAccountBadge nexudusUserId={account.nexudusUserId || ''} />
                                            {account.isDefault === 1 && (
                                                <span className="text-[8px] font-black uppercase tracking-widest text-orange-500 block mt-1">
                                                    Predeterminada (Recibe el resto)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-px md:h-8 md:w-px bg-white/5" />
                                    <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                                        {COPY_TYPES.map(type => (
                                            <div key={type.key} className="flex flex-col items-center">
                                                <label className="text-[8px] font-black text-slate-400 uppercase mb-1">{type.label}</label>
                                                <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/5">
                                                    <button 
                                                        onClick={() => handleUpdateQuantity(account.id, type.key, -1)}
                                                        className="p-1 hover:text-white text-slate-500"
                                                    ><Minus size={14} /></button>
                                                    <input 
                                                        type="number"
                                                        value={distributions.find(d => d.nexudusAccountId === account.id && d.type === type.key)?.quantity || ''}
                                                        onChange={(e) => handleUpdateQuantity(account.id, type.key, parseInt(e.target.value || '0') - (distributions.find(d => d.nexudusAccountId === account.id && d.type === type.key)?.quantity || 0))}
                                                        placeholder="0"
                                                        className="w-12 bg-transparent border-none text-center text-xs font-black text-orange-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button 
                                                        onClick={() => handleUpdateQuantity(account.id, type.key, 1)}
                                                        disabled={account.id === defaultAccountId 
                                                            ? (assignedTotals[type.key] || 0) >= (totalConsumption[type.key] || 0)
                                                            : (distributions.find(d => d.nexudusAccountId === defaultAccountId && d.type === type.key)?.quantity || 0) <= 0
                                                         }
                                                        className="p-1 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 text-slate-500 transition-colors"
                                                    ><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 flex items-start gap-4">
                        <Info className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed font-medium">
                            <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] block mb-1">Nota sobre Synchronización</span>
                            Cualquier copia que <span className="text-indigo-400 font-black">no sea asignada manualmente</span> será facturada automáticamente a la <strong>Cuenta por Defecto</strong> durante el cierre de mes ejecutado por el administrador.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-black/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-left-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        {!error && (
                            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={14} /> Borrador listo para guardar
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button 
                            onClick={onClose}
                            className="flex-1 md:flex-none px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Guardar Reparto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
