import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';

interface ResetPasswordFormProps {
  username?: string;
  onFinish?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ username }) => {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const displayName = username || user || 'Usuario';
  const targetDestination = role === 'admin' ? '/reports' : '/dashboard';

  const handleSkip = () => {
    navigate(targetDestination);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: apiError } = await api.POST('/api/v1/auth/reset-password', {
        body: { newPassword },
      });

      if (apiError) {
        throw new Error((apiError as any).message || 'Error al actualizar la contraseña');
      }

      navigate(targetDestination);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          ¡Bienvenido de vuelta!
        </h1>
        <p className="text-emerald-300 text-xs font-semibold mt-1">
          Acceso verificado para {displayName}
        </p>
        <p className="text-white/60 text-xs mt-2">
          Tu cuenta ha sido desbloqueada. Te recomendamos definir una nueva contraseña segura ahora.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1" htmlFor="new-password">
            Nueva Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              id="new-password"
              type="password"
              required
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1" htmlFor="confirm-password">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !newPassword}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Guardar Contraseña y Continuar
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full py-2.5 text-xs text-white/40 hover:text-white transition-colors cursor-pointer text-center"
        >
          Omitir por ahora y acceder directamente
        </button>
      </form>
    </div>
  );
};
