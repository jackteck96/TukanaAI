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
          process_id: string | null
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
          process_id?: string | null
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
          process_id?: string | null
          status?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      client_legal_data: {
        Row: {
          address: string | null
          client_email: string
          client_name: string
          cnpj: string | null
          company_id: string | null
          company_name: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          legal_representative_cpf: string | null
          legal_representative_name: string | null
          marital_status: string | null
          nationality: string | null
          person_type: string
          phone: string | null
          profession: string | null
          rg: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_email: string
          client_name: string
          cnpj?: string | null
          company_id?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          legal_representative_cpf?: string | null
          legal_representative_name?: string | null
          marital_status?: string | null
          nationality?: string | null
          person_type?: string
          phone?: string | null
          profession?: string | null
          rg?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_email?: string
          client_name?: string
          cnpj?: string | null
          company_id?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          legal_representative_cpf?: string | null
          legal_representative_name?: string | null
          marital_status?: string | null
          nationality?: string | null
          person_type?: string
          phone?: string | null
          profession?: string | null
          rg?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_legal_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          client_email: string
          company_id: string
          created_at: string
          document_id: string | null
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
          document_id?: string | null
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
          document_id?: string | null
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
      clients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zipcode: string | null
          admin_cpf: string | null
          admin_full_name: string | null
          cnpj: string | null
          company_id: string
          company_name: string
          created_at: string
          created_by: string | null
          email: string
          email_preference: string | null
          email_sent: boolean
          email_sent_at: string | null
          id: string
          internal_notes: string | null
          phone: string
          qualification_method: string
          registration_status: string
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          admin_cpf?: string | null
          admin_full_name?: string | null
          cnpj?: string | null
          company_id: string
          company_name: string
          created_at?: string
          created_by?: string | null
          email: string
          email_preference?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          internal_notes?: string | null
          phone: string
          qualification_method?: string
          registration_status?: string
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          admin_cpf?: string | null
          admin_full_name?: string | null
          cnpj?: string | null
          company_id?: string
          company_name?: string
          created_at?: string
          created_by?: string | null
          email?: string
          email_preference?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          internal_notes?: string | null
          phone?: string
          qualification_method?: string
          registration_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_permissions: {
        Row: {
          access_type: string
          client_email: string | null
          company_id: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_type: string
          client_email?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_type?: string
          client_email?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_process_access: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          process_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          process_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_process_access_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "collaborator_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_process_access_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          legal_representative_cpf: string | null
          legal_representative_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          legal_representative_cpf?: string | null
          legal_representative_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          legal_representative_cpf?: string | null
          legal_representative_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
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
      data_subject_requests: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          export_file_path: string | null
          id: string
          rejection_reason: string | null
          request_details: Json | null
          request_type: string
          requested_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          export_file_path?: string | null
          id?: string
          rejection_reason?: string | null
          request_details?: Json | null
          request_type: string
          requested_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          export_file_path?: string | null
          id?: string
          rejection_reason?: string | null
          request_details?: Json | null
          request_type?: string
          requested_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
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
      google_calendar_tokens: {
        Row: {
          access_token: string
          company_id: string
          created_at: string | null
          id: string
          refresh_token: string | null
          scope: string
          token_expiry: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          company_id: string
          created_at?: string | null
          id?: string
          refresh_token?: string | null
          scope: string
          token_expiry: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          company_id?: string
          created_at?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string
          token_expiry?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_process_chat: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_url: string | null
          company_id: string
          created_at: string
          id: string
          message: string
          process_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          company_id: string
          created_at?: string
          id?: string
          message: string
          process_id: string
          user_id: string
          user_name: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          company_id?: string
          created_at?: string
          id?: string
          message?: string
          process_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_process_chat_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
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
          process_id: string | null
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
          process_id?: string | null
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
          process_id?: string | null
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
      partner_documents: {
        Row: {
          address_proof_path: string | null
          address_proof_status: string | null
          address_proof_uploaded_at: string | null
          client_email: string
          company_id: string
          cpf_path: string | null
          cpf_status: string | null
          cpf_uploaded_at: string | null
          created_at: string
          id: string
          rg_path: string | null
          rg_status: string | null
          rg_uploaded_at: string | null
          social_contract_path: string | null
          social_contract_status: string | null
          social_contract_uploaded_at: string | null
          updated_at: string
        }
        Insert: {
          address_proof_path?: string | null
          address_proof_status?: string | null
          address_proof_uploaded_at?: string | null
          client_email: string
          company_id: string
          cpf_path?: string | null
          cpf_status?: string | null
          cpf_uploaded_at?: string | null
          created_at?: string
          id?: string
          rg_path?: string | null
          rg_status?: string | null
          rg_uploaded_at?: string | null
          social_contract_path?: string | null
          social_contract_status?: string | null
          social_contract_uploaded_at?: string | null
          updated_at?: string
        }
        Update: {
          address_proof_path?: string | null
          address_proof_status?: string | null
          address_proof_uploaded_at?: string | null
          client_email?: string
          company_id?: string
          cpf_path?: string | null
          cpf_status?: string | null
          cpf_uploaded_at?: string | null
          created_at?: string
          id?: string
          rg_path?: string | null
          rg_status?: string | null
          rg_uploaded_at?: string | null
          social_contract_path?: string | null
          social_contract_status?: string | null
          social_contract_uploaded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_documents_history: {
        Row: {
          created_at: string
          document_type: string
          file_path: string
          id: string
          partner_document_id: string
          replaced_at: string
          replaced_by: string | null
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_path: string
          id?: string
          partner_document_id: string
          replaced_at?: string
          replaced_by?: string | null
          uploaded_at: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_path?: string
          id?: string
          partner_document_id?: string
          replaced_at?: string
          replaced_by?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_history_partner_document_id_fkey"
            columns: ["partner_document_id"]
            isOneToOne: false
            referencedRelation: "partner_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_data_access_log: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_user_id: string
          accessor_user_id: string | null
          data_category: string
          id: string
          ip_address: unknown
          metadata: Json | null
          purpose: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_user_id: string
          accessor_user_id?: string | null
          data_category: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          purpose: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_user_id?: string
          accessor_user_id?: string | null
          data_category?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          purpose?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      privacy_policies: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          effective_date: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          effective_date: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          version: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      process_calendar_events: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          document_id: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          meeting_link: string | null
          process_id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          document_id?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          meeting_link?: string | null
          process_id: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          document_id?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          meeting_link?: string | null
          process_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_calendar_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_calendar_events_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_clients: {
        Row: {
          client_email: string
          client_name: string
          cpf_cnpj: string | null
          created_at: string
          id: string
          is_primary: boolean
          process_id: string
          updated_at: string
        }
        Insert: {
          client_email: string
          client_name: string
          cpf_cnpj?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          process_id: string
          updated_at?: string
        }
        Update: {
          client_email?: string
          client_name?: string
          cpf_cnpj?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          process_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_clients_process_id_fkey"
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
          meeting_date: string | null
          meeting_url: string | null
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
          meeting_date?: string | null
          meeting_url?: string | null
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
          meeting_date?: string | null
          meeting_url?: string | null
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
      security_incidents: {
        Row: {
          affected_data_categories: string[] | null
          affected_users_count: number | null
          created_at: string | null
          created_by: string | null
          description: string
          detected_at: string
          id: string
          incident_type: string
          notification_sent_at: string | null
          reported_at: string | null
          reported_to_anpd: boolean | null
          resolution_details: string | null
          resolution_status: string | null
          resolved_at: string | null
          severity: string
          updated_at: string | null
          users_notified: boolean | null
        }
        Insert: {
          affected_data_categories?: string[] | null
          affected_users_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          detected_at: string
          id?: string
          incident_type: string
          notification_sent_at?: string | null
          reported_at?: string | null
          reported_to_anpd?: boolean | null
          resolution_details?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          severity: string
          updated_at?: string | null
          users_notified?: boolean | null
        }
        Update: {
          affected_data_categories?: string[] | null
          affected_users_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          detected_at?: string
          id?: string
          incident_type?: string
          notification_sent_at?: string | null
          reported_at?: string | null
          reported_to_anpd?: boolean | null
          resolution_details?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          severity?: string
          updated_at?: string | null
          users_notified?: boolean | null
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
      standalone_signature_documents: {
        Row: {
          client_email: string
          client_name: string
          client_signed_at: string | null
          company_id: string
          company_signed_at: string | null
          created_at: string
          document_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          notes: string | null
          signature_deadline: string | null
          signature_hash: string | null
          signature_status: string
          signed_at: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_signed_at?: string | null
          company_id: string
          company_signed_at?: string | null
          created_at?: string
          document_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          notes?: string | null
          signature_deadline?: string | null
          signature_hash?: string | null
          signature_status?: string
          signed_at?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_signed_at?: string | null
          company_id?: string
          company_signed_at?: string | null
          created_at?: string
          document_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          notes?: string | null
          signature_deadline?: string | null
          signature_hash?: string | null
          signature_status?: string
          signed_at?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "standalone_signature_documents_company_id_fkey"
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
      user_consents: {
        Row: {
          consent_date: string | null
          consent_given: boolean
          consent_type: string
          created_at: string | null
          id: string
          ip_address: unknown
          purpose: string
          revoked_date: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean
          consent_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          purpose: string
          revoked_date?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean
          consent_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          purpose?: string
          revoked_date?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          access_type: string | null
          allowed_process_ids: string[] | null
          client_email: string | null
          company_id: string | null
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
          access_type?: string | null
          allowed_process_ids?: string[] | null
          client_email?: string | null
          company_id?: string | null
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
          access_type?: string | null
          allowed_process_ids?: string[] | null
          client_email?: string | null
          company_id?: string | null
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
      can_create_client_invite: {
        Args: { target_client_email: string }
        Returns: boolean
      }
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
      collaborator_can_access_process: {
        Args: { _process_id: string; _user_id: string }
        Returns: boolean
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
      get_accessible_process_ids: {
        Args: never
        Returns: {
          process_id: string
        }[]
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
      log_personal_data_access: {
        Args: {
          p_access_type: string
          p_accessed_user_id: string
          p_data_category: string
          p_metadata?: Json
          p_purpose: string
        }
        Returns: string
      }
      log_process_access: {
        Args: { access_type: string; process_uuid: string }
        Returns: undefined
      }
      process_collaborator_invite_acceptance: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      update_usage_metrics: {
        Args: { company_uuid: string }
        Returns: undefined
      }
      upsert_collaborator_permissions: {
        Args: {
          p_access_type: string
          p_client_email: string
          p_company_id: string
          p_process_ids: string[]
          p_target_user_id: string
        }
        Returns: Json
      }
      user_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_client_role: {
        Args: { _client_email: string; _user_id: string }
        Returns: boolean
      }
      user_has_company_admin_role: {
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
