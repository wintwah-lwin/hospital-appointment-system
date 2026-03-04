import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // TODO: Replace with real auth (JWT + role check)
  const isLoggedIn = true;     // set false to test redirect
  const role = "admin";        // "user" | "admin"

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  return children;
}
