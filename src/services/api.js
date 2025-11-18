/**
 * Enhanced API Service for TinyLearn Frontend
 * Provides centralized API communication with error handling and caching
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ROLE_ENDPOINTS = {
  admin: '/admins',
  teacher: '/teachers',
  parent: '/parents',
  student: '/students'
};

const ADMIN_MANAGEMENT_ENDPOINTS = {
  admin: '/admins',
  teacher: '/admins/teachers',
  parent: '/admins/parents',
  student: '/admins/students'
};

const ROLE_LIST_ENDPOINTS = {
  admin: '/admins/users/admins',
  teacher: '/admins/users/teachers',
  student: '/admins/users/students',
  parent: '/admins/users/parents'
};

const ROLE_DETAIL_ENDPOINTS = {
  admin: '/admins/users/admins',
  teacher: '/admins/users/teachers',
  student: '/admins/users/students',
  parent: '/admins/users/parents'
};

const LOGIN_PRIORITY = ['student', 'parent', 'teacher'];

class ApiService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Make HTTP request with enhanced error handling
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      let data;
      
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      // Normalize response format
      return {
        success: data.success ?? true,
        data: data.data ?? data,
        message: data.message || 'Success'
      };
    } catch (error) {
      // Network or parsing errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  /**
   * GET request with optional caching
   */
  async get(endpoint, useCache = false) {
    if (useCache && this.cache.has(endpoint)) {
      const cached = this.cache.get(endpoint);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(endpoint);
    }

    const data = await this.request(endpoint);
    
    if (useCache) {
      this.cache.set(endpoint, {
        data,
        timestamp: Date.now()
      });
    }

    return data;
  }

  /**
   * POST request
   */
  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Token management
   */
  getToken() {
    return localStorage.getItem('tinylearn_token');
  }

  setToken(token) {
    localStorage.setItem('tinylearn_token', token);
  }

  removeToken() {
    localStorage.removeItem('tinylearn_token');
    this.clearCache();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  // === AUTH ENDPOINTS ===
  async login(credentials, roleHint = null) {
    const preferredRoles = roleHint
      ? [roleHint]
      : (credentials?.role ? [credentials.role] : LOGIN_PRIORITY);

    let lastError;
    for (const role of preferredRoles) {
      const endpoint = `${ROLE_ENDPOINTS[role]}/login`;
      try {
        const response = await this.post(endpoint, credentials);
        if (response.data?.user && !response.data.user.role) {
          response.data.user = { ...response.data.user, role };
        }
        if (response.data?.token) {
          this.setToken(response.data.token);
        }
        return response;
      } catch (error) {
        lastError = error;
        // Only continue looping if the endpoint explicitly says the user wasn't found
        if (error.status && ![400, 401, 404].includes(error.status)) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Login failed. Please check your credentials.');
  }

  async logout() {
    this.removeToken();
    return { success: true, message: 'Logged out successfully' };
  }

  async getProfile(role = null) {
    if (role && ROLE_ENDPOINTS[role]) {
      return this.get(`${ROLE_ENDPOINTS[role]}/profile`, true);
    }
    return this._cascadeRequest('GET', (currentRole) => `${ROLE_ENDPOINTS[currentRole]}/profile`);
  }

  // === USER MANAGEMENT ===
  async createUser(userData) {
    const role = userData?.role?.toLowerCase();
    if (!role || !ROLE_ENDPOINTS[role]) {
      throw new Error('A valid user role is required to create an account');
    }
    return this.post(`${ROLE_ENDPOINTS[role]}/register`, userData);
  }

  async createStudent(userData) {
    return this.createUser({ ...userData, role: 'student' });
  }

  async getUsers(role = null) {
    if (role && ROLE_LIST_ENDPOINTS[role]) {
      return this._getRoleUsers(role);
    }

    const results = await Promise.all(
      Object.keys(ROLE_LIST_ENDPOINTS).map((roleKey) => this._getRoleUsers(roleKey))
    );

    const data = results
      .filter(result => result.success)
      .flatMap(result => result.data);

    return {
      success: true,
      data,
      message: 'Users retrieved successfully'
    };
  }

  async _getRoleUsers(role) {
    const endpoint = ROLE_LIST_ENDPOINTS[role];
    if (!endpoint) {
      return { success: false, message: 'Unsupported role' };
    }

    const response = await this.get(endpoint);
    if (response.success) {
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return {
        success: true,
        data: list.map(user => ({ ...user, role }))
      };
    }
    return response;
  }

  async getTeachers() {
    return this.get(ROLE_ENDPOINTS.teacher);
  }

  async getStudents() {
    return this.get(ROLE_ENDPOINTS.student);
  }

  async updateUser(userId, userData = {}, roleHint = null) {
    const role = (roleHint || userData.role)?.toLowerCase();
    const endpointBase = role
      ? (ADMIN_MANAGEMENT_ENDPOINTS[role] || ROLE_ENDPOINTS[role])
      : null;

    if (endpointBase) {
      return this.put(`${endpointBase}/${userId}`, userData);
    }

    return this._cascadeRequest(
      'PUT',
      (currentRole) => {
        const base = ADMIN_MANAGEMENT_ENDPOINTS[currentRole] || ROLE_ENDPOINTS[currentRole];
        return `${base}/${userId}`;
      },
      userData
    );
  }

  async deleteUser(userId, roleHint = null) {
    const role = roleHint?.toLowerCase();
    const endpointBase = role
      ? (ADMIN_MANAGEMENT_ENDPOINTS[role] || ROLE_ENDPOINTS[role])
      : null;

    if (endpointBase) {
      return this.delete(`${endpointBase}/${userId}`);
    }

    return this._cascadeRequest('DELETE', (currentRole) => {
      const base = ADMIN_MANAGEMENT_ENDPOINTS[currentRole] || ROLE_ENDPOINTS[currentRole];
      return `${base}/${userId}`;
    });
  }

  async getUserById(userId, roleHint = null) {
    const role = roleHint?.toLowerCase();
    if (role && ROLE_DETAIL_ENDPOINTS[role]) {
      return this.get(`${ROLE_DETAIL_ENDPOINTS[role]}/${userId}`);
    }
    return this._cascadeRequest('GET', (currentRole) => {
      if (ROLE_DETAIL_ENDPOINTS[currentRole]) {
        return `${ROLE_DETAIL_ENDPOINTS[currentRole]}/${userId}`;
      }
      return `${ROLE_ENDPOINTS[currentRole]}/${userId}`;
    });
  }

  async getSystemStats() {
    return this.get('/admins/stats');
  }

  async updateTeacherAccountState(userId, payload = {}) {
    const endpointBase = ADMIN_MANAGEMENT_ENDPOINTS.teacher || ROLE_ENDPOINTS.teacher;
    return this.put(`${endpointBase}/${userId}/status`, {
      accountStatus: payload.accountStatus,
      isActive: payload.isActive
    });
  }

  async getAdmins() {
    return this.get(ROLE_ENDPOINTS.admin);
  }

  async getAdminStats() {
    return this.get('/admins/stats');
  }

  async getAdminTeachers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admins/teachers${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async getAdminStudents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admins/students${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async getAdminParents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admins/parents${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }


  // === LESSONS ===
  async getLessons(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/lessons${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint, true);
  }

  async getLesson(lessonId) {
    return this.get(`/lessons/${lessonId}`, true);
  }

  async createLesson(lessonData) {
    return this.post('/lessons', lessonData);
  }

  async updateLesson(lessonId, lessonData) {
    return this.put(`/lessons/${lessonId}`, lessonData);
  }

  async deleteLesson(lessonId) {
    return this.delete(`/lessons/${lessonId}`);
  }

  // === PROGRESS ===
  async getProgress(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/progress${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async updateProgress(progressData) {
    return this.post('/progress', progressData);
  }

  async getStudentProgress(studentId) {
    return this.get(`/progress/student/${studentId}`, true);
  }

  // === ASSIGNMENTS ===
  async getAssignments(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/assignments${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async getAssignment(assignmentId) {
    return this.get(`/assignments/${assignmentId}`);
  }

  async createAssignment(assignmentData) {
    return this.post('/assignments', assignmentData);
  }

  async updateAssignment(assignmentId, assignmentData) {
    return this.put(`/assignments/${assignmentId}`, assignmentData);
  }

  async deleteAssignment(assignmentId) {
    return this.delete(`/assignments/${assignmentId}`);
  }

  // === SUBMISSIONS ===
  async getSubmissions(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/submissions${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async createSubmission(submissionData) {
    return this.post('/submissions', submissionData);
  }

  async updateSubmission(submissionId, submissionData) {
    return this.put(`/submissions/${submissionId}`, submissionData);
  }

  async gradeSubmission(submissionId, gradeData) {
    return this.put(`/submissions/${submissionId}/grade`, gradeData);
  }

  // === MESSAGES ===
  async getMessages(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/messages${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async getConversations() {
    return this.get('/messages/conversations');
  }

  async getMessagesWithUser(otherUserId) {
    return this.get(`/messages/${otherUserId}`);
  }

  async sendMessage(messageData) {
    return this.post('/messages', messageData);
  }

  async markMessageAsRead(messageId) {
    return this.put(`/messages/${messageId}/read`);
  }

  async deleteMessage(messageId) {
    return this.delete(`/messages/${messageId}`);
  }

  // === PARENT-STUDENT RELATIONSHIPS ===
  async getParentStudents(parentId) {
    return this.get(`/users/${parentId}/students`, true);
  }

  async getParentChildren() {
    return this.get('/users/parent/children');
  }

  async getParentsForTeacher() {
    return this.get('/users/teacher/parents');
  }

  async linkParentStudent(parentId, studentId, relationship = 'guardian') {
    return this.post('/users/parent-student-link', {
      parentId,
      studentId,
      relationship
    });
  }

  async _cascadeRequest(method, endpointBuilder, body) {
    let lastError;
    for (const role of Object.keys(ROLE_ENDPOINTS)) {
      const endpoint = endpointBuilder(role);
      try {
        return await this.request(endpoint, {
          method,
          body: body ? JSON.stringify(body) : undefined
        });
      } catch (error) {
        lastError = error;
        if (!error.status || ![400, 401, 404].includes(error.status)) {
          throw error;
        }
      }
    }
    throw lastError || new Error('Resource not found');
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export both class and instance for flexibility
export { ApiService };
export default apiService;
