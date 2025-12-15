import axios from "axios";

// Base URL for API - uses environment variable in production
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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

// College API
export const getColleges = () => API.get("/colleges");
export const getCollegeBySlug = (slug) => API.get(`/colleges/${slug}`);
export const createCollege = (collegeData) => API.post("/colleges", collegeData);
export const deleteCollege = (id) => API.delete(`/colleges/${id}`);

// Students API
export const getStudentsByCollege = (collegeId) => API.get(`/students/college/${collegeId}`);

// Users API
export const updateUserProfile = (formData) => API.put("/users/update", formData);

// Connections API
export const sendConnectionRequest = (to, level) => API.post("/connections", { to, level });

export default API;