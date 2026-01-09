import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, TrendingUp, Clock, Zap, CheckCircle } from "lucide-react";
import type { ConceptProgress } from "@/pages/AdaptiveLearning";

interface MicroGoal {
  id: string;
  title: string;
  description: string;
  type: "accuracy" | "time" | "pulse" | "consistency";
  target: number;
  current: number;
  completed: boolean;
  icon: React.ReactNode;
}

interface MicroGoalsProps {
  conceptProgress: ConceptProgress[];
  currentStreak?: number;
}

const conceptTitles: Record<string, string> = {
  arrays: "Arrays",
  "stacks-queues": "Stacks & Queues",
  "linked-lists": "Linked Lists",
  trees: "Trees",
  sorting: "Sorting",
  searching: "Searching",
  "hash-tables": "Hash Tables",
  graphs: "Graphs",
};

const MicroGoals = ({ conceptProgress, currentStreak = 0 }: MicroGoalsProps) => {
  const [goals, setGoals] = useState<MicroGoal[]>([]);

  useEffect(() => {
    generatePersonalGoals();
  }, [conceptProgress, currentStreak]);

  const generatePersonalGoals = () => {
    const newGoals: MicroGoal[] = [];

    // Find concepts needing improvement (yellow/red pulse)
    const needsImprovement = conceptProgress.filter(p => {
      const score = p.quizScore || 0;
      return score > 0 && score < 70;
    });

    // Find yellow pulse concepts (score 40-69)
    const yellowPulse = conceptProgress.filter(p => {
      const score = p.quizScore || 0;
      return score >= 40 && score < 70;
    });

    // Goal 1: Improve accuracy on struggling concept
    if (needsImprovement.length > 0) {
      const concept = needsImprovement[0];
      const conceptName = conceptTitles[concept.conceptId] || concept.conceptId;
      newGoals.push({
        id: `accuracy-${concept.conceptId}`,
        title: `Improve ${conceptName}`,
        description: `Raise your score from ${concept.quizScore}% to 70%`,
        type: "accuracy",
        target: 70,
        current: concept.quizScore,
        completed: false,
        icon: <Target className="h-4 w-4 text-info" />,
      });
    }

    // Goal 2: Stabilize yellow pulses
    if (yellowPulse.length > 0) {
      const stableCount = conceptProgress.filter(p => p.quizScore >= 70).length;
      newGoals.push({
        id: "stabilize-pulses",
        title: "Stabilize Understanding",
        description: `Turn ${yellowPulse.length} yellow pulse${yellowPulse.length > 1 ? 's' : ''} green`,
        type: "pulse",
        target: conceptProgress.length,
        current: stableCount,
        completed: yellowPulse.length === 0,
        icon: <Zap className="h-4 w-4 text-amber-500" />,
      });
    }

    // Goal 3: Time efficiency goal
    const inProgressConcepts = conceptProgress.filter(p => p.status === "in-progress");
    if (inProgressConcepts.length > 0) {
      const avgTime = inProgressConcepts.reduce((sum, p) => sum + p.timeSpent, 0) / inProgressConcepts.length;
      const targetTime = Math.max(300, avgTime * 0.8); // 20% faster or 5 min minimum
      newGoals.push({
        id: "time-efficiency",
        title: "Learn More Efficiently",
        description: "Master the next concept in under 15 minutes",
        type: "time",
        target: 900,
        current: Math.min(avgTime, 900),
        completed: avgTime <= 900,
        icon: <Clock className="h-4 w-4 text-primary" />,
      });
    }

    // Goal 4: Consistency streak
    const nextStreakMilestone = currentStreak < 3 ? 3 : currentStreak < 7 ? 7 : 14;
    newGoals.push({
      id: "consistency-streak",
      title: `Reach ${nextStreakMilestone}-Day Streak`,
      description: `You're at ${currentStreak} days. Keep going!`,
      type: "consistency",
      target: nextStreakMilestone,
      current: currentStreak,
      completed: currentStreak >= nextStreakMilestone,
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
    });

    // Goal 5: Master all concepts
    const masteredCount = conceptProgress.filter(p => p.status === "mastered").length;
    const totalConcepts = 8; // Total available concepts
    if (masteredCount < totalConcepts) {
      newGoals.push({
        id: "master-all",
        title: "Chapter Mastery",
        description: `Master all ${totalConcepts} concepts`,
        type: "accuracy",
        target: totalConcepts,
        current: masteredCount,
        completed: masteredCount >= totalConcepts,
        icon: <Trophy className="h-4 w-4 text-amber-500" />,
      });
    }

    setGoals(newGoals.slice(0, 4)); // Show max 4 goals
  };

  const getProgressPercentage = (goal: MicroGoal) => {
    return Math.min(100, (goal.current / goal.target) * 100);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">You vs You</CardTitle>
            <CardDescription>Personal improvement goals</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Start learning to unlock personal goals!
          </p>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className={`p-3 rounded-lg border transition-all ${
                goal.completed 
                  ? "bg-emerald-500/5 border-emerald-500/30" 
                  : "bg-muted/30 border-border/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${goal.completed ? "text-emerald-500" : ""}`}>
                  {goal.completed ? <CheckCircle className="h-4 w-4" /> : goal.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {goal.title}
                    </h4>
                    {goal.completed && (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                  {!goal.completed && (
                    <div className="mt-2">
                      <Progress value={getProgressPercentage(goal)} className="h-1.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default MicroGoals;
