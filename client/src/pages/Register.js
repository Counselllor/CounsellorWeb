

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getColleges, registerUser } from "../api/api";
import Footer from "../components/Footer";

function Register() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    college: "",
  });
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [colleges, setColleges] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    refreshCaptcha();
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/colleges", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const { data } = await getColleges();
        setColleges(data || []);
      } catch (err) {
        console.error("Error fetching colleges:", err);
        toast.error("Failed to load colleges");
        setColleges([]);
      }
    };
    fetchColleges();
  }, []);

  const refreshCaptcha = () => {
    const newCaptcha = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCaptcha(newCaptcha);
    setCaptchaInput("");
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Full name is required";
        } else if (value.trim().length < 2) {
          error = "Name must be at least 2 characters";
        }
        break;
      case "username":
        if (!value.trim()) {
          error = "Username is required";
        } else if (value.length < 3) {
          error = "Username must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = "Username can only contain letters, numbers, and underscores";
        }
        break;
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
      case "college":
        if (!value) {
          error = "Please select a college";
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
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
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
    newErrors.name = validateField("name", form.name);
    newErrors.username = validateField("username", form.username);
    newErrors.email = validateField("email", form.email);
    newErrors.password = validateField("password", form.password);
    newErrors.college = validateField("college", form.college);
    newErrors.captcha = validateField("captcha", captchaInput);
    setErrors(newErrors);
    setTouched({ name: true, username: true, email: true, password: true, college: true, captcha: true });
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
      const { data } = await registerUser(form);
      localStorage.setItem("user", JSON.stringify(data));
      toast.success("Registered successfully! 🎉 Please login to continue.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
      refreshCaptcha();
      setCaptchaInput("");
      setErrors({ ...errors, captcha: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
    return colors[passwordStrength] || "bg-gray-300";
  };

  const getPasswordStrengthText = () => {
    const texts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return texts[passwordStrength] || "";
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full bg-white shadow-2xl rounded-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden animate-scaleIn">

          {/* LEFT - REGISTER FORM */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center max-h-screen overflow-y-auto">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-800">
                Join Us Today! 🚀
              </h1>
              <h2 className="text-base sm:text-lg font-medium text-gray-600">
                Create your account to get started
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border-2 rounded-lg px-3 py-2 sm:py-2.5 transition-all ${errors.name && touched.name
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <span className="text-gray-400 mr-2 text-lg" aria-hidden="true">🧑</span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full outline-none bg-transparent text-sm sm:text-base"
                    aria-invalid={errors.name && touched.name ? "true" : "false"}
                    aria-describedby={errors.name && touched.name ? "name-error" : undefined}
                  />
                </div>
                {errors.name && touched.name && (
                  <p id="name-error" className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border-2 rounded-lg px-3 py-2 sm:py-2.5 transition-all ${errors.username && touched.username
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <span className="text-gray-400 mr-2 text-lg" aria-hidden="true">👤</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="johndoe123"
                    value={form.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full outline-none bg-transparent text-sm sm:text-base"
                    aria-invalid={errors.username && touched.username ? "true" : "false"}
                    aria-describedby={errors.username && touched.username ? "username-error" : undefined}
                  />
                </div>
                {errors.username && touched.username && (
                  <p id="username-error" className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border-2 rounded-lg px-3 py-2 sm:py-2.5 transition-all ${errors.email && touched.email
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <span className="text-gray-400 mr-2 text-lg" aria-hidden="true">✉️</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
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

              {/* Password with Strength Indicator */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border-2 rounded-lg px-3 py-2 sm:py-2.5 transition-all ${errors.password && touched.password
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <span className="text-gray-400 mr-2 text-lg" aria-hidden="true">🔑</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full outline-none bg-transparent text-sm sm:text-base"
                    aria-invalid={errors.password && touched.password ? "true" : "false"}
                    aria-describedby={errors.password && touched.password ? "password-error password-strength" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="text-lg" aria-hidden="true">{showPassword ? "👁️" : "👁️‍🗨️"}</span>
                  </button>
                </div>
                {form.password && (
                  <div id="password-strength" className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${level <= passwordStrength ? getPasswordStrengthColor() : "bg-gray-200"
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Strength: <span className="font-medium">{getPasswordStrengthText()}</span>
                    </p>
                  </div>
                )}
                {errors.password && touched.password && (
                  <p id="password-error" className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.password}
                  </p>
                )}
              </div>
              {/* College Selection */}
              <div>
                <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-1">
                  College <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center border-2 rounded-lg px-3 py-2 sm:py-2.5 transition-all ${errors.college && touched.college
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <span className="text-gray-400 mr-2 text-lg" aria-hidden="true">🎓</span>
                  <select
                    id="college"
                    name="college"
                    value={form.college}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full outline-none bg-transparent text-sm sm:text-base cursor-pointer"
                    aria-invalid={errors.college && touched.college ? "true" : "false"}
                    aria-describedby={errors.college && touched.college ? "college-error" : undefined}
                  >
                    <option value="">Select your college</option>
                    {colleges.map((college) => (
                      <option key={college._id} value={college._id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.college && touched.college && (
                  <p id="college-error" className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.college}
                  </p>
                )}
              </div>

              {/* Captcha */}
              <div>
                <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="bg-gradient-to-r from-green-100 to-blue-100 px-4 py-3 rounded-lg font-mono text-base sm:text-lg tracking-widest select-none border-2 border-green-200 shadow-sm text-center sm:text-left flex-shrink-0">
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
                    className={`flex-1 border-2 rounded-lg px-3 py-2 sm:py-2.5 text-sm sm:text-base transition-all outline-none ${errors.captcha && touched.captcha
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-green-500"
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

              {/* Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg py-3 sm:py-3.5 transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    <span className="mr-2" aria-hidden="true">✨</span>
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-700 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-1"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>

          {/* RIGHT - ILLUSTRATION (Hidden on mobile) */}
          <div className="hidden md:flex bg-gradient-to-br from-green-100 to-blue-100 justify-center items-center p-8">
            <div className="text-center space-y-6">
              <img
                src="https://cdn-icons-png.flaticon.com/512/5087/5087579.png"
                alt=""
                className="max-w-xs lg:max-w-sm mx-auto"
                aria-hidden="true"
              />
              <div className="space-y-2">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800">
                  Start Your Journey
                </h3>
                <p className="text-sm lg:text-base text-gray-600 max-w-sm mx-auto">
                  Join thousands of students finding their perfect college match and connecting with peers.
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

export default Register;
