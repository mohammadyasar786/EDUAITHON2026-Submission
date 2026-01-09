import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import AITutor from "./pages/AITutor";
import ARLearning from "./pages/ARLearning";
import MindPulse from "./pages/MindPulse";
import Talk2Code from "./pages/Talk2Code";
import LearnFlow from "./pages/LearnFlow";
import AdaptiveLearning from "./pages/AdaptiveLearning";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboardPage from "./pages/FacultyDashboardPage";
import ResearchDashboardPage from "./pages/ResearchDashboardPage";
import NotFound from "./pages/NotFound";
import ProgressBoard from "./pages/ProgressBoard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/select-role" element={<RoleSelection />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/faculty-dashboard" element={<FacultyDashboardPage />} />
            <Route path="/research-dashboard" element={<ResearchDashboardPage />} />
            <Route path="/tutor" element={<AITutor />} />
            <Route path="/ar-learning" element={<ARLearning />} />
            <Route path="/mindpulse" element={<MindPulse />} />
            <Route path="/talk2code" element={<Talk2Code />} />
            <Route path="/learnflow" element={<LearnFlow />} />
            <Route path="/adaptive-learning" element={<AdaptiveLearning />} />
            <Route path="/progress-board" element={<ProgressBoard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
