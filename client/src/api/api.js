import axios from "axios";

// Change to your Render backend URL once deployed
const API = axios.create({ baseURL: "http://localhost:5000/api" });

export const registerUser = (formData) => API.post("/auth/register", formData);
export const loginUser = (formData) => API.post("/auth/login", formData);