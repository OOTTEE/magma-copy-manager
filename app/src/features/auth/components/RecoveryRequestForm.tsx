import React, { useState } from 'react';
import { Mail, User, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';

interface RecoveryRequestFormProps {
  onBackToLogin: () => void;
  defaultUsername?: string;
}

export const RecoveryRequestForm: React.FC<RecoveryRequestFormProps> = ({
  onBackToLogin,
  defaultUsername = '',
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const { error: apiError } = await api.POST('/api/v1/auth/recovery', {
        body: { username: username.trim() },
      });

      if (apiError) {
        throw new Error((apiError as any).message || 'Error al procesar la solicitud');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
            Enlace de Acceso Solicitado
          </h2>

          <p className="text-white/70 text-sm leading-relaxed mb-6">
            Si la cuenta <strong className="text-white">{username}</strong> está registrada y dispone de un correo electrónico válido, se ha enviado un enlace de acceso seguro.
          </p>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs mb-8 text-left">
            ⚠️ <strong>Importante:</strong> El enlace es de un solo uso y caduca en 15 minutos. Revisa tu buzón de entrada (o carpeta de spam).
          </div>

          <button
            onClick={onBackToLogin}
            className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center mb-8">
        <div className="p-4 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/30 mb-4 text-slate-950">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Recuperar Acceso</h1>
        <p className="text-white/60 text-xs mt-1 text-center">
          Desbloquea tu cuenta o accede mediante un enlace enviado a tu correo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1" htmlFor="recovery-username">
            Usuario
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              id="recovery-username"
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
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
          disabled={isLoading || !username.trim()}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Enviar enlace seguro a mi correo
              <Mail className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs text-white/60 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </button>
        </div>
      </form>
    </div>
  );
};
