-- Create the marketing data view with proper numeric conversions
CREATE OR REPLACE VIEW public.vw_marketing_data
WITH (security_invoker = true)
AS
SELECT 
  id,
  "Data" as data,
  canal,
  "Campaign Name" as campanha,
  "Grupo" as grupo_anuncio,
  -- Convert text fields to numeric, handling comma as decimal separator
  COALESCE(NULLIF(REPLACE(REPLACE("Impressões", '.', ''), ',', '.'), '')::numeric, 0)::integer as impressoes,
  COALESCE(NULLIF(REPLACE(REPLACE("Cliques", '.', ''), ',', '.'), '')::numeric, 0)::integer as cliques,
  COALESCE(NULLIF(REPLACE(REPLACE("Gasto", '.', ''), ',', '.'), '')::numeric, 0) as investimento,
  COALESCE(NULLIF(REPLACE(REPLACE("Leads", '.', ''), ',', '.'), '')::numeric, 0)::integer as leads,
  COALESCE(NULLIF(REPLACE(REPLACE("VENDAS", '.', ''), ',', '.'), '')::numeric, 0)::integer as conversoes,
  COALESCE(NULLIF(REPLACE(REPLACE("receita", '.', ''), ',', '.'), '')::numeric, 0) as receita
FROM public."Tabela_Objetivo"
WHERE "Data" IS NOT NULL;