import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import AnimatedBackground from "@/components/AnimatedBackground";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import ThemesPage from "./pages/ThemesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <AnimatedBackground />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/لوحة-التحكم" element={<Dashboard />} />
                <Route path="/المحادثات" element={<ChatPage />} />
                <Route path="/الملف-الشخصي" element={<ProfilePage />} />
                <Route path="/الثيمات" element={<ThemesPage />} />
                <Route path="/تسجيل-الدخول" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
