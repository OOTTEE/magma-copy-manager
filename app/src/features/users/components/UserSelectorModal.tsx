import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useUserStore } from '../../../store/userStore';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../services/api';

interface UserSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSelectorModal: React.FC<UserSelectorModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { users, isLoading, fetchUsers } = useUserStore();
  const startImpersonation = useAuthStore((state) => state.startImpersonation);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setErrorMessage(null);
      setIsSubmittingId(null);
      fetchUsers();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, fetchUsers]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter only customers and apply search query
  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return users
      .filter((u) => u.role !== 'admin')
      .filter((u) => {
        if (!query) return true;
        const usernameMatch = u.username?.toLowerCase().includes(query);
        const printUserMatch = u.printUser?.toLowerCase().includes(query);
        const nexudusUserMatch = u.nexudusUser?.toLowerCase().includes(query);
        return Boolean(usernameMatch || printUserMatch || nexudusUserMatch);
      });
  }, [users, searchTerm]);

  const handleSelectUser = async (userItem: any) => {
    if (isSubmittingId) return;

    setIsSubmittingId(userItem.id);
    setErrorMessage(null);

    try {
      const { data, error } = await api.POST('/api/v1/auth/impersonate', {
        body: { userId: userItem.id }
      });

      if (error || !data) {
        throw new Error((error as any)?.message || 'No se pudo iniciar el modo sombra');
      }

      startImpersonation(
        data.accessToken || '',
        data.refreshToken || '',
        data.username || userItem.username,
        data.role || 'customer'
      );

      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to impersonate user:', err);
      setErrorMessage(err.message || 'Error al iniciar modo sombra');
      setIsSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#181515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-md w-full h-[520px] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Ver como usuario</h3>
              <p className="text-xs text-white/40">Accede al espacio de un coworker en Modo Sombra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/5 bg-black/20">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, usuario o print..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Scrollable User List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/40">
              <Loader2 size={24} className="animate-spin text-amber-500" />
              <span className="text-xs">Cargando coworkers...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-white/30 p-6 text-center">
              <User size={32} className="opacity-20" />
              <p className="text-sm font-medium">No se encontraron usuarios</p>
              <p className="text-xs text-white/20">
                {searchTerm ? 'Prueba con otro término de búsqueda' : 'No hay clientes registrados en el sistema'}
              </p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = isSubmittingId === u.id;
              return (
                <button
                  key={u.id}
                  disabled={Boolean(isSubmittingId)}
                  onClick={() => handleSelectUser(u)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-xl text-left transition-all group
                    ${isSelected ? 'bg-amber-500/20 border border-amber-500/30' : 'hover:bg-white/5 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                      {u.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                        {u.username}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-white/40 truncate">
                        {u.printUser && <span>Print: {u.printUser}</span>}
                        {u.nexudusUser && (
                          <>
                            <span>•</span>
                            <span className="truncate">Nex: {u.nexudusUser}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    {isSelected ? (
                      <Loader2 size={16} className="animate-spin text-amber-400" />
                    ) : (
                      <div className="p-1.5 rounded-lg text-white/20 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-all">
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/5 bg-black/30 flex items-center justify-between text-[11px] text-white/30 px-4">
          <span>{filteredUsers.length} coworkers disponibles</span>
          <span>Pulsa Escape para salir</span>
        </div>
      </div>
    </div>
  );
};
