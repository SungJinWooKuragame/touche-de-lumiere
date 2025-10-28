-- Adicionar configurações do Google Calendar ao site_settings
-- Esta migração adiciona campos para armazenar credenciais da API do Google Calendar

-- Adicionar colunas para configurações do Google Calendar
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS google_client_id TEXT,
ADD COLUMN IF NOT EXISTS google_client_secret TEXT,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_calendar_email TEXT;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_site_settings_google_connected 
ON public.site_settings (google_calendar_connected);

-- Função para verificar se Google Calendar está configurado
CREATE OR REPLACE FUNCTION public.is_google_calendar_configured()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT google_calendar_connected 
     FROM public.site_settings 
     WHERE id = 1), 
    FALSE
  )
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.is_google_calendar_configured() TO authenticated;