import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { useEffect } from 'react';
import { api } from './services/api';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';

import { UserAdminPage } from './features/users/pages/UserAdminPage';
import { MonthlyReportPage } from './features/reports/pages/MonthlyReportPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { InvoicesPage } from './features/billing/pages/InvoicesPage';

/**
 * Main Application Component
 * 
 * Configures the Router with the main layouts and protected areas.
 */
function App() {
  const setVersion = useUIStore((state) => state.setVersion);
  const { token, setVerifyingSession, logout, login } = useAuthStore();

  useEffect(() => {
    const initApp = async () => {
      // 1. Fetch Version (Public)
      try {
        const { data: infoData } = await api.GET("/api/v1/info/", {});
        if (infoData?.version) {
          setVersion(infoData.version);
        }
      } catch (error) {
        console.error('Failed to fetch version:', error);
      }

      // 2. Validate Session (if token exists)
      if (token) {
        setVerifyingSession(true);
        try {
          const { data: authData, error: authError } = await api.GET("/api/v1/auth/me", {});
          if (authError || !authData) {
            console.warn("[Session] Token invalid or expired. Logging out.");
            logout();
          } else {
            // Refresh user data (in case role changed)
            login(token, authData.username || '', authData.role || 'customer');
          }
        } catch (error) {
          console.error('[Session] Verification failed:', error);
          logout();
        } finally {
          setVerifyingSession(false);
        }
      }
    };
    
    initApp();
  }, [token, setVersion, setVerifyingSession, logout, login]);

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
              element={<DashboardPage />} 
            />
            
            {/* Admin-only Routes */}
            <Route element={<ProtectedRoute adminOnly />}>
              {/* User Administration */}
              <Route path="/users" element={<UserAdminPage />} />
              {/* Monthly Reports */}
              <Route path="/reports" element={<MonthlyReportPage />} />
              {/* Persisted Invoices */}
              <Route path="/invoices" element={<InvoicesPage />} />
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
