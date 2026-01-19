-- Fix security: Enable RLS on tables and create policies
ALTER TABLE "Tabela_Objetivo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tabela_Geral_Leads" ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read marketing data
CREATE POLICY "Authenticated users can read marketing data"
ON "Tabela_Objetivo"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read leads data"
ON "Tabela_Geral_Leads"
FOR SELECT
TO authenticated
USING (true);

-- Drop and recreate VIEW with security_invoker for proper RLS
DROP VIEW IF EXISTS public.vw_marketing_data;

CREATE VIEW public.vw_marketing_data
WITH (security_invoker = true) AS
SELECT 
  "Date"::date as data,
  "Campaign Name" as campanha,
  "Grupo" as grupo_anuncio,
  canal,
  COALESCE(NULLIF(REPLACE(REPLACE("Gasto", '.', ''), ',', '.'), '')::numeric, 0) as investimento,
  COALESCE(NULLIF(REPLACE(REPLACE("Impressões", '.', ''), ',', '.'), '')::integer, 0) as impressoes,
  COALESCE(NULLIF(REPLACE(REPLACE("Cliques", '.', ''), ',', '.'), '')::integer, 0) as cliques,
  COALESCE("Leads", 0) as leads,
  COALESCE("VENDAS", 0) as conversoes,
  COALESCE(NULLIF(REPLACE(REPLACE("receita", '.', ''), ',', '.'), '')::numeric, 0) as receita
FROM "Tabela_Objetivo"
WHERE "Date" IS NOT NULL;