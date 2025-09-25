import React from "react";
import { BrowserRouter as Router, Routes, Route,Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import AdminColleges from "./pages/AdminColleges";
import Colleges from "./pages/Colleges";  
import ProtectedRoute from "./components/ProtectedRoute";
import CollegeDetail from "./pages/CollegeDetail";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import { ToastContainer } from "react-toastify";



function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/colleges" 
          element={
            <ProtectedRoute>
              <Colleges />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/colleges" 
          element={
            <ProtectedRoute role="admin">
              <AdminColleges />
            </ProtectedRoute>
          } 
        />
        <Route path="/colleges/:slug" element={<CollegeDetail />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Router>
  );
}

export default App;