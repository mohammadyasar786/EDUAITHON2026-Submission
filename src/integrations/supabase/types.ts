export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      adaptive_concept_progress: {
        Row: {
          attempts: number
          concept_id: string
          created_at: string
          id: string
          quiz_score: number
          status: string
          time_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          concept_id: string
          created_at?: string
          id?: string
          quiz_score?: number
          status?: string
          time_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          concept_id?: string
          created_at?: string
          id?: string
          quiz_score?: number
          status?: string
          time_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      adaptive_learning_profiles: {
        Row: {
          answered_questions: Json | null
          created_at: string
          diagnostic_score: number
          id: string
          learning_style: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answered_questions?: Json | null
          created_at?: string
          diagnostic_score?: number
          id?: string
          learning_style?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answered_questions?: Json | null
          created_at?: string
          diagnostic_score?: number
          id?: string
          learning_style?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aiva_conversations: {
        Row: {
          created_at: string
          current_chapter: string | null
          current_concept: string | null
          id: string
          messages: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_chapter?: string | null
          current_concept?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_chapter?: string | null
          current_concept?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chapter_content: {
        Row: {
          chapter_id: string
          common_misconceptions: Json | null
          content: string | null
          created_at: string
          id: string
          key_concepts: Json | null
          learning_objectives: Json | null
          lecture_notes: string | null
          pdf_url: string | null
          slides_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string
          common_misconceptions?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          key_concepts?: Json | null
          learning_objectives?: Json | null
          lecture_notes?: string | null
          pdf_url?: string | null
          slides_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          common_misconceptions?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          key_concepts?: Json | null
          learning_objectives?: Json | null
          lecture_notes?: string | null
          pdf_url?: string | null
          slides_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      code_generations: {
        Row: {
          created_at: string
          generated_code: string
          id: string
          instruction: string
          language: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_code: string
          id?: string
          instruction: string
          language?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_code?: string
          id?: string
          instruction?: string
          language?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          duration_minutes: number | null
          ended_at: string | null
          energy: number | null
          engagement: number | null
          focus_level: number | null
          id: string
          started_at: string
          user_id: string
          wellbeing: number | null
        }
        Insert: {
          duration_minutes?: number | null
          ended_at?: string | null
          energy?: number | null
          engagement?: number | null
          focus_level?: number | null
          id?: string
          started_at?: string
          user_id: string
          wellbeing?: number | null
        }
        Update: {
          duration_minutes?: number | null
          ended_at?: string | null
          energy?: number | null
          engagement?: number | null
          focus_level?: number | null
          id?: string
          started_at?: string
          user_id?: string
          wellbeing?: number | null
        }
        Relationships: []
      }
      leaderboard_preferences: {
        Row: {
          created_at: string
          id: string
          show_improvement: boolean
          show_on_leaderboard: boolean
          show_streak: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_improvement?: boolean
          show_on_leaderboard?: boolean
          show_streak?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          show_improvement?: boolean
          show_on_leaderboard?: boolean
          show_streak?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_achievements: {
        Row: {
          achieved_at: string
          achievement_type: string
          achievement_value: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_type: string
          achievement_value?: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_type?: string
          achievement_value?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          module: string
          progress: number
          status: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module: string
          progress?: number
          status?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module?: string
          progress?: number
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_active_date: string | null
          longest_streak: number
          total_active_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          total_active_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          total_active_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_insights: {
        Row: {
          chapter_id: string
          code_language: string | null
          concept_id: string
          content: string
          created_at: string
          id: string
          insight_type: string
          is_approved: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string
          code_language?: string | null
          concept_id: string
          content: string
          created_at?: string
          id?: string
          insight_type: string
          is_approved?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          code_language?: string | null
          concept_id?: string
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          is_approved?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "faculty" | "research_expert"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "faculty", "research_expert"],
    },
  },
} as const
