const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/adoption-center';

// Extract base server URL (protocol + host) from API_BASE_URL for non-adoption-center endpoints
const getBaseServerUrl = () => {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://localhost:5000';
  }
};

export const BASE_SERVER_URL = getBaseServerUrl();

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Auth API
export const authAPI = {
  // Signup adoption center
  signup: async (data) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Signup failed');
    }

    return result;
  },

  // Login adoption center
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    return result;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get stored user data
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getToken();
  },
};

// Pet API
export const petAPI = {
  // Create a new pet
  create: async (petData) => {
    // Check if petData is FormData (for file uploads)
    const isFormData = petData instanceof FormData;

    // For FormData, we need to exclude Content-Type header to let browser set it with boundary
    const token = getToken();
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type for JSON data
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/pets`, {
      method: 'POST',
      headers: headers,
      body: isFormData ? petData : JSON.stringify(petData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create pet';
      try {
        const result = await response.json();
        errorMessage = result.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Get all pets
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${API_BASE_URL}/pets?${queryParams}` : `${API_BASE_URL}/pets`;

    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch pets';
      try {
        const result = await response.json();
        errorMessage = result.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Get pet by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch pet';
      try {
        const result = await response.json();
        errorMessage = result.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Update pet
  update: async (id, petData) => {
    const isFormData = petData instanceof FormData;
    const headers = createHeaders(true);

    if (isFormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: 'PUT',
      headers: headers,
      body: isFormData ? petData : JSON.stringify(petData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update pet';
      try {
        const result = await response.json();
        errorMessage = result.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Delete pet
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete pet';
      try {
        const result = await response.json();
        errorMessage = result.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Remove photo from pet
  removePhoto: async (id, photoUrl) => {
    const response = await fetch(`${API_BASE_URL}/pets/${id}/remove-photo`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify({ photoUrl }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to remove photo';
      try {
        const result = await response.json();
        errorMessage = result.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Quick status-only update (used by Inventory table dropdown)
  updateStatus: async (id, adoptionStatus) => {
    const response = await fetch(`${API_BASE_URL}/pets/${id}/status`, {
      method: 'PATCH',
      headers: createHeaders(true),
      body: JSON.stringify({ adoptionStatus }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update pet status';
      try {
        const result = await response.json();
        errorMessage = result.message || errorMessage;
      } catch (e) {
        // Response is not JSON (likely HTML error page)
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },
};

// Application API
// NOTE: Routes are mounted at /api/v1/adoption-applications (NOT /adoption-center/applications)
const ADOPTION_APP_BASE = `${BASE_SERVER_URL}/api/v1/adoption-applications`;

export const applicationAPI = {
  // Submit a new adoption application (center staff submits on behalf of applicant)
  submitApplication: async (applicationData) => {
    const response = await fetch(`${ADOPTION_APP_BASE}/`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(applicationData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit application');
    }
    return result;
  },

  // Get all applications for the center
  getCenterApplications: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams
      ? `${ADOPTION_APP_BASE}/center/applications?${queryParams}`
      : `${ADOPTION_APP_BASE}/center/applications`;

    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch applications');
    }
    return result;
  },

  // Get single application details (center view)
  getApplicationDetails: async (id) => {
    const response = await fetch(`${ADOPTION_APP_BASE}/center/${id}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch application details');
    }
    return result;
  },

  // Review (approve/reject) an application
  review: async (id, status, reviewNotes) => {
    const response = await fetch(`${ADOPTION_APP_BASE}/center/${id}/review`, {
      method: 'PATCH',
      headers: createHeaders(true),
      body: JSON.stringify({ status, reviewNotes }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to review application');
    }
    return result;
  },

  // Finalize adoption — transfers pet ownership to applicant
  finalizeAdoption: async (id) => {
    const response = await fetch(`${ADOPTION_APP_BASE}/center/${id}/finalize`, {
      method: 'POST',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to finalize adoption');
    }
    return result;
  },

  // Submit application on behalf of a mobile user (adoption center staff)
  centerSubmitApplication: async (applicationData) => {
    const response = await fetch(`${ADOPTION_APP_BASE}/center/submit`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(applicationData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit application');
    }
    return result;
  },

  // Update application details (adoption center — edit form fields and/or applicant)
  updateApplication: async (id, data) => {
    const response = await fetch(`${ADOPTION_APP_BASE}/center/${id}`, {
      method: 'PATCH',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update application');
    }
    return result;
  },
};

export const resourcesAPI = {
  getBreeds: async (species = null) => {
    // Resources endpoint is at /api/v1/resources, not under adoption-center
    const baseUrl = `${BASE_SERVER_URL}/api/v1/resources`;
    const url = species
      ? `${baseUrl}/breeds?species=${encodeURIComponent(species)}`
      : `${baseUrl}/breeds`;
    const response = await fetch(url, {
      headers: createHeaders(true)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch breeds');
    return result;
  }
};

// User Management API (for adoption center admins/owners to manage their staff)
export const userManagementAPI = {
  // Get all users in the adoption center
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch users');
    }

    return result;
  },

  // Invite a new user
  inviteUser: async (data) => {
    const response = await fetch(`${API_BASE_URL}/users/invite`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to invite user');
    }

    return result;
  },

  // Get user by ID
  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch user');
    }

    return result;
  },

  // Update user
  updateUser: async (userId, data) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update user');
    }

    return result;
  },

  // Remove user
  removeUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove user');
    }

    return result;
  },

  // Search mobile app users (for adoption application user autocomplete)
  searchMobileUsers: async (q) => {
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(q)}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to search users');
    }

    return result;
  },

  // Resend invite
  resendInvite: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/resend-invite`, {
      method: 'POST',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to resend invite');
    }

    return result;
  },
};

// Profile API - for current user and organization profile
export const profileAPI = {
  // Get current logged-in user profile
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch user profile');
    }

    return result;
  },

  // Update current logged-in user profile
  updateCurrentUser: async (data) => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update user profile');
    }

    return result;
  },

  // Change current user password
  changePassword: async (data) => {
    const response = await fetch(`${API_BASE_URL}/me/password`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to change password');
    }

    return result;
  },

  // Get organization (adoption center) profile
  getOrganization: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch organization profile');
    }

    return result;
  },

  // Update organization (adoption center) profile
  updateOrganization: async (data) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update organization profile');
    }

    return result;
  },
};

const DASHBOARD_BASE = `${BASE_SERVER_URL}/api/v1/adoption-center/dashboard`;

export const reportAPI = {
  getSummaryStats: async () => {
    const response = await fetch(`${DASHBOARD_BASE}/reports/summary-stats`, {
      headers: createHeaders(true),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch summary stats');
    return result;
  },

  getAdoptionTrends: async () => {
    const response = await fetch(`${DASHBOARD_BASE}/reports/adoption-trends`, {
      headers: createHeaders(true),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch adoption trends');
    return result;
  },

  getSpeciesDistribution: async () => {
    const response = await fetch(`${DASHBOARD_BASE}/reports/species-distribution`, {
      headers: createHeaders(true),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch species distribution');
    return result;
  },

  getApplicationFunnel: async () => {
    const response = await fetch(`${DASHBOARD_BASE}/reports/application-funnel`, {
      headers: createHeaders(true),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch application funnel');
    return result;
  },

  getInventoryStatus: async () => {
    const response = await fetch(`${DASHBOARD_BASE}/reports/inventory-status`, {
      headers: createHeaders(true),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch inventory status');
    return result;
  },
};

export default {
  auth: authAPI,
  pet: petAPI,
  applications: applicationAPI,
  resources: resourcesAPI,
  userManagement: userManagementAPI,
  profile: profileAPI,
  reports: reportAPI,
};

