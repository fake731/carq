import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";

const Index = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <AuthPage />;
};

export default Index;
