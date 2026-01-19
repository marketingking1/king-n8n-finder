-- Create VIEW to normalize marketing data with proper types
CREATE OR REPLACE VIEW public.vw_marketing_data AS
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

-- Create index on Date column for performance
CREATE INDEX IF NOT EXISTS idx_tabela_objetivo_date ON "Tabela_Objetivo" ("Date");