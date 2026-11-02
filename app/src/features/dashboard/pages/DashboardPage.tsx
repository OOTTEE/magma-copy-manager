import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { CustomerDashboardView } from '../components/CustomerDashboardView';

/**
 * DashboardPage Component
 *
 * Main entry point for the authenticated user experience.
 * For customers, renders personal consumption dashboard.
 * For admins, redirects to the operational monthly report.
 */
export const DashboardPage = () => {
    const { role } = useAuthStore();

    if (role === 'admin') {
        return <Navigate to="/reports" replace />;
    }

    return <CustomerDashboardView />;
};
