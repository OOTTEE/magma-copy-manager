import { useAuthStore } from '../../../store/authStore';
import { CustomerDashboardView } from '../components/CustomerDashboardView';
import { AdminDashboardView } from '../components/AdminDashboardView';

/**
 * DashboardPage Component
 * 
 * Main entry point for the authenticated user experience.
 * Switches view between Admin and Customer roles.
 */
export const DashboardPage = () => {
    const { role } = useAuthStore();
    
    if (role === 'customer') {
        return <CustomerDashboardView />;
    }

    return <AdminDashboardView />;
};
