import React, { useState } from "react";
// import { loginUser } from "../api/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/login", form);
      localStorage.setItem("token", data.token);
      toast.success("Logged in successfully");
      navigate("/colleges");
    } catch (err) {
    toast.error(err.response?.data?.message || "Invalid login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-6xl w-full bg-white shadow-xl rounded-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* LEFT LOGIN FORM */}
        <div className="p-10 flex flex-col justify-center">
          {/* Branding */}
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Counsellor</h1>
          <h2 className="text-lg font-semibold mb-6 text-gray-700">Log in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="flex items-center border rounded-lg px-3 py-2">
              <span className="text-gray-400 mr-2">✉️</span>
              <input
                type="text"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full outline-none"
              />
            </div>

            {/* Password */}
            <div className="flex items-center border rounded-lg px-3 py-2">
              <span className="text-gray-400 mr-2">🔑</span>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full outline-none"
              />
            </div>

            {/* Captcha placeholder */}
            <div className="flex items-center gap-2">
              <div className="bg-gray-200 px-4 py-2 rounded-md font-mono tracking-widest">
                ALoX
              </div>
              <input
                type="text"
                placeholder="Enter Captcha Here"
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <button type="button" className="px-2">🔄</button>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="h-4 w-4" />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 transition"
            >
              Login
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-4 text-sm text-center space-y-1">
            <button className="text-blue-500 hover:underline block">
              Forgot Your password?
            </button>
            <button
              className="text-blue-500 hover:underline block"
              onClick={() => navigate("/register")}
            >
              Don’t have an account?
            </button>
          </div>
        </div>

        {/* RIGHT ILLUSTRATION */}
        <div className="bg-blue-100 flex justify-center items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2641/2641414.png"
            alt="Counselling Illustration"
            className="max-w-md"
          />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-3 text-center text-sm text-gray-500">
        © 2025 from Counsellor |
        <a href="/about" className="ml-1 text-blue-500 hover:underline">About Us</a> ·
        <a href="/blog" className="ml-1 text-blue-500 hover:underline">Blog</a> ·
        <a href="/help" className="ml-1 text-blue-500 hover:underline">Help</a>
      </footer>
    </div>
  );
}

export default Login;
