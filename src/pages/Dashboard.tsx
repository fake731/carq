import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import CustomerDashboard from "./CustomerDashboard";
import GarageDashboard from "./GarageDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

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
