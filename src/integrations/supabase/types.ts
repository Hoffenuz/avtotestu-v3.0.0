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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_turnstile_verifications: {
        Row: {
          action: string
          challenge_ts: string | null
          created_at: string
          email_attempt: string | null
          error_codes: string[] | null
          hostname: string | null
          id: string
          remote_ip: string | null
          success: boolean
        }
        Insert: {
          action?: string
          challenge_ts?: string | null
          created_at?: string
          email_attempt?: string | null
          error_codes?: string[] | null
          hostname?: string | null
          id?: string
          remote_ip?: string | null
          success: boolean
        }
        Update: {
          action?: string
          challenge_ts?: string | null
          created_at?: string
          email_attempt?: string | null
          error_codes?: string[] | null
          hostname?: string | null
          id?: string
          remote_ip?: string | null
          success?: boolean
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chek: {
        Row: {
          created_at: string
          email: string
          id: string
          link: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          link: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          link?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chek_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      device_licenses: {
        Row: {
          created_at: string
          device_id: string
          expires_at: string
          id: string
          issued_at: string
          last_refreshed_at: string | null
          license_key: string
          refresh_count: number
          revoked: boolean
          short_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          expires_at: string
          id?: string
          issued_at?: string
          last_refreshed_at?: string | null
          license_key: string
          refresh_count?: number
          revoked?: boolean
          short_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          expires_at?: string
          id?: string
          issued_at?: string
          last_refreshed_at?: string | null
          license_key?: string
          refresh_count?: number
          revoked?: boolean
          short_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          email: string
          id: string
          payment_method: string | null
          receipt_url: string
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email: string
          id?: string
          payment_method?: string | null
          receipt_url: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string
          id?: string
          payment_method?: string | null
          receipt_url?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          tariff_days: number | null
          tariff_end_date: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          tariff_days?: number | null
          tariff_end_date?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          tariff_days?: number | null
          tariff_end_date?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          page: string | null
          rating: number
          submitter_ip: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          page?: string | null
          rating: number
          submitter_ip?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          page?: string | null
          rating?: number
          submitter_ip?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          id: string
          slug: string
          title_uz_lat: string
          title_uz_cyr: string | null
          title_ru: string | null
          excerpt_uz_lat: string | null
          excerpt_uz_cyr: string | null
          excerpt_ru: string | null
          body_uz_lat: string
          body_uz_cyr: string | null
          body_ru: string | null
          cover_image_url: string | null
          meta_description_uz_lat: string | null
          meta_description_uz_cyr: string | null
          meta_description_ru: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title_uz_lat: string
          title_uz_cyr?: string | null
          title_ru?: string | null
          excerpt_uz_lat?: string | null
          excerpt_uz_cyr?: string | null
          excerpt_ru?: string | null
          body_uz_lat: string
          body_uz_cyr?: string | null
          body_ru?: string | null
          cover_image_url?: string | null
          meta_description_uz_lat?: string | null
          meta_description_uz_cyr?: string | null
          meta_description_ru?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title_uz_lat?: string
          title_uz_cyr?: string | null
          title_ru?: string | null
          excerpt_uz_lat?: string | null
          excerpt_uz_cyr?: string | null
          excerpt_ru?: string | null
          body_uz_lat?: string
          body_uz_cyr?: string | null
          body_ru?: string | null
          cover_image_url?: string | null
          meta_description_uz_lat?: string | null
          meta_description_uz_cyr?: string | null
          meta_description_ru?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          assigned_by: string | null
          created_at: string
          currency: string
          ends_at: string
          expires_at: string | null
          id: string
          is_trial: boolean
          note: string | null
          plan_name: string
          started_at: string
          status: string
          tariff_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          assigned_by?: string | null
          created_at?: string
          currency?: string
          ends_at?: string
          expires_at?: string | null
          id?: string
          is_trial?: boolean
          note?: string | null
          plan_name: string
          started_at?: string
          status?: string
          tariff_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          assigned_by?: string | null
          created_at?: string
          currency?: string
          ends_at?: string
          expires_at?: string | null
          id?: string
          is_trial?: boolean
          note?: string | null
          plan_name?: string
          started_at?: string
          status?: string
          tariff_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          access_type: string | null
          completed_at: string
          correct_answers: number
          created_at: string
          id: string
          is_premium: boolean
          question_source: string | null
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
          variant: number
        }
        Insert: {
          access_type?: string | null
          completed_at?: string
          correct_answers?: number
          created_at?: string
          id?: string
          is_premium?: boolean
          question_source?: string | null
          time_taken_seconds?: number | null
          total_questions?: number
          user_id: string
          variant: number
        }
        Update: {
          access_type?: string | null
          completed_at?: string
          correct_answers?: number
          created_at?: string
          id?: string
          is_premium?: boolean
          question_source?: string | null
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
          variant?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          access_type: string
          completed: boolean
          created_at: string
          expires_at: string
          id: string
          is_premium: boolean
          question_source: string
          started_at: string
          user_id: string | null
          variant: number
        }
        Insert: {
          access_type: string
          completed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          is_premium?: boolean
          question_source: string
          started_at?: string
          user_id?: string | null
          variant?: number
        }
        Update: {
          access_type?: string
          completed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          is_premium?: boolean
          question_source?: string
          started_at?: string
          user_id?: string | null
          variant?: number
        }
        Relationships: []
      }
      user_archive: {
        Row: {
          archived_at: string | null
          deleted_reason: string | null
          email: string | null
          full_name: string | null
          id: string
          is_trial_used: boolean | null
          tariff_days: number | null
          tariff_end_date: string | null
          tariff_start_date: string | null
        }
        Insert: {
          archived_at?: string | null
          deleted_reason?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_trial_used?: boolean | null
          tariff_days?: number | null
          tariff_end_date?: string | null
          tariff_start_date?: string | null
        }
        Update: {
          archived_at?: string | null
          deleted_reason?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_trial_used?: boolean | null
          tariff_days?: number | null
          tariff_end_date?: string | null
          tariff_start_date?: string | null
        }
        Relationships: []
      }
      user_payment_type: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          note: string | null
          payment_type_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          payment_type_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          payment_type_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_type_payment_type_id_fkey"
            columns: ["payment_type_id"]
            isOneToOne: false
            referencedRelation: "payment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_payment_type_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_trial_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_user_access_state: {
        Args: { user_id: string }
        Returns: {
          expires_at: string
          is_premium: boolean
          state: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      start_test_session: {
        Args: {
          p_is_premium: boolean
          p_question_source: string
          p_variant: number
        }
        Returns: Json
      }
      verify_and_save_test_result: {
        Args: {
          p_correct_answers: number
          p_session_id: string
          p_time_taken_seconds: number
          p_total_questions: number
          p_variant: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      message_sender: "user" | "admin"
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
      app_role: ["admin", "moderator", "user"],
      message_sender: ["user", "admin"],
    },
  },
} as const
