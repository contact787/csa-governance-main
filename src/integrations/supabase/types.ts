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
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          creator_name: string | null
          id: string
          is_global: boolean
          organization_id: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          creator_name?: string | null
          id?: string
          is_global?: boolean
          organization_id?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          creator_name?: string | null
          id?: string
          is_global?: boolean
          organization_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          error_message: string | null
          id: string
          ip_address: string | null
          login_at: string
          organization_id: string | null
          organization_name: string | null
          success: boolean
          user_agent: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          ip_address?: string | null
          login_at?: string
          organization_id?: string | null
          organization_name?: string | null
          success?: boolean
          user_agent?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          ip_address?: string | null
          login_at?: string
          organization_id?: string | null
          organization_name?: string | null
          success?: boolean
          user_agent?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          organization_id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          organization_id: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          organization_id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      method_evidence: {
        Row: {
          file_name: string
          file_size: number
          file_url: string
          id: string
          method_key: string
          organization_standard_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_size: number
          file_url: string
          id?: string
          method_key: string
          organization_standard_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          method_key?: string
          organization_standard_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "method_evidence_organization_standard_id_fkey"
            columns: ["organization_standard_id"]
            isOneToOne: false
            referencedRelation: "organization_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_standards: {
        Row: {
          comments: string | null
          compliance_notes: string | null
          compliance_owner_department: string | null
          created_at: string | null
          due_date: string | null
          frequency: string | null
          id: string
          ncap_guidance_label: string | null
          ncap_guidance_url: string | null
          organization_id: string
          responsible_person_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          standard_id: string
          state_guidance_label: string | null
          state_guidance_url: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
          updated_by: string | null
          verification_method_notes: string | null
        }
        Insert: {
          comments?: string | null
          compliance_notes?: string | null
          compliance_owner_department?: string | null
          created_at?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          ncap_guidance_label?: string | null
          ncap_guidance_url?: string | null
          organization_id: string
          responsible_person_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          standard_id: string
          state_guidance_label?: string | null
          state_guidance_url?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_method_notes?: string | null
        }
        Update: {
          comments?: string | null
          compliance_notes?: string | null
          compliance_owner_department?: string | null
          created_at?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          ncap_guidance_label?: string | null
          ncap_guidance_url?: string | null
          organization_id?: string
          responsible_person_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          standard_id?: string
          state_guidance_label?: string | null
          state_guidance_url?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_method_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_standards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standards_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "messaging_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standards_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standards_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "messaging_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_standards_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      participation_log_evidence: {
        Row: {
          file_name: string
          file_size: number
          file_url: string
          id: string
          participation_log_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_size: number
          file_url: string
          id?: string
          participation_log_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          participation_log_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "participation_log_evidence_participation_log_id_fkey"
            columns: ["participation_log_id"]
            isOneToOne: false
            referencedRelation: "participation_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      participation_logs: {
        Row: {
          created_at: string
          created_by: string
          end_date: string | null
          event_date: string
          event_type: string
          geography: string | null
          id: string
          notes: string | null
          organization_standard_id: string
          participant_count: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date?: string | null
          event_date: string
          event_type: string
          geography?: string | null
          id?: string
          notes?: string | null
          organization_standard_id: string
          participant_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string | null
          event_date?: string
          event_type?: string
          geography?: string | null
          id?: string
          notes?: string | null
          organization_standard_id?: string
          participant_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participation_logs_organization_standard_id_fkey"
            columns: ["organization_standard_id"]
            isOneToOne: false
            referencedRelation: "organization_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      participation_methods: {
        Row: {
          created_at: string
          id: string
          method_key: string
          organization_standard_id: string
          other_description: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          method_key: string
          organization_standard_id: string
          other_description?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          method_key?: string
          organization_standard_id?: string
          other_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participation_methods_organization_standard_id_fkey"
            columns: ["organization_standard_id"]
            isOneToOne: false
            referencedRelation: "organization_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          created_by: string
          file_size: number | null
          id: string
          name: string
          organization_id: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          file_size?: number | null
          id?: string
          name: string
          organization_id: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          file_size?: number | null
          id?: string
          name?: string
          organization_id?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      roma_reports: {
        Row: {
          actual_results_intermediate_term: string | null
          actual_results_long_term: string | null
          actual_results_short_term: string
          created_at: string
          data_source: string
          frequency_data_collection: string
          id: string
          identified_problem: string
          measurement_tool: string
          name: string
          organization_id: string
          outcome_indicator_intermediate_term: string | null
          outcome_indicator_long_term: string | null
          outcome_indicator_short_term: string
          outcome_intermediate_term: string | null
          outcome_long_term: string | null
          outcome_short_term: string
          service_activity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_results_intermediate_term?: string | null
          actual_results_long_term?: string | null
          actual_results_short_term: string
          created_at?: string
          data_source: string
          frequency_data_collection: string
          id?: string
          identified_problem: string
          measurement_tool: string
          name: string
          organization_id: string
          outcome_indicator_intermediate_term?: string | null
          outcome_indicator_long_term?: string | null
          outcome_indicator_short_term: string
          outcome_intermediate_term?: string | null
          outcome_long_term?: string | null
          outcome_short_term: string
          service_activity: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_results_intermediate_term?: string | null
          actual_results_long_term?: string | null
          actual_results_short_term?: string
          created_at?: string
          data_source?: string
          frequency_data_collection?: string
          id?: string
          identified_problem?: string
          measurement_tool?: string
          name?: string
          organization_id?: string
          outcome_indicator_intermediate_term?: string | null
          outcome_indicator_long_term?: string | null
          outcome_indicator_short_term?: string
          outcome_intermediate_term?: string | null
          outcome_long_term?: string | null
          outcome_short_term?: string
          service_activity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roma_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_logs: {
        Row: {
          audience: string | null
          created_at: string
          created_by: string
          evidence_description: string | null
          id: string
          log_date: string
          method: string
          organization_standard_id: string
          result: string | null
          updated_at: string
        }
        Insert: {
          audience?: string | null
          created_at?: string
          created_by: string
          evidence_description?: string | null
          id?: string
          log_date: string
          method: string
          organization_standard_id: string
          result?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string | null
          created_at?: string
          created_by?: string
          evidence_description?: string | null
          id?: string
          log_date?: string
          method?: string
          organization_standard_id?: string
          result?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secondary_logs_organization_standard_id_fkey"
            columns: ["organization_standard_id"]
            isOneToOne: false
            referencedRelation: "organization_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_activity_logs: {
        Row: {
          action_type: string
          description: string
          id: string
          metadata: Json | null
          organization_standard_id: string
          performed_at: string
          performed_by: string
        }
        Insert: {
          action_type: string
          description: string
          id?: string
          metadata?: Json | null
          organization_standard_id: string
          performed_at?: string
          performed_by: string
        }
        Update: {
          action_type?: string
          description?: string
          id?: string
          metadata?: Json | null
          organization_standard_id?: string
          performed_at?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "standard_activity_logs_organization_standard_id_fkey"
            columns: ["organization_standard_id"]
            isOneToOne: false
            referencedRelation: "organization_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_documents: {
        Row: {
          file_name: string
          file_size: number
          file_url: string
          id: string
          organization_standard_id: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_size: number
          file_url: string
          id?: string
          organization_standard_id: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          organization_standard_id?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "standard_documents_organization_standard_id_fkey"
            columns: ["organization_standard_id"]
            isOneToOne: false
            referencedRelation: "organization_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standards: {
        Row: {
          category: string | null
          compliance_owner: string | null
          created_at: string | null
          evidence_examples: string[] | null
          frequency: string | null
          id: string
          information_to_collect: string | null
          responsible_role: string | null
          standard_id: string
          title: string
          verification_method: string | null
        }
        Insert: {
          category?: string | null
          compliance_owner?: string | null
          created_at?: string | null
          evidence_examples?: string[] | null
          frequency?: string | null
          id?: string
          information_to_collect?: string | null
          responsible_role?: string | null
          standard_id: string
          title: string
          verification_method?: string | null
        }
        Update: {
          category?: string | null
          compliance_owner?: string | null
          created_at?: string | null
          evidence_examples?: string[] | null
          frequency?: string | null
          id?: string
          information_to_collect?: string | null
          responsible_role?: string | null
          standard_id?: string
          title?: string
          verification_method?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          organization_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          source: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          organization_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          organization_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          role: Database["public"]["Enums"]["app_role"]
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
      messaging_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "compliance_manager"
        | "board_member"
        | "master_admin"
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
      app_role: [
        "admin",
        "staff",
        "compliance_manager",
        "board_member",
        "master_admin",
      ],
    },
  },
} as const
