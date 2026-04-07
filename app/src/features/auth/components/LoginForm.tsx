import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { LogIn, User, Lock, Loader2 } from "lucide-react";

/**
 * LoginForm Component
 * 
 * Features:
 * - Glassmorphism UI with Tailwind v4
 * - Real-time error handling
 * - Integration with auto-generated API client
 * - Redirects to dashboard on success
 */
export const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { data, error: apiError } = await api.POST("/api/v1/login/", {
                body: { username, password },
            });

            if (apiError) {
                // @ts-ignore - apiError is typed but might need better inference
                setError(apiError.message || "Usuario o contraseña incorrectos");
                return;
            }

            if (data && 'token' in data && 'role' in data) {
                login(data.token as string, username, data.role as string);
                navigate("/dashboard");
            }
        } catch (err) {
            setError("Ocurrió un error al intentar iniciar sesión. Revisa tu conexión.");
        } finally {
            setIsLoading(false);
        }
    };

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
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
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
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl animate-in slide-in-from-top-2">
                        <p className="text-sm text-red-200 text-center font-medium">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
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
            </form>
        </div>
    );
};
