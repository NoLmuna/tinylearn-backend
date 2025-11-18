import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

/**
 * Admin Login Component
 * Secure login interface specifically for administrators
 */
export default function AdminLogin() {
  const { login, logout, user } = useAuth();
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    rememberMe: false 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user && user.role !== 'admin') {
      // If logged in but not admin, redirect to their dashboard
      const userDashboards = {
        student: '/student',
        teacher: '/teacher',
        parent: '/parent'
      };
      navigate(userDashboards[user.role] || '/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({
        email: form.email.trim(),
        password: form.password
      }, false, 'admin'); // Disable AuthContext toast, force admin auth

      if (result.success) {
        // Verify user is actually an admin
        if (result.user.role !== 'admin') {
          await logout(false); // Logout if not admin (no toast)
          toast.error('Access denied. This login is for administrators only.');
          setTimeout(() => {
            toast.info('Redirecting you to the regular login page...');
            navigate('/login');
          }, 2000);
          return;
        }

        // Save email if remember me is checked
        if (form.rememberMe) {
          localStorage.setItem('tinylearn_admin_email', form.email);
        } else {
          localStorage.removeItem('tinylearn_admin_email');
        }

        toast.success(`Welcome back, Administrator ${result.user.firstName}!`);
        
        // Navigate to admin dashboard
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Admin login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Security Warning Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <LockClosedIcon className="h-4 w-4" />
            <span className="font-medium">SECURE ADMIN ACCESS</span>
          </div>
          <p className="text-xs mt-1">Authorized personnel only</p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-full shadow-lg">
              <ShieldCheckIcon className="h-16 w-16 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2">
            Administrator Login
          </h2>
          <p className="text-lg text-red-200">
            Secure access to TinyLearn management
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:px-10 shadow-2xl rounded-3xl border-2 border-red-200 transform transition-all duration-300 hover:scale-[1.01]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                Administrator Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-4 py-3 border-2 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="admin@tinylearn.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-4 py-3 pr-12 border-2 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter administrator password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember administrator email
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                    Secure Admin Login
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Back to Regular Login */}
          <div className="mt-6 text-center">
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                Not an administrator?{' '}
                <Link
                  to="/login"
                  className="font-medium text-red-600 hover:text-red-500 transition-colors"
                >
                  Go to regular login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-red-300">
          This is a secure administrative area. All access attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
}
