import { Navigate } from "react-router-dom";
import { auth } from "../lib/auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = auth.getToken();
  const user = auth.getUser();

  if (!token) return <Navigate to="/login" replace />;

  // If roles are restricted to specific ones, check
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Student trying to access admin routes → go to profile
    if (user?.role === "Student") return <Navigate to="/my-profile" replace />;
    // Non-student trying to access student routes → go to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}