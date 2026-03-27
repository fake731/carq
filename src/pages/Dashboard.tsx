import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import CustomerDashboard from "./CustomerDashboard";
import GarageDashboard from "./GarageDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  switch (user?.role) {
    case "admin":
      return <AdminDashboard />;
    case "garage":
      return <GarageDashboard />;
    default:
      return <CustomerDashboard />;
  }
};

export default Dashboard;
