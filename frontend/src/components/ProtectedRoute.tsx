
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { User } from "../types/user";

interface ProtectedRouteProps {
  currentUser: User | null;
  authLoading: boolean;
  allowedRoles?: User["role"][];
  children: ReactNode;
}

function ProtectedRoute({
  currentUser,
  authLoading,
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  // Wait until the session verification request finishes.
  if (authLoading) {
    return (
      <div className="campaign-loading">
        Checking your session...
      </div>
    );
  }

  // Redirect only after confirming that the user is not logged in.
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check whether the user's role is allowed.
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
