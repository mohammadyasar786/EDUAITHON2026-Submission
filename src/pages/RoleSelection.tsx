import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, FlaskConical, ArrowRight, Sparkles } from "lucide-react";
import type { AppRole } from "@/hooks/useUserRole";

const roles = [
  {
    id: "student" as AppRole,
    title: "Student",
    description: "Learn Arrays, Stacks, and Queues through AI-powered personalized lessons",
    icon: GraduationCap,
    color: "bg-info/10 text-info",
    features: [
      "Diagnostic onboarding",
      "Adaptive explanations",
      "Practice questions",
      "Progress tracking",
    ],
  },
  {
    id: "faculty" as AppRole,
    title: "Faculty",
    description: "Create and manage chapter content, objectives, and track student performance",
    icon: Users,
    color: "bg-success/10 text-success",
    features: [
      "Upload lecture notes",
      "Define learning objectives",
      "Set misconceptions",
      "View analytics",
    ],
  },
  {
    id: "research_expert" as AppRole,
    title: "Research Expert",
    description: "Contribute applied insights, code snippets, and real-world case studies",
    icon: FlaskConical,
    color: "bg-accent text-accent-foreground",
    features: [
      "Add code snippets",
      "Share case studies",
      "Provide research notes",
      "Real-world applications",
    ],
  },
];

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: AppRole) => {
    // Store the selected role temporarily and navigate to auth
    sessionStorage.setItem("pendingRole", role);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 justify-center">
            <div className="p-3 rounded-2xl gradient-primary shadow-primary">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold">EduVerse</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome! Choose Your Role
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select how you want to use EduVerse for the{" "}
            <span className="font-semibold text-primary">Arrays, Stacks, and Queues</span> chapter
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${role.color} flex items-center justify-center mb-4`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground" 
                  variant="outline"
                >
                  Continue as {role.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Already have account link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Already have an account? <span className="font-semibold text-primary">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
