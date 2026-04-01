import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * ProtectedRoute Component
 * 
 * Prevents access to children if the user is not authenticated.
 * Redirects to the /login page otherwise.
 */
interface ProtectedRouteProps {
    adminOnly?: boolean;
}

/**
 * ProtectedRoute Component
 * 
 * Prevents access to children if the user is not authenticated.
 * If adminOnly is true, also checks if the user has the 'admin' role.
 * Redirects to the /login page if not authenticated, or to /dashboard if role is insufficient.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ adminOnly = false }) => {
    const { isAuthenticated, role } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
