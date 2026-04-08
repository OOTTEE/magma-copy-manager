import React, { useState } from 'react';
import { X, Share2, Search, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '../../../services/api';

interface User {
  id: string;
  username: string;
  printUser: string;
  nexudusUser: string;
  role: string;
}

interface LinkNexudusModalProps {
  user: User;
  onClose: () => void;
  onSave: (nexudusId: string) => Promise<void>;
}

/**
 * LinkNexudusModal Component
 * 
 * Specialized modal for bridging discovery between Magma and Nexudus.
 * Estética: Dark mode with glassmorphism and focus on search discovery.
 */
export const LinkNexudusModal: React.FC<LinkNexudusModalProps> = ({ user, onClose, onSave }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedCoworker, setSelectedCoworker] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSearchNexudus = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSelectedCoworker(null);
    try {
      const { data, error: apiError } = await api.GET("/api/v1/nexudus/coworkers", {
        params: {
          query: { search: searchTerm }
        }
      });

      if (apiError) throw apiError;
      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (err) {
      setSearchError("Error al buscar en Nexudus");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCoworker = (coworker: any) => {
    setSelectedCoworker(coworker);
    setSearchTerm(`${coworker.fullName} (${coworker.email})`);
    setShowSearchResults(false);
  };

  const handleLink = async () => {
    if (!selectedCoworker) return;
    
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(selectedCoworker.id.toString());
      onClose();
    } catch (err) {
      setSaveError("No se pudo completar la vinculación.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with extreme blur for focus */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121111] rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Decorative background gradient */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#f15a24]/10 to-transparent pointer-none" />

        {/* Header */}
        <div className="px-10 pt-10 pb-6 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#f15a24]/10 text-[#f15a24]">
                <Share2 size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
                  Vincular Nexudus
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f15a24] mt-0.5">
                  Identity Discovery Bridge
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-slate-600 dark:text-white/20 dark:hover:text-white rounded-2xl bg-slate-50 dark:bg-white/5 transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* User Context Info Card */}
          <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-xs">
              M
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500/50">Usuario Local</p>
              <p className="text-sm font-bold text-slate-700 dark:text-white/80">{user.username}</p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="px-10 py-6 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-2">
              Buscar Coworker en Nexudus
            </label>
            
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/10 group-focus-within:text-[#f15a24] transition-colors" size={18} strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Nombre, email o ID de Nexudus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchNexudus())}
                  autoComplete="off"
                  className="w-full pl-12 pr-6 py-4 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[#f15a24]/30 rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/10"
                />
              </div>
              <button
                type="button"
                onClick={handleSearchNexudus}
                disabled={isSearching || !searchTerm}
                className="px-6 bg-[#f15a24] text-white rounded-2xl transition-all shadow-lg shadow-[#f15a24]/20 hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:scale-100"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>

            {/* Results Dropdown Area */}
            {showSearchResults && (
              <div className="p-2 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-3xl space-y-1 max-h-56 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 fade-in duration-200">
                {searchResults.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs font-bold text-slate-400">No se encontraron resultados en Nexudus</p>
                  </div>
                ) : (
                  searchResults.map((coworker) => (
                    <button
                      key={coworker.id}
                      type="button"
                      onClick={() => handleSelectCoworker(coworker)}
                      className="w-full p-4 flex items-center justify-between hover:bg-white dark:hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-[#f15a24]/20"
                    >
                      <div className="text-left flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {coworker.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700 dark:text-white group-hover:text-[#f15a24]">
                            {coworker.fullName}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-white/30">
                            {coworker.email}
                          </p>
                        </div>
                      </div>
                      <Check size={16} className={`text-green-500 transition-opacity ${selectedCoworker?.id === coworker.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} />
                    </button>
                  ))
                )}
              </div>
            )}

            {searchError && (
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 px-3">
                <AlertCircle size={12} /> {searchError}
              </div>
            )}
          </div>
          
          {selectedCoworker && (
            <div className="p-6 rounded-[2rem] bg-green-500/5 border border-green-500/10 flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-500 text-white">
                            <UserLink size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Seleccionado para Vincular</p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-400">{selectedCoworker.fullName}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                    <span>NEXUDUS_ID: {selectedCoworker.id}</span>
                </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/40 flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedCoworker || isSaving}
            className="flex-[2] py-4 bg-[#f15a24] text-white hover:bg-[#f15a24]/90 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#f15a24]/30 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <ExternalLink size={16} />
                Vincular a Nexudus
              </>
            )}
          </button>
        </div>
        
        {saveError && (
          <div className="px-10 pb-6">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-1">
              {saveError}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal icon specifically for linking
const UserLink = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);
