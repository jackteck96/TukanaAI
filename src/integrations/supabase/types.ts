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
      admin_invites: {
        Row: {
          approval_token: string
          approved_at: string | null
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          invited_by: string
          status: string
        }
        Insert: {
          approval_token?: string
          approved_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          invited_by: string
          status?: string
        }
        Update: {
          approval_token?: string
          approved_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          invited_by?: string
          status?: string
        }
        Relationships: []
      }
      ai_training_cases: {
        Row: {
          correct_documents: string[]
          created_at: string
          description: string
          documents_received: string[]
          feedback: string | null
          id: string
          process_type: string
          result: string
          updated_at: string
        }
        Insert: {
          correct_documents?: string[]
          created_at?: string
          description: string
          documents_received?: string[]
          feedback?: string | null
          id?: string
          process_type: string
          result: string
          updated_at?: string
        }
        Update: {
          correct_documents?: string[]
          created_at?: string
          description?: string
          documents_received?: string[]
          feedback?: string | null
          id?: string
          process_type?: string
          result?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_training_data: {
        Row: {
          conditions: string | null
          created_at: string
          expected_output: string | null
          id: string
          input_example: string | null
          is_active: boolean
          keywords: string[]
          notes: string | null
          priority: number
          process_type: string
          required_documents: string[]
          suggested_documents: string[]
          updated_at: string
        }
        Insert: {
          conditions?: string | null
          created_at?: string
          expected_output?: string | null
          id?: string
          input_example?: string | null
          is_active?: boolean
          keywords?: string[]
          notes?: string | null
          priority?: number
          process_type: string
          required_documents?: string[]
          suggested_documents?: string[]
          updated_at?: string
        }
        Update: {
          conditions?: string | null
          created_at?: string
          expected_output?: string | null
          id?: string
          input_example?: string | null
          is_active?: boolean
          keywords?: string[]
          notes?: string | null
          priority?: number
          process_type?: string
          required_documents?: string[]
          suggested_documents?: string[]
          updated_at?: string
        }
        Relationships: []
      }
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
      client_notifications: {
        Row: {
          client_email: string
          company_id: string
          created_at: string
          document_id: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          process_id: string
          title: string
          updated_at: string
        }
        Insert: {
          client_email: string
          company_id: string
          created_at?: string
          document_id: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          process_id: string
          title: string
          updated_at?: string
        }
        Update: {
          client_email?: string
          company_id?: string
          created_at?: string
          document_id?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          process_id?: string
          title?: string
          updated_at?: string
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
      company_document_templates: {
        Row: {
          category: string
          company_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          category: string
          company_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          category?: string
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      digital_signatures: {
        Row: {
          certificate_issuer: string
          certificate_serial: string
          certificate_subject: string
          company_id: string
          created_at: string
          document_id: string
          gov_br_access_token: string | null
          id: string
          process_id: string
          signature_hash: string
          signature_metadata: Json
          signature_order: number
          signature_status: string
          signature_timestamp: string
          signer_cpf: string
          signer_email: string
          signer_name: string
          updated_at: string
        }
        Insert: {
          certificate_issuer: string
          certificate_serial: string
          certificate_subject: string
          company_id: string
          created_at?: string
          document_id: string
          gov_br_access_token?: string | null
          id?: string
          process_id: string
          signature_hash: string
          signature_metadata?: Json
          signature_order?: number
          signature_status?: string
          signature_timestamp?: string
          signer_cpf: string
          signer_email: string
          signer_name: string
          updated_at?: string
        }
        Update: {
          certificate_issuer?: string
          certificate_serial?: string
          certificate_subject?: string
          company_id?: string
          created_at?: string
          document_id?: string
          gov_br_access_token?: string | null
          id?: string
          process_id?: string
          signature_hash?: string
          signature_metadata?: Json
          signature_order?: number
          signature_status?: string
          signature_timestamp?: string
          signer_cpf?: string
          signer_email?: string
          signer_name?: string
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
      document_requests: {
        Row: {
          company_id: string
          created_at: string
          current_status: string
          document_name: string
          id: string
          instructions: string | null
          last_upload_id: string | null
          last_uploaded_at: string | null
          process_id: string
          required: boolean
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_status?: string
          document_name: string
          id?: string
          instructions?: string | null
          last_upload_id?: string | null
          last_uploaded_at?: string | null
          process_id: string
          required?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_status?: string
          document_name?: string
          id?: string
          instructions?: string | null
          last_upload_id?: string | null
          last_uploaded_at?: string | null
          process_id?: string
          required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_last_upload_id_fkey"
            columns: ["last_upload_id"]
            isOneToOne: false
            referencedRelation: "document_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_process_id_fkey"
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
          has_issue_date: boolean
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
          has_issue_date?: boolean
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
          has_issue_date?: boolean
          id?: string
          name?: string
          notes?: string | null
          requires_issuing_location?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      document_uploads: {
        Row: {
          client_email: string | null
          client_id: string | null
          company_id: string
          created_at: string
          document_request_id: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          process_id: string
          status: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          document_request_id: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          process_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          document_request_id?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          process_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_uploads_document_request_id_fkey"
            columns: ["document_request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_uploads_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          adjustment_comments: string | null
          authenticity_term_url: string | null
          client_signed_at: string | null
          company_id: string | null
          company_signed_at: string | null
          created_at: string
          document_type: string
          expiration_date: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          issue_date: string | null
          issuing_location: string | null
          process_id: string
          rejection_reason: string | null
          requires_signature: boolean | null
          signature_status: string | null
          status: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          adjustment_comments?: string | null
          authenticity_term_url?: string | null
          client_signed_at?: string | null
          company_id?: string | null
          company_signed_at?: string | null
          created_at?: string
          document_type: string
          expiration_date?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          issue_date?: string | null
          issuing_location?: string | null
          process_id: string
          rejection_reason?: string | null
          requires_signature?: boolean | null
          signature_status?: string | null
          status?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          adjustment_comments?: string | null
          authenticity_term_url?: string | null
          client_signed_at?: string | null
          company_id?: string | null
          company_signed_at?: string | null
          created_at?: string
          document_type?: string
          expiration_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          issue_date?: string | null
          issuing_location?: string | null
          process_id?: string
          rejection_reason?: string | null
          requires_signature?: boolean | null
          signature_status?: string | null
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
      global_document_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      global_document_types: {
        Row: {
          created_at: string
          has_expiration_date: boolean
          has_issue_date: boolean
          id: string
          name: string
          notes: string | null
          requires_issuing_location: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_expiration_date?: boolean
          has_issue_date?: boolean
          id?: string
          name: string
          notes?: string | null
          requires_issuing_location?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_expiration_date?: boolean
          has_issue_date?: boolean
          id?: string
          name?: string
          notes?: string | null
          requires_issuing_location?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      internal_signatures: {
        Row: {
          auth_report_url: string | null
          authentication_contact: string
          authentication_method: string
          company_id: string
          created_at: string
          document_hash: string
          document_id: string
          id: string
          process_id: string
          signature_hash: string
          signature_ip: unknown
          signature_metadata: Json
          signature_order: number
          signer_email: string
          signer_id: string
          signer_name: string
          updated_at: string
        }
        Insert: {
          auth_report_url?: string | null
          authentication_contact: string
          authentication_method: string
          company_id: string
          created_at?: string
          document_hash: string
          document_id: string
          id?: string
          process_id: string
          signature_hash: string
          signature_ip?: unknown
          signature_metadata?: Json
          signature_order?: number
          signer_email: string
          signer_id: string
          signer_name: string
          updated_at?: string
        }
        Update: {
          auth_report_url?: string | null
          authentication_contact?: string
          authentication_method?: string
          company_id?: string
          created_at?: string
          document_hash?: string
          document_id?: string
          id?: string
          process_id?: string
          signature_hash?: string
          signature_ip?: unknown
          signature_metadata?: Json
          signature_order?: number
          signer_email?: string
          signer_id?: string
          signer_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          attempts: number
          contact: string
          created_at: string
          document_id: string
          expires_at: string
          id: string
          is_verified: boolean
          user_id: string
          verification_code: string
          verification_method: string
        }
        Insert: {
          attempts?: number
          contact: string
          created_at?: string
          document_id: string
          expires_at: string
          id?: string
          is_verified?: boolean
          user_id: string
          verification_code: string
          verification_method: string
        }
        Update: {
          attempts?: number
          contact?: string
          created_at?: string
          document_id?: string
          expires_at?: string
          id?: string
          is_verified?: boolean
          user_id?: string
          verification_code?: string
          verification_method?: string
        }
        Relationships: []
      }
      process_notes: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          parent_note_id: string | null
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
          parent_note_id?: string | null
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
          parent_note_id?: string | null
          process_id?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_notes_parent_note_id_fkey"
            columns: ["parent_note_id"]
            isOneToOne: false
            referencedRelation: "process_notes"
            referencedColumns: ["id"]
          },
        ]
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
          address: string | null
          company_id: string | null
          created_at: string
          email: string
          firm_id: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          firm_id?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          firm_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
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
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      signature_flows: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          current_step: number
          document_id: string
          flow_status: string
          flow_type: string
          id: string
          process_id: string
          total_steps: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          current_step?: number
          document_id: string
          flow_status?: string
          flow_type?: string
          id?: string
          process_id: string
          total_steps?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          current_step?: number
          document_id?: string
          flow_status?: string
          flow_type?: string
          id?: string
          process_id?: string
          total_steps?: number
          updated_at?: string
        }
        Relationships: []
      }
      signature_requirements: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          notification_sent: boolean
          signature_flow_id: string
          signature_order: number
          signer_email: string
          signer_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          notification_sent?: boolean
          signature_flow_id: string
          signature_order: number
          signer_email: string
          signer_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          notification_sent?: boolean
          signature_flow_id?: string
          signature_order?: number
          signer_email?: string
          signer_name?: string | null
        }
        Relationships: []
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
      terms_acceptances: {
        Row: {
          accepted_at: string
          id: string
          ip_address: unknown
          terms_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: unknown
          terms_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: unknown
          terms_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_acceptances_terms_id_fkey"
            columns: ["terms_id"]
            isOneToOne: false
            referencedRelation: "terms_of_service"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_of_service: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          version?: string
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
      user_roles: {
        Row: {
          client_email: string | null
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          client_email?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          client_email?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_process: { Args: { process_uuid: string }; Returns: boolean }
      can_manage_company: {
        Args: { comp_id: string; user_uuid: string }
        Returns: boolean
      }
      can_sign_document: {
        Args: { document_uuid: string; signer_email_param: string }
        Returns: boolean
      }
      can_view_company: { Args: { comp_id: string }; Returns: boolean }
      check_expiring_documents: {
        Args: { days_ahead?: number }
        Returns: {
          client_email: string
          client_name: string
          company_id: string
          days_until_expiration: number
          document_id: string
          document_name: string
          document_type: string
          expiration_date: string
          process_id: string
          status: string
        }[]
      }
      check_plan_limits: {
        Args: { company_uuid: string; limit_type: string }
        Returns: Json
      }
      generate_document_hash: {
        Args: { document_uuid: string; file_path_val: string }
        Returns: string
      }
      generate_document_report: {
        Args: { process_uuid: string }
        Returns: string
      }
      generate_invite_token: { Args: never; Returns: string }
      generate_signature_hash: {
        Args: {
          document_uuid: string
          signer_uuid: string
          timestamp_val: string
        }
        Returns: string
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_company_id: { Args: never; Returns: string }
      get_user_role_details: {
        Args: { user_uuid: string }
        Returns: {
          client_email: string
          company_id: string
          role: string
        }[]
      }
      get_user_roles: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_any_role: {
        Args: {
          check_roles: Database["public"]["Enums"]["app_role"][]
          user_uuid: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          user_uuid: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { user_uuid: string }; Returns: boolean }
      log_process_access: {
        Args: { access_type: string; process_uuid: string }
        Returns: undefined
      }
      update_usage_metrics: {
        Args: { company_uuid: string }
        Returns: undefined
      }
      user_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "platform_admin"
        | "company_admin"
        | "company_collaborator"
        | "client"
        | "client_collaborator"
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
      app_role: [
        "platform_admin",
        "company_admin",
        "company_collaborator",
        "client",
        "client_collaborator",
      ],
      subscription_plan: ["starter", "professional", "enterprise"],
      subscription_status: ["active", "trial", "expired", "canceled"],
      user_role: ["admin", "lawyer", "staff", "client"],
    },
  },
} as const
