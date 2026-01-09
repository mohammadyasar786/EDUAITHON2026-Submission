import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { GraduationCap, Mail, Lock, User, Sparkles, Users, FlaskConical } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { role, isLoading: roleLoading, setUserRole } = useUserRole();
  const navigate = useNavigate();

  // Get pending role from sessionStorage (set during role selection)
  const pendingRole = sessionStorage.getItem("pendingRole") as AppRole | null;

  // Redirect authenticated users based on their role
  useEffect(() => {
    if (user && !roleLoading) {
      if (role) {
        // User has a role, redirect to appropriate dashboard
        redirectToRoleDashboard(role);
      } else if (pendingRole) {
        // User just signed up with a pending role, set it
        setUserRole(pendingRole).then(({ error }) => {
          if (!error) {
            sessionStorage.removeItem("pendingRole");
            redirectToRoleDashboard(pendingRole);
          }
        });
      } else {
        // Existing user without a role, go to role selection
        navigate("/select-role");
      }
    }
  }, [user, role, roleLoading, pendingRole]);

  const redirectToRoleDashboard = (userRole: AppRole) => {
    switch (userRole) {
      case "student":
        navigate("/student-dashboard");
        break;
      case "faculty":
        navigate("/faculty-dashboard");
        break;
      case "research_expert":
        navigate("/research-dashboard");
        break;
      default:
        navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          // Redirect will happen via useEffect when role is loaded
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! Welcome to EduVerse!");
          // Redirect will happen via useEffect when role is set
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const RoleIcon = pendingRole ? roleIcons[pendingRole] : GraduationCap;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 justify-center">
            <div className="p-3 rounded-2xl gradient-primary shadow-primary">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold">EduVerse</span>
          </div>
          
          {/* Show selected role if coming from role selection */}
          {pendingRole && !isLogin && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <RoleIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Signing up as {roleLabels[pendingRole]}
              </span>
            </div>
          )}
          
          <p className="text-muted-foreground">
            {isLogin ? "Welcome back! Continue your learning journey." : "Join the future of personalized education."}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="p-8 border-2 shadow-elevation">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="h-12"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 gradient-primary text-primary-foreground shadow-primary text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {isLogin ? "Sign In" : "Create Account"}
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="font-semibold text-primary">Sign up</span></>
              ) : (
                <>Already have an account? <span className="font-semibold text-primary">Sign in</span></>
              )}
            </button>
            
            {/* Back to role selection */}
            {!isLogin && (
              <button
                type="button"
                onClick={() => navigate("/select-role")}
                className="block w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← Choose a different role
              </button>
            )}
          </div>
        </Card>

        {/* Features preview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "🤖", label: "AI Tutor" },
            { icon: "🎯", label: "Adaptive Path" },
            { icon: "💚", label: "Wellness" }
          ].map((feature, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/50">
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-xs text-muted-foreground">{feature.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Auth;
