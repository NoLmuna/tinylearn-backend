import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AcademicCapIcon, EyeIcon, EyeSlashIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import PlayfulButton from '../../components/PlayfulButton';
import { useAuth } from '../../hooks/useAuth';

const rememberKey = 'tinylearn_student_email';

export default function StudentLogin() {
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
    if (user.role === 'student') {
      navigate('/student');
    } else {
      const fallback = {
        teacher: '/teacher',
        parent: '/parent',
        admin: '/admin/dashboard',
      }[user.role] || '/';
      navigate(fallback, { replace: true });
    }
  }, [user, navigate]);

  const fieldErrors = useMemo(() => errors, [errors]);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email';
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
        'student'
      );

      if (result.success) {
        if (form.rememberMe) {
          localStorage.setItem(rememberKey, form.email.trim());
        } else {
          localStorage.removeItem(rememberKey);
        }
        toast.success(`Ready to learn, ${result.user.firstName}!`);
        navigate('/student');
      }
    } catch (error) {
      toast.error(error.message || 'Student login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-b from-sky-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-sky-500 p-3 rounded-full shadow-lg">
              <AcademicCapIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <p className="text-sm uppercase tracking-widest text-sky-600 font-semibold">
            Student Portal
          </p>
          <h2 className="my-2 text-3xl font-extrabold text-gray-900">Sign in to learn</h2>
          <p className="text-gray-500">Access your lessons, assignments, and progress</p>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:px-10 shadow-2xl rounded-3xl border border-sky-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                Student Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition ${
                  fieldErrors.email ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="you@student.tinylearn.com"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
              )}
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
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition ${
                    fieldErrors.password ? 'border-red-300' : 'border-gray-200'
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
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-sky-500 focus:ring-sky-500 border-gray-300 rounded"
                />
                <span className="ml-2">Remember me</span>
              </label>
              <span className="text-xs text-gray-400">Forgot password? Ask your teacher.</span>
            </div>

            <PlayfulButton
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-5 w-5 border-b-2 border-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                  <span>Enter Classroom</span>
                </div>
              )}
            </PlayfulButton>
          </form>

          <div className="mt-8 space-y-2 text-center text-sm text-gray-600">
            <p>
              Parent instead?{' '}
              <Link className="text-emerald-600 font-semibold" to="/parent/login">
                Parent Login
              </Link>
            </p>
            <p>
              Need another role?{' '}
              <Link className="text-sky-600 font-semibold" to="/login">
                Choose role
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

