import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const token = localStorage.getItem("token"); // check login status


  const handleLogout = () => {
    localStorage.removeItem("token"); // clear token 
    navigate("/login", { replace: true });  // redirect to login immediately
    window.location.reload();
  };

  return (
    <nav className="bg-blue-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">


          {/* Logo */}
          <Link to="/colleges" className="flex items-center">
            <img src="/logo192.png" alt="Logo" className="h-10 w-10" />
            <span className="font-bold text-blue-700">Counselling</span>

          </Link>


          {/* Nav links */}
          <div className="flex space-x-6">
            <Link to="/topUniversity" className="text-blue-900 hover:text-blue-700">
              Top Universities
            </Link>
            <Link to="/jobs" className="text-blue-900 hover:text-blue-700">
              Jobs
            </Link>
            <Link to="/courses" className="text-blue-900 hover:text-blue-700">
              Courses
            </Link>
            <Link to="/support" className="text-blue-900 hover:text-blue-700">
              Career Support
            </Link>


            {/* Right Section (depends on login status) */}
            <div className="flex items-center space-x-4">
              {token ? (
                // ✅ If logged in → show Profile + Logout
                <>
                  <Link
                    to="/profile"
                    className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 font-medium hover:underline"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                // ❌ If not logged in → show Login + Register
                <>
                  <Link
                    to="/login"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Dark/Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center text-sm bg-gray-200 px-3 py-1 rounded-full"
            >
              <span className="mr-2">{darkMode ? "🌙" : "☀️"}</span>
              {darkMode ? "Dark Mode" : "Light Mode"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;