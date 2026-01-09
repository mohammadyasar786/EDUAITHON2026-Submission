import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, BookOpen, Code, Brain, Clock, TrendingUp, MessageSquare, Zap, Target, Award } from "lucide-react";
interface DashboardStats {
  totalMessages: number;
  codeGenerations: number;
  focusSessions: number;
  totalFocusMinutes: number;
  learningProgress: number;
  completedModules: number;
}
const Dashboard = () => {
  const {
    user,
    isLoading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    codeGenerations: 0,
    focusSessions: 0,
    totalFocusMinutes: 0,
    learningProgress: 0,
    completedModules: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to view your dashboard");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      // Fetch all stats in parallel
      const [messagesRes, codeRes, focusRes, progressRes] = await Promise.all([supabase.from("chat_messages").select("*", {
        count: "exact",
        head: true
      }).eq("user_id", user.id), supabase.from("code_generations").select("*", {
        count: "exact",
        head: true
      }).eq("user_id", user.id), supabase.from("focus_sessions").select("*").eq("user_id", user.id), supabase.from("learning_progress").select("*").eq("user_id", user.id)]);

      // Calculate focus stats
      const focusSessions = focusRes.data || [];
      const totalFocusMinutes = focusSessions.reduce((acc, session) => acc + (session.duration_minutes || 0), 0);

      // Calculate learning progress
      const progress = progressRes.data || [];
      const completedModules = progress.filter(p => p.status === "completed").length;
      const avgProgress = progress.length > 0 ? progress.reduce((acc, p) => acc + p.progress, 0) / progress.length : 0;
      setStats({
        totalMessages: messagesRes.count || 0,
        codeGenerations: codeRes.count || 0,
        focusSessions: focusSessions.length,
        totalFocusMinutes,
        learningProgress: Math.round(avgProgress),
        completedModules
      });

      // Fetch recent activity
      const [recentMessages, recentCode] = await Promise.all([supabase.from("chat_messages").select("*").eq("user_id", user.id).order("created_at", {
        ascending: false
      }).limit(3), supabase.from("code_generations").select("*").eq("user_id", user.id).order("created_at", {
        ascending: false
      }).limit(3)]);
      const activities = [...(recentMessages.data || []).map(m => ({
        type: "chat",
        content: m.content.substring(0, 50) + "...",
        created_at: m.created_at
      })), ...(recentCode.data || []).map(c => ({
        type: "code",
        content: c.instruction.substring(0, 50) + "...",
        created_at: c.created_at
      }))].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };
  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>;
  }
  const statCards = [{
    icon: MessageSquare,
    label: "AI Conversations",
    value: stats.totalMessages,
    color: "primary",
    link: "/ai-tutor"
  }, {
    icon: Code,
    label: "Code Generated",
    value: stats.codeGenerations,
    color: "accent",
    link: "/talk2code"
  }, {
    icon: Brain,
    label: "Focus Sessions",
    value: stats.focusSessions,
    color: "info",
    link: "/mindpulse"
  }, {
    icon: Clock,
    label: "Focus Minutes",
    value: stats.totalFocusMinutes,
    color: "success",
    link: "/mindpulse"
  }];
  const quickActions = [{
    icon: MessageSquare,
    label: "Ask AI Tutor",
    description: "Get help with any topic",
    link: "/ai-tutor",
    gradient: "gradient-primary"
  }, {
    icon: Code,
    label: "Generate Code",
    description: "Voice to code assistant",
    link: "/talk2code",
    gradient: "gradient-accent"
  }, {
    icon: BookOpen,
    label: "AR Learning",
    description: "3D visualizations",
    link: "/ar-learning",
    gradient: "gradient-hero"
  }, {
    icon: Brain,
    label: "Focus Session",
    description: "Track your attention",
    link: "/mindpulse",
    gradient: "gradient-primary"
  }];
  return <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 pb-8 px-4 container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full gradient-primary">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome back!</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => <Link key={index} to={stat.link}>
              <Card className="p-4 hover:shadow-elevation transition-all hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20 rounded-3xl">
                <div className={`inline-flex p-2 rounded-lg bg-${stat.color}/10 mb-3`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            </Link>)}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => <Link key={index} to={action.link}>
                  <Card className="p-5 hover:shadow-elevation transition-all hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20 group rounded-3xl">
                    <div className={`inline-flex p-3 rounded-xl ${action.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">
                      {action.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </Card>
                </Link>)}
            </div>

            {/* Learning Progress */}
            <Card className="p-6 border-2 rounded-3xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-success" />
                Learning Progress
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Overall Progress
                    </span>
                    <span className="font-semibold">{stats.learningProgress}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{
                    width: `${stats.learningProgress}%`
                  }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-accent" />
                  <span>
                    <strong>{stats.completedModules}</strong> modules completed
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </h2>
            <Card className="p-4 border-2 rounded-3xl">
              {recentActivity.length > 0 ? <div className="space-y-3">
                  {recentActivity.map((activity, index) => <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-full">
                      <div className={`p-2 rounded-lg ${activity.type === "chat" ? "bg-primary/10" : "bg-accent/10"}`}>
                        {activity.type === "chat" ? <MessageSquare className="h-4 w-4 text-primary" /> : <Code className="h-4 w-4 text-accent" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.type === "chat" ? "AI Chat" : "Code Generation"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.content}
                        </p>
                      </div>
                    </div>)}
                </div> : <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No recent activity yet</p>
                  <p className="text-xs">Start learning to see your progress!</p>
                </div>}
            </Card>

            {/* Tips Card */}
            <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-2 rounded-3xl">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Pro Tip
              </h3>
              <p className="text-sm text-muted-foreground">
                Use the AI Tutor to ask questions about topics you're learning,
                then visualize complex concepts in AR-Teach 360 for deeper
                understanding!
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default Dashboard;