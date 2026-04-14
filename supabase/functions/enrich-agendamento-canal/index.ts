import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

// Tag -> Canal mapping
function tagToCanal(tagName: string): string | null {
  const t = tagName.toLowerCase();
  if (t.includes('cadastro_meta') || t.includes('meta_ads') || t === 'meta ads') return 'Meta Ads';
  if (t.includes('linkedin') || t.includes('mql + linkedin') || t.includes('mql, linkedin')) return 'LinkedIn';
  if (t.includes('google ads') || t.includes('mql + google ads') || t.includes('mql, google ads')) return 'Google Ads';
  if (t.includes('orgânico') || t.includes('organico') || t.includes('seo') || t.includes('lead organico') || t.includes('teste nivelamento')) return 'Orgânico';
  if (t.includes('indicação') || t.includes('indicacao')) return 'Indicação';
  return null;
}

// Extract canal from an array of tags
function canalFromTags(tags: { id?: number; name: string }[]): string | null {
  for (const tag of tags) {
    const canal = tagToCanal(tag.name);
    if (canal) return canal;
  }
  return null;
}

interface AgendamentoRow {
  id: number;
  sync_kommo_lead_id: number | null;
  telefone: string | null;
  email: string | null;
  nome: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const kommoToken = Deno.env.get("KOMMO_ACCESS_TOKEN") ?? Deno.env.get("KOMMO_API_TOKEN");
    const kommoUrlRaw = Deno.env.get("KOMMO_BASE_URL") || "https://kingoflanguages.kommo.com";
    const kommoUrl = kommoUrlRaw.replace(/\/$/, "").endsWith("/api/v4")
      ? kommoUrlRaw.replace(/\/$/, "")
      : `${kommoUrlRaw.replace(/\/$/, "")}/api/v4`;

    if (!kommoToken) {
      return new Response(JSON.stringify({ error: "Missing KOMMO_ACCESS_TOKEN" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional params
    let mesFilter: string | null = null;
    try {
      const body = await req.json();
      if (body.mes && body.ano) {
        const m = String(body.mes).padStart(2, '0');
        mesFilter = `${body.ano}-${m}`;
      }
    } catch {
      // No body — default to current month
      const now = new Date();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      mesFilter = `${now.getFullYear()}-${m}`;
    }

    // 1. Fetch agendamentos where canal IS NULL
    let query = supabase
      .from("Dados_Agendamento_Plataforma")
      .select("id, sync_kommo_lead_id, telefone, email, nome")
      .is("canal", null);

    if (mesFilter) {
      const startDate = `${mesFilter}-01`;
      const [y, mo] = mesFilter.split('-').map(Number);
      const endDate = new Date(y, mo, 0); // last day of month
      const endStr = `${y}-${String(mo).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
      query = query.gte("dataAulaExperimental", startDate).lte("dataAulaExperimental", endStr);
    }

    const { data: agendamentos, error: agErr } = await query;
    if (agErr) throw new Error(`Fetch agendamentos: ${agErr.message}`);
    if (!agendamentos || agendamentos.length === 0) {
      return new Response(JSON.stringify({ message: "No agendamentos to enrich", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = agendamentos as AgendamentoRow[];
    const stats = { total: rows.length, kommo_batch: 0, kommo_search: 0, leads_fallback: 0, no_match: 0 };

    // ============================================
    // BATCH 1: Kommo API by sync_kommo_lead_id
    // ============================================
    const withKommoId = rows.filter(r => r.sync_kommo_lead_id !== null);

    // Collect unique lead IDs
    const uniqueLeadIds = [...new Set(withKommoId.map(r => r.sync_kommo_lead_id!))];
    const leadIdToCanal = new Map<number, string>();

    // Fetch in batches of 50
    for (let i = 0; i < uniqueLeadIds.length; i += 50) {
      const batch = uniqueLeadIds.slice(i, i + 50);
      const params = batch.map(id => `id[]=${id}`).join('&');
      const url = `${kommoUrl}/leads?${params}&with=contacts`;

      try {
        const res = await fetchWithTimeout(url, {
          headers: { Authorization: `Bearer ${kommoToken}` },
        });

        if (res.status === 204) continue;
        if (!res.ok) {
          console.error(`Kommo API error ${res.status}: ${await res.text()}`);
          continue;
        }

        const data = await res.json();
        const leads = data?._embedded?.leads || [];

        for (const lead of leads) {
          const tags = lead._embedded?.tags || lead.tags || [];
          const canal = canalFromTags(tags);
          if (canal) {
            leadIdToCanal.set(lead.id, canal);
          }
        }
      } catch (err) {
        console.error(`Batch error at offset ${i}:`, err);
      }

      // Rate limit: 150ms between batches
      if (i + 50 < uniqueLeadIds.length) await delay(150);
    }

    // Update agendamentos with canal from Kommo leads
    const kommoUpdates: { id: number; canal: string }[] = [];
    for (const row of withKommoId) {
      const canal = leadIdToCanal.get(row.sync_kommo_lead_id!);
      if (canal) {
        kommoUpdates.push({ id: row.id, canal });
      }
    }

    // Batch update grouped by canal
    const byCanalMap = new Map<string, number[]>();
    for (const u of kommoUpdates) {
      const arr = byCanalMap.get(u.canal) || [];
      arr.push(u.id);
      byCanalMap.set(u.canal, arr);
    }
    for (const [canal, canalIds] of byCanalMap) {
      // Update in chunks of 100 IDs
      for (let i = 0; i < canalIds.length; i += 100) {
        const chunk = canalIds.slice(i, i + 100);
        const { error } = await supabase
          .from("Dados_Agendamento_Plataforma")
          .update({ canal })
          .in("id", chunk);
        if (error) console.error(`Update error for canal ${canal}:`, error);
      }
    }
    stats.kommo_batch = kommoUpdates.length;

    // Track which rows still need canal
    const updatedIds = new Set(kommoUpdates.map(u => u.id));
    const stillPending = rows.filter(r => !updatedIds.has(r.id));

    // ============================================
    // BATCH 2: Kommo API search by email/name
    // ============================================
    const pendingWithoutKommo = stillPending.filter(r => r.sync_kommo_lead_id === null);
    const kommoSearchUpdates: { id: number; canal: string }[] = [];

    for (const row of pendingWithoutKommo) {
      const searchQuery = row.email || row.nome;
      if (!searchQuery) continue;

      try {
        const encoded = encodeURIComponent(searchQuery);
        const res = await fetchWithTimeout(
          `${kommoUrl}/contacts?query=${encoded}&with=leads`,
          { headers: { Authorization: `Bearer ${kommoToken}` } }
        );

        if (res.status === 204) continue;
        if (!res.ok) continue;

        const data = await res.json();
        const contacts = data?._embedded?.contacts || [];

        if (contacts.length === 0) continue;

        // Get the first contact's lead
        const contact = contacts[0];
        const leadLinks = contact._embedded?.leads || [];
        if (leadLinks.length === 0) continue;

        const leadId = leadLinks[0].id;
        // Fetch this lead to get tags
        const leadRes = await fetchWithTimeout(
          `${kommoUrl}/leads/${leadId}`,
          { headers: { Authorization: `Bearer ${kommoToken}` } }
        );

        if (!leadRes.ok) continue;

        const leadData = await leadRes.json();
        const tags = leadData._embedded?.tags || leadData.tags || [];
        const canal = canalFromTags(tags);

        if (canal) {
          kommoSearchUpdates.push({ id: row.id, canal });
        }
      } catch (err) {
        console.error(`Search error for row ${row.id}:`, err);
      }

      await delay(150); // Rate limit
    }

    // Apply search updates
    for (const u of kommoSearchUpdates) {
      await supabase
        .from("Dados_Agendamento_Plataforma")
        .update({ canal: u.canal })
        .eq("id", u.id);
    }
    stats.kommo_search = kommoSearchUpdates.length;

    // ============================================
    // BATCH 3: Fallback — match via leads table (SQL)
    // ============================================
    let monthStart: string | null = null;
    let monthEnd: string | null = null;
    if (mesFilter) {
      monthStart = `${mesFilter}-01`;
      const [y, mo] = mesFilter.split('-').map(Number);
      const endDate = new Date(y, mo, 0);
      monthEnd = `${y}-${String(mo).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
    }

    const { data: fallbackResult } = await supabase.rpc('enrich_canal_from_leads', {
      p_month_start: monthStart,
      p_month_end: monthEnd,
    });
    stats.leads_fallback = fallbackResult ?? 0;

    stats.no_match = rows.length - stats.kommo_batch - stats.kommo_search - stats.leads_fallback;

    return new Response(JSON.stringify({
      message: "Enrichment complete",
      stats,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
