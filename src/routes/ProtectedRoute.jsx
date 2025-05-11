import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/authProvider";

export const ProtectedRoute = () => {
  const { token } = useAuth();

  // Check if the user is authenticated
  if (!token) {
    // If not authenticated, redirect to the login page
    console.log("No token found. Redirecting to Sign In.");
    return <Navigate to="/signin" />;
  }

  // If authenticated, render the child routes
  console.log("Token found. Congratulations!");
  return <Outlet />;
};