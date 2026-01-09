import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import FacultyDashboard from "@/components/AdaptiveLearning/FacultyDashboard";
import { supabase } from "@/integrations/supabase/client";

interface ConceptProgress {
  conceptId: string;
  status: "not-started" | "in-progress" | "mastered";
  timeSpent: number;
  quizScore: number;
  attempts: number;
}

const FacultyDashboardPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [conceptProgress, setConceptProgress] = useState<ConceptProgress[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect if not faculty
  useEffect(() => {
    if (!roleLoading && role && role !== "faculty") {
      if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "research_expert") {
        navigate("/research-dashboard");
      }
    }
  }, [role, roleLoading, navigate]);

  // Load all student progress data for analytics
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      try {
        // Load all concept progress for analytics
        const { data: progressData, error: progressError } = await supabase
          .from("adaptive_concept_progress")
          .select("*");

        if (progressError) throw progressError;

        if (progressData) {
          setConceptProgress(
            progressData.map((p) => ({
              conceptId: p.concept_id,
              status: p.status as ConceptProgress["status"],
              timeSpent: p.time_spent,
              quizScore: p.quiz_score,
              attempts: p.attempts,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading faculty data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!authLoading && role === "faculty") {
      loadData();
    }
  }, [user, authLoading, role]);

  if (authLoading || roleLoading || isLoadingData) {
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
                  Faculty Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage chapter content and track student performance • Arrays, Stacks, and Queues
                </p>
              </div>
            </div>
          </div>

          {/* Faculty Dashboard Content */}
          <FacultyDashboard conceptProgress={conceptProgress} />
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboardPage;
