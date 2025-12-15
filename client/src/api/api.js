import axios from "axios";

// Uses environment variable in production, falls back to localhost for development
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api"
});

export const registerUser = (formData) => API.post("/auth/register", formData);
export const loginUser = (formData) => API.post("/auth/login", formData);