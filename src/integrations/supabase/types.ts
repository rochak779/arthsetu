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
      kite_holdings: {
        Row: {
          average_price: number
          collateral_quantity: number
          exchange: string
          id: number
          instrument_token: number
          last_price: number
          pnl: number
          product: string
          quantity: number
          raw: Json
          t1_quantity: number
          tradingsymbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_price: number
          collateral_quantity?: number
          exchange: string
          id?: never
          instrument_token: number
          last_price: number
          pnl: number
          product: string
          quantity: number
          raw: Json
          t1_quantity?: number
          tradingsymbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_price?: number
          collateral_quantity?: number
          exchange?: string
          id?: never
          instrument_token?: number
          last_price?: number
          pnl?: number
          product?: string
          quantity?: number
          raw?: Json
          t1_quantity?: number
          tradingsymbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          alert_pref: string
          created_at: string | null
          id: string
          investor_type: string
          risk_comfort: string
          user_id: string
        }
        Insert: {
          alert_pref: string
          created_at?: string | null
          id?: string
          investor_type: string
          risk_comfort: string
          user_id: string
        }
        Update: {
          alert_pref?: string
          created_at?: string | null
          id?: string
          investor_type?: string
          risk_comfort?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_verifiedat: string | null
          full_name: string
          groww_accesstoken: string | null
          kite_accesstoken: string | null
          last_login_date: string | null
          upstox_accesstoken: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verifiedat?: string | null
          full_name: string
          groww_accesstoken?: string | null
          kite_accesstoken?: string | null
          last_login_date?: string | null
          upstox_accesstoken?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verifiedat?: string | null
          full_name?: string
          groww_accesstoken?: string | null
          kite_accesstoken?: string | null
          last_login_date?: string | null
          upstox_accesstoken?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status_code: number | null
          status: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status_code?: number | null
          status: string
          user_id: string
          webhook_url: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status_code?: number | null
          status?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          id: string
          user_id: string | null
          external_id: string | null
          symbol: string | null
          title: string | null
          summary: string | null
          full_summary: string | null
          action: "buy" | "trim" | "hold"
          priority: "high" | "medium" | "low"
          confidence: "high" | "medium" | "low"
          last_price: number | null
          change_pct: number | null
          link: string | null
          source: string | null
          category: string | null
          payload: Json | null
          lifecycle_status: "new" | "read" | "archived"
          read_at: string | null
          archived_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          external_id?: string | null
          symbol?: string | null
          title?: string | null
          summary?: string | null
          full_summary?: string | null
          action?: "buy" | "trim" | "hold"
          priority?: "high" | "medium" | "low"
          confidence?: "high" | "medium" | "low"
          last_price?: number | null
          change_pct?: number | null
          link?: string | null
          source?: string | null
          category?: string | null
          payload?: Json | null
          lifecycle_status?: "new" | "read" | "archived"
          read_at?: string | null
          archived_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          external_id?: string | null
          symbol?: string | null
          title?: string | null
          summary?: string | null
          full_summary?: string | null
          action?: "buy" | "trim" | "hold"
          priority?: "high" | "medium" | "low"
          confidence?: "high" | "medium" | "low"
          last_price?: number | null
          change_pct?: number | null
          link?: string | null
          source?: string | null
          category?: string | null
          payload?: Json | null
          lifecycle_status?: "new" | "read" | "archived"
          read_at?: string | null
          archived_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
