import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AcademicCapIcon, EyeIcon, EyeSlashIcon, BookOpenIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import PlayfulButton from '../../components/PlayfulButton';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
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

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        // If not a teacher, redirect to their appropriate dashboard
        const dashboardPaths = {
          student: '/student',
          parent: '/parent',
          admin: '/admin/dashboard'
        };
        navigate(dashboardPaths[user.role] || '/');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check for saved credentials
    const savedEmail = localStorage.getItem('tinylearn_teacher_email');
    if (savedEmail) {
      setForm(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

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
      }, false); // Disable AuthContext toast

      if (result.success) {
        // Only allow teacher login through this page
        if (result.user.role !== 'teacher') {
          await logout(false); // Logout immediately (no toast)
          
          const roleMessages = {
            admin: 'Administrators must use the secure admin login.',
            student: 'Students should use the student login page.',
            parent: 'Parents should use the parent login page.'
          };
          
          const redirectPaths = {
            admin: '/admin/login',
            student: '/student/login',
            parent: '/parent/login'
          };
          
          toast.error(roleMessages[result.user.role] || 'Access denied. Please use the correct login page.');
          
          setTimeout(() => {
            navigate(redirectPaths[result.user.role] || '/');
          }, 2000);
          return;
        }

        // Save email if remember me is checked
        if (form.rememberMe) {
          localStorage.setItem('tinylearn_teacher_email', form.email);
        } else {
          localStorage.removeItem('tinylearn_teacher_email');
        }

        toast.success(`Welcome back, ${result.user.firstName}!`);
        navigate('/teacher');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <BookOpenIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <p className="text-sm uppercase tracking-widest text-indigo-600 font-semibold mb-2">
            Teacher Portal
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
            Educator Sign In
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Manage lessons, assignments, and student progress
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:px-10 shadow-2xl rounded-3xl border-2 border-indigo-100 transform transition-all duration-300 hover:scale-[1.01]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                Teacher Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-4 py-3 border-2 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="teacher@tinylearn.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                Password
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
                  className={`appearance-none relative block w-full px-4 py-3 pr-12 border-2 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your secure password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 font-medium">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">
                  Contact admin for help
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <PlayfulButton
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <BookOpenIcon className="h-5 w-5 mr-2" />
                    Sign In to Dashboard
                  </div>
                )}
              </PlayfulButton>
            </div>
          </form>

          {/* Other Login Options */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-4">
              Not a teacher?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/student/login"
                className="flex items-center justify-center px-4 py-2 border border-sky-300 rounded-lg text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
              >
                <AcademicCapIcon className="h-4 w-4 mr-1" />
                Student Login
              </Link>
              <Link
                to="/parent/login"
                className="flex items-center justify-center px-4 py-2 border border-rose-300 rounded-lg text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <UserGroupIcon className="h-4 w-4 mr-1" />
                Parent Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}