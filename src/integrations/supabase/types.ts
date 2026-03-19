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
      alunos_experimentais: {
        Row: {
          aluno_id: number
          atualizacoes_status: Json | null
          chave_idempotencia: string
          created_at: string | null
          data_aula_experimental: string | null
          data_registro: string | null
          email: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: number
          nome: string | null
          status_aula: string | null
          status_fechamento: string | null
          synced_at: string | null
          telefone: string | null
          updated_at: string | null
          vendedor: string | null
          vendedor_id: string | null
        }
        Insert: {
          aluno_id: number
          atualizacoes_status?: Json | null
          chave_idempotencia: string
          created_at?: string | null
          data_aula_experimental?: string | null
          data_registro?: string | null
          email?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: number
          nome?: string | null
          status_aula?: string | null
          status_fechamento?: string | null
          synced_at?: string | null
          telefone?: string | null
          updated_at?: string | null
          vendedor?: string | null
          vendedor_id?: string | null
        }
        Update: {
          aluno_id?: number
          atualizacoes_status?: Json | null
          chave_idempotencia?: string
          created_at?: string | null
          data_aula_experimental?: string | null
          data_registro?: string | null
          email?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: number
          nome?: string | null
          status_aula?: string | null
          status_fechamento?: string | null
          synced_at?: string | null
          telefone?: string | null
          updated_at?: string | null
          vendedor?: string | null
          vendedor_id?: string | null
        }
        Relationships: []
      }
      Dados_Agendamento_Plataforma: {
        Row: {
          atualizacao: string | null
          chaveIdempotencia: string | null
          dataAulaExperimental: string | null
          dataRegistro: string | null
          email: string | null
          horarioFim: string | null
          horarioInicio: string | null
          id: number
          nome: string | null
          statusAula: string | null
          statusFechamento: string | null
          telefone: string | null
          vendedor: string | null
          vendedorId: string | null
        }
        Insert: {
          atualizacao?: string | null
          chaveIdempotencia?: string | null
          dataAulaExperimental?: string | null
          dataRegistro?: string | null
          email?: string | null
          horarioFim?: string | null
          horarioInicio?: string | null
          id: number
          nome?: string | null
          statusAula?: string | null
          statusFechamento?: string | null
          telefone?: string | null
          vendedor?: string | null
          vendedorId?: string | null
        }
        Update: {
          atualizacao?: string | null
          chaveIdempotencia?: string | null
          dataAulaExperimental?: string | null
          dataRegistro?: string | null
          email?: string | null
          horarioFim?: string | null
          horarioInicio?: string | null
          id?: number
          nome?: string | null
          statusAula?: string | null
          statusFechamento?: string | null
          telefone?: string | null
          vendedor?: string | null
          vendedorId?: string | null
        }
        Relationships: []
      }
      dados_funil_kommo: {
        Row: {
          data_criacao: string | null
          data_movimentacao: string | null
          etapa_anterior: string | null
          etapa_atual: string | null
          lead_id: number
          nome_lead: string | null
          vendedor: string | null
        }
        Insert: {
          data_criacao?: string | null
          data_movimentacao?: string | null
          etapa_anterior?: string | null
          etapa_atual?: string | null
          lead_id: number
          nome_lead?: string | null
          vendedor?: string | null
        }
        Update: {
          data_criacao?: string | null
          data_movimentacao?: string | null
          etapa_anterior?: string | null
          etapa_atual?: string | null
          lead_id?: number
          nome_lead?: string | null
          vendedor?: string | null
        }
        Relationships: []
      }
      Dados_RH: {
        Row: {
          "Data de Criacao": string | null
          Email: string | null
          fbclid: string | null
          gclid: string | null
          Genero: string | null
          id_Supabase: string
          Idade: number | null
          Localidade: string | null
          "Nome Completo": string | null
          Qualificacao: string | null
          telefone: number | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: number | null
        }
        Insert: {
          "Data de Criacao"?: string | null
          Email?: string | null
          fbclid?: string | null
          gclid?: string | null
          Genero?: string | null
          id_Supabase?: string
          Idade?: number | null
          Localidade?: string | null
          "Nome Completo"?: string | null
          Qualificacao?: string | null
          telefone?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: number | null
        }
        Update: {
          "Data de Criacao"?: string | null
          Email?: string | null
          fbclid?: string | null
          gclid?: string | null
          Genero?: string | null
          id_Supabase?: string
          Idade?: number | null
          Localidade?: string | null
          "Nome Completo"?: string | null
          Qualificacao?: string | null
          telefone?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: number | null
        }
        Relationships: []
      }
      kommo_leads: {
        Row: {
          closed_at: string | null
          created_at: string | null
          etapa_anterior: string | null
          etapa_atual: string | null
          is_deleted: boolean | null
          lead_id: number
          nome: string | null
          pipeline_id: number | null
          updated_at: string | null
          valor: number | null
          vendedor: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          etapa_anterior?: string | null
          etapa_atual?: string | null
          is_deleted?: boolean | null
          lead_id: number
          nome?: string | null
          pipeline_id?: number | null
          updated_at?: string | null
          valor?: number | null
          vendedor?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          etapa_anterior?: string | null
          etapa_atual?: string | null
          is_deleted?: boolean | null
          lead_id?: number
          nome?: string | null
          pipeline_id?: number | null
          updated_at?: string | null
          valor?: number | null
          vendedor?: string | null
        }
        Relationships: []
      }
      kommo_leads_ads_cache: {
        Row: {
          ano: number
          cached_at: string | null
          created_at: string | null
          etapa_atual: string | null
          id: number
          lead_id: number
          mes: number
          nome: string | null
          pipeline_id: number | null
          tags: string[] | null
          valor: number | null
          vendedor: string | null
        }
        Insert: {
          ano: number
          cached_at?: string | null
          created_at?: string | null
          etapa_atual?: string | null
          id?: number
          lead_id: number
          mes: number
          nome?: string | null
          pipeline_id?: number | null
          tags?: string[] | null
          valor?: number | null
          vendedor?: string | null
        }
        Update: {
          ano?: number
          cached_at?: string | null
          created_at?: string | null
          etapa_atual?: string | null
          id?: number
          lead_id?: number
          mes?: number
          nome?: string | null
          pipeline_id?: number | null
          tags?: string[] | null
          valor?: number | null
          vendedor?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          call_agendada: boolean | null
          call_realizada: boolean | null
          compra: boolean | null
          contrato: boolean | null
          created_at: string | null
          data: string | null
          email: string | null
          fbclid: string | null
          gclid: string | null
          id: string
          id_facebook: string | null
          mql: boolean | null
          nome: string | null
          tag: string | null
          telefone: string
          updated_at: string | null
          utm_anuncio: string | null
          utm_campaign: string | null
          utm_conjunto: string | null
        }
        Insert: {
          call_agendada?: boolean | null
          call_realizada?: boolean | null
          compra?: boolean | null
          contrato?: boolean | null
          created_at?: string | null
          data?: string | null
          email?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          id_facebook?: string | null
          mql?: boolean | null
          nome?: string | null
          tag?: string | null
          telefone: string
          updated_at?: string | null
          utm_anuncio?: string | null
          utm_campaign?: string | null
          utm_conjunto?: string | null
        }
        Update: {
          call_agendada?: boolean | null
          call_realizada?: boolean | null
          compra?: boolean | null
          contrato?: boolean | null
          created_at?: string | null
          data?: string | null
          email?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          id_facebook?: string | null
          mql?: boolean | null
          nome?: string | null
          tag?: string | null
          telefone?: string
          updated_at?: string | null
          utm_anuncio?: string | null
          utm_campaign?: string | null
          utm_conjunto?: string | null
        }
        Relationships: []
      }
      metas_vendedores: {
        Row: {
          ano: number
          competicao: string | null
          created_at: string | null
          dias_uteis: number | null
          id: number
          mes: number
          meta: number | null
          nivel: string | null
          supermeta: number | null
          vendedor: string
        }
        Insert: {
          ano: number
          competicao?: string | null
          created_at?: string | null
          dias_uteis?: number | null
          id?: number
          mes: number
          meta?: number | null
          nivel?: string | null
          supermeta?: number | null
          vendedor: string
        }
        Update: {
          ano?: number
          competicao?: string | null
          created_at?: string | null
          dias_uteis?: number | null
          id?: number
          mes?: number
          meta?: number | null
          nivel?: string | null
          supermeta?: number | null
          vendedor?: string
        }
        Relationships: []
      }
      projecoes_calculadas: {
        Row: {
          ano: number
          calculado_em: string | null
          id: number
          mes: number
          pct_meta: number | null
          previsao_fechados: number | null
          previsao_leads: number | null
          roi: number | null
          status: string | null
          vendedor: string
        }
        Insert: {
          ano: number
          calculado_em?: string | null
          id?: number
          mes: number
          pct_meta?: number | null
          previsao_fechados?: number | null
          previsao_leads?: number | null
          roi?: number | null
          status?: string | null
          vendedor: string
        }
        Update: {
          ano?: number
          calculado_em?: string | null
          id?: number
          mes?: number
          pct_meta?: number | null
          previsao_fechados?: number | null
          previsao_leads?: number | null
          roi?: number | null
          status?: string | null
          vendedor?: string
        }
        Relationships: []
      }
      rag_copy_senior: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
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
          Data: string | null
          Gasto: string | null
          Grupo: string | null
          id: string
          Impressões: string | null
          Leads: string | null
          receita: string | null
          VENDAS: string | null
        }
        Insert: {
          "Campaign Conversion Month ID (transações)"?: string | null
          "Campaign Month ID (plataforma)"?: string | null
          "Campaign Name"?: string | null
          canal?: string | null
          Cliques?: string | null
          Data?: string | null
          Gasto?: string | null
          Grupo?: string | null
          id?: string
          Impressões?: string | null
          Leads?: string | null
          receita?: string | null
          VENDAS?: string | null
        }
        Update: {
          "Campaign Conversion Month ID (transações)"?: string | null
          "Campaign Month ID (plataforma)"?: string | null
          "Campaign Name"?: string | null
          canal?: string | null
          Cliques?: string | null
          Data?: string | null
          Gasto?: string | null
          Grupo?: string | null
          id?: string
          Impressões?: string | null
          Leads?: string | null
          receita?: string | null
          VENDAS?: string | null
        }
        Relationships: []
      }
      vendas_historico: {
        Row: {
          calls: number | null
          created_at: string | null
          data: string
          fonte: string | null
          id: number
          leads: number | null
          leads_ads: number | null
          vendas: number | null
          vendedor: string
        }
        Insert: {
          calls?: number | null
          created_at?: string | null
          data: string
          fonte?: string | null
          id?: number
          leads?: number | null
          leads_ads?: number | null
          vendas?: number | null
          vendedor: string
        }
        Update: {
          calls?: number | null
          created_at?: string | null
          data?: string
          fonte?: string | null
          id?: number
          leads?: number | null
          leads_ads?: number | null
          vendas?: number | null
          vendedor?: string
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
          id: string | null
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
          data?: string | null
          grupo_anuncio?: string | null
          id?: string | null
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
          data?: string | null
          grupo_anuncio?: string | null
          id?: string | null
          impressoes?: never
          investimento?: never
          leads?: never
          receita?: never
        }
        Relationships: []
      }
    }
    Functions: {
      bytea_to_text: { Args: { data: string }; Returns: string }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      match_rag_brending: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_rag_copy_senior: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      sync_alunos_experimentais: { Args: never; Returns: Json }
      text_to_bytea: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
