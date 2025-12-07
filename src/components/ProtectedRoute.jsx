import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute Component
 * Protects routes that require authentication and role-based access
 */
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to role-specific login if not authenticated
  if (!isAuthenticated) {
    // Try to determine appropriate login page from URL or default to teacher login
    const path = window.location.pathname;
    if (path.startsWith('/student')) {
      return <Navigate to="/student/login" replace />;
    } else if (path.startsWith('/parent')) {
      return <Navigate to="/parent/login" replace />;
    } else if (path.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    // Default to teacher login for /teacher routes or unknown routes
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required
  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!allowedRoles.includes(user?.role)) {
      // Redirect to appropriate dashboard based on user role
      const dashboardMap = {
        admin: '/admin',
        teacher: '/teacher', 
        parent: '/parent',
        student: '/student'
      };
      
      const redirectPath = dashboardMap[user.role] || '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
