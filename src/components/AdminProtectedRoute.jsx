import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * AdminProtectedRoute Component
 * Protects admin-only routes with enhanced security
 */
const AdminProtectedRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-red-200 text-lg">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect to admin login if not an admin user
  if (user?.role !== 'admin') {
    // If user has a different role, redirect them to their appropriate dashboard
    const userDashboards = {
      student: '/student',
      teacher: '/teacher',
      parent: '/parent'
    };
    
    if (user?.role && userDashboards[user.role]) {
      return <Navigate to={userDashboards[user.role]} replace />;
    }
    
    // If no valid role, redirect to admin login
    return <Navigate to="/admin/login" replace />;
  }

  // User is authenticated and is an admin
  return <Outlet />;
};

export default AdminProtectedRoute;
