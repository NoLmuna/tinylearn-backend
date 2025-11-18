import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const buildConfig = (options = {}) => {
  const token = localStorage.getItem('tinylearn_token');
  if (!token) {
    console.warn('[teacherService] No auth token found in localStorage');
  }

  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };
};

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = buildConfig(options);
  const authPreview = config.headers?.Authorization
    ? `${config.headers.Authorization.slice(0, 20)}…`
    : null;
  console.log('[teacherService] Requesting', url, 'with headers', {
    ...config.headers,
    Authorization: authPreview || undefined
  });

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return {
    success: data.success ?? true,
    data: data.data ?? data,  
    message: data.message || 'Success'
  };
};

const teacherService = {
  async getAssignedStudents(options = {}) {
    const { silent = false } = options;

    try {
      console.log('[teacherService] Fetching assigned students...');
      const response = await request('/teachers/students');
      console.log('[teacherService] Assigned students response:', response);
      return response;
    } catch (error) {
      console.error('[teacherService] Failed to fetch students:', error);
      if (!silent) {
        toast.error(error.message || 'Failed to load students');
      }
      throw error;
    }
  },

  async getLessons(options = {}) {
    const { silent = false, page = 1, limit = 10, status } = options;

    try {
      console.log('[teacherService] Fetching lessons...');
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (status) queryParams.append('status', status);
      
      const endpoint = `/teachers/lessons${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await request(endpoint);
      console.log('[teacherService] Lessons response:', response);
      return response;
    } catch (error) {
      console.error('[teacherService] Failed to fetch lessons:', error);
      if (!silent) {
        toast.error(error.message || 'Failed to load lessons');
      }
      throw error;
    }
  }
};

export default teacherService;
