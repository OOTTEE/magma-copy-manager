import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    Plus,
    Trash2,
    Layers,
    Share2,
    AlertTriangle,
    FileText
} from 'lucide-react';
import { api } from '../../../services/api';
import { NexudusAccountBadge } from '../../users/components/NexudusAccountBadge';
import { useUserStore } from '../../../store/userStore';

export const ALL_COPY_TYPES = [
    { key: 'a4Bw', label: 'A4 B/N', color: 'slate' },
    { key: 'a4Color', label: 'A4 Color', color: 'indigo' },
    { key: 'a3Bw', label: 'A3 B/N', color: 'slate' },
    { key: 'a3Color', label: 'A3 Color', color: 'orange' },
    { key: 'sra3Bw', label: 'SRA3 B/N', color: 'emerald' },
    { key: 'sra3Color', label: 'SRA3 Color', color: 'teal' },
];

export interface CopyConsumption {
    a4Bw?: number;
    a4Color?: number;
    a3Bw?: number;
    a3Color?: number;
    sra3Bw?: number;
    sra3Color?: number;
}

interface DistributionEntry {
    id: string;
    userId: string;
    nexudusAccountId: string;
    month: string;
    type: string;
    quantity: number;
    concept?: string | null;
    createdAt: string;
}

interface NexudusAccount {
    id: string;
    userId: string;
    nexudusUserId: string;
    accountName?: string | null;
    isDefault: number;
}

interface DistributionDraftManagerProps {
    userId: string;
    consumption: CopyConsumption;
    period?: string; // YYYY-MM
    onBalanceChange?: (isBalanced: boolean) => void;
    onSaveSuccess?: () => void;
}

export const DistributionDraftManager: React.FC<DistributionDraftManagerProps> = ({
    userId,
    consumption,
    period,
    onBalanceChange,
    onSaveSuccess
}) => {
    const [accounts, setAccounts] = useState<NexudusAccount[]>([]);
    const [entries, setEntries] = useState<DistributionEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state for creating a new entry
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('a4Color');
    const [quantity, setQuantity] = useState<string>('');
    const [concept, setConcept] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { coworkers, fetchCoworkerById } = useUserStore();

    // Preload coworker names for accounts if not already cached
    useEffect(() => {
        accounts.forEach(acc => {
            if (acc.nexudusUserId && !acc.accountName) {
                fetchCoworkerById(acc.nexudusUserId);
            }
        });
    }, [accounts, fetchCoworkerById]);

    const getAccountDisplayName = useCallback((acc: NexudusAccount) => {
        if (acc.accountName) return acc.accountName;
        const cw = coworkers.find(c => c.id?.toString() === acc.nexudusUserId);
        if (cw?.fullName) return cw.fullName;
        return `Cuenta ${acc.nexudusUserId}`;
    }, [coworkers]);

    const defaultAccount = useMemo(() => accounts.find(a => a.isDefault === 1) || accounts[0], [accounts]);
    const secondaryAccounts = useMemo(() => accounts.filter(a => a.id !== defaultAccount?.id), [accounts, defaultAccount]);

    const getConsumptionValue = useCallback((key: string): number => {
        const val = (consumption as Record<string, unknown>)[key];
        return typeof val === 'number' ? val : 0;
    }, [consumption]);

    const totalPhysical = useMemo(() => {
        return ALL_COPY_TYPES.reduce((acc, t) => acc + getConsumptionValue(t.key), 0);
    }, [getConsumptionValue]);

    const totalAssigned = useMemo(() => {
        return entries.reduce((acc, e) => acc + (e.quantity || 0), 0);
    }, [entries]);

    const isOverAllocated = totalAssigned > totalPhysical;
    const remainder = Math.max(0, totalPhysical - totalAssigned);

    // Auto-select first secondary account when loaded
    useEffect(() => {
        if (secondaryAccounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(secondaryAccounts[0].id);
        }
    }, [secondaryAccounts, selectedAccountId]);

    // Notify parent about balance status
    useEffect(() => {
        onBalanceChange?.(!isOverAllocated);
    }, [isOverAllocated, onBalanceChange]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [accountsRes, entriesRes] = await Promise.all([
                api.GET('/api/v1/users/{id}/nexudus-accounts', { params: { path: { id: userId } } }),
                api.GET('/api/v1/billing/distributions', { 
                    params: { 
                        query: { 
                            userId,
                            ...(period ? { month: period } : {})
                        } 
                    } 
                })
            ]);

            setAccounts((accountsRes.data as unknown as NexudusAccount[]) || []);
            setEntries((entriesRes.data as unknown as DistributionEntry[]) || []);
        } catch {
            setError('Error al cargar el reparto de copias.');
        } finally {
            setIsLoading(false);
        }
    }, [userId, period]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedQty = parseInt(quantity, 10);
        if (!selectedAccountId || isNaN(parsedQty) || parsedQty <= 0) {
            setError('Indica una cuenta y una cantidad válida de copias.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await api.POST('/api/v1/billing/distributions/entries', {
                body: {
                    userId,
                    nexudusAccountId: selectedAccountId,
                    type: selectedType,
                    quantity: parsedQty,
                    concept: concept.trim() || undefined,
                    ...(period ? { month: period } : {})
                }
            });

            // Reset form inputs
            setQuantity('');
            setConcept('');
            await loadData();
            onSaveSuccess?.();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al guardar la asignación.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        setDeletingId(entryId);
        setError(null);
        try {
            await api.DELETE('/api/v1/billing/distributions/entries/{id}', {
                params: { path: { id: entryId } }
            });
            await loadData();
            onSaveSuccess?.();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al eliminar la partida.';
            setError(msg);
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading && accounts.length === 0) {
        return (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-indigo-500" size={28} />
                <span className="text-xs font-bold uppercase tracking-wider">Cargando reparto de copias...</span>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 bg-slate-50/50 dark:bg-black/20">
            {/* Header: Overview and Default Account Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Default Account Card (Passive Remainder) */}
                <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
                                <Share2 size={13} />
                                Cuenta Principal
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                Por defecto
                            </span>
                        </div>
                        {defaultAccount ? (
                            <div className="mt-1">
                                <NexudusAccountBadge nexudusUserId={defaultAccount.nexudusUserId} />
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">Sin cuenta configurada</p>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-white/40 mt-2 font-medium">
                            Absorbe automáticamente las copias no desviadas a cuentas secundarias.
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-baseline justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-white/60">Remanente previsto:</span>
                        <span className={`text-base font-black font-mono ${isOverAllocated ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            {remainder} <span className="text-[10px] font-normal text-slate-400">copias</span>
                        </span>
                    </div>
                </div>

                {/* Macro Balance & Status Card */}
                <div className={`p-5 rounded-2xl lg:col-span-2 border transition-all flex flex-col justify-between ${
                    isOverAllocated 
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30' 
                        : 'bg-white dark:bg-white/[0.03] border-slate-200/80 dark:border-white/5'
                }`}>
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                                Balance del Ciclo
                            </span>
                            {isOverAllocated ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                                    <AlertTriangle size={11} />
                                    Sobreasignado
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 size={11} />
                                    Equilibrado
                                </span>
                            )}
                        </div>

                        {/* Balance Numbers */}
                        <div className="grid grid-cols-3 gap-3 my-2">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Físico</p>
                                <p className="text-xl font-black font-mono text-slate-800 dark:text-white">{totalPhysical}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Asignadas a Secundarias</p>
                                <p className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{totalAssigned}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Remanente Principal</p>
                                <p className={`text-xl font-black font-mono ${isOverAllocated ? 'text-rose-500 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {remainder}
                                </p>
                            </div>
                        </div>

                        {isOverAllocated && (
                            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs font-semibold leading-relaxed">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                                <div>
                                    <p className="font-bold">Publicación bloqueada por sobreasignación (+{totalAssigned - totalPhysical} copias en exceso)</p>
                                    <p className="text-[11px] opacity-90 mt-0.5">
                                        Las partidas asignadas a cuentas secundarias superan las capturadas en la impresora. Al cerrar el mes se congelará la subida y se notificará al administrador hasta corregir el exceso.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Area: 2 Columns on desktop (Ledger Table + Add Entry Form) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Allocation Ledger Entries List */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80 flex items-center gap-2">
                            <Layers size={14} className="text-indigo-500" />
                            <span>Partidas en Cuentas Secundarias ({entries.length})</span>
                        </h4>
                    </div>

                    {entries.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 text-center flex flex-col items-center justify-center">
                            <FileText size={28} className="text-slate-300 dark:text-white/20 mb-2" />
                            <p className="text-xs font-bold text-slate-600 dark:text-white/70">No hay partidas registradas</p>
                            <p className="text-[11px] text-slate-400 dark:text-white/40 mt-1 max-w-sm">
                                Todo el consumo del período se asignará automáticamente a la cuenta principal sin necesidad de configuración.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 bg-slate-50 dark:bg-white/[0.01]">
                                        <th className="py-3 px-4">Cuenta Destino</th>
                                        <th className="py-3 px-3">Tipo</th>
                                        <th className="py-3 px-3 text-center">Copias</th>
                                        <th className="py-3 px-4">Concepto / Motivo</th>
                                        <th className="py-3 px-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                                    {entries.map(entry => {
                                        const account = accounts.find(a => a.id === entry.nexudusAccountId);
                                        const typeObj = ALL_COPY_TYPES.find(t => t.key === entry.type);
                                        const isDeleting = deletingId === entry.id;

                                        return (
                                            <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-4 font-bold text-slate-800 dark:text-white/90">
                                                    {account ? (
                                                        <NexudusAccountBadge nexudusUserId={account.nexudusUserId} />
                                                    ) : (
                                                        <span className="font-mono text-xs">{entry.nexudusAccountId}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70">
                                                        {typeObj?.label || entry.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">
                                                    {entry.quantity}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 dark:text-white/60 text-[11px]">
                                                    {entry.concept ? (
                                                        <span>{entry.concept}</span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-white/20 italic">Sin concepto</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry.id)}
                                                        disabled={isDeleting}
                                                        title="Eliminar partida"
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                                                    >
                                                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right: Quick Entry Registration Form */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Plus size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                Nueva Asignación In-Situ
                            </h4>
                            <p className="text-[10px] text-slate-400">Desvía copias hacia una cuenta secundaria</p>
                        </div>
                    </div>

                    {secondaryAccounts.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-center text-xs text-slate-400 font-medium">
                            No tienes cuentas secundarias registradas para repartir.
                        </div>
                    ) : (
                        <form onSubmit={handleCreateEntry} className="flex flex-col gap-3.5">
                            {/* Account Selector */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                    Cuenta Destino
                                </label>
                                <select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                    {secondaryAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="dark:bg-slate-900">
                                            {getAccountDisplayName(acc)} (ID: {acc.nexudusUserId})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Copy Type & Quantity (2 cols) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                        Modalidad
                                    </label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    >
                                        {ALL_COPY_TYPES.map(t => (
                                            <option key={t.key} value={t.key} className="dark:bg-slate-900">
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="Ej: 25"
                                        required
                                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-black font-mono text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Concept / Reason */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                    Concepto / Motivo <span className="font-normal text-slate-400">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={concept}
                                    onChange={(e) => setConcept(e.target.value)}
                                    placeholder="Ej: Planos obra Cliente X, dossier..."
                                    maxLength={100}
                                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !quantity || parseInt(quantity, 10) <= 0}
                                className="mt-1 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Registrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        <span>Registrar Asignación</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
