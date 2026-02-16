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
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      chat_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          description: string | null
          doer_payout_amount: number | null
          escrow_id: string | null
          id: string
          poster_refund_amount: number | null
          raised_by_id: string | null
          raised_by_role: string
          reason: string
          resolution_notes: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_in_favor_of: string | null
          status: string
          task_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          doer_payout_amount?: number | null
          escrow_id?: string | null
          id?: string
          poster_refund_amount?: number | null
          raised_by_id?: string | null
          raised_by_role: string
          reason: string
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_in_favor_of?: string | null
          status?: string
          task_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          doer_payout_amount?: number | null
          escrow_id?: string | null
          id?: string
          poster_refund_amount?: number | null
          raised_by_id?: string | null
          raised_by_role?: string
          reason?: string
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_in_favor_of?: string | null
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          is_primary: boolean | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          auto_release_at: string | null
          created_at: string
          doer_id: string | null
          fee_percentage: number
          gross_amount: number
          id: string
          net_payout: number
          platform_fee: number
          poster_id: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          task_id: string
          version: number | null
        }
        Insert: {
          auto_release_at?: string | null
          created_at?: string
          doer_id?: string | null
          fee_percentage: number
          gross_amount: number
          id?: string
          net_payout: number
          platform_fee: number
          poster_id?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          task_id: string
          version?: number | null
        }
        Update: {
          auto_release_at?: string | null
          created_at?: string
          doer_id?: string | null
          fee_percentage?: number
          gross_amount?: number
          id?: string
          net_payout?: number
          platform_fee?: number
          poster_id?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          task_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          next_retry_at: string | null
          payload: Json
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          next_retry_at?: string | null
          payload: Json
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          key: string
          request_hash: string
          response: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          key: string
          request_hash: string
          response?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          key?: string
          request_hash?: string
          response?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          flagged_at: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean | null
          receiver_id: string
          sender_id: string
          task_id: string
        }
        Insert: {
          content: string
          created_at?: string
          flagged_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          receiver_id: string
          sender_id: string
          task_id: string
        }
        Update: {
          content?: string
          created_at?: string
          flagged_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          receiver_id?: string
          sender_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_events: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          id_image_url: string | null
          is_verified: boolean | null
          phone: string | null
          preferred_language: string | null
          rating: number | null
          tasks_completed: number | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          verification_status: string
          wallet_balance: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          id_image_url?: string | null
          is_verified?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          rating?: number | null
          tasks_completed?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string
          wallet_balance?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_image_url?: string | null
          is_verified?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          rating?: number | null
          tasks_completed?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      sos_audio_recordings: {
        Row: {
          duration_seconds: number | null
          id: string
          is_simulated: boolean | null
          recorded_at: string
          sos_event_id: string
          storage_path: string | null
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          is_simulated?: boolean | null
          recorded_at?: string
          sos_event_id: string
          storage_path?: string | null
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          is_simulated?: boolean | null
          recorded_at?: string
          sos_event_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_audio_recordings_sos_event_id_fkey"
            columns: ["sos_event_id"]
            isOneToOne: false
            referencedRelation: "sos_events"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_events: {
        Row: {
          current_latitude: number | null
          current_longitude: number | null
          emergency_contact_notified: boolean | null
          id: string
          initial_latitude: number
          initial_longitude: number
          is_silent_mode: boolean | null
          last_location_update: string | null
          resolution_notes: string | null
          resolved_at: string | null
          responded_at: string | null
          safety_team_member_id: string | null
          safety_team_notified: boolean | null
          safety_team_notified_at: string | null
          simulated_emergency_call: string | null
          status: Database["public"]["Enums"]["sos_status"]
          task_id: string | null
          triggered_at: string
          user_id: string
          user_role: string
        }
        Insert: {
          current_latitude?: number | null
          current_longitude?: number | null
          emergency_contact_notified?: boolean | null
          id?: string
          initial_latitude: number
          initial_longitude: number
          is_silent_mode?: boolean | null
          last_location_update?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          responded_at?: string | null
          safety_team_member_id?: string | null
          safety_team_notified?: boolean | null
          safety_team_notified_at?: string | null
          simulated_emergency_call?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          task_id?: string | null
          triggered_at?: string
          user_id: string
          user_role: string
        }
        Update: {
          current_latitude?: number | null
          current_longitude?: number | null
          emergency_contact_notified?: boolean | null
          id?: string
          initial_latitude?: number
          initial_longitude?: number
          is_silent_mode?: boolean | null
          last_location_update?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          responded_at?: string | null
          safety_team_member_id?: string | null
          safety_team_notified?: boolean | null
          safety_team_notified_at?: string | null
          simulated_emergency_call?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          task_id?: string | null
          triggered_at?: string
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_location_history: {
        Row: {
          accuracy: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          sos_event_id: string
        }
        Insert: {
          accuracy?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          sos_event_id: string
        }
        Update: {
          accuracy?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          sos_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_location_history_sos_event_id_fkey"
            columns: ["sos_event_id"]
            isOneToOne: false
            referencedRelation: "sos_events"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          message: string | null
          submitted_by: string
          task_id: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          message?: string | null
          submitted_by: string
          task_id: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          message?: string | null
          submitted_by?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          actor_id: string
          actor_role: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          new_state: string | null
          old_state: string | null
          task_id: string
        }
        Insert: {
          actor_id: string
          actor_role: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_state?: string | null
          old_state?: string | null
          task_id: string
        }
        Update: {
          actor_id?: string
          actor_role?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_state?: string | null
          old_state?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_verifications: {
        Row: {
          expires_at: string | null
          id: string
          image_path: string
          is_approved: boolean | null
          phase: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          task_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          image_path: string
          is_approved?: boolean | null
          phase: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          task_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          image_path?: string
          is_approved?: boolean | null
          phase?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          task_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_verifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          accepted_at: string | null
          approved_at: string | null
          auto_release_at: string | null
          category: Database["public"]["Enums"]["task_category"]
          created_at: string
          deadline: string
          description: string
          doer_id: string | null
          id: string
          is_in_person: boolean | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          poster_id: string | null
          reward_amount: number
          status: Database["public"]["Enums"]["task_status"]
          submitted_at: string | null
          task_code: string
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          approved_at?: string | null
          auto_release_at?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          deadline: string
          description: string
          doer_id?: string | null
          id?: string
          is_in_person?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          poster_id?: string | null
          reward_amount: number
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          task_code?: string
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          approved_at?: string | null
          auto_release_at?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          deadline?: string
          description?: string
          doer_id?: string | null
          id?: string
          is_in_person?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          poster_id?: string | null
          reward_amount?: number
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          task_code?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_freezes: {
        Row: {
          frozen_at: string
          frozen_by: string
          id: string
          reason: string
          unfrozen_at: string | null
          unfrozen_by: string | null
          user_id: string
        }
        Insert: {
          frozen_at?: string
          frozen_by: string
          id?: string
          reason: string
          unfrozen_at?: string | null
          unfrozen_by?: string | null
          user_id: string
        }
        Update: {
          frozen_at?: string
          frozen_by?: string
          id?: string
          reason?: string
          unfrozen_at?: string | null
          unfrozen_by?: string | null
          user_id?: string
        }
        Relationships: []
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
      wallet_events: {
        Row: {
          actor_id: string | null
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          escrow_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          escrow_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          escrow_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_events_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _payload?: Json
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_frozen: { Args: { _user_id: string }; Returns: boolean }
      log_task_event: {
        Args: {
          _actor_id: string
          _actor_role: string
          _event_type: string
          _metadata?: Json
          _new_state: string
          _old_state: string
          _task_id: string
        }
        Returns: string
      }
      log_wallet_event: {
        Args: {
          _actor_id?: string
          _amount: number
          _balance_after: number
          _balance_before: number
          _escrow_id?: string
          _event_type: string
          _metadata?: Json
          _task_id?: string
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "task_poster" | "task_doer" | "admin" | "safety_team"
      payment_status:
        | "pending"
        | "in_escrow"
        | "released"
        | "disputed"
        | "refunded"
      sos_status:
        | "triggered"
        | "safety_team_responded"
        | "resolved"
        | "escalated"
      task_category:
        | "design"
        | "development"
        | "writing"
        | "marketing"
        | "data_entry"
        | "research"
        | "translation"
        | "video"
        | "audio"
        | "other"
      task_status:
        | "open"
        | "accepted"
        | "in_progress"
        | "submitted"
        | "under_review"
        | "approved"
        | "disputed"
        | "completed"
        | "cancelled"
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
      app_role: ["task_poster", "task_doer", "admin", "safety_team"],
      payment_status: [
        "pending",
        "in_escrow",
        "released",
        "disputed",
        "refunded",
      ],
      sos_status: [
        "triggered",
        "safety_team_responded",
        "resolved",
        "escalated",
      ],
      task_category: [
        "design",
        "development",
        "writing",
        "marketing",
        "data_entry",
        "research",
        "translation",
        "video",
        "audio",
        "other",
      ],
      task_status: [
        "open",
        "accepted",
        "in_progress",
        "submitted",
        "under_review",
        "approved",
        "disputed",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
