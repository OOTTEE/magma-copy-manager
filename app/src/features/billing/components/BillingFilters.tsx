import { useState, useEffect } from 'react';
import { User, Calendar, X, Search, Check } from 'lucide-react';
import { api } from '../../../services/api';

interface BillingFiltersProps {
    onFilterChange: (filters: { userIds?: string[]; months?: string[] }) => void;
}

/**
 * BillingFilters Component
 * 
 * Provides multi-selection for users and natural months.
 * Follows premium aesthetics with animated menus.
 */
export const BillingFilters = ({ onFilterChange }: BillingFiltersProps) => {
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.GET("/api/v1/users", {});
                if (data) setAllUsers(data as any[]);
            } catch (err) {
                console.error("Error fetching users for filters:", err);
            }
        };
        fetchUsers();
    }, []);

    // Generate dynamic list of last 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d);
        return { 
            value: `${year}-${month}`, 
            label: label.charAt(0).toUpperCase() + label.slice(1) 
        };
    });

    const toggleUser = (userId: string) => {
        const newSelection = selectedUserIds.includes(userId)
            ? selectedUserIds.filter(id => id !== userId)
            : [...selectedUserIds, userId];
        setSelectedUserIds(newSelection);
        onFilterChange({ userIds: newSelection, months: selectedMonths });
    };

    const toggleMonth = (monthValue: string) => {
        const newSelection = selectedMonths.includes(monthValue)
            ? selectedMonths.filter(m => m !== monthValue)
            : [...selectedMonths, monthValue];
        setSelectedMonths(newSelection);
        onFilterChange({ userIds: selectedUserIds, months: newSelection });
    };

    const clearFilters = () => {
        setSelectedUserIds([]);
        setSelectedMonths([]);
        onFilterChange({ userIds: [], months: [] });
    };

    const filteredUsers = allUsers.filter(u => 
        u.username.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none">
            {/* User Multi-select */}
            <div className="relative">
                <button 
                   onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsMonthMenuOpen(false); }}
                   className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${selectedUserIds.length > 0 ? "border-indigo-500 bg-indigo-500/5 text-indigo-500" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:border-indigo-500/30"}`}
                >
                    <User size={18} />
                    <span className="text-sm font-bold">
                        {selectedUserIds.length === 0 ? "Todos los Usuarios" : `${selectedUserIds.length} Seleccionados`}
                    </span>
                </button>

                {isUserMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                        <div className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-[#1a1818] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl z-50 p-4 animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                            <div className="relative mb-4">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar usuario..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                {filteredUsers.length === 0 ? (
                                    <p className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">No hay resultados</p>
                                ) : (
                                    filteredUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => toggleUser(user.id)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group ${selectedUserIds.includes(user.id) ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-white/60"}`}
                                        >
                                            <span className="text-sm font-bold">{user.username}</span>
                                            {selectedUserIds.includes(user.id) ? (
                                                <Check size={14} />
                                            ) : (
                                                <div className="w-5 h-5 rounded-lg border border-slate-200 dark:border-white/10 group-hover:border-indigo-500/30 transition-colors" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Month Multi-select */}
            <div className="relative">
                <button 
                   onClick={() => { setIsMonthMenuOpen(!isMonthMenuOpen); setIsUserMenuOpen(false); }}
                   className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${selectedMonths.length > 0 ? "border-indigo-500 bg-indigo-500/5 text-indigo-500" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:border-indigo-500/30"}`}
                >
                    <Calendar size={18} />
                    <span className="text-sm font-bold">
                        {selectedMonths.length === 0 ? "Todos los Meses" : `${selectedMonths.length} Meses`}
                    </span>
                </button>

                {isMonthMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMonthMenuOpen(false)} />
                        <div className="absolute top-full left-0 mt-4 w-64 bg-white dark:bg-[#1a1818] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl z-50 p-4 animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                {months.map(month => (
                                    <button
                                        key={month.value}
                                        onClick={() => toggleMonth(month.value)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group ${selectedMonths.includes(month.value) ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-white/60"}`}
                                    >
                                        <span className="text-sm font-bold">{month.label}</span>
                                        {selectedMonths.includes(month.value) ? (
                                            <Check size={14} />
                                        ) : (
                                            <div className="w-5 h-5 rounded-lg border border-slate-200 dark:border-white/10 group-hover:border-indigo-500/30 transition-colors" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {(selectedUserIds.length > 0 || selectedMonths.length > 0) && (
                <button 
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-6 py-2 text-slate-400 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    <X size={14} />
                    Limpiar Filtros
                </button>
            )}
        </div>
    );
};
