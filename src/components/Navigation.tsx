import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Heart, Code, TrendingUp, Sparkles, LogOut, LayoutDashboard, GraduationCap, Trophy, Users, FlaskConical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import ThemeToggle from "./ThemeToggle";
const Navigation = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    role
  } = useUserRole();
  const navigate = useNavigate();
  const handleDashboardClick = () => {
    if (!user) {
      navigate("/select-role");
      return;
    }
    switch (role) {
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
        navigate("/dashboard");
    }
  };
  const getRoleDashboardInfo = () => {
    switch (role) {
      case "student":
        return {
          icon: GraduationCap,
          label: "Student Dashboard",
          href: "/student-dashboard"
        };
      case "faculty":
        return {
          icon: Users,
          label: "Faculty Dashboard",
          href: "/faculty-dashboard"
        };
      case "research_expert":
        return {
          icon: FlaskConical,
          label: "Research Dashboard",
          href: "/research-dashboard"
        };
      default:
        return {
          icon: LayoutDashboard,
          label: "Dashboard",
          href: "/dashboard"
        };
    }
  };
  const dashboardInfo = getRoleDashboardInfo();
  const DashboardIcon = dashboardInfo.icon;
  return <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-primary transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500">
              EduVerse
            </span>
          </Link>

          {/* Show different nav items based on role */}
          <div className="hidden md:flex items-center space-x-1">
            {role === "student" && <>
                <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-primary hover:bg-primary/5">
                  <Link to="/tutor" className="flex items-center gap-2 rounded-3xl">
                    <Brain className="h-4 w-4" />
                    AI Tutor
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-info hover:bg-info/5">
                  <Link to="/ar-learning" className="flex items-center gap-2 rounded-3xl">
                    <BookOpen className="h-4 w-4" />
                    AR Learning
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-success hover:bg-success/5">
                  <Link to="/mindpulse" className="flex items-center gap-2 rounded-3xl">
                    <Heart className="h-4 w-4" />
                    MindPulse
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-accent hover:bg-accent/5">
                  <Link to="/talk2code" className="flex items-center gap-2 rounded-3xl">
                    <Code className="h-4 w-4" />
                    Talk2Code
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-primary hover:bg-primary/5">
                  <Link to="/learnflow" className="flex items-center gap-2 rounded-3xl">
                    <TrendingUp className="h-4 w-4" />
                    LearnFlow
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-amber-500 hover:bg-amber-500/5">
                  <Link to="/progress-board" className="flex items-center gap-2 rounded-3xl">
                    <Trophy className="h-4 w-4" />
                    Progress
                  </Link>
                </Button>
              </>}
            
            {/* Show role-specific dashboard link */}
            {user && role && <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-success hover:bg-success/5">
                <Link to={dashboardInfo.href} className="flex items-center gap-2 rounded-3xl">
                  <DashboardIcon className="h-4 w-4" />
                  {role === "student" ? "Dashboard" : dashboardInfo.label.split(" ")[0]}
                </Link>
              </Button>}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? <>
                <Button variant="ghost" size="sm" onClick={handleDashboardClick} className="text-foreground/70 hover:text-primary hover:bg-primary/5">
                  <DashboardIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{dashboardInfo.label.split(" ")[0]}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={signOut} className="rounded-3xl">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </> : <Button size="sm" className="gradient-primary text-primary-foreground shadow-primary" asChild>
                <Link to="/select-role" className="rounded-full">Get Started</Link>
              </Button>}
          </div>
        </div>
      </div>
    </nav>;
};
export default Navigation;