import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Not logged in OR no token? -> go to login
  if (!user || !token) return <Navigate to="/login" />;

  // Role passed & doesn't match? -> redirect user
  if (role && user.role !== role) {
    return <Navigate to="/colleges" />;
  }

  return children;
}

export default ProtectedRoute;