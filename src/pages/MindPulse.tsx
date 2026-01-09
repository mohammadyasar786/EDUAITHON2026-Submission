import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { Heart, Brain, Smile, Activity, Coffee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AIVAButton } from "@/components/AIVA";
import { useLearningStreak } from "@/hooks/useLearningStreak";
import FacialAnalysis from "@/components/MindPulse/FacialAnalysis";

const MindPulse = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { updateStreak, recordFocusSession } = useLearningStreak();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [facialFocusState, setFacialFocusState] = useState<"focused" | "neutral" | "stressed">("neutral");
  const [stats, setStats] = useState([
    { label: "Focus Level", value: 0, color: "primary", icon: Brain },
    { label: "Engagement", value: 0, color: "success", icon: Activity },
    { label: "Well-being", value: 0, color: "info", icon: Smile },
    { label: "Energy", value: 0, color: "accent", icon: Coffee }
  ]);
  const [insights, setInsights] = useState<Array<{ type: string; time: string; message: string }>>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to use MindPulse");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isMonitoring) {
      updateStreak();
    }
  }, [user, isMonitoring, updateStreak]);

  // Simulate focus monitoring with random values
  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(() => {
      setStats(prev => prev.map(stat => ({
        ...stat,
        value: Math.min(100, Math.max(0, stat.value + (Math.random() * 20 - 10)))
      })));

      if (Math.random() > 0.8) {
        const insightTypes = [
          { type: "success", message: "Great focus! Keep up the excellent work." },
          { type: "info", message: "Consider taking a short break soon." },
          { type: "warning", message: "Your engagement seems to be dropping. Try switching topics." }
        ];
        const randomInsight = insightTypes[Math.floor(Math.random() * insightTypes.length)];
        setInsights(prev => [{ ...randomInsight, time: "Just now" }, ...prev.slice(0, 4)]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Update stats based on facial analysis
  const handleFacialFocusUpdate = (focus: "focused" | "neutral" | "stressed") => {
    setFacialFocusState(focus);
    
    // Adjust focus level based on facial analysis
    setStats(prev => prev.map(stat => {
      if (stat.label === "Focus Level") {
        const adjustment = focus === "focused" ? 10 : focus === "stressed" ? -15 : 0;
        return { ...stat, value: Math.min(100, Math.max(0, stat.value + adjustment)) };
      }
      if (stat.label === "Well-being") {
        const adjustment = focus === "stressed" ? -10 : focus === "focused" ? 5 : 0;
        return { ...stat, value: Math.min(100, Math.max(0, stat.value + adjustment)) };
      }
      return stat;
    }));

    // Add insight based on facial state change
    if (focus === "stressed") {
      setInsights(prev => [{
        type: "warning",
        time: "Just now",
        message: "Camera detected stress. Consider a short breathing break."
      }, ...prev.slice(0, 4)]);
    }
  };

  const startMonitoring = async () => {
    setIsMonitoring(true);
    setSessionStart(new Date());
    setStats(prev => prev.map(stat => ({ ...stat, value: 70 + Math.random() * 20 })));

    if (user) {
      const { data, error } = await supabase.from("focus_sessions").insert({
        user_id: user.id,
        focus_level: 75,
        engagement: 80,
        wellbeing: 70,
        energy: 65
      }).select().single();
      if (!error && data) {
        setSessionId(data.id);
      }
    }
    setInsights([{
      type: "success",
      time: "Just now",
      message: "Session started! I'll help you stay focused and monitor your well-being."
    }]);
    toast.success("Monitoring started!");
  };

  const stopMonitoring = async () => {
    setIsMonitoring(false);

    if (user && sessionId && sessionStart) {
      const duration = Math.round((new Date().getTime() - sessionStart.getTime()) / 60000);
      await supabase.from("focus_sessions").update({
        ended_at: new Date().toISOString(),
        duration_minutes: duration,
        focus_level: Math.round(stats[0].value),
        engagement: Math.round(stats[1].value),
        wellbeing: Math.round(stats[2].value),
        energy: Math.round(stats[3].value)
      }).eq("id", sessionId);

      await recordFocusSession(duration);
    }
    setSessionId(null);
    setSessionStart(null);
    toast.info("Session ended. Great work!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4 container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">MindPulse Monitor</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            Stay Focused &{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500">
              Emotionally Balanced
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time monitoring of your attention, engagement, and well-being. Learn better by understanding your mental state.
          </p>
        </div>

        {/* Camera-based Facial Analysis */}
        <div className="mb-8">
          <FacialAnalysis 
            onFocusUpdate={handleFacialFocusUpdate}
            isMonitoring={isMonitoring}
          />
        </div>

        {/* Monitoring Control */}
        <Card className="mb-8 p-8 text-center border-2 rounded-3xl">
          <div className="max-w-md mx-auto space-y-6">
            <div className={`inline-flex p-6 rounded-2xl gradient-success shadow-primary ${isMonitoring ? "animate-pulse" : ""}`}>
              <Heart className="h-12 w-12 text-success-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {isMonitoring ? "Monitoring Active" : "Start Monitoring"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {isMonitoring 
                  ? "We're tracking your focus and well-being in real-time" 
                  : "Start a focus session to track your learning wellness"}
              </p>
              {isMonitoring && sessionStart && (
                <p className="text-sm text-primary font-medium mb-4">
                  Session duration: {Math.round((new Date().getTime() - sessionStart.getTime()) / 60000)} minutes
                </p>
              )}
            </div>
            <Button 
              size="lg" 
              onClick={isMonitoring ? stopMonitoring : startMonitoring} 
              className={isMonitoring ? "gradient-accent text-accent-foreground" : "gradient-primary text-primary-foreground shadow-primary"}
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </Button>
          </div>
        </Card>

        {/* Stats Dashboard */}
        {isMonitoring && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="p-6 border-2 hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                      <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                    </div>
                    <span className="font-medium text-sm">{stat.label}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">{Math.round(stat.value)}</span>
                      <span className="text-muted-foreground text-sm mb-1">%</span>
                    </div>
                    <Progress value={stat.value} className="h-2" />
                  </div>
                </Card>
              ))}
            </div>

            {/* Insights */}
            <Card className="p-6 border-2">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Insights
              </h3>
              <div className="space-y-4">
                {insights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Analyzing your focus patterns...</p>
                  </div>
                ) : (
                  insights.map((insight, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-l-4 ${
                        insight.type === "success" 
                          ? "border-success bg-success/5" 
                          : insight.type === "info" 
                          ? "border-info bg-info/5" 
                          : "border-accent bg-accent/5"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{insight.time}</span>
                      </div>
                      <p className="text-sm">{insight.message}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Tips */}
            <Card className="mt-8 p-8 bg-gradient-to-br from-primary/5 to-success/5 border-2">
              <h3 className="text-xl font-bold mb-4 text-center">Study Tips for Better Focus</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-xl gradient-primary">
                    <Brain className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm">25-Minute Sessions</h4>
                  <p className="text-xs text-muted-foreground">
                    Use the Pomodoro technique for optimal focus
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-xl gradient-success">
                    <Coffee className="h-6 w-6 text-success-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm">Regular Breaks</h4>
                  <p className="text-xs text-muted-foreground">
                    Take 5-minute breaks between sessions
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-xl gradient-info">
                    <Smile className="h-6 w-6 text-info-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm">Stay Positive</h4>
                  <p className="text-xs text-muted-foreground">
                    Maintain a positive mindset for better retention
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <AIVAButton 
        context={{ 
          topic: "Focus & Well-being",
          focusLevel: isMonitoring ? `${Math.round(stats[0].value)}%` : undefined 
        }} 
        learningStyle="step-by-step" 
      />
    </div>
  );
};

export default MindPulse;
