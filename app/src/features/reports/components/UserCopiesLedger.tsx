import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    RefreshCw, 
    FileText,
    TrendingUp
} from 'lucide-react';

interface CopyRecord {
    id?: string;
    datetime?: string;
    count?: {
        a4Color?: number;
        a4Bw?: number;
        a3Color?: number;
        a3Bw?: number;
    };
    total?: {
        a4Color?: number;
        a4Bw?: number;
        a3Color?: number;
        a3Bw?: number;
    };
    isSynced?: boolean;
}

interface UserCopiesLedgerProps {
    userId: string;
    period: string;
    username?: string;
}

export const UserCopiesLedger: React.FC<UserCopiesLedgerProps> = ({
    userId,
    period,
    username
}) => {
    const [copies, setCopies] = useState<CopyRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCopies = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: apiError } = await api.GET("/api/v1/users/{userId}/copies/", {
                params: {
                    path: { userId },
                    query: { period }
                }
            });

            if (apiError) {
                setError((apiError as any).message || 'Error al obtener el historial de copias');
                setCopies([]);
            } else if (data) {
                setCopies(data as CopyRecord[]);
            }
        } catch (err: any) {
            setError(err.message || 'Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId && period) {
            fetchCopies();
        }
    }, [userId, period]);

    // Sum totals of all records in this period
    const totalIncrement = copies.reduce((sum, c) => {
        const a4Bw = c.count?.a4Bw || 0;
        const a4Color = c.count?.a4Color || 0;
        const a3Bw = c.count?.a3Bw || 0;
        const a3Color = c.count?.a3Color || 0;
        return sum + a4Bw + a4Color + a3Bw + a3Color;
    }, 0);

    return (
        <div className="p-5 flex flex-col gap-4">
            {/* Header & Controls */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <FileText size={16} />
                    </span>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white/90">
                            Registro de Capturas de Impresora
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-white/40">
                            Lecturas físicas registradas durante el ciclo {period} {username ? `para ${username}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 border border-slate-200/60 dark:border-white/5">
                        {copies.length} {copies.length === 1 ? 'captura' : 'capturas'} · Total: +{totalIncrement}
                    </span>

                    <button
                        onClick={fetchCopies}
                        disabled={isLoading}
                        title="Recargar capturas"
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-8 text-slate-400 dark:text-white/40 gap-2 text-xs font-medium">
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                    <span>Cargando lecturas del período...</span>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && copies.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-white/30">
                    <Clock size={24} className="mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-600 dark:text-white/60">
                        Sin capturas de impresora registradas en este período
                    </p>
                    <p className="text-[11px] mt-0.5">
                        No se detectó ningún incremento de copias para este usuario entre las fechas del ciclo.
                    </p>
                </div>
            )}

            {/* Records List / Micro-Table */}
            {!isLoading && !error && copies.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/50 dark:bg-black/20">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200/60 dark:border-white/5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-white/30 bg-slate-50/50 dark:bg-white/[0.02]">
                                <th className="py-2.5 px-4">Fecha y Hora</th>
                                <th className="py-2.5 px-4 text-center">Incremento</th>
                                <th className="py-2.5 px-4">Desglose de Formatos</th>
                                <th className="py-2.5 px-4 text-center">Contador Acumulado</th>
                                <th className="py-2.5 px-4 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                            {copies.map((c, idx) => {
                                const dt = c.datetime ? new Date(c.datetime) : null;
                                const dateStr = dt ? dt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'N/D';
                                const timeStr = dt ? dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
                                
                                const a4Bw = c.count?.a4Bw || 0;
                                const a4Color = c.count?.a4Color || 0;
                                const a3Bw = c.count?.a3Bw || 0;
                                const a3Color = c.count?.a3Color || 0;
                                const rowTotal = a4Bw + a4Color + a3Bw + a3Color;

                                const totA4Bw = c.total?.a4Bw || 0;
                                const totA4Color = c.total?.a4Color || 0;
                                const totA3Bw = c.total?.a3Bw || 0;
                                const totA3Color = c.total?.a3Color || 0;
                                const cumulativeTotal = totA4Bw + totA4Color + totA3Bw + totA3Color;

                                return (
                                    <tr key={c.id || idx} className="hover:bg-indigo-50/20 dark:hover:bg-white/[0.02] transition-colors">
                                        {/* Date and Time */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-800 dark:text-white/90">
                                                    {dateStr}
                                                </span>
                                                <span className="font-mono text-[10px] text-slate-400 dark:text-white/40">
                                                    {timeStr}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Total Increment */}
                                        <td className="py-3 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                                <TrendingUp size={11} />
                                                +{rowTotal}
                                            </span>
                                        </td>

                                        {/* Breakdown Details */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2 flex-wrap font-mono text-[10px]">
                                                {a4Bw > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70">
                                                        {a4Bw} A4 BN
                                                    </span>
                                                )}
                                                {a4Color > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                                        {a4Color} A4 Color
                                                    </span>
                                                )}
                                                {a3Bw > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70">
                                                        {a3Bw} A3 BN
                                                    </span>
                                                )}
                                                {a3Color > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                                        {a3Color} A3 Color
                                                    </span>
                                                )}
                                                {rowTotal === 0 && (
                                                    <span className="text-slate-400 dark:text-white/30 italic">
                                                        Sin incremento
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Cumulative Snapshot */}
                                        <td className="py-3 px-4 text-center">
                                            <span className="font-mono text-[11px] text-slate-500 dark:text-white/40">
                                                {cumulativeTotal.toLocaleString()}
                                            </span>
                                        </td>

                                        {/* Sync Status Badge */}
                                        <td className="py-3 px-4 text-right">
                                            {c.isSynced ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 size={11} />
                                                    Facturado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                    <Clock size={11} />
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
