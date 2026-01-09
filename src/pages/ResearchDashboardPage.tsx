import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import ResearchExpertDashboard from "@/components/AdaptiveLearning/ResearchExpertDashboard";

const ResearchDashboardPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect if not research expert
  useEffect(() => {
    if (!roleLoading && role && role !== "research_expert") {
      if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "faculty") {
        navigate("/faculty-dashboard");
      }
    }
  }, [role, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Research Expert Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Contribute insights, code snippets, and case studies • Arrays, Stacks, and Queues
                </p>
              </div>
            </div>
          </div>

          {/* Research Expert Dashboard Content */}
          <ResearchExpertDashboard />
        </div>
      </main>
    </div>
  );
};

export default ResearchDashboardPage;
