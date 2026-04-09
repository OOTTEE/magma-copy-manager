import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
    Database, 
    RefreshCw, 
    Trash2, 
    CheckSquare, 
    Square, 
    AlertCircle, 
    Loader2, 
    Search, 
    History,
    CheckCircle2,
    Clock,
    User
} from 'lucide-react';

interface CopyRecord {
    id: string;
    userId: string;
    username: string;
    datetime: string;
    a4Bw: number;
    a4Color: number;
    a3Bw: number;
    a3Color: number;
    a4BwTotal: number;
    a4ColorTotal: number;
    a3BwTotal: number;
    a3ColorTotal: number;
    isSynced: boolean;
}

/**
 * MasterCopiesPage
 * 
 * Administrative view for managing raw copy logs.
 * Supports bulk deletion for data cleanup.
 */
export const MasterCopiesPage = () => {
    const [records, setRecords] = useState<CopyRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRecords = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const { data, error: apiError } = await api.GET("/api/v1/copies/" as any, {});
            if (apiError) throw apiError;
            setRecords((data as CopyRecord[]) || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Error al recuperar el historial maestro.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredRecords.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRecords.map(r => r.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`¿Estás seguro de borrar ${selectedIds.size} registros de copias permanentemente? Esto afectará a los reportes mensuales.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const { error: apiError } = await api.DELETE("/api/v1/copies/batch" as any, {
                body: { ids: Array.from(selectedIds) }
            });
            if (apiError) throw apiError;
            
            // Local cleanup
            setRecords(records.filter(r => !selectedIds.has(r.id)));
            setSelectedIds(new Set());
        } catch (err: any) {
            alert(err.message || 'Error al eliminar registros.');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredRecords = records.filter(record => 
        record.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-40">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-inner">
                        <History size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                            Historial Maestro
                        </h1>
                        <p className="text-sm font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mt-1">
                            Gestión técnica de registros de copias
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => fetchRecords(true)}
                        disabled={isLoading}
                        className="p-4 bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-500 rounded-2xl border border-slate-200 dark:border-white/5 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    
                    {selectedIds.size > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-3 px-6 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all animate-in slide-in-from-right-4"
                        >
                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            Borrar {selectedIds.size} Registros
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative group flex-1 max-w-md">
                    <div className="absolute inset-0 bg-[#f15a24]/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-all" />
                    <div className="relative flex items-center bg-white dark:bg-[#1a1818] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-3 shadow-sm transition-all group-focus-within:border-[#f15a24]/30">
                        <Search className="text-slate-400 mr-3" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar por usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 size={40} className="text-[#f15a24] animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recuperando registros crudos...</p>
                </div>
            ) : error ? (
                <div className="p-20 bg-red-500/5 rounded-[3rem] border border-red-500/10 text-center">
                    <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-white/60 font-bold">{error}</p>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="p-40 bg-slate-50 dark:bg-black/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5 text-center">
                    <Database size={40} className="text-slate-300 dark:text-white/10 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">No hay registros para mostrar</p>
                </div>
            ) : (
                <div className="overflow-hidden bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl animate-in fade-in duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                                    <th className="px-8 py-5 w-10">
                                        <button onClick={toggleSelectAll} className="text-indigo-500">
                                            {selectedIds.size === filteredRecords.length ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Usuario / Fecha</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 text-center">A4 B/W</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 text-center">A4 Color</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 text-center">A3 B/W</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 text-center">A3 Color</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {filteredRecords.map(record => (
                                    <tr 
                                        key={record.id} 
                                        onClick={() => toggleSelect(record.id)}
                                        className={`group cursor-pointer transition-colors ${selectedIds.has(record.id) ? 'bg-indigo-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'}`}
                                    >
                                        <td className="px-8 py-5">
                                            <div className={`${selectedIds.has(record.id) ? 'text-indigo-500' : 'text-slate-300 dark:text-white/10 group-hover:text-indigo-300'}`}>
                                                {selectedIds.has(record.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 dark:text-white/80 text-sm">{record.username}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase font-mono tracking-tight">{formatDate(record.datetime)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <p className="font-mono text-sm text-slate-600 dark:text-white/60 leading-none">{record.a4Bw > 0 ? `+${record.a4Bw}` : record.a4Bw}</p>
                                            <p className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase mt-1">Total: {record.a4BwTotal}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <p className="font-mono text-sm font-bold text-indigo-500 leading-none">{record.a4Color > 0 ? `+${record.a4Color}` : record.a4Color}</p>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-white/10 uppercase mt-1">Total: {record.a4ColorTotal}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <p className="font-mono text-sm text-slate-600 dark:text-white/60 leading-none">{record.a3Bw > 0 ? `+${record.a3Bw}` : record.a3Bw}</p>
                                            <p className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase mt-1">Total: {record.a3BwTotal}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <p className="font-mono text-sm font-bold text-[#f15a24] leading-none">{record.a3Color > 0 ? `+${record.a3Color}` : record.a3Color}</p>
                                            <p className="text-[9px] font-bold text-[#f15a24]/30 dark:text-white/10 uppercase mt-1">Total: {record.a3ColorTotal}</p>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {record.isSynced ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                    <CheckCircle2 size={10} />
                                                    Sincronizado
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                                    <Clock size={10} />
                                                    Pendiente
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
