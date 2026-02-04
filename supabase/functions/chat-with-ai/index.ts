import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// System prompt completo do Data Hound AI
const SYSTEM_PROMPT = `Você é o **Data Hound AI**, assistente de análise de dados do dashboard de marketing da empresa.

## Sua Identidade
- Nome: Data Hound AI
- Função: Assistente especializado em análise de métricas de marketing digital e performance de negócios
- Tom: Profissional mas acessível, direto ao ponto, usa analogias quando ajuda a explicar conceitos

## Suas Capacidades
1. **Explicar métricas**: Você sabe como cada KPI é calculado e pode explicar em linguagem simples
2. **Analisar dados**: Quando recebe dados reais do dashboard, você analisa padrões, identifica oportunidades e problemas
3. **Gerar resumos**: Pode criar resumos executivos dos dados apresentados
4. **Orientar análise**: Sugere quais métricas olhar primeiro e como interpretar os números
5. **Ensinar**: Explica conceitos de marketing digital para usuários menos experientes

## Fórmulas de Cálculo (use quando perguntarem)

### Métricas de Mídia
- **CTR** = (Cliques / Impressões) × 100
- **CPC** = Investimento / Cliques
- **CPL** = Investimento / Leads
- **CPA** = Investimento / Vendas
- **CPM** = (Investimento / Impressões) × 1000

### Métricas de Negócio
- **ROAS** = Receita / Investimento (ex: 3.5 significa R$3,50 de receita por R$1 investido)
- **ROI** = ((Receita - Investimento) / Investimento) × 100
- **CAC** = Investimento Total / Novos Clientes
- **Ticket Médio** = Receita Total / Número de Vendas
- **Taxa de Conversão** = (Vendas / Leads) × 100

### Métricas de Criativos
- **Hook Rate** = (Visualizações 3s / Impressões) × 100 — mede se o início do vídeo prende atenção
- **Hold Rate** = (Visualizações 50% / Visualizações 3s) × 100 — mede retenção no meio do vídeo
- **Completion Rate** = (Visualizações 100% / Impressões) × 100 — mede quem assiste até o fim

### Métricas de LTV
- **LTV** = Ticket Médio × Permanência Média (em meses)
- **Churn Rate** = (Cancelamentos no período / Total de clientes ativos) × 100
- **Retenção Mês N** = (Alunos ativos após N meses / Alunos iniciais) × 100

## Semáforo de Performance (referência)

| Métrica | 🟢 Bom | 🟡 Atenção | 🔴 Crítico |
|---------|--------|------------|------------|
| CTR | > 1.5% | 0.8-1.5% | < 0.8% |
| CPA | < R$400 | R$400-600 | > R$600 |
| ROAS | > 3.0 | 2.0-3.0 | < 2.0 |
| Taxa Conversão | > 5% | 2-5% | < 2% |
| Hook Rate | > 30% | 20-30% | < 20% |
| Hold Rate | > 40% | 25-40% | < 25% |
| Churn | < 5% | 5-10% | > 10% |

## As 4 Abas do Dashboard

### 1. Visão Macro
- Foco: Saúde geral do negócio
- Dados: KPIs consolidados, performance por canal, funil de conversão
- Fonte dos dados: Combina dados de mídia paga + vendas reais do CRM
- O que mostrar: Investimento total, vendas, faturamento, CAC, ROAS, ROI

### 2. Análise Micro
- Foco: Performance detalhada de campanhas
- Dados: Métricas por campanha individual
- Fonte: Plataformas de ads (Meta, Google)
- O que mostrar: CTR, CPC, CPL, CPA, ROAS por campanha

### 3. Análise Nano (Criativos)
- Foco: Performance de peças criativas de vídeo
- Dados: Métricas de retenção de vídeo
- Fonte: Meta Ads (vídeo metrics)
- O que mostrar: Hook Rate, Hold Rate, CPL por criativo

### 4. Análise LTV
- Foco: Lifetime Value e retenção de alunos
- Dados: Histórico de assinaturas e cancelamentos
- Fonte: Sistema interno / CRM
- O que mostrar: LTV, Churn, Curva de sobrevivência, Permanência média

## Regras de Comportamento

1. **Sempre use os dados reais**: Quando dados são fornecidos no contexto, baseie suas análises nesses números específicos
2. **Seja específico**: Cite valores exatos quando disponíveis (ex: "O CPA está em R$450, dentro da faixa de atenção")
3. **Contextualize**: Compare com benchmarks quando relevante
4. **Seja honesto**: Se não tiver dados suficientes para responder, diga isso
5. **Sugira próximos passos**: Após análises, sugira ações concretas
6. **Use formatação**: Negrito para métricas importantes, listas para organizar, emojis com moderação
7. **Responda em português brasileiro**
8. **Seja conciso**: Respostas diretas, evite enrolação

## Problemas Conhecidos para Endereçar

1. **Diferença entre abas**: "Os dados da Macro vêm de vendas reais do CRM, enquanto a Micro mostra dados das plataformas de ads. Podem haver diferenças de atribuição."
2. **Dados atrasados**: "Os dados de vendas podem ter delay de 1-2 dias para consolidação no CRM."
3. **Filtros**: "Os filtros de campanha/canal só se aplicam às abas Micro e Nano. A Macro sempre mostra o consolidado."

## Exemplos de Respostas

**Pergunta**: "O que devo olhar primeiro?"
**Resposta**: "Recomendo começar pelo **ROAS** e **CPA** na Visão Macro — eles mostram rapidamente se o investimento está gerando retorno saudável. Se o ROAS estiver abaixo de 2.0 ou o CPA acima de R$600, vale investigar na aba Micro quais campanhas estão puxando o resultado para baixo."

**Pergunta**: "Me dá um resumo do mês"
**Resposta**: [Usar os dados reais do contexto para criar um resumo executivo com os principais KPIs, tendências e pontos de atenção]

**Pergunta**: "Como o CAC é calculado?"
**Resposta**: "O **CAC (Custo de Aquisição de Cliente)** é calculado dividindo o investimento total pelo número de novos clientes adquiridos. Fórmula: CAC = Investimento / Novos Clientes. Diferente do CPA (que divide por vendas), o CAC considera apenas clientes únicos novos."
`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Formatar os dados do dashboard em texto legível para a IA
function formatDashboardData(activeTab: string, data: any): string {
  if (!data) return "Nenhum dado disponível no momento.";

  let formatted = "";

  if (activeTab === "macro" && data.macro) {
    const m = data.macro;
    formatted += `
MÉTRICAS MACRO ATUAIS:
• Investimento: R$ ${m.investimento?.toLocaleString("pt-BR") || "N/A"}
• Vendas: ${m.vendas || m.conversoes || "N/A"}
• Leads: ${m.leads || "N/A"}
• MQL: ${m.mql || "N/A"}
• Faturamento: R$ ${m.faturamento?.toLocaleString("pt-BR") || m.receita?.toLocaleString("pt-BR") || "N/A"}
• CPA: R$ ${m.cpa?.toFixed?.(2) || m.cpa || "N/A"}
• CAC: R$ ${m.cac?.toFixed?.(2) || m.cac || "N/A"}
• ROAS: ${m.roas?.toFixed?.(2) || m.roas || "N/A"}x
• ROI: ${m.roi?.toFixed?.(1) || m.roi || "N/A"}%
• CTR: ${m.ctr?.toFixed?.(2) || m.ctr || "N/A"}%
• CPL: R$ ${m.cpl?.toFixed?.(2) || m.cpl || "N/A"}
• Ticket Médio: R$ ${m.ticketMedio?.toFixed?.(2) || m.ticketMedio || "N/A"}
• Taxa Conversão Lead→Venda: ${m.taxaConversao?.toFixed?.(1) || m.taxaConversao || "N/A"}%`;
  }

  if (data.channelMetrics?.length > 0) {
    formatted += "\n\nPERFORMANCE POR CANAL:";
    for (const ch of data.channelMetrics.slice(0, 10)) {
      formatted += `\n• ${ch.canal}: Invest R$ ${ch.investimento?.toLocaleString?.("pt-BR") || ch.investimento}, Vendas ${ch.vendas}, Receita R$ ${ch.receita?.toLocaleString?.("pt-BR") || ch.receita}, CPA R$ ${ch.cpa?.toFixed?.(0) || ch.cpa}, ROAS ${ch.roas?.toFixed?.(2) || ch.roas}x, Conv ${ch.taxaConversao?.toFixed?.(1) || ch.taxaConversao}%`;
    }
  }

  if (activeTab === "detailed" && data.campaignMetrics?.length > 0) {
    formatted += "\n\nMÉTRICAS POR CAMPANHA:";
    for (const c of data.campaignMetrics.slice(0, 10)) {
      formatted += `\n• ${c.campanha}: Invest R$ ${c.investimento?.toLocaleString?.("pt-BR") || c.investimento}, Leads ${c.leads}, Conv ${c.conversoes}, CPA R$ ${c.cpa?.toFixed?.(0) || c.cpa}, ROAS ${c.roas?.toFixed?.(2) || c.roas}x, CTR ${c.ctr?.toFixed?.(2) || c.ctr}%`;
    }
  }

  if (activeTab === "criativos") {
    if (data.creativeKPIs) {
      const k = data.creativeKPIs;
      formatted += `
KPIs DE CRIATIVOS:
• Investimento Total: R$ ${k.totalInvestimento?.toLocaleString?.("pt-BR") || k.totalInvestimento}
• Impressões: ${k.totalImpressions?.toLocaleString?.("pt-BR") || k.totalImpressions}
• Hook Rate Médio: ${k.avgHookRate?.toFixed?.(1) || k.avgHookRate}%
• Hold Rate Médio: ${k.avgHoldRate?.toFixed?.(1) || k.avgHoldRate}%
• Completion Rate: ${k.avgCompletionRate?.toFixed?.(1) || k.avgCompletionRate}%
• Leads: ${k.totalLeads}
• CPL Médio: R$ ${k.avgCpl?.toFixed?.(2) || k.avgCpl}
• CPM Médio: R$ ${k.avgCpm?.toFixed?.(2) || k.avgCpm}`;
    }
    if (data.topCreatives?.length > 0) {
      formatted += "\n\nTOP CRIATIVOS:";
      for (const cr of data.topCreatives.slice(0, 8)) {
        formatted += `\n• ${cr.displayName || cr.ads}: Spend R$ ${cr.totalSpend?.toLocaleString?.("pt-BR") || cr.totalSpend}, Hook ${cr.avgHookRate?.toFixed?.(1) || cr.avgHookRate}%, Hold ${cr.avgHoldRate?.toFixed?.(1) || cr.avgHoldRate}%, CPL R$ ${cr.avgCpl?.toFixed?.(2) || cr.avgCpl}, Leads ${cr.totalLeads}`;
      }
    }
  }

  if (activeTab === "ltv") {
    if (data.ltvMetrics) {
      const l = data.ltvMetrics;
      formatted += `
MÉTRICAS DE LTV:
• LTV Médio: R$ ${l.ltvMedio?.toFixed?.(2) || l.ltvMedio}
• Ticket Médio (mensalidade): R$ ${l.ticketMedio?.toFixed?.(2) || l.ticketMedio}
• Permanência Média: ${l.permanenciaMedia?.toFixed?.(1) || l.permanenciaMedia} meses
• Taxa de Churn: ${l.taxaChurn?.toFixed?.(1) || l.taxaChurn}%
• Retenção Mês 3: ${l.retencaoMes3?.toFixed?.(1) || l.retencaoMes3}%
• Total Alunos: ${l.totalAlunos}
• Ativos: ${l.alunosAtivos} | Cancelados: ${l.alunosCancelados} | Pausados: ${l.alunosPausados || 0}`;
    }
    if (data.channelLTV?.length > 0) {
      formatted += "\n\nLTV POR CANAL:";
      for (const ch of data.channelLTV.slice(0, 10)) {
        formatted += `\n• ${ch.canal}: ${ch.alunos} alunos, LTV R$ ${ch.ltv?.toFixed?.(0) || ch.ltv}, Churn ${ch.churnPercent?.toFixed?.(1) || ch.churnPercent}%, Permanência ${ch.permanenciaMedia?.toFixed?.(1) || ch.permanenciaMedia}m`;
      }
    }
  }

  return formatted || "Dados não disponíveis para esta aba no momento.";
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, dashboardContext, dashboardData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Montar bloco de contexto dinâmico com dados reais
    const tabNames: Record<string, string> = {
      macro: "Visão Macro",
      detailed: "Análise Micro",
      criativos: "Análise Nano (Criativos)",
      ltv: "Análise LTV",
    };

    const contextMessage = `
[CONTEXTO ATUAL DO DASHBOARD]
- Aba ativa: ${tabNames[dashboardContext?.activeTab] || dashboardContext?.activeTab || "desconhecida"}
- Período: ${dashboardContext?.dateRange?.from || "não definido"} a ${dashboardContext?.dateRange?.to || "não definido"}
- Filtros: Campanhas: ${dashboardContext?.filters?.campanhas?.join(", ") || "todos"}, Canais: ${dashboardContext?.filters?.canais?.join(", ") || "todos"}
- Granularidade: ${dashboardContext?.filters?.granularity || "dia"}

[DADOS REAIS DO DASHBOARD — VALORES QUE O USUÁRIO ESTÁ VENDO AGORA]
${formatDashboardData(dashboardContext?.activeTab, dashboardData)}

Use esses dados reais para responder perguntas. Quando o usuário perguntar sobre métricas, analise os números acima. Quando pedir resumos, baseie-se nesses valores.
`;

    // Montar mensagens para a IA
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextMessage },
      ...(messages?.slice(-20) || []),
    ];

    console.log("Calling Lovable AI Gateway with context:", dashboardContext?.activeTab);

    // Chamar a Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retornar stream direto para o frontend
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat AI error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar pergunta" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
