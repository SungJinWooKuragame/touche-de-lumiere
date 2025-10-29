-- Adicionar campos de customização na tabela services
-- Execute este comando no SQL Editor do Supabase

ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'sparkles',
ADD COLUMN IF NOT EXISTS icon_emoji TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hover_color TEXT DEFAULT '#3B82F6';

-- Comentários para documentação
COMMENT ON COLUMN public.services.icon_name IS 'Nome do ícone Lucide para display';
COMMENT ON COLUMN public.services.icon_emoji IS 'Emoji opcional como alternativa ao ícone';
COMMENT ON COLUMN public.services.hover_color IS 'Cor hex para efeitos de hover';

-- Atualizar serviços existentes com ícones baseados no nome
UPDATE public.services 
SET icon_name = CASE 
  WHEN LOWER(name) LIKE '%relax%' OR LOWER(name_pt) LIKE '%relax%' THEN 'heart'
  WHEN LOWER(name) LIKE '%terap%' OR LOWER(name_pt) LIKE '%terap%' THEN 'zap'
  WHEN LOWER(name) LIKE '%reiki%' THEN 'sparkles'
  WHEN LOWER(name) LIKE '%combo%' OR LOWER(name) LIKE '%combina%' THEN 'star'
  ELSE 'sparkles'
END
WHERE icon_name = 'sparkles' OR icon_name IS NULL;