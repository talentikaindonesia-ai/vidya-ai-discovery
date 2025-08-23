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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_icon: string | null
          description: string | null
          earned_at: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          badge_icon?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          badge_icon?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          assessment_type: string
          career_recommendations: string[] | null
          completed_at: string
          created_at: string
          id: string
          interest_categories: string[] | null
          learning_style: string | null
          personality_type: string | null
          questions_answers: Json
          score_breakdown: Json | null
          talent_areas: string[] | null
          user_id: string
        }
        Insert: {
          assessment_type?: string
          career_recommendations?: string[] | null
          completed_at?: string
          created_at?: string
          id?: string
          interest_categories?: string[] | null
          learning_style?: string | null
          personality_type?: string | null
          questions_answers: Json
          score_breakdown?: Json | null
          talent_areas?: string[] | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          career_recommendations?: string[] | null
          completed_at?: string
          created_at?: string
          id?: string
          interest_categories?: string[] | null
          learning_style?: string | null
          personality_type?: string | null
          questions_answers?: Json
          score_breakdown?: Json | null
          talent_areas?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          accessed_at: string | null
          id: string
          ip_address: string | null
          operation: string
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          id?: string
          ip_address?: string | null
          operation: string
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          id?: string
          ip_address?: string | null
          operation?: string
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_hours: number | null
          id: string
          is_featured: boolean | null
          price: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          id?: string
          is_featured?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          id?: string
          is_featured?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      learning_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "learning_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_content: {
        Row: {
          average_rating: number | null
          category_id: string | null
          content_type: string
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          external_id: string | null
          external_source: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          priority_score: number | null
          tags: string[] | null
          target_personas: string[] | null
          thumbnail_url: string | null
          title: string
          total_enrollments: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          category_id?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          priority_score?: number | null
          tags?: string[] | null
          target_personas?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_enrollments?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          category_id?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          priority_score?: number | null
          tags?: string[] | null
          target_personas?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_enrollments?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "learning_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_contents: {
        Row: {
          content_id: string
          created_at: string
          id: string
          is_required: boolean | null
          order_index: number
          path_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          order_index: number
          path_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          order_index?: number
          path_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "learning_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_contents_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          estimated_duration_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          target_persona: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          target_persona?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_persona?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string
          feedback: string | null
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
          rating: number | null
          status: string | null
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          rating?: number | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          rating?: number | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "learning_content"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean | null
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          order_index: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_bookings: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          mentor_id: string
          notes: string | null
          session_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          mentor_id: string
          notes?: string | null
          session_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          mentor_id?: string
          notes?: string | null
          session_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_bookings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          experience_years: number | null
          expertise_areas: string[] | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          name: string
          rating: number | null
          title: string
          total_sessions: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          name: string
          rating?: number | null
          title: string
          total_sessions?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          name?: string
          rating?: number | null
          title?: string
          total_sessions?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_name: string | null
          organization_type: string | null
          phone: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          subscription_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_name?: string | null
          organization_type?: string | null
          phone?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_name?: string | null
          organization_type?: string | null
          phone?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scraped_content: {
        Row: {
          category: string
          content_type: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          source_website: string
          tags: string[] | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          content_type?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          source_website: string
          tags?: string[] | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          content_type?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          source_website?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number
          price_yearly: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly: number
          price_yearly: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          score: number | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          score?: number | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "interest_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string | null
          progress_percentage: number | null
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          progress_percentage?: number | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          progress_percentage?: number | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      Vidya: {
        Row: {
          Content: string | null
          created_at: string
          id: number
        }
        Insert: {
          Content?: string | null
          created_at?: string
          id?: number
        }
        Update: {
          Content?: string | null
          created_at?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_profile_secure: {
        Args: { profile_user_id: string }
        Returns: {
          address: string
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          organization_name: string
          organization_type: string
          phone: string
          subscription_status: string
          subscription_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "individual" | "school"
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
      user_role: ["admin", "individual", "school"],
    },
  },
} as const
