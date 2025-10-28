-- Adicionar campos multilíngues para serviços
-- Esta migração adiciona suporte para nomes e descrições em múltiplos idiomas

-- Adicionar colunas para traduções de nome
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS name_pt TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT, 
ADD COLUMN IF NOT EXISTS name_fr TEXT;

-- Adicionar colunas para traduções de descrição
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS description_pt TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT;

-- Migrar dados existentes para o campo português (assumindo que os dados atuais estão em português)
UPDATE public.services 
SET 
  name_pt = name,
  description_pt = description
WHERE name_pt IS NULL OR description_pt IS NULL;

-- Função para obter nome do serviço no idioma especificado
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

-- Função para obter descrição do serviço no idioma especificado
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

-- View para facilitar consultas multilíngues
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