import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { UserAdminPage } from './features/users/pages/UserAdminPage';
import { MonthlyReportPage } from './features/reports/pages/MonthlyReportPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';

/**
 * Main Application Component
 * 
 * Configures the Router with the main layouts and protected areas.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes: Login with glassmorphism */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes: Under DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Index redirects to /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard Sections */}
            <Route 
              path="/dashboard" 
              element={
                <div className="space-y-6">
                  <div className="p-10 bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10 transition-all">
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                      ¡Bienvenido al Panel de Magma!
                    </h1>
                    <p className="mt-4 text-slate-500 dark:text-white/40 max-w-2xl leading-relaxed font-medium">
                      Desde aquí podrás gestionar el conteo de copias de tus clientes, 
                      generar reportes mensuales de facturación y sincronizar datos con Nexudus de forma automática.
                    </p>
                    <div className="mt-10 flex gap-4">
                        <button className="px-8 py-4 bg-[#f15a24] text-white rounded-2xl font-bold shadow-lg shadow-[#f15a24]/30 hover:scale-105 active:scale-95 transition-all">
                            Nueva Sincronización
                        </button>
                        <button className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                            Ver Reportes
                        </button>
                    </div>
                  </div>

                  {/* Quick Stats Placeholder */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                          <div key={i} className="h-48 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 animate-pulse" />
                      ))}
                  </div>
                </div>
              } 
            />
            
            {/* Admin-only Routes */}
            <Route element={<ProtectedRoute adminOnly />}>
              {/* User Administration */}
              <Route path="/users" element={<UserAdminPage />} />
              {/* Monthly Reports */}
              <Route path="/reports" element={<MonthlyReportPage />} />
              {/* System Settings */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all: Redirect to root/login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
