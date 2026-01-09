import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, FlaskConical, ArrowRight } from "lucide-react";
import type { AppRole } from "@/hooks/useUserRole";

interface RoleSelectorProps {
  onSelectRole: (role: AppRole) => void;
  isLoading: boolean;
}

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

const RoleSelector = ({ onSelectRole, isLoading }: RoleSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to EduVerse</h2>
        <p className="text-muted-foreground">
          Select your role to begin learning or contributing to the chapter:
          <br />
          <span className="font-semibold text-primary">Arrays, Stacks, and Queues</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card
            key={role.id}
            className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer group"
            onClick={() => !isLoading && onSelectRole(role.id)}
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
                className="w-full gap-2 group-hover:bg-primary" 
                variant="outline"
                disabled={isLoading}
              >
                Continue as {role.title}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
