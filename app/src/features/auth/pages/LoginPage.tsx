import { LoginForm } from "../components/LoginForm";
import loginBg from "../../../assets/login-bg.png";

/**
 * LoginPage
 * 
 * Main screen for authentication. 
 * Features a high-quality background image and a centered login panel.
 */
export const LoginPage = () => {
    return (
        <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src={loginBg}
                    alt="Coworking Space"
                    className="w-full h-full object-cover transition-transform duration-10000 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/40 to-indigo-950/60" />
                <div className="absolute inset-0 backdrop-blur-[2px]" />
            </div>

            {/* Content Layer (Panel) */}
            <div className="relative z-10 w-full flex justify-center">
                <LoginForm />
            </div>

            {/* Footer / Info */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-center">
                <p className="text-white/40 text-xs font-medium tracking-widest uppercase">
                    &copy; 2026 Magma Operations • Built for Premium Coworking
                </p>
            </div>
        </main>
    );
};
