import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { LogIn, User, Lock, Loader2, AlertTriangle, KeyRound } from "lucide-react";
import { RecoveryRequestForm } from "./RecoveryRequestForm";
import { ResetPasswordForm } from "./ResetPasswordForm";

type AuthViewMode = 'login' | 'request_recovery' | 'reset_password';

/**
 * LoginForm Component
 *
 * Features:
 * - Glassmorphism UI with Tailwind v4
 * - Active brute-force defense handling (account lockout alerts)
 * - Self-service access recovery with single-use magic links
 * - Guided password reset flow
 */
export const LoginForm = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const recoveryToken = searchParams.get('recoveryToken');

    const [viewMode, setViewMode] = useState<AuthViewMode>('login');
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isAccountLocked, setIsAccountLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifyingRecovery, setIsVerifyingRecovery] = useState(false);
    const [verifiedUsername, setVerifiedUsername] = useState<string>("");

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    // Auto-detect and verify recoveryToken from email link
    useEffect(() => {
        if (recoveryToken) {
            const verifyToken = async () => {
                setIsVerifyingRecovery(true);
                setError(null);
                try {
                    const { data, error: apiError } = await api.POST('/api/v1/auth/recovery/verify', {
                        body: { token: recoveryToken }
                    });

                    if (apiError || !data) {
                        throw new Error((apiError as any)?.message || 'El enlace de acceso es inválido o ha caducado.');
                    }

                    // Log in the user atomically with verified tokens
                    login(
                        data.accessToken || '',
                        data.refreshToken || '',
                        data.username || '',
                        data.role || 'customer'
                    );

                    setVerifiedUsername(data.username || '');
                    setViewMode('reset_password');
                    // Clean URL query param without full page reload
                    setSearchParams({}, { replace: true });
                } catch (err: any) {
                    setError(err.message || 'El enlace de acceso es inválido o ha caducado.');
                    setViewMode('login');
                } finally {
                    setIsVerifyingRecovery(false);
                }
            };

            verifyToken();
        }
    }, [recoveryToken, login, setSearchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsAccountLocked(false);
        setIsLoading(true);

        try {
            const { data, error: apiError } = await api.POST("/api/v1/login/", {
                body: { username, password },
            });

            if (apiError) {
                const errObj = apiError as any;
                if (errObj.error_type === 'account_locked') {
                    setIsAccountLocked(true);
                }
                setError(errObj.message || "Usuario o contraseña incorrectos");
                return;
            }

            if (data && 'accessToken' in data && 'refreshToken' in data && 'role' in data) {
                const finalUsername = (data as any).username || username;
                login(data.accessToken as string, data.refreshToken as string, finalUsername, data.role as string);
                const destination = data.role === 'admin' ? "/reports" : "/dashboard";
                navigate(destination);
            }
        } catch (err) {
            setError("Ocurrió un error al intentar iniciar sesión. Revisa tu conexión.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifyingRecovery) {
        return (
            <div className="w-full max-w-md p-10 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={40} className="animate-spin text-amber-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">Verificando Enlace Seguro...</h3>
                <p className="text-xs text-white/50">Desbloqueando tu cuenta e iniciando sesión protegida</p>
            </div>
        );
    }

    if (viewMode === 'request_recovery') {
        return (
            <RecoveryRequestForm
                defaultUsername={username}
                onBackToLogin={() => setViewMode('login')}
            />
        );
    }

    if (viewMode === 'reset_password') {
        return <ResetPasswordForm username={verifiedUsername} />;
    }

    return (
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center mb-10">
                <div className="p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/50 mb-4">
                    <LogIn className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Magma System</h1>
                <p className="text-white/60 text-sm mt-2">Acceso exclusivo para administradores y clientes</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1" htmlFor="username">
                        Usuario
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            id="username"
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Introduce tu usuario"
                            autoComplete="username"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1" htmlFor="password">
                        Contraseña
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            autoComplete="current-password"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
                        />
                    </div>
                </div>

                {error && (
                    <div className={`p-4 rounded-2xl animate-in slide-in-from-top-2 text-xs leading-relaxed ${isAccountLocked ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200' : 'bg-red-500/20 border border-red-500/30 text-red-200'}`}>
                        {isAccountLocked ? (
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center gap-2 font-bold text-amber-300">
                                    <AlertTriangle size={16} />
                                    <span>Cuenta bloqueada por seguridad</span>
                                </div>
                                <p>{error}</p>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('request_recovery')}
                                    className="mt-1 px-3 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-colors cursor-pointer text-left flex items-center justify-between"
                                >
                                    <span>Desbloquear mediante enlace por correo</span>
                                    <KeyRound size={14} />
                                </button>
                            </div>
                        ) : (
                            <p className="text-center font-medium">{error}</p>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Entrar al sistema
                            <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={() => setViewMode('request_recovery')}
                        className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                        <KeyRound size={13} className="text-amber-400" />
                        ¿Olvidaste tu contraseña o tu cuenta está bloqueada?
                    </button>
                </div>
            </form>
        </div>
    );
};
