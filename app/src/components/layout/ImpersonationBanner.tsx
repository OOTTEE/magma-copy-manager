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
    <div className="sticky top-0 z-40 bg-amber-400 border-b-2 border-amber-500 shadow-md px-6 py-2.5 transition-all animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left Side: Badge + Context Text */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-amber-300 text-[11px] font-black tracking-wider uppercase shadow-sm shrink-0">
            <Eye size={14} className="text-amber-400 stroke-[2.5]" />
            <span>Modo Sombra</span>
          </div>

          <p className="text-xs md:text-sm text-slate-950 font-medium truncate">
            Viendo la aplicación como{' '}
            <strong className="font-extrabold text-black underline decoration-slate-900 underline-offset-2">
              {user}
            </strong>
            <span className="hidden sm:inline text-slate-900/80 ml-2">
              (las modificaciones se guardarán en su nombre)
            </span>
          </p>
        </div>

        {/* Right Side: Exit Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-white hover:text-amber-300 font-bold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <LogOut size={14} strokeWidth={2.5} />
            <span>Salir y volver a Administrador</span>
          </button>
        </div>
      </div>
    </div>
  );
};
