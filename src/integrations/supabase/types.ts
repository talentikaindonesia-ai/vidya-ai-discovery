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
      certificates: {
        Row: {
          certificate_type: string
          certificate_url: string | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string | null
          issuer: string | null
          metadata: Json | null
          title: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          certificate_type: string
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuer?: string | null
          metadata?: Json | null
          title: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          certificate_type?: string
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuer?: string | null
          metadata?: Json | null
          title?: string
          user_id?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      community_challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          start_date: string | null
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          start_date?: string | null
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      community_events: {
        Row: {
          created_at: string | null
          current_participants: number | null
          description: string | null
          duration_minutes: number | null
          event_date: string
          event_type: string
          id: string
          is_active: boolean | null
          is_premium_only: boolean | null
          location: string | null
          max_participants: number | null
          organizer_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          duration_minutes?: number | null
          event_date: string
          event_type: string
          id?: string
          is_active?: boolean | null
          is_premium_only?: boolean | null
          location?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          duration_minutes?: number | null
          event_date?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          is_premium_only?: boolean | null
          location?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          title?: string
          updated_at?: string | null
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
      mentorship_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          mentor_id: string
          notes: string | null
          session_date: string
          session_type: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          mentor_id: string
          notes?: string | null
          session_date: string
          session_type?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          mentor_id?: string
          notes?: string | null
          session_date?: string
          session_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      networking_connections: {
        Row: {
          connected_user_id: string
          connection_type: string | null
          created_at: string | null
          id: string
          message: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connected_user_id: string
          connection_type?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connected_user_id?: string
          connection_type?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      one_time_products: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_digital: boolean | null
          name: string
          price: number
          product_type: string
          stock_quantity: number | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_digital?: boolean | null
          name: string
          price: number
          product_type: string
          stock_quantity?: number | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_digital?: boolean | null
          name?: string
          price?: number
          product_type?: string
          stock_quantity?: number | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          external_transaction_id: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_gateway: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          external_transaction_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          external_transaction_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string | null
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          item_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          item_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          item_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
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
      quests: {
        Row: {
          badge_reward: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          is_active: boolean | null
          quest_type: string
          requirements: Json | null
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          badge_reward?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          quest_type: string
          requirements?: Json | null
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          badge_reward?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          quest_type?: string
          requirements?: Json | null
          title?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          completed_at: string
          id: string
          is_correct: boolean
          points_earned: number | null
          quiz_id: string | null
          time_taken_seconds: number | null
          user_answer: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          is_correct: boolean
          points_earned?: number | null
          quiz_id?: string | null
          time_taken_seconds?: number | null
          user_answer: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number | null
          quiz_id?: string | null
          time_taken_seconds?: number | null
          user_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
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
          updated_at?: string
        }
        Relationships: []
      }
      quiz_challenges: {
        Row: {
          category_id: string | null
          challenge_type: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          min_score: number | null
          quiz_ids: string[] | null
          reward_badge: string | null
          reward_points: number | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          min_score?: number | null
          quiz_ids?: string[] | null
          reward_badge?: string | null
          reward_points?: number | null
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          min_score?: number | null
          quiz_ids?: string[] | null
          reward_badge?: string | null
          reward_points?: number | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_challenges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quiz_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_leaderboard: {
        Row: {
          correct_answers: number | null
          created_at: string
          current_streak: number | null
          id: string
          last_quiz_date: string | null
          longest_streak: number | null
          rank_position: number | null
          total_points: number | null
          total_quizzes_completed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_answers?: number | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_quiz_date?: string | null
          longest_streak?: number | null
          rank_position?: number | null
          total_points?: number | null
          total_quizzes_completed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_answers?: number | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_quiz_date?: string | null
          longest_streak?: number | null
          rank_position?: number | null
          total_points?: number | null
          total_quizzes_completed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          category_id: string | null
          clue_location: string | null
          correct_answer: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          explanation: string | null
          id: string
          is_active: boolean | null
          is_isc_exclusive: boolean | null
          media_url: string | null
          options: Json | null
          points_reward: number | null
          question: string
          question_type: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          clue_location?: string | null
          correct_answer: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          is_isc_exclusive?: boolean | null
          media_url?: string | null
          options?: Json | null
          points_reward?: number | null
          question: string
          question_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          clue_location?: string | null
          correct_answer?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          is_isc_exclusive?: boolean | null
          media_url?: string | null
          options?: Json | null
          points_reward?: number | null
          question?: string
          question_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quiz_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean | null
          total_commission: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          total_commission?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          total_commission?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_usage: {
        Row: {
          commission_earned: number
          created_at: string
          id: string
          referral_code_id: string | null
          referred_user_id: string
          transaction_id: string | null
        }
        Insert: {
          commission_earned: number
          created_at?: string
          id?: string
          referral_code_id?: string | null
          referred_user_id: string
          transaction_id?: string | null
        }
        Update: {
          commission_earned?: number
          created_at?: string
          id?: string
          referral_code_id?: string | null
          referred_user_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_usage_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_usage_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          item_type: string
          stock_quantity: number | null
          title: string
          updated_at: string | null
          xp_cost: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_type: string
          stock_quantity?: number | null
          title: string
          updated_at?: string | null
          xp_cost: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_type?: string
          stock_quantity?: number | null
          title?: string
          updated_at?: string | null
          xp_cost?: number
        }
        Relationships: []
      }
      scraped_content: {
        Row: {
          category: string
          contact_info: Json | null
          content_type: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_manual: boolean | null
          location: string | null
          organizer: string | null
          poster_url: string | null
          prize_info: string | null
          registration_end_date: string | null
          registration_start_date: string | null
          requirements: string[] | null
          source_website: string
          tags: string[] | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          contact_info?: Json | null
          content_type?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_manual?: boolean | null
          location?: string | null
          organizer?: string | null
          poster_url?: string | null
          prize_info?: string | null
          registration_end_date?: string | null
          registration_start_date?: string | null
          requirements?: string[] | null
          source_website: string
          tags?: string[] | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          contact_info?: Json | null
          content_type?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_manual?: boolean | null
          location?: string | null
          organizer?: string | null
          poster_url?: string | null
          prize_info?: string | null
          registration_end_date?: string | null
          registration_start_date?: string | null
          requirements?: string[] | null
          source_website?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      subscription_packages: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean | null
          max_courses: number | null
          max_opportunities: number | null
          max_users: number | null
          name: string
          price_monthly: number
          price_yearly: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean | null
          max_courses?: number | null
          max_opportunities?: number | null
          max_users?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean | null
          max_courses?: number | null
          max_opportunities?: number | null
          max_users?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          type?: string
          updated_at?: string
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
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          rank: number | null
          score: number | null
          status: string | null
          submission_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          rank?: number | null
          score?: number | null
          status?: string | null
          submission_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          rank?: number | null
          score?: number | null
          status?: string | null
          submission_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "community_challenges"
            referencedColumns: ["id"]
          },
        ]
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
      user_quests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          progress_data: Json | null
          quest_id: string
          status: string | null
          updated_at: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          quest_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          quest_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          created_at: string | null
          id: string
          is_redeemed: boolean | null
          purchase_date: string | null
          redemption_code: string | null
          reward_item_id: string
          user_id: string
          xp_spent: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          purchase_date?: string | null
          redemption_code?: string | null
          reward_item_id: string
          user_id: string
          xp_spent: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          purchase_date?: string | null
          redemption_code?: string | null
          reward_item_id?: string
          user_id?: string
          xp_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_item_id_fkey"
            columns: ["reward_item_id"]
            isOneToOne: false
            referencedRelation: "reward_items"
            referencedColumns: ["id"]
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
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          streak_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount_paid: number
          auto_renew: boolean | null
          billing_cycle: string
          created_at: string
          expires_at: string | null
          id: string
          package_id: string | null
          starts_at: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          auto_renew?: boolean | null
          billing_cycle?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string | null
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          auto_renew?: boolean | null
          billing_cycle?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string | null
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          created_at: string | null
          current_level: number | null
          current_xp: number | null
          id: string
          total_xp_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          current_xp?: number | null
          id?: string
          total_xp_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          current_xp?: number | null
          id?: string
          total_xp_earned?: number | null
          updated_at?: string | null
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
      voucher_codes: {
        Row: {
          applicable_packages: string[] | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          name: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_packages?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          name: string
          updated_at?: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          applicable_packages?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          name?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      voucher_usage: {
        Row: {
          discount_applied: number
          id: string
          transaction_id: string | null
          used_at: string
          user_id: string
          voucher_id: string | null
        }
        Insert: {
          discount_applied: number
          id?: string
          transaction_id?: string | null
          used_at?: string
          user_id: string
          voucher_id?: string | null
        }
        Update: {
          discount_applied?: number
          id?: string
          transaction_id?: string | null
          used_at?: string
          user_id?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voucher_usage_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_usage_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "voucher_codes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_payment_transaction: {
        Args: {
          p_amount: number
          p_currency?: string
          p_payment_gateway?: string
          p_subscription_id?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_payment_analytics: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          avg_transaction_amount: number
          successful_transactions: number
          total_revenue: number
          transaction_count: number
        }[]
      }
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
      get_transaction_summary: {
        Args: { transaction_id: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          status: string
          transaction_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_quiz_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_subscription_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_transaction_status: {
        Args: {
          p_external_id?: string
          p_new_status: string
          p_payment_method?: string
          p_transaction_id: string
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
