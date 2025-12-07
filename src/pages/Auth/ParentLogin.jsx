import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserGroupIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import PlayfulButton from '../../components/PlayfulButton';
import { useAuth } from '../../hooks/useAuth';

const rememberKey = 'tinylearn_parent_email';

export default function ParentLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedEmail = localStorage.getItem(rememberKey);
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'parent') {
      navigate('/parent');
    } else {
      const fallback = {
        student: '/student',
        teacher: '/teacher',
        admin: '/admin/dashboard',
      }[user.role] || '/';
      navigate(fallback, { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(
        {
          email: form.email.trim(),
          password: form.password,
        },
        false,
        'parent'
      );

      if (result.success) {
        if (form.rememberMe) {
          localStorage.setItem(rememberKey, form.email.trim());
        } else {
          localStorage.removeItem(rememberKey);
        }
        toast.success(`Welcome back, ${result.user.firstName}!`);
        navigate('/parent');
      }
    } catch (error) {
      toast.error(error.message || 'Parent login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-rose-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-rose-500 p-3 rounded-full shadow-lg">
              <UserGroupIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <p className="text-sm uppercase tracking-widest text-rose-500 font-semibold">
            Parent Portal
          </p>
          <h2 className="my-2 text-3xl font-extrabold text-gray-900">Stay connected</h2>
          <p className="text-gray-500">Monitor progress, assignments, and updates</p>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:px-10 shadow-2xl rounded-3xl border border-rose-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                Parent Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition ${
                  errors.email ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="you@family.tinylearn.com"
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

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
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300 rounded"
                />
                <span className="ml-2">Remember me</span>
              </label>
              <span className="text-xs text-gray-400">Need help? Contact the admin.</span>
            </div>

            <PlayfulButton
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white py-3 rounded-xl font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-5 w-5 border-b-2 border-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <ArrowRightCircleIcon className="h-5 w-5" />
                  <span>Enter Parent Hub</span>
                </div>
              )}
            </PlayfulButton>
          </form>

          <div className="mt-8 space-y-2 text-center text-sm text-gray-600">
            <p>
              Student account?{' '}
              <Link className="text-sky-600 font-semibold" to="/student/login">
                Student Login
              </Link>
            </p>
            <p>
              Teacher or staff?{' '}
              <Link className="text-rose-500 font-semibold" to="/login">
                Teacher Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

