import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const ImpersonationBanner: React.FC = () => {
  const navigate = useNavigate();
  const { impersonatingFrom, user, stopImpersonation } = useAuthStore();

  if (!impersonatingFrom) return null;

  const handleExit = () => {
    stopImpersonation();
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-600/20 via-amber-500/15 to-orange-600/20 backdrop-blur-md border-b border-amber-500/30 px-6 py-2.5 transition-all animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left Side: Badge + Context Text */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide uppercase shadow-sm shrink-0 animate-pulse">
            <Eye size={14} className="text-amber-400" />
            <span>Modo Sombra</span>
          </div>

          <p className="text-xs md:text-sm text-amber-100/90 truncate">
            Viendo la aplicación como{' '}
            <strong className="font-bold text-white underline decoration-amber-400/50 underline-offset-2">
              {user}
            </strong>
            <span className="hidden sm:inline text-amber-200/60 ml-2">
              (las modificaciones se guardarán en su nombre)
            </span>
          </p>
        </div>

        {/* Right Side: Exit Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <LogOut size={14} strokeWidth={2.5} />
            <span>Salir y volver a Administrador</span>
          </button>
        </div>
      </div>
    </div>
  );
};
