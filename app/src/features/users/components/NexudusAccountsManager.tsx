import React, { useEffect, useState } from 'react';
import { Share2, Plus, Trash2, CheckCircle2, Search, Loader2, X, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { NexudusAccountBadge } from './NexudusAccountBadge';

export interface NexudusCoworker {
  id?: number;
  fullName?: string;
  email?: string;
}

interface NexudusAccount {
  id: string;
  userId: string;
  nexudusUserId: string;
  isDefault: number;
  createdOn: string;
}

interface NexudusAccountsManagerProps {
  userId: string;
  username: string;
}

export const NexudusAccountsManager: React.FC<NexudusAccountsManagerProps> = ({ userId }) => {
  const [accounts, setAccounts] = useState<NexudusAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NexudusCoworker[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const { data, error: apiError } = await api.GET("/api/v1/users/{id}/nexudus-accounts" as any, {
        params: { path: { id: userId } }
      });
      if (apiError) throw apiError;
      setAccounts(data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [userId]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const { data, error: apiError } = await api.GET("/api/v1/nexudus/coworkers", {
        params: { query: { search: searchTerm } }
      });
      if (apiError) throw apiError;
      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (err) {
      setError("Error al buscar en Nexudus");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddAccount = async (nexudusUserId: string) => {
    setError(null);
    try {
      const { error: apiError } = await api.POST("/api/v1/users/{id}/nexudus-accounts" as any, {
        params: { path: { id: userId } },
        body: { nexudusUserId }
      });
      if (apiError) throw apiError;
      setIsAdding(false);
      setSearchTerm('');
      setShowSearchResults(false);
      fetchAccounts();
    } catch (err) {
      setError("Error al vincular cuenta");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("¿Estás seguro de desvincular esta cuenta?")) return;
    try {
      const { error: apiError } = await api.DELETE("/api/v1/users/{id}/nexudus-accounts/{accountId}" as any, {
        params: { path: { id: userId, accountId } }
      });
      if (apiError) throw apiError;
      fetchAccounts();
    } catch (err) {
      setError("Error al eliminar cuenta");
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const { error: apiError } = await api.PATCH("/api/v1/users/{id}/nexudus-accounts/{accountId}/default" as any, {
        params: { path: { id: userId, accountId } }
      });
      if (apiError) throw apiError;
      fetchAccounts();
    } catch (err) {
      setError("Error al cambiar cuenta predeterminada");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
            <Share2 size={20} />
          </div>
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white/80">Cuentas Nexudus Vincualdas</h4>
        </div>
        {!isAdding && (
          <button 
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
          >
            <Plus size={14} /> Añadir Cuenta
          </button>
        )}
      </div>

      {isAdding && (
        <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-[2rem] border border-orange-500/20 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-orange-500">Vincular Nueva Cuenta</label>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/10 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Busca por nombre o ID de Nexudus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-white/5 border border-transparent focus:border-orange-500/30 rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !searchTerm}
              className="px-6 bg-slate-800 dark:bg-white/10 hover:bg-orange-500 text-white rounded-2xl transition-all disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </div>

          {showSearchResults && (
            <div className="mt-4 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
              {searchResults.length === 0 ? (
                <p className="text-center py-4 text-xs font-bold text-slate-400">Sin resultados</p>
              ) : (
                searchResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleAddAccount(c.id!.toString())}
                    className="w-full p-3 flex items-center justify-between hover:bg-white dark:hover:bg-white/5 rounded-xl border border-transparent hover:border-orange-500/20 transition-all"
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700 dark:text-white">{c.fullName}</p>
                      <p className="text-[10px] text-slate-400">{c.email} (ID: {c.id})</p>
                    </div>
                    <Plus size={14} className="text-orange-500" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
      ) : accounts.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
          <p className="text-xs font-bold text-slate-400 italic">No hay cuentas alternativas vinculadas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div 
              key={acc.id}
              className={`p-5 bg-white dark:bg-[#1f1d1d] rounded-2xl border transition-all flex items-center justify-between group ${acc.isDefault ? 'border-orange-500 shadow-lg shadow-orange-500/5' : 'border-slate-100 dark:border-white/5'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${acc.isDefault ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                  <Share2 size={16} />
                </div>
                <div>
                  <div className="flex-1 min-w-0">
                    <NexudusAccountBadge nexudusUserId={acc.nexudusUserId} />
                    {acc.isDefault === 1 && (
                      <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">Predeterminada</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">Vinculada el: {new Date(acc.createdOn).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {acc.isDefault === 0 && (
                  <button 
                    type="button"
                    onClick={() => handleSetDefault(acc.id)}
                    className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"
                    title="Hacer predeterminada"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Desvincular"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 px-3">
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  );
};
