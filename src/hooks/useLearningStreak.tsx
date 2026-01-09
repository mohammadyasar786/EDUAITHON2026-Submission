import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type AchievementType = 
  | "first_concept"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "focus_champion"
  | "quick_learner"
  | "most_improved";

const ACHIEVEMENT_LABELS: Record<AchievementType, { title: string; emoji: string }> = {
  first_concept: { title: "First Concept Mastered", emoji: "🎯" },
  streak_3: { title: "3-Day Streak", emoji: "🔥" },
  streak_7: { title: "Week Warrior", emoji: "⚡" },
  streak_30: { title: "Monthly Master", emoji: "🏆" },
  focus_champion: { title: "Focus Champion", emoji: "🧠" },
  quick_learner: { title: "Quick Learner", emoji: "🚀" },
  most_improved: { title: "Most Improved", emoji: "📈" },
};

export const useLearningStreak = () => {
  const { user } = useAuth();

  const updateStreak = useCallback(async () => {
    if (!user) return;

    try {
      // Get current streak data
      const { data: existingStreak, error: fetchError } = await supabase
        .from("learning_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const today = new Date().toISOString().split("T")[0];

      if (fetchError) {
        console.error("Error fetching streak:", fetchError);
        return;
      }

      if (!existingStreak) {
        // Create new streak record
        await supabase.from("learning_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_active_date: today,
          total_active_days: 1,
        });
        return;
      }

      const lastActiveDate = existingStreak.last_active_date;
      
      // If already active today, skip
      if (lastActiveDate === today) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = existingStreak.current_streak;
      
      if (lastActiveDate === yesterdayStr) {
        // Consecutive day - increment streak
        newStreak += 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }

      const newLongestStreak = Math.max(newStreak, existingStreak.longest_streak);

      await supabase
        .from("learning_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_active_date: today,
          total_active_days: existingStreak.total_active_days + 1,
        })
        .eq("user_id", user.id);

      // Check for streak achievements
      if (newStreak === 3) {
        await awardAchievement("streak_3", 3);
      } else if (newStreak === 7) {
        await awardAchievement("streak_7", 7);
      } else if (newStreak === 30) {
        await awardAchievement("streak_30", 30);
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  }, [user]);

  const awardAchievement = useCallback(
    async (type: AchievementType, value: number = 1) => {
      if (!user) return;

      try {
        // Check if achievement already exists
        const { data: existing } = await supabase
          .from("learning_achievements")
          .select("id")
          .eq("user_id", user.id)
          .eq("achievement_type", type)
          .maybeSingle();

        if (existing) return; // Already has this achievement

        await supabase.from("learning_achievements").insert({
          user_id: user.id,
          achievement_type: type,
          achievement_value: value,
        });

        const achievement = ACHIEVEMENT_LABELS[type];
        toast.success(`${achievement.emoji} Achievement Unlocked: ${achievement.title}!`);
      } catch (error) {
        console.error("Error awarding achievement:", error);
      }
    },
    [user]
  );

  const recordConceptMastery = useCallback(async () => {
    if (!user) return;

    // Update streak
    await updateStreak();

    // Check if this is their first concept
    const { data: concepts } = await supabase
      .from("adaptive_concept_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "mastered");

    if (concepts && concepts.length === 1) {
      await awardAchievement("first_concept", 1);
    }
  }, [user, updateStreak, awardAchievement]);

  const recordFocusSession = useCallback(
    async (durationMinutes: number) => {
      if (!user) return;

      await updateStreak();

      // Award focus champion for 60+ minute sessions
      if (durationMinutes >= 60) {
        await awardAchievement("focus_champion", durationMinutes);
      }
    },
    [user, updateStreak, awardAchievement]
  );

  return {
    updateStreak,
    awardAchievement,
    recordConceptMastery,
    recordFocusSession,
  };
};
