

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { loginUser } from "../api/api";
import Footer from "../components/Footer";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    refreshCaptcha();
    const token = localStorage.getItem("token");
    if (token) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role === "admin") {
        navigate("/admin/colleges", { replace: true });
      } else {
        navigate("/colleges", { replace: true });
      }
    }
  }, [navigate]);

  const refreshCaptcha = () => {
    const newCaptcha = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCaptcha(newCaptcha);
    setCaptchaInput("");
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        }
        break;
      case "captcha":
        if (!value.trim()) {
          error = "Please enter the captcha";
        } else if (value !== captcha) {
          error = "Captcha does not match";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.email = validateField("email", form.email);
    newErrors.password = validateField("password", form.password);
    newErrors.captcha = validateField("captcha", captchaInput);
    setErrors(newErrors);
    setTouched({ email: true, password: true, captcha: true });
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await loginUser(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
      toast.success("Logged in successfully! 🎉");
      setTimeout(() => {
        if (data.role === "admin") {
          navigate("/admin/colleges");
        } else {
          navigate("/colleges");
        }
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid login credentials");
      refreshCaptcha();
      setCaptchaInput("");
      setErrors({ ...errors, captcha: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full bg-white shadow-2xl rounded-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden animate-scaleIn">

          {/* LEFT - LOGIN FORM */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-800">
                Welcome Back! 👋
              </h1>
              <h2 className="text-base sm:text-lg font-medium text-gray-600">
                Log in to your account
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border-2 rounded-lg px-3 py-2.5 sm:py-3 transition-all ${errors.email && touched.email
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
                  }`}>
                  <span className="text-gray-400 mr-2 text-lg" aria-hidden="true">✉️</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full outline-none bg-transparent text-sm sm:text-base"
                    aria-invalid={errors.email && touched.email ? "true" : "false"}
                    aria-describedby={errors.email && touched.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && touched.email && (
                  <p id="email-error" className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border-2 rounded-lg px-3 py-2.5 sm:py-3 transition-all ${errors.password && touched.password
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
                  }`}>
                  <span className="text-gray-400 mr-2 text-lg" aria-hidden="true">🔑</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full outline-none bg-transparent text-sm sm:text-base"
                    aria-invalid={errors.password && touched.password ? "true" : "false"}
                    aria-describedby={errors.password && touched.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    <span className="text-lg" aria-hidden="true">{showPassword ? "👁️" : "👁️‍🗨️"}</span>
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p id="password-error" className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Captcha */}
              <div>
                <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-3 rounded-lg font-mono text-base sm:text-lg tracking-widest select-none border-2 border-blue-200 shadow-sm text-center sm:text-left flex-shrink-0">
                    {captcha}
                  </div>
                  <input
                    id="captcha"
                    type="text"
                    placeholder="Enter code"
                    value={captchaInput}
                    onChange={(e) => {
                      setCaptchaInput(e.target.value);
                      if (touched.captcha) {
                        const error = validateField("captcha", e.target.value);
                        setErrors({ ...errors, captcha: error });
                      }
                    }}
                    onBlur={() => {
                      setTouched({ ...touched, captcha: true });
                      const error = validateField("captcha", captchaInput);
                      setErrors({ ...errors, captcha: error });
                    }}
                    className={`flex-1 border-2 rounded-lg px-3 py-2.5 sm:py-3 text-sm sm:text-base transition-all outline-none ${errors.captcha && touched.captcha
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-blue-500"
                      }`}
                    aria-invalid={errors.captcha && touched.captcha ? "true" : "false"}
                    aria-describedby={errors.captcha && touched.captcha ? "captcha-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2.5 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors outline-none min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                    aria-label="Refresh captcha"
                    title="Refresh captcha"
                  >
                    <span className="text-xl" aria-hidden="true">🔄</span>
                  </button>
                </div>
                {errors.captcha && touched.captcha && (
                  <p id="captcha-error" className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.captcha}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-xs sm:text-sm text-gray-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg py-3 sm:py-3.5 transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  <>
                    <span className="mr-2" aria-hidden="true">🚀</span>
                    Login
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                >
                  Sign up now
                </Link>
              </p>
            </div>
          </div>

          {/* RIGHT - ILLUSTRATION (Hidden on mobile) */}
          <div className="hidden md:flex bg-gradient-to-br from-blue-100 to-purple-100 justify-center items-center p-8">
            <div className="text-center space-y-6">
              <img
                src="https://res.cloudinary.com/counsellorcloud/image/upload/v1771012750/meeting2-mDUlSLPI_dm7qvm.png"
                alt="meeting2"
                className="max-w-xs lg:max-w-sm mx-auto"
                aria-hidden="true"
              />
              <div className="space-y-2">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800">
                  Find Your Dream College
                </h3>
                <p className="text-sm lg:text-base text-gray-600 max-w-sm mx-auto">
                  Connect with students, explore colleges, and make informed decisions about your future.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Login;
