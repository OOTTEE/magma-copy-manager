import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";

/**
 * DashboardLayout Component
 * 
 * Main layout for the authenticated area of Magma.
 * Composes the Sidebar, Header and the dynamic content area (Outlet).
 */
export const DashboardLayout = () => {
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
