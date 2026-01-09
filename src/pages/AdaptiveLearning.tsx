import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import DiagnosticOnboarding from "@/components/AdaptiveLearning/DiagnosticOnboarding";
import ChapterView from "@/components/AdaptiveLearning/ChapterView";
import ConceptLearning from "@/components/AdaptiveLearning/ConceptLearning";
import FacultyDashboard from "@/components/AdaptiveLearning/FacultyDashboard";
import ResearchExpertDashboard from "@/components/AdaptiveLearning/ResearchExpertDashboard";
import RoleSelector from "@/components/AdaptiveLearning/RoleSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, FlaskConical, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AIVAButton } from "@/components/AIVA";

export interface LearningProfile {
  diagnosticScore: number;
  learningStyle: "visual" | "analogy" | "step-by-step" | "formula-first";
  answeredQuestions: { questionId: number; correct: boolean }[];
}

export interface ConceptProgress {
  conceptId: string;
  status: "not-started" | "in-progress" | "mastered";
  timeSpent: number;
  quizScore: number;
  attempts: number;
}

const roleIcons = {
  student: GraduationCap,
  faculty: Users,
  research_expert: FlaskConical,
};

const roleLabels = {
  student: "Student",
  faculty: "Faculty",
  research_expert: "Research Expert",
};

const AdaptiveLearning = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading, setUserRole, clearRole } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [conceptProgress, setConceptProgress] = useState<ConceptProgress[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load profile and progress from database
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      try {
        // Load learning profile
        const { data: profileData, error: profileError } = await supabase
          .from("adaptive_learning_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData) {
          setLearningProfile({
            diagnosticScore: profileData.diagnostic_score,
            learningStyle: profileData.learning_style as LearningProfile["learningStyle"],
            answeredQuestions: (profileData.answered_questions as any[]) || [],
          });
        }

        // Load concept progress
        const { data: progressData, error: progressError } = await supabase
          .from("adaptive_concept_progress")
          .select("*")
          .eq("user_id", user.id);

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
        console.error("Error loading adaptive learning data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  const handleRoleSelect = async (selectedRole: AppRole) => {
    const { error } = await setUserRole(selectedRole);
    if (error) {
      toast({ title: "Error", description: "Failed to set role.", variant: "destructive" });
    } else {
      toast({ title: "Welcome!", description: `You're now logged in as ${roleLabels[selectedRole]}.` });
    }
  };

  const handleProfileComplete = async (profile: LearningProfile) => {
    setLearningProfile(profile);

    if (user) {
      try {
        const { error } = await supabase.from("adaptive_learning_profiles").upsert({
          user_id: user.id,
          diagnostic_score: profile.diagnosticScore,
          learning_style: profile.learningStyle,
          answered_questions: profile.answeredQuestions,
        });

        if (error) throw error;
        toast({ title: "Profile saved", description: "Your learning profile has been saved." });
      } catch (error) {
        console.error("Error saving profile:", error);
        toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
      }
    }
  };

  const handleConceptSelect = (conceptId: string) => {
    setSelectedConcept(conceptId);
  };

  const handleConceptBack = () => {
    setSelectedConcept(null);
  };

  const handleProgressUpdate = async (conceptId: string, progress: Partial<ConceptProgress>) => {
    const existing = conceptProgress.find((p) => p.conceptId === conceptId);
    const updatedProgress: ConceptProgress = existing
      ? { ...existing, ...progress }
      : { conceptId, status: "in-progress", timeSpent: 0, quizScore: 0, attempts: 0, ...progress };

    setConceptProgress((prev) => {
      const existingIndex = prev.findIndex((p) => p.conceptId === conceptId);
      if (existingIndex >= 0) {
        return prev.map((p) => (p.conceptId === conceptId ? updatedProgress : p));
      }
      return [...prev, updatedProgress];
    });

    if (user) {
      try {
        const { error } = await supabase.from("adaptive_concept_progress").upsert({
          user_id: user.id,
          concept_id: conceptId,
          status: updatedProgress.status,
          time_spent: updatedProgress.timeSpent,
          quiz_score: updatedProgress.quizScore,
          attempts: updatedProgress.attempts,
        });

        if (error) throw error;
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }
  };

  const handleSwitchRole = async () => {
    await clearRole();
  };

  if (authLoading || roleLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleResetProfile = async () => {
    setLearningProfile(null);
    if (user) {
      try {
        await supabase.from("adaptive_learning_profiles").delete().eq("user_id", user.id);
        await supabase.from("adaptive_concept_progress").delete().eq("user_id", user.id);
        setConceptProgress([]);
        toast({ title: "Profile reset", description: "Your learning profile has been reset." });
      } catch (error) {
        console.error("Error resetting profile:", error);
      }
    }
  };

  const RoleIcon = role ? roleIcons[role] : GraduationCap;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header with chapter focus */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Arrays, Stacks, and Queues
                </h1>
                <p className="text-muted-foreground">
                  AI-powered self-learning module • Data Structures
                </p>
              </div>
              {role && (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-2 px-3 py-1.5">
                    <RoleIcon className="h-4 w-4" />
                    {roleLabels[role]}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={handleSwitchRole}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Switch Role
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Role selection or role-specific content */}
          {!role ? (
            <RoleSelector onSelectRole={handleRoleSelect} isLoading={roleLoading} />
          ) : role === "student" ? (
            // Student View
            !learningProfile ? (
              <DiagnosticOnboarding onComplete={handleProfileComplete} />
            ) : selectedConcept ? (
              <ConceptLearning
                conceptId={selectedConcept}
                learningProfile={learningProfile}
                progress={conceptProgress.find((p) => p.conceptId === selectedConcept)}
                onBack={handleConceptBack}
                onProgressUpdate={(progress) => handleProgressUpdate(selectedConcept, progress)}
              />
            ) : (
              <ChapterView
                learningProfile={learningProfile}
                conceptProgress={conceptProgress}
                onConceptSelect={handleConceptSelect}
                onResetProfile={handleResetProfile}
              />
            )
          ) : role === "faculty" ? (
            // Faculty View
            <FacultyDashboard conceptProgress={conceptProgress} />
          ) : (
            // Research Expert View
            <ResearchExpertDashboard />
          )}
        </div>
      </main>
      
      {/* AIVA Floating AI Companion - Only for students */}
      {role === "student" && (
        <AIVAButton 
          context={{
            concept: selectedConcept || undefined,
            chapter: "Arrays, Stacks, and Queues",
          }}
          learningStyle={learningProfile?.learningStyle}
        />
      )}
    </div>
  );
};

export default AdaptiveLearning;
