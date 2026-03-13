import axios from "axios";

// Base URL for API - uses environment variable in production
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"; // Change to your actual API URL

// Base URL for socket.io (without /api suffix)
export const SOCKET_URL = API_BASE_URL.replace("/api", "");

// Create axios instance with base configuration
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized errors (token expired)
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// Auth API
export const registerUser = (formData) => API.post("/auth/register", formData);
export const loginUser = (formData) => API.post("/auth/login", formData);
export const getCurrentUser = () => API.get("/auth/me");
export const forgotPassword = (email, config = {}) => API.post("/auth/forgot-password", { email }, config);
export const resetPasswordAPI = (token, password, config = {}) => API.post(`/auth/reset-password/${token}`, { password }, config);

// College API
export const getColleges = () => API.get("/colleges");
export const getCollegeBySlug = (slug) => API.get(`/colleges/${slug}`);
// For FormData, we need to let axios set the Content-Type header automatically (with boundary)
export const createCollege = (collegeData) => {
  const config = collegeData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  return API.post("/colleges", collegeData, config);
};
export const updateCollege = (id, collegeData) => {
  const config = collegeData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  return API.put(`/colleges/${id}`, collegeData, config);
};
export const deleteCollege = (id) => API.delete(`/colleges/${id}`);

// Students API
export const getStudentsByCollege = (collegeId, course = null) => {
  const params = course && course !== "all" ? { course } : {};
  return API.get(`/students/college/${collegeId}`, { params });
};
export const getCoursesByCollege = (collegeId) => API.get(`/students/college/${collegeId}/courses`);

// Users API - CRUD Operations
export const getAllUsers = (params) => API.get("/users", { params }); // Admin only
export const getUserById = (id) => API.get(`/users/${id}`);
export const updateUserProfile = (formData) => API.put("/users/update", formData);
export const updateUserById = (id, formData) => API.put(`/users/${id}`, formData); // Admin only
export const deleteUser = (id) => API.delete(`/users/${id}`); // Admin only

// Connections API
export const sendConnectionRequest = (to, level) => API.post("/connections", { to, level });
export const acceptConnectionRequest = (id) => API.put(`/connections/${id}/accept`);
export const rejectConnectionRequest = (id) => API.put(`/connections/${id}/reject`);
export const getConnectionRequests = (status) => {
  const params = status ? { status } : {};
  return API.get("/connections", { params });
};

// Notifications API
export const getNotifications = (page = 1, limit = 20, unread) => {
  const params = { page, limit };
  if (unread) params.unread = "true";
  return API.get("/notifications", { params });
};
export const getUnreadCount = () => API.get("/notifications/unread-count");
export const markNotificationAsRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => API.put("/notifications/read-all");

// Messaging API
export const getConversations = () => API.get("/messages/conversations");
export const getOrCreateConversation = (userId) => API.post("/messages/conversations", { userId });
export const getMessages = (conversationId, page = 1, limit = 50) =>
  API.get(`/messages/${conversationId}`, { params: { page, limit } });
export const sendMessageAPI = (conversationId, text) =>
  API.post(`/messages/${conversationId}`, { text });
export const markConversationRead = (conversationId) =>
  API.put(`/messages/${conversationId}/read`);
export const getUnreadDmCount = () => API.get("/messages/unread-count");

export default API;