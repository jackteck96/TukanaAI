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
      client_invites: {
        Row: {
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          process_id: string
          status: string
          token: string
          used_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          process_id: string
          status?: string
          token: string
          used_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          process_id?: string
          status?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_reports: {
        Row: {
          approved_documents: number
          company_id: string | null
          generated_at: string
          id: string
          pending_documents: number
          process_id: string
          report_data: Json
          total_documents: number
        }
        Insert: {
          approved_documents?: number
          company_id?: string | null
          generated_at?: string
          id?: string
          pending_documents?: number
          process_id: string
          report_data: Json
          total_documents?: number
        }
        Update: {
          approved_documents?: number
          company_id?: string | null
          generated_at?: string
          id?: string
          pending_documents?: number
          process_id?: string
          report_data?: Json
          total_documents?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reports_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          company_id: string
          created_at: string
          has_expiration_date: boolean
          has_validity_date: boolean
          id: string
          name: string
          notes: string | null
          requires_issuing_location: boolean
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          has_expiration_date?: boolean
          has_validity_date?: boolean
          id?: string
          name: string
          notes?: string | null
          requires_issuing_location?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          has_expiration_date?: boolean
          has_validity_date?: boolean
          id?: string
          name?: string
          notes?: string | null
          requires_issuing_location?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          company_id: string | null
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          process_id: string
          status: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          process_id: string
          status?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          process_id?: string
          status?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_notes: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          process_id: string
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          process_id: string
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          process_id?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          assigned_user_id: string | null
          client_email: string
          client_name: string
          company_id: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          process_type: string
          progress: number
          project_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          client_email: string
          client_name: string
          company_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          process_type: string
          progress?: number
          project_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          client_email?: string
          client_name?: string
          company_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          process_type?: string
          progress?: number
          project_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          firm_id: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          firm_id?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          firm_id?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          document_type: string
          due_date: string | null
          id: string
          process_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          document_type: string
          due_date?: string | null
          id?: string
          process_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          document_type?: string
          due_date?: string | null
          id?: string
          process_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_records: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          employee_name: string
          id: string
          timestamp: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          employee_name: string
          id?: string
          timestamp?: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          employee_name?: string
          id?: string
          timestamp?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          company_id: string
          created_at: string
          document_count: number
          id: string
          last_calculated_at: string
          storage_used_bytes: number
          updated_at: string
          user_count: number
        }
        Insert: {
          company_id: string
          created_at?: string
          document_count?: number
          id?: string
          last_calculated_at?: string
          storage_used_bytes?: number
          updated_at?: string
          user_count?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          document_count?: number
          id?: string
          last_calculated_at?: string
          storage_used_bytes?: number
          updated_at?: string
          user_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          company_id: string
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_process: {
        Args: { process_uuid: string }
        Returns: boolean
      }
      check_plan_limits: {
        Args: { company_uuid: string; limit_type: string }
        Returns: Json
      }
      generate_document_report: {
        Args: { process_uuid: string }
        Returns: string
      }
      generate_invite_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_process_access: {
        Args: { access_type: string; process_uuid: string }
        Returns: undefined
      }
      update_usage_metrics: {
        Args: { company_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      subscription_plan: "starter" | "professional" | "enterprise"
      subscription_status: "active" | "trial" | "expired" | "canceled"
      user_role: "admin" | "lawyer" | "staff" | "client"
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
      subscription_plan: ["starter", "professional", "enterprise"],
      subscription_status: ["active", "trial", "expired", "canceled"],
      user_role: ["admin", "lawyer", "staff", "client"],
    },
  },
} as const
