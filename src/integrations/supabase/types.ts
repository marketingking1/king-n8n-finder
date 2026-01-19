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
      Tabela_Geral_Leads: {
        Row: {
          call_agendada: string | null
          call_realizada: string | null
          comprador: string | null
          contrato_gerado: string | null
          created_at: string | null
          data_entrada_lead: string | null
          email: string | null
          facebook_id: string | null
          fbclid: string | null
          gclid: string | null
          id: number
          mql: string | null
          nome: string | null
          telefone: number
          utm_anuncio: string | null
          utm_campaing: string | null
          utm_conjunto: string | null
          venda: string | null
        }
        Insert: {
          call_agendada?: string | null
          call_realizada?: string | null
          comprador?: string | null
          contrato_gerado?: string | null
          created_at?: string | null
          data_entrada_lead?: string | null
          email?: string | null
          facebook_id?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: number
          mql?: string | null
          nome?: string | null
          telefone: number
          utm_anuncio?: string | null
          utm_campaing?: string | null
          utm_conjunto?: string | null
          venda?: string | null
        }
        Update: {
          call_agendada?: string | null
          call_realizada?: string | null
          comprador?: string | null
          contrato_gerado?: string | null
          created_at?: string | null
          data_entrada_lead?: string | null
          email?: string | null
          facebook_id?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: number
          mql?: string | null
          nome?: string | null
          telefone?: number
          utm_anuncio?: string | null
          utm_campaing?: string | null
          utm_conjunto?: string | null
          venda?: string | null
        }
        Relationships: []
      }
      Tabela_Objetivo: {
        Row: {
          "Campaign Conversion Month ID (transações)": string | null
          "Campaign Month ID (plataforma)": string | null
          "Campaign Name": string | null
          canal: string | null
          Cliques: string | null
          Date: string | null
          Gasto: string | null
          Grupo: string | null
          Impressões: string | null
          Leads: number | null
          receita: string | null
          VENDAS: number | null
        }
        Insert: {
          "Campaign Conversion Month ID (transações)"?: string | null
          "Campaign Month ID (plataforma)"?: string | null
          "Campaign Name"?: string | null
          canal?: string | null
          Cliques?: string | null
          Date?: string | null
          Gasto?: string | null
          Grupo?: string | null
          Impressões?: string | null
          Leads?: number | null
          receita?: string | null
          VENDAS?: number | null
        }
        Update: {
          "Campaign Conversion Month ID (transações)"?: string | null
          "Campaign Month ID (plataforma)"?: string | null
          "Campaign Name"?: string | null
          canal?: string | null
          Cliques?: string | null
          Date?: string | null
          Gasto?: string | null
          Grupo?: string | null
          Impressões?: string | null
          Leads?: number | null
          receita?: string | null
          VENDAS?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_marketing_data: {
        Row: {
          campanha: string | null
          canal: string | null
          cliques: number | null
          conversoes: number | null
          data: string | null
          grupo_anuncio: string | null
          impressoes: number | null
          investimento: number | null
          leads: number | null
          receita: number | null
        }
        Insert: {
          campanha?: string | null
          canal?: string | null
          cliques?: never
          conversoes?: never
          data?: never
          grupo_anuncio?: string | null
          impressoes?: never
          investimento?: never
          leads?: never
          receita?: never
        }
        Update: {
          campanha?: string | null
          canal?: string | null
          cliques?: never
          conversoes?: never
          data?: never
          grupo_anuncio?: string | null
          impressoes?: never
          investimento?: never
          leads?: never
          receita?: never
        }
        Relationships: []
      }
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
