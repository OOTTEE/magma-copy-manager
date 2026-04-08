import React, { useState, useEffect } from 'react';
import { Filter, Calendar, User, X, BarChart3 } from 'lucide-react';
import { api } from '../../../services/api';

interface SyncFiltersProps {
  onFilterChange: (filters: { userIds?: string[], months?: string[] }) => void;
}

/**
 * SyncFilters Component
 * 
 * Advanced filtering for synchronization history.
 */
export const SyncFilters: React.FC<SyncFiltersProps> = ({ onFilterChange }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  useEffect(() => {
    // Load users for the filter
    const loadUsers = async () => {
      try {
        const { data } = await api.GET("/api/v1/users/", {});
        setUsers((data as any) || []);
      } catch (err) {
        console.error("Error loading users for filters:", err);
      }
    };
    loadUsers();
  }, []);

  // Generate last 6 months for filtering
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7); // YYYY-MM
  });

  const handleApply = () => {
    onFilterChange({
      userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      months: selectedMonths.length > 0 ? selectedMonths : undefined
    });
  };

  const handleReset = () => {
    setSelectedUserIds([]);
    setSelectedMonths([]);
    onFilterChange({});
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(i => i !== month) : [...prev, month]
    );
  };

  const activeFiltersCount = selectedUserIds.length + selectedMonths.length;

  return (
    <div className="bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Filter size={18} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white/80">Filtros de Auditoría</h3>
        </div>
        
        {activeFiltersCount > 0 && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <X size={12} />
            Limpiar ({activeFiltersCount})
          </button>
        )}
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Filter */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <User size={12} />
            Filtrar por Usuarios
          </div>
          <div className="flex flex-wrap gap-2">
            {users.slice(0, 8).map(user => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                  selectedUserIds.includes(user.id)
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                    : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/20 border-transparent hover:border-slate-200"
                }`}
              >
                {user.username}
              </button>
            ))}
            {users.length > 8 && <span className="text-[10px] text-slate-300 dark:text-white/10 flex items-center">+{users.length - 8} más...</span>}
          </div>
        </div>

        {/* Month Filter */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Calendar size={12} />
            Filtrar por Meses
          </div>
          <div className="flex flex-wrap gap-2">
            {months.map(month => (
              <button
                key={month}
                onClick={() => toggleMonth(month)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                  selectedMonths.includes(month)
                    ? "bg-[#f15a24] text-white border-[#f15a24] shadow-lg shadow-[#f15a24]/20"
                    : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/20 border-transparent hover:border-slate-200"
                }`}
              >
                {new Date(month).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 py-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex justify-end">
        <button 
          onClick={handleApply}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-slate-800 dark:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <BarChart3 size={16} />
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};
