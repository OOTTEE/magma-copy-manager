import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';
import { UserTable } from '../components/UserTable';
import { UserCard } from '../components/UserCard';
import { EditUserModal } from '../components/EditUserModal';
import { 
    LayoutGrid, 
    Table as TableIcon, 
    RefreshCw, 
    Search,
    Users as UsersIcon,
    Loader2,
    AlertCircle
} from 'lucide-react';

/**
 * UserAdminPage Component
 * 
 * Main administrative page for user management.
 */
export const UserAdminPage = () => {
    const { role } = useAuthStore();
    const { users, isLoading, error, fetchUsers, updateUser } = useUserStore();
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<any>(null);

    // 1. RoleGuard: Redirect if not admin
    if (role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleUpdateUser = async (updatedData: any) => {
        if (!editingUser) return;
        try {
            await updateUser(editingUser.id, updatedData);
            setEditingUser(null);
        } catch (err) {
            console.error("Error updating user:", err);
            throw err;
        }
    };

    const filteredUsers = users.filter(user => 
        (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.printUser?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.nexudusUser?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Page Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <UsersIcon size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                            Control de Usuarios
                        </h1>
                        <p className="text-sm font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mt-1">
                            Administración Global del Sistema
                        </p>
                    </div>
                </div>

                {/* View Controls & Tools */}
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-3 rounded-2xl transition-all ${viewMode === 'table' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 dark:text-white/20 hover:text-indigo-500"}`}
                        title="Vista de Tabla"
                    >
                        <TableIcon size={20} strokeWidth={2} />
                    </button>
                    <button 
                        onClick={() => setViewMode('cards')}
                        className={`p-3 rounded-2xl transition-all ${viewMode === 'cards' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 dark:text-white/20 hover:text-indigo-500"}`}
                        title="Vista de Tarjetas"
                    >
                        <LayoutGrid size={20} strokeWidth={2} />
                    </button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-white/5 mx-1" />
                    <button 
                        onClick={() => fetchUsers(true)}
                        disabled={isLoading}
                        className="p-3 text-slate-400 dark:text-white/20 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all disabled:opacity-50"
                        title="Refrescar Lista"
                    >
                        <RefreshCw size={20} strokeWidth={2} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="relative group max-w-xl">
                 <div className="absolute inset-0 bg-[#f15a24]/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                 <div className="relative flex items-center bg-white dark:bg-[#1a1818] border border-slate-200 dark:border-white/5 rounded-[2rem] px-6 py-4 transition-all group-focus-within:border-[#f15a24]/50 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <Search className="text-slate-400 dark:text-white/20 mr-4" size={20} strokeWidth={1.5} />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario, impresora o nexudus..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-none text-slate-700 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-white/10 outline-none"
                    />
                 </div>
            </div>

            {/* Content Area: Table, Cards or Loading/Error State */}
            {isLoading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 size={48} className="text-indigo-500 animate-spin" />
                    <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">Cargando Usuarios...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 p-10 bg-red-500/5 rounded-[3rem] border border-red-500/10 text-center">
                    <AlertCircle size={48} className="text-red-500/40 mb-4" />
                    <h3 className="text-xl font-bold text-red-500 mb-2">Error de Sincronización</h3>
                    <p className="text-slate-400 dark:text-white/20 font-medium max-w-sm mb-8">{error}</p>
                    <button onClick={() => fetchUsers(true)} className="px-8 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all">
                        Intentar de nuevo
                    </button>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 dark:bg-white/5 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5 text-center">
                    <Search size={48} className="text-slate-300 dark:text-white/10 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400 dark:text-white/20">No se encontraron resultados</h3>
                    <p className="text-slate-400 dark:text-white/10 text-xs">Ajusta tu búsqueda para encontrar lo que necesitas</p>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {viewMode === 'table' ? (
                        <UserTable users={filteredUsers} onEdit={setEditingUser} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredUsers.map(user => (
                                <UserCard key={user.id} user={user} onEdit={setEditingUser} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit User Floating Modal */}
            {editingUser && (
                <EditUserModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onSave={handleUpdateUser}
                />
            )}
        </div>
    );
};
