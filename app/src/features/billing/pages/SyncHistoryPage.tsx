import { useState, useEffect } from 'react';
import { useSyncStore } from '../../../store/syncStore';
import { SyncHistoryTable } from '../components/SyncHistoryTable';
import { SyncHistoryGrid } from '../components/SyncHistoryGrid';
import { SyncFilters } from '../components/SyncFilters';
import { Pagination } from '../../../components/Pagination';
import { SyncDetailModal } from '../../reports/components/SyncDetailModal';
import { api } from '../../../services/api';
import { 
    LayoutGrid, 
    Table as TableIcon, 
    RefreshCw, 
    Zap,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Trash2
} from 'lucide-react';

/**
 * SyncHistoryPage Component
 * 
 * Historical view of all synchronization events with Nexudus.
 * Provides transparency and direct traceability with the external billing system.
 */
export const SyncHistoryPage = () => {
    const { 
        records, 
        pagination,
        isLoading, 
        isRefreshing, 
        error, 
        stats,
        fetchRecords, 
        fetchStats,
        setPage,
        setFilters
    } = useSyncStore();
    
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [viewingSync, setViewingSync] = useState<any>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
    const [isForceDelete, setIsForceDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    useEffect(() => {
        fetchRecords();
        fetchStats();
    }, [fetchRecords, fetchStats]);

    const handleViewSync = async (id: string) => {
        try {
            const { data, error } = await api.GET("/api/v1/billing/sync/{id}" as any, {
                params: { path: { id } }
            });
            if (error) throw error;
            setViewingSync(data);
        } catch (err) {
            console.error("Error fetching sync details:", err);
        }
    };

    const handleDeleteSync = (id: string) => {
        setConfirmingDelete(id);
        setIsForceDelete(false); // Reset for each new deletion
    };

    const confirmRollback = async () => {
        if (!confirmingDelete) return;
        setIsDeleting(true);
        try {
            const { deleteRecord } = useSyncStore.getState();
            await deleteRecord(confirmingDelete, isForceDelete);
            setDeleteSuccess(true);
            setTimeout(() => {
                setConfirmingDelete(null);
                setDeleteSuccess(false);
                setIsForceDelete(false);
            }, 2000);
        } catch (err: any) {
            console.error("Rollback failed:", err);
            // Error is handled by store
        } finally {
            setIsDeleting(false);
        }
    };


    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Zap size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                            Auditoría Sync
                        </h1>
                        <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] mt-1 text-slate-400 dark:text-white/30">
                            Historial de sincronización con Nexudus
                            {isRefreshing && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full animate-in fade-in zoom-in duration-300">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span className="text-[10px] font-black">Actualizando</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-3 rounded-2xl transition-all ${viewMode === 'table' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 dark:text-white/20 hover:text-indigo-500"}`}
                    >
                        <TableIcon size={20} />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-3 rounded-2xl transition-all ${viewMode === 'grid' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 dark:text-white/20 hover:text-indigo-500"}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />
                    <button 
                        onClick={() => fetchRecords(true)}
                        disabled={isLoading}
                        className="p-3 text-slate-400 dark:text-white/20 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-8 text-emerald-500/5 group-hover:scale-110 transition-transform duration-500">
                        <CheckCircle2 size={120} strokeWidth={1} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-2">Total Páginas Vendidas (Mes Actual)</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {stats?.totalSalesThisMonth ?? 0}
                        </p>
                        <span className="text-[10px] font-black uppercase text-indigo-500">Unidades en Nexudus</span>
                    </div>
                </div>
                <div className="p-8 bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-500/5 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-8 text-amber-500/5 group-hover:scale-110 transition-transform duration-500">
                        <RefreshCw size={120} strokeWidth={1} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-2">Usuarios Pendientes de Sync</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {stats?.usersPendingSync ?? 0}
                        </p>
                        <span className="text-[10px] font-black uppercase text-amber-500">Requieren Acción</span>
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            <SyncFilters onFilterChange={setFilters} />

            {/* Main Content */}
            {isLoading && records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 size={48} className="text-indigo-500 animate-spin" />
                    <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">Cargando Histórico...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 p-10 bg-red-500/5 rounded-[3rem] border border-red-500/10 text-center">
                    <AlertCircle size={48} className="text-red-500/40 mb-4" />
                    <h3 className="text-xl font-bold text-red-500 mb-2">Error en el Listado</h3>
                    <p className="text-slate-400 dark:text-white/20 font-medium max-w-sm mb-8">{error}</p>
                    <button onClick={() => fetchRecords(true)} className="px-8 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all">
                        Intentar de nuevo
                    </button>
                </div>
            ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4 text-center bg-white dark:bg-white/5 rounded-[3rem] border border-slate-200 dark:border-white/5">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-white/10 mb-4 transition-transform hover:scale-110">
                        <Zap size={40} strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 dark:text-white/20">No se encontraron sincronizaciones</h3>
                    <p className="text-sm text-slate-400 dark:text-white/10 max-w-xs">Ajusta los filtros o sincroniza consumos desde el Reporte Mensual para ver el histórico.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {viewMode === 'table' ? (
                        <SyncHistoryTable 
                            data={records} 
                            onView={handleViewSync}
                            onDelete={handleDeleteSync}
                        />
                    ) : (
                        <SyncHistoryGrid 
                            data={records} 
                            onView={handleViewSync} 
                            onDelete={handleDeleteSync}
                        />
                    )}

                    <Pagination 
                        currentPage={pagination.current_page}
                        totalPages={pagination.total_pages}
                        totalRecords={pagination.total_records}
                        limit={pagination.limit}
                        onPageChange={setPage}
                    />
                </div>
            )}

            {/* Detail Modal */}
            <SyncDetailModal 
                isOpen={!!viewingSync}
                onClose={() => setViewingSync(null)}
                data={viewingSync}
            />

            {/* Rollback Confirmation Modal */}
            {confirmingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => !isDeleting && setConfirmingDelete(null)}
                    />
                    <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl p-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 overflow-hidden">
                        {deleteSuccess ? (
                            <div className="flex flex-col items-center text-center py-4 scale-in-center">
                                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Rollback Exitoso</h3>
                                <p className="text-slate-400 dark:text-white/40 font-bold uppercase tracking-widest text-[10px]">La sincronización ha sido revertida</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 rounded-3xl bg-red-500/10 text-red-500">
                                        <Trash2 size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Confirmar Rollback</h3>
                                        <p className="text-slate-400 dark:text-white/40 font-bold text-[10px] uppercase tracking-widest">Esta acción es irreversible</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-red-50 dark:bg-red-500/5 rounded-3xl border border-red-100 dark:border-red-500/10 mb-6">
                                    <p className="text-sm text-red-800 dark:text-red-400 font-bold leading-relaxed">
                                        Estás a punto de eliminar esta venta de Nexudus automáticamente y liberar las copias en Magma para que puedan ser refacturadas.
                                    </p>
                                </div>

                                {/* Force Option */}
                                <div 
                                    onClick={() => !isDeleting && setIsForceDelete(!isForceDelete)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer mb-8 flex items-center gap-4 ${isForceDelete ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400"}`}
                                >
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isForceDelete ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300 dark:border-white/20"}`}>
                                        {isForceDelete && <CheckCircle2 size={14} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black uppercase tracking-widest">Forzar borrado local</p>
                                        <p className="text-[10px] font-bold opacity-60">Ignorar errores de Nexudus (Ya borrado o facturado)</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        disabled={isDeleting}
                                        onClick={() => setConfirmingDelete(null)}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        disabled={isDeleting}
                                        onClick={confirmRollback}
                                        className={`flex-1 py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${isForceDelete ? "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600" : "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600"}`}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Ejecutando...
                                            </>
                                        ) : isForceDelete ? 'Forzar Borrado' : 'Confirmar Borrado'}
                                    </button>
                                </div>
                            </>
                        )}
                        
                        {/* Error message if store has one during this action */}
                        {!deleteSuccess && error && (
                             <div className="mt-6 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
                                <AlertCircle size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
