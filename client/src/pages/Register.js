/** Register Page Component 
 * added Icon function for rendering SVG icons based on name props.
 * added new visual design and layout for the register page.
 * added page indicator for login and register page.
 * other functions and feature remain the same, including form validation, password strength indicator, and captcha verification.
*/

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getColleges, registerUser } from "../api/api";
import Footer from "../components/Footer";

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />,
    briefcase: <path d="M9 6V4h6v2m5 4H4m1-4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm5 7h4" />,
    check: <path d="m5 12 4 4L19 6" />,
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m4 4 16 16M10.6 6.2A10.6 10.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8M7.1 7.1C4.1 8.8 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 2.8-.4M10.4 10.4a2.3 2.3 0 0 0 3.2 3.2" />
      </>
    ),
    graduation: <path d="m3 9 9-5 9 5-9 5-9-5Zm3 3v4.5c3.5 2.3 8.5 2.3 12 0V12m3-3v6" />,
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
      </>
    ),
    mail: <path d="M3 6h18v12H3V6Zm1 1 8 6 8-6" />,
    phone: <path d="M7.2 3H4.5A1.5 1.5 0 0 0 3 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 0 0 1.5-1.5v-2.7l-4.2-1.4-1.2 2.1a14.2 14.2 0 0 1-9.1-9.1l2.1-1.2L7.2 3Z" />,
    refresh: <path d="M20 7v5h-5M4 17v-5h5m9.5-3A7 7 0 0 0 6.2 6.2L4 9m16 6-2.2 2.8A7 7 0 0 1 5.5 15" />,
    spark: <path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

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
  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--mx", `${x * 18}px`);
    event.currentTarget.style.setProperty("--my", `${y * 18}px`);
  }; 

  return (
    <>
      <div className="app-shell" onMouseMove={handlePointerMove}>
        <div className="auth-card sign-up-mode">

          {/* LEFT - REGISTER FORM */}
          <div className="form-panel">

            <div className="signup-mode mode-switch" aria-label="Choose authentication mode">
              <span className="switch-highlight" />
              <button type="button" aria-pressed="false" onClick={() => navigate("/login")}>
                Log in
              </button>
              <button type="button" aria-pressed="true" className="active">
                Sign up
              </button>
            </div>

            <div className="heading-wrap">
              <p className="eyebrow">Your journey starts here</p>
              <h1>Create your account</h1>
              <p>Join a community built to help you make confident choices.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="field-group">
                  Full Name
                </label>
                <div className={`input-shell ${errors.name && touched.name
                  ? "has-error"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <Icon name="user" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="has-error"
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
                <label htmlFor="username" className="field-group">
                  Username 
                </label>
                <div className={`input-shell ${errors.username && touched.username
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <Icon name="user" />
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
                <label htmlFor="email" className="field-group">
                  Email Address 
                </label>
                <div className={`input-shell ${errors.email && touched.email
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                   <Icon name="mail" />
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
                <label htmlFor="password" className="field-group">
                  Password 
                </label>
                <div className={`input-shell ${errors.password && touched.password
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <Icon name="lock" />
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
                    className="password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="eye-icon eye-open" aria-hidden="true">{showPassword ? <Icon name="eye" /> : <Icon name="eyeOff" />}</span>
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
                <label htmlFor="college" className="field-group">
                  College
                </label>
                <div className={`input-shell ${errors.college && touched.college
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"
                  }`}>
                  <Icon name="graduation" />
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
                <label htmlFor="captcha" className="captcha-wrap">
                  Verification Code
                </label>
                <div className="captcha-row">
                  <div className="captcha-code">
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
                    className="captcha-refresh"
                    aria-label="Refresh captcha"
                    title="Refresh captcha"
                  >
                    <Icon name="refresh" />
                  </button>
                </div>
                {errors.captcha && touched.captcha && (
                  <p id="captcha-error" className="captcha-error">
                    <span className="mr-1">⚠️</span>
                    {errors.captcha}
                  </p>
                )}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-button"
              >
                {isSubmitting ? (
                  <>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="button-arrow"><Icon name="arrow" /></span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            
              <p className="alternate">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-700 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-1"
                >
                  Login here
                </Link>
              </p>
          </div>

          {/* RIGHT - ILLUSTRATION (Hidden on mobile) */}
          <aside className="visual-panel">
            <div className="grid-lines" />
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="illustration" aria-hidden="true">
              <div className="path-line" />
              <div className="destination-card">
                <span className="mini-label">Your next step</span>
                <div className="destination-icon"><Icon name="spark" /></div>
                <strong>A future that fits</strong>
                <span className="match"><Icon name="check" /> 96% match</span>
              </div>
              <div className="float-card float-card-one">
                <Icon name="book" />
                <span><strong>120+</strong> courses</span>
              </div>
              <div className="float-card float-card-two">
                <span className="avatar">A</span>
                <span><strong>Expert guidance</strong>Always in your corner</span>
              </div>
            </div>
            <div className="visual-copy">
              <span className="visual-kicker"><Icon name="spark" /> Built around your ambition</span>
              <h2>Let’s find where you belong.</h2>
              <p>Discover courses, compare colleges and get guidance for every important decision.</p>
              <div className="trust-row">
                <span className="avatars"><i>M</i><i>J</i><i>S</i></span>
                <span><strong>10,000+</strong> students moving forward</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Register;
