import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { useAuthStore } from "../store/authStore";
import { BrandLogo } from "../components/BrandLogo";

/**
 * DashboardLayout Component
 * 
 * Main layout for the authenticated area of Magma.
 * Composes the Sidebar, Header and the dynamic content area (Outlet).
 */
export const DashboardLayout = () => {
    const isVerifyingSession = useAuthStore((state) => state.isVerifyingSession);

    if (isVerifyingSession) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#f15a24]/20 blur-3xl animate-pulse rounded-full" />
                    <BrandLogo showText={true} className="h-16 relative animate-bounce" />
                </div>
                <p className="mt-8 text-white/20 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                    Verificando sesión segura
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
            {/* Navigational Sidebar: Always Dark */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar: Title & DarkMode Toggle */}
                <Header />

                {/* Main Dynamic Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
