import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Target,
  TrendingUp,
  Trophy,
  Clock,
  Award,
  Eye,
  EyeOff,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import AchievementBadges from "@/components/AchievementBadges";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
}

interface Achievement {
  type: string;
  value: number;
  achievedAt: string;
  label: string;
  icon: React.ReactNode;
}

interface LeaderboardPreferences {
  showOnLeaderboard: boolean;
  showStreak: boolean;
  showImprovement: boolean;
}

const ProgressBoard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Progress data
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
  });
  const [conceptsCompleted, setConceptsCompleted] = useState(0);
  const [improvementScore, setImprovementScore] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [preferences, setPreferences] = useState<LeaderboardPreferences>({
    showOnLeaderboard: true,
    showStreak: true,
    showImprovement: true,
  });

  // Top performers (anonymized)
  const [topImprovers, setTopImprovers] = useState<{ id: string; score: number; displayName: string }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch streak data
      const { data: streakRow } = await supabase
        .from("learning_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (streakRow) {
        setStreakData({
          currentStreak: streakRow.current_streak || 0,
          longestStreak: streakRow.longest_streak || 0,
          totalActiveDays: streakRow.total_active_days || 0,
        });
      }

      // Fetch concepts completed
      const { data: conceptProgress } = await supabase
        .from("adaptive_concept_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "mastered");

      setConceptsCompleted(conceptProgress?.length || 0);

      // Calculate improvement score from diagnostic to current
      const { data: learningProfile } = await supabase
        .from("adaptive_learning_profiles")
        .select("diagnostic_score")
        .eq("user_id", user.id)
        .maybeSingle();

      if (learningProfile && conceptProgress) {
        const avgQuizScore = conceptProgress.length > 0
          ? conceptProgress.reduce((sum, c) => sum + (c.quiz_score || 0), 0) / conceptProgress.length
          : 0;
        const improvement = Math.max(0, Math.round(avgQuizScore - (learningProfile.diagnostic_score || 0)));
        setImprovementScore(improvement);
      }

      // Fetch achievements
      const { data: achievementRows } = await supabase
        .from("learning_achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false })
        .limit(5);

      if (achievementRows) {
        const mappedAchievements: Achievement[] = achievementRows.map((a) => ({
          type: a.achievement_type,
          value: a.achievement_value,
          achievedAt: a.achieved_at,
          label: getAchievementLabel(a.achievement_type),
          icon: getAchievementIcon(a.achievement_type),
        }));
        setAchievements(mappedAchievements);
      }

      // Fetch preferences
      const { data: prefsRow } = await supabase
        .from("leaderboard_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prefsRow) {
        setPreferences({
          showOnLeaderboard: prefsRow.show_on_leaderboard,
          showStreak: prefsRow.show_streak,
          showImprovement: prefsRow.show_improvement,
        });
      }

      // Fetch focus sessions for personal bests
      const { data: focusSessions } = await supabase
        .from("focus_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .order("duration_minutes", { ascending: false })
        .limit(1);

      if (focusSessions && focusSessions.length > 0) {
        const existingFocusAchievement = achievements.find(a => a.type === "longest_focus");
        if (!existingFocusAchievement) {
          setAchievements(prev => [
            ...prev,
            {
              type: "longest_focus",
              value: focusSessions[0].duration_minutes || 0,
              achievedAt: new Date().toISOString(),
              label: "Longest Focus Session",
              icon: <Clock className="h-5 w-5 text-blue-500" />,
            },
          ]);
        }
      }

    } catch (error) {
      console.error("Error fetching progress data:", error);
      toast({
        title: "Error loading progress",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAchievementLabel = (type: string): string => {
    const labels: Record<string, string> = {
      longest_focus: "Longest Focus Session",
      most_improved_week: "Most Improved This Week",
      streak_milestone: "Streak Milestone",
      concepts_milestone: "Concepts Milestone",
    };
    return labels[type] || type;
  };

  const getAchievementIcon = (type: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      longest_focus: <Clock className="h-5 w-5 text-blue-500" />,
      most_improved_week: <TrendingUp className="h-5 w-5 text-green-500" />,
      streak_milestone: <Flame className="h-5 w-5 text-orange-500" />,
      concepts_milestone: <Target className="h-5 w-5 text-purple-500" />,
    };
    return icons[type] || <Award className="h-5 w-5 text-amber-500" />;
  };

  const updatePreference = async (key: keyof LeaderboardPreferences, value: boolean) => {
    if (!user) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from("leaderboard_preferences")
        .upsert({
          user_id: user.id,
          show_on_leaderboard: newPreferences.showOnLeaderboard,
          show_streak: newPreferences.showStreak,
          show_improvement: newPreferences.showImprovement,
        });

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Your privacy settings have been saved.",
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error saving preferences",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Learning Progress Board</h1>
              <p className="text-muted-foreground mt-1">
                Track your growth, celebrate consistency
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Settings Panel */}
        {showSettings && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                Privacy Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Show on public highlights</p>
                    <p className="text-xs text-muted-foreground">
                      Allow your achievements to appear in top highlights
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showOnLeaderboard}
                    onCheckedChange={(v) => updatePreference("showOnLeaderboard", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Show learning streak</p>
                    <p className="text-xs text-muted-foreground">
                      Display your streak in community highlights
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showStreak}
                    onCheckedChange={(v) => updatePreference("showStreak", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Show improvement score</p>
                    <p className="text-xs text-muted-foreground">
                      Share your improvement progress
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showImprovement}
                    onCheckedChange={(v) => updatePreference("showImprovement", v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="personal" className="gap-2">
              <Eye className="h-4 w-4" />
              My Progress
            </TabsTrigger>
            <TabsTrigger value="highlights" className="gap-2">
              <Trophy className="h-4 w-4" />
              Highlights
            </TabsTrigger>
          </TabsList>

          {/* Personal Progress Tab */}
          <TabsContent value="personal" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Streak Card */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-transparent rounded-bl-full" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Learning Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-orange-500">
                      {streakData.currentStreak}
                    </span>
                    <span className="text-lg text-muted-foreground mb-1">days</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Longest: {streakData.longestStreak} days
                  </p>
                </CardContent>
              </Card>

              {/* Concepts Completed */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Concepts Mastered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-purple-500">
                      {conceptsCompleted}
                    </span>
                    <span className="text-lg text-muted-foreground mb-1">concepts</span>
                  </div>
                  <Progress value={Math.min(conceptsCompleted * 10, 100)} className="mt-3 h-2" />
                </CardContent>
              </Card>

              {/* Improvement Score */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Improvement Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-green-500">
                      +{improvementScore}
                    </span>
                    <span className="text-lg text-muted-foreground mb-1">points</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Since diagnostic assessment
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Personal Bests & Achievement Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Achievement Badges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AchievementBadges />
                
                {achievements.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2 pt-4 border-t">
                    {achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                          {achievement.icon}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{achievement.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.value} {achievement.type === "longest_focus" ? "minutes" : "points"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{streakData.totalActiveDays}</p>
                    <p className="text-sm text-muted-foreground">Total Active Days</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{conceptsCompleted}</p>
                    <p className="text-sm text-muted-foreground">Concepts Completed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{streakData.longestStreak}</p>
                    <p className="text-sm text-muted-foreground">Best Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Community Highlights Tab */}
          <TabsContent value="highlights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Most Improved Learners
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Celebrating growth and progress (anonymized)
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topImprovers.length > 0 ? (
                    topImprovers.map((learner, index) => (
                      <div
                        key={learner.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-600 font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="font-medium">{learner.displayName}</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          +{learner.score} pts
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Improvement highlights will appear here</p>
                      <p className="text-xs mt-1">Keep learning to see community progress!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Motivational Message */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Remember</h3>
                  <p className="text-muted-foreground">
                    Learning is a journey, not a competition. Celebrate your progress, 
                    no matter how small. Every concept you master is a step forward! 🌟
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProgressBoard;
