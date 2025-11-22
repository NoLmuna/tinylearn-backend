import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/levelup-logo.png';

/**
 * Dashboard Navigation Component
 * Provides role-specific navigation for each dashboard
 */
const DashboardNavbar = ({ role, currentPage = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    // Navigate to role-specific login page
    const loginPaths = {
      student: '/student/login',
      parent: '/parent/login',
      teacher: '/login',
      admin: '/admin/login'
    };
    navigate(loginPaths[user?.role] || '/login');
  };

  const handleNavigation = (item) => {
    // All admin pages are now implemented, so navigate directly
    navigate(item.path);
  };

  const roleConfigs = {
    admin: {
      color: 'red',
      bgGradient: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      navItems: [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Users', path: '/admin/users' },
        { name: 'System', path: '/admin/system' },
        { name: 'Reports', path: '/admin/reports' }
      ]
    },
    teacher: {
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      navItems: [
        { name: 'Dashboard', path: '/teacher' },
        { name: 'Students', path: '/teacher/students' },
        { name: 'Lessons', path: '/teacher/lessons' },
        { name: 'Assignments', path: '/teacher/assignments' },
        { name: 'Messages', path: '/teacher/messages' }
      ]
    },
    parent: {
      color: 'green',
      bgGradient: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      navItems: [
        { name: 'Dashboard', path: '/parent' },
        { name: 'Progress', path: '/parent/progress' },
        { name: 'Messages', path: '/parent/messages' }
      ]
    },
    student: {
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      navItems: [
        { name: 'Dashboard', path: '/student' },
        { name: 'Lessons', path: '/student/lessons' },
        { name: 'Assignments', path: '/student/assignments' },
        { name: 'Progress', path: '/student/progress' }
      ]
    }
  };

  const config = roleConfigs[role] || roleConfigs.student;

  return (
    <nav className="bg-white shadow-lg border-b-2 border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden">
                <img 
                  src={logo} 
                  alt="TinyLearn Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-2xl font-bold text-gray-800">TinyLearn</span>
            </div>
            
            {/* Current Page Indicator */}
            <div className="hidden md:block">
              <span className="text-gray-400 mx-2">|</span>
              <span className={`font-semibold ${config.textColor}`}>
                {currentPage}
              </span>
            </div>
          </div>

          {/* Role Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {config.navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.name === currentPage
                    ? `bg-gradient-to-r ${config.bgGradient} text-white shadow-md`
                    : `text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:shadow-sm`
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${config.bgGradient} text-white text-sm font-medium`}>
              {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user?.firstName || 'User'}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to profile
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to settings
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-gray-50 px-4 py-2">
        <div className="flex space-x-1 overflow-x-auto">
          {config.navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
                item.name === currentPage
                  ? `bg-gradient-to-r ${config.bgGradient} text-white`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
