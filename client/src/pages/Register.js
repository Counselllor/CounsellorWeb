import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getColleges, registerUser } from "../api/api";

function Register() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    college: "",
    captcha: "",
  });

  const [captcha, setCaptcha] = useState("");
  const [colleges, setColleges] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Generate initial captcha
  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Fetch colleges from API
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const { data } = await getColleges();
        setColleges(data);
      } catch (err) {
        console.error("Error fetching colleges:", err);
        toast.error("Failed to load colleges");
      }
    };

    fetchColleges();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const refreshCaptcha = () => {
    const newCaptcha = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCaptcha(newCaptcha);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate captcha
    if (form.captcha !== captcha) {
      toast.error("Captcha validation failed!");
      refreshCaptcha();
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await registerUser({
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        college: form.college,
      });

      localStorage.setItem("user", JSON.stringify(data));
      toast.success("Registered successfully!");
      navigate("/login");
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.message || "Something went wrong"));
      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-6xl w-full bg-white shadow-xl rounded-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* LEFT Register Form */}
        <div className="p-10 flex flex-col justify-center">
          {/* Branding */}
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Counsellor</h1>
          <h2 className="text-lg font-semibold mb-6 text-gray-700">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="flex items-center border rounded-lg px-3 py-2">
              <span className="text-gray-400 mr-2">👤</span>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                className="w-full outline-none"
                required
              />
            </div>

            {/* Full Name */}
            <div className="flex items-center border rounded-lg px-3 py-2">
              <span className="text-gray-400 mr-2">🧑</span>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full outline-none"
                required
              />
            </div>

            {/* Email */}
            <div className="flex items-center border rounded-lg px-3 py-2">
              <span className="text-gray-400 mr-2">✉️</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full outline-none"
                required
              />
            </div>

            {/* Password */}
            <div className="flex items-center border rounded-lg px-3 py-2">
              <span className="text-gray-400 mr-2">🔑</span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full outline-none"
                required
              />
            </div>

            {/* College */}
            <div className="flex items-center border rounded-lg px-3 py-2">
              <span className="text-gray-400 mr-2">🎓</span>
              <select
                name="college"
                value={form.college}
                onChange={handleChange}
                required
                className="w-full outline-none"
              >
                <option value="">Select College</option>
                {colleges.map((college) => (
                  <option key={college._id} value={college._id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Captcha */}
            <div className="flex items-center gap-2">
              <div className="bg-gray-200 px-4 py-2 rounded-md font-mono tracking-widest">
                {captcha}
              </div>
              <input
                type="text"
                name="captcha"
                placeholder="Enter Captcha Here"
                value={form.captcha}
                onChange={handleChange}
                className="flex-1 border rounded-lg px-3 py-2"
                required
              />
              <button type="button" className="px-2" onClick={refreshCaptcha}>
                🔄
              </button>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg py-2 transition"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-4 text-sm text-center space-y-1">
            <button
              className="text-blue-500 hover:underline"
              onClick={() => navigate("/login")}
            >
              Already have an account? Login
            </button>
          </div>
        </div>

        {/* RIGHT Illustration */}
        <div className="bg-green-100 flex justify-center items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/5087/5087579.png"
            alt="Register Illustration"
            className="max-w-md"
          />
        </div>
      </div>
    </div>
  );
}

export default Register;  