import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    RefreshCw, 
    RotateCcw, 
    Lock, 
    Zap, 
    Layers, 
    Calendar
} from 'lucide-react';

interface SyncItem {
    id: string;
    type: string;
    quantity: number;
    nexudusSaleId: string;
    nexudusCoworkerId: string | null;
    nexudusAccountName?: string;
}

interface SyncRecord {
    userId: string;
    username: string;
    month: string;
    saleDate: string;
    totalQuantity: number;
    items: SyncItem[];
    nexudusCoworkerId: string | null;
    createdOn: string;
}

interface UserSyncAuditProps {
    userId: string;
    period: string; // YYYY-MM
    username?: string;
    onRollbackSuccess?: () => void;
}

/**
 * Checks if a natural calendar month for period (YYYY-MM) has elapsed.
 * Real billing executes on the last day of the month; after that, rollbacks are strictly locked.
 */
export function isPeriodClosed(periodMonth: string, referenceDate: Date = new Date()): boolean {
    if (!periodMonth || !/^\d{4}-\d{2}$/.test(periodMonth)) return false;
    const [yearStr, monthStr] = periodMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const endOfNaturalMonth = new Date(year, month, 0, 23, 59, 59, 999);
    return referenceDate.getTime() > endOfNaturalMonth.getTime();
}

export const UserSyncAudit: React.FC<UserSyncAuditProps> = ({
    userId,
    period,
    username,
    onRollbackSuccess
}) => {
    const [records, setRecords] = useState<SyncRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [pendingRollbackIds, setPendingRollbackIds] = useState<string[] | null>(null);

    const copyTypeLabels: Record<string, string> = {
        'A4_BW': 'A4 B/N',
        'A4_COLOR': 'A4 Color',
        'A3_BW': 'A3 B/N',
        'A3_COLOR': 'A3 Color',
        'SRA3_BW': 'SRA3 B/N',
        'SRA3_COLOR': 'SRA3 Color',
        'a4Bw': 'A4 B/N',
        'a4Color': 'A4 Color',
        'a3Bw': 'A3 B/N',
        'a3Color': 'A3 Color',
        'sra3Bw': 'SRA3 B/N',
        'sra3Color': 'SRA3 Color',
    };

    const fetchSyncSales = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: apiError } = await api.GET("/api/v1/billing/sync" as any, {
                params: {
                    query: {
                        userIds: [userId],
                        months: [period],
                        limit: 50
                    } as any
                }
            });

            if (apiError) {
                setError((apiError as any).message || 'Error al obtener ventas registradas');
                setRecords([]);
            } else if (data) {
                setRecords(((data as any).data || []) as SyncRecord[]);
            }
        } catch (err: any) {
            setError(err.message || 'Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId && period) {
            fetchSyncSales();
        }
    }, [userId, period]);

    const handleConfirmRollback = async () => {
        if (!pendingRollbackIds || pendingRollbackIds.length === 0) return;
        setIsRollingBack(true);
        try {
            const { error: apiError } = await api.DELETE("/api/v1/billing/sync/group" as any, {
                params: {
                    query: {
                        ids: pendingRollbackIds,
                        force: false
                    } as any
                }
            });

            if (apiError) {
                throw new Error((apiError as any).message || 'Error al revertir la venta');
            }

            setPendingRollbackIds(null);
            await fetchSyncSales();
            onRollbackSuccess?.();
        } catch (err: any) {
            setError(err.message || 'No se pudo revertir la venta.');
        } finally {
            setIsRollingBack(false);
        }
    };

    const totalSyncedPages = records.reduce((sum, r) => sum + r.totalQuantity, 0);

    return (
        <div className="p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Zap size={16} />
                    </span>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white/90">
                            Ventas Sincronizadas en Nexudus
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-white/40">
                            Cargos generados en la pasarela externa para el ciclo {period} {username ? `de ${username}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {records.length > 0 && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {totalSyncedPages} copias enviadas
                        </span>
                    )}

                    <button
                        onClick={fetchSyncSales}
                        disabled={isLoading}
                        title="Refrescar ventas"
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all disabled:opacity-40"
                    >
                        <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Closed Period Banner */}
            {records.length > 0 && records.every(r => isPeriodClosed((r.createdOn || r.saleDate || r.month || '').slice(0, 7))) && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                    <Lock size={16} className="shrink-0 text-amber-500" />
                    <div className="text-xs">
                        <span className="font-bold">Facturación consolidada e inmutable:</span>{' '}
                        El mes natural en el que se ejecutaron estas ventas ha finalizado. La facturación ya es irrevocable en Nexudus y no se permite deshacer la sincronización.
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                    <span className="text-xs">Consultando ventas de Nexudus...</span>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && records.length === 0 && !error && (
                <div className="py-8 text-center text-slate-400 dark:text-white/40">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-slate-300 dark:text-white/20" />
                    <p className="text-xs font-bold">No hay ventas registradas en Nexudus para este ciclo</p>
                    <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">
                        Las copias de este usuario aún no se han publicado en el sistema de facturación.
                    </p>
                </div>
            )}

            {/* List of Sync Sales */}
            {!isLoading && records.length > 0 && (
                <div className="flex flex-col gap-3">
                    {records.map((record, index) => {
                        const allItemIds = record.items.map(i => i.id);
                        const executionMonth = (record.createdOn || record.saleDate || record.month || '').slice(0, 7);
                        const isRecordLocked = isPeriodClosed(executionMonth);

                        return (
                            <div
                                key={`${record.userId}-${record.saleDate}-${index}`}
                                className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex flex-col gap-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={13} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-white/80">
                                            Sincronizado el {new Date(record.createdOn || record.saleDate).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Action button */}
                                    {isRecordLocked ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed">
                                            <Lock size={12} />
                                            <span>Mes Cerrado</span>
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setPendingRollbackIds(allItemIds)}
                                            disabled={isRollingBack}
                                            title="Anular venta en Nexudus y devolver copias a pendiente"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
                                        >
                                            <RotateCcw size={12} />
                                            <span>Deshacer Sincronización</span>
                                        </button>
                                    )}
                                </div>

                                {/* Items Breakdown */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                    {record.items.map(item => (
                                        <div
                                            key={item.id}
                                            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col gap-0.5"
                                        >
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                                <span>{copyTypeLabels[item.type] || item.type}</span>
                                                <span className="font-mono text-indigo-500">#{item.nexudusSaleId}</span>
                                            </div>
                                            <div className="text-sm font-black font-mono text-slate-800 dark:text-white/90">
                                                {item.quantity} copias
                                            </div>
                                            {item.nexudusAccountName && (
                                                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                                    <Layers size={9} />
                                                    <span className="truncate">{item.nexudusAccountName}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={pendingRollbackIds !== null}
                onClose={() => setPendingRollbackIds(null)}
                onConfirm={handleConfirmRollback}
                title="¿Deshacer sincronización de copias?"
                message={`Se eliminará la venta generada en Nexudus para este usuario en el ciclo ${period}. Las copias volverán al estado pendiente en Magma para poder ser reasignadas o revisadas.`}
                confirmText={isRollingBack ? "Revirtiendo..." : "Confirmar y Revertir"}
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};
