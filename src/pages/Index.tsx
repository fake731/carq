import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthPage from "./AuthPage";

const Index = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <AuthPage />;
};

export default Index;
