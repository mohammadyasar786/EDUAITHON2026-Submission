import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_value: number;
  achieved_at: string;
}

const ACHIEVEMENT_CONFIG: Record<string, { emoji: string; title: string; description: string }> = {
  first_concept: {
    emoji: "🎯",
    title: "First Concept",
    description: "Mastered your first concept",
  },
  streak_3: {
    emoji: "🔥",
    title: "3-Day Streak",
    description: "Studied for 3 consecutive days",
  },
  streak_7: {
    emoji: "⚡",
    title: "Week Warrior",
    description: "Studied for 7 consecutive days",
  },
  streak_30: {
    emoji: "🏆",
    title: "Monthly Master",
    description: "Studied for 30 consecutive days",
  },
  focus_champion: {
    emoji: "🧠",
    title: "Focus Champion",
    description: "Completed a 60+ minute focus session",
  },
  quick_learner: {
    emoji: "🚀",
    title: "Quick Learner",
    description: "Mastered a concept in under 10 minutes",
  },
  most_improved: {
    emoji: "📈",
    title: "Most Improved",
    description: "Showed significant improvement in quiz scores",
  },
  misconception_crusher: {
    emoji: "💡",
    title: "Misconception Crusher",
    description: "Overcame a common misconception",
  },
  consistency_champion: {
    emoji: "🌟",
    title: "Consistency Champion",
    description: "Maintained consistent daily learning",
  },
  deep_thinker: {
    emoji: "🎓",
    title: "Deep Thinker",
    description: "Provided excellent Explain-it-back responses",
  },
};

interface AchievementBadgesProps {
  compact?: boolean;
}

const AchievementBadges = ({ compact = false }: AchievementBadgesProps) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("learning_achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false });

      if (error) {
        console.error("Error fetching achievements:", error);
      } else {
        setAchievements(data || []);
      }
      setLoading(false);
    };

    fetchAchievements();
  }, [user]);

  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return compact ? null : (
      <p className="text-sm text-muted-foreground">No achievements yet. Keep learning!</p>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {achievements.map((achievement) => {
          const config = ACHIEVEMENT_CONFIG[achievement.achievement_type];
          if (!config) return null;

          return (
            <Tooltip key={achievement.id}>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  <span className="mr-1">{config.emoji}</span>
                  {!compact && config.title}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{config.title}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default AchievementBadges;
