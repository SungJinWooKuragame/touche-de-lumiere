-- ========================================
-- 🔧 CORREÇÃO: Adicionar colunas multilíngues na tabela services
-- ========================================
-- Esta migração garante que todas as colunas necessárias existam
-- Corrige erro: "Could not find the 'description_en' column of 'services' in the schema cache"

-- Adicionar colunas de nome multilíngue (se não existirem)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS name_pt TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS name_fr TEXT;

-- Adicionar colunas de descrição multilíngue (se não existirem)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS description_pt TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT;

-- Adicionar colunas de customização visual (se não existirem)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'sparkles',
ADD COLUMN IF NOT EXISTS icon_emoji TEXT,
ADD COLUMN IF NOT EXISTS hover_color TEXT DEFAULT '#3B82F6';

-- Migrar dados existentes para os campos de português (se ainda não foram migrados)
UPDATE public.services 
SET 
  name_pt = COALESCE(name_pt, name),
  description_pt = COALESCE(description_pt, description)
WHERE name_pt IS NULL OR description_pt IS NULL;

-- Criar ou substituir funções de tradução
CREATE OR REPLACE FUNCTION public.get_service_name(
  service_row public.services,
  language_code TEXT DEFAULT 'pt'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE language_code
    WHEN 'en' THEN
      RETURN COALESCE(service_row.name_en, service_row.name_pt, service_row.name);
    WHEN 'fr' THEN
      RETURN COALESCE(service_row.name_fr, service_row.name_pt, service_row.name);
    ELSE
      RETURN COALESCE(service_row.name_pt, service_row.name);
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_service_description(
  service_row public.services,
  language_code TEXT DEFAULT 'pt'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE language_code
    WHEN 'en' THEN
      RETURN COALESCE(service_row.description_en, service_row.description_pt, service_row.description);
    WHEN 'fr' THEN
      RETURN COALESCE(service_row.description_fr, service_row.description_pt, service_row.description);
    ELSE
      RETURN COALESCE(service_row.description_pt, service_row.description);
  END CASE;
END;
$$;

-- Criar ou substituir view multilíngue
DROP VIEW IF EXISTS public.services_multilingual CASCADE;
CREATE OR REPLACE VIEW public.services_multilingual AS
SELECT 
  s.*,
  COALESCE(s.name_pt, s.name) as display_name_pt,
  COALESCE(s.name_en, s.name_pt, s.name) as display_name_en,
  COALESCE(s.name_fr, s.name_pt, s.name) as display_name_fr,
  COALESCE(s.description_pt, s.description) as display_description_pt,
  COALESCE(s.description_en, s.description_pt, s.description) as display_description_en,
  COALESCE(s.description_fr, s.description_pt, s.description) as display_description_fr
FROM public.services s;

-- Garantir permissões
GRANT SELECT ON public.services_multilingual TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_name(public.services, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_description(public.services, TEXT) TO anon, authenticated;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_services_name_pt ON public.services (name_pt);
CREATE INDEX IF NOT EXISTS idx_services_name_en ON public.services (name_en);
CREATE INDEX IF NOT EXISTS idx_services_name_fr ON public.services (name_fr);

-- Adicionar comentários
COMMENT ON COLUMN public.services.name_pt IS 'Nome do serviço em português';
COMMENT ON COLUMN public.services.name_en IS 'Nome do serviço em inglês';
COMMENT ON COLUMN public.services.name_fr IS 'Nome do serviço em francês';
COMMENT ON COLUMN public.services.description_pt IS 'Descrição do serviço em português';
COMMENT ON COLUMN public.services.description_en IS 'Descrição do serviço em inglês';
COMMENT ON COLUMN public.services.description_fr IS 'Descrição do serviço em francês';
COMMENT ON COLUMN public.services.icon_name IS 'Nome do ícone Lucide para exibição';
COMMENT ON COLUMN public.services.icon_emoji IS 'Emoji alternativo ao ícone';
COMMENT ON COLUMN public.services.hover_color IS 'Cor hexadecimal para efeitos hover';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migração concluída: Colunas multilíngues adicionadas à tabela services';
END $$;
