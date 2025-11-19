import toast from 'react-hot-toast';
import apiService from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const buildConfig = (options = {}) => {
  const token = options.skipAuth ? null : apiService.getToken();

  return {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    ...options,
  };
};

const request = async (endpoint, options = {}) => {
  const { skipAuth, ...rest } = options;
  const config = buildConfig({ ...rest, skipAuth });
  const previewToken = config.headers.Authorization
    ? `${config.headers.Authorization.slice(0, 16)}…`
    : null;

  console.log('[studentService] Request', `${API_BASE_URL}${endpoint}`, {
    ...config,
    headers: {
      ...config.headers,
      Authorization: previewToken || undefined,
    },
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return {
    success: payload.success ?? true,
    data: payload.data ?? payload,
    message: payload.message || 'Success',
  };
};

const handleLoginSuccess = (result, role) => {
  const token = result.data?.token;
  if (token) {
    apiService.setToken(token);
  }

  const user = result.data?.user || result.data;
  if (user && !user.role) {
    result.data.user = { ...user, role };
  }

  return result;
};

const studentService = {
  async loginStudent(credentials = {}, options = {}) {
    try {
      const response = await request('/students/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        skipAuth: true,
      });
      return handleLoginSuccess(response, 'student');
    } catch (error) {
      if (!options.silent) {
        toast.error(error.message || 'Student login failed');
      }
      throw error;
    }
  },

  async loginParent(credentials = {}, options = {}) {
    try {
      const response = await request('/parents/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        skipAuth: true,
      });
      return handleLoginSuccess(response, 'parent');
    } catch (error) {
      if (!options.silent) {
        toast.error(error.message || 'Parent login failed');
      }
      throw error;
    }
  },

  async getStudentProfile(options = {}) {
    try {
      return await request('/students/profile', options);
    } catch (error) {
      if (!options.silent) {
        toast.error(error.message || 'Unable to load student profile');
      }
      throw error;
    }
  },

  async getParentProfile(options = {}) {
    try {
      return await request('/parents/profile', options);
    } catch (error) {
      if (!options.silent) {
        toast.error(error.message || 'Unable to load parent profile');
      }
      throw error;
    }
  },
};

export default studentService;
