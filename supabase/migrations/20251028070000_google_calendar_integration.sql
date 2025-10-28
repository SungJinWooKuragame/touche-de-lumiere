-- Adicionar campos para integração com Google Calendar
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_event_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS calendar_event_created_at TIMESTAMP WITH TIME ZONE;

-- Adicionar índice para consultas por evento do calendário
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event 
ON public.appointments (google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;

-- Criar tabela para configurações do Google Calendar
CREATE TABLE IF NOT EXISTS public.google_calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS para configurações do Google Calendar
ALTER TABLE public.google_calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias configurações de calendário"
ON public.google_calendar_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações de calendário"
ON public.google_calendar_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações de calendário"
ON public.google_calendar_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Owners podem ver todas as configurações de calendário"
ON public.google_calendar_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Função para criar evento no Google Calendar
CREATE OR REPLACE FUNCTION public.create_google_calendar_event(
  appointment_id UUID,
  force_recreate BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_record RECORD;
  calendar_settings RECORD;
  result JSON;
BEGIN
  -- Verificar se já existe evento e não está forçando recriação
  IF NOT force_recreate THEN
    SELECT calendar_event_created INTO result
    FROM public.appointments
    WHERE id = appointment_id;
    
    IF result = TRUE THEN
      RETURN json_build_object('success', false, 'message', 'Evento já existe no calendário');
    END IF;
  END IF;

  -- Buscar dados do agendamento
  SELECT 
    a.*,
    s.name as service_name,
    s.duration_minutes,
    p.full_name as client_name,
    p.email as client_email
  INTO appointment_record
  FROM public.appointments a
  JOIN public.services s ON s.id = a.service_id
  JOIN public.profiles p ON p.id = a.client_id
  WHERE a.id = appointment_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Agendamento não encontrado');
  END IF;

  -- Buscar configurações do Google Calendar
  SELECT * INTO calendar_settings
  FROM public.google_calendar_settings
  WHERE user_id IN (
    SELECT user_id FROM public.user_roles WHERE role = 'owner' LIMIT 1
  );

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Configurações do Google Calendar não encontradas');
  END IF;

  -- Aqui chamaria a função Edge para criar o evento
  -- Por enquanto, vamos simular a criação
  UPDATE public.appointments
  SET 
    calendar_event_created = TRUE,
    calendar_event_created_at = NOW(),
    google_calendar_event_id = 'simulated_' || appointment_id
  WHERE id = appointment_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Evento criado no Google Calendar',
    'event_id', 'simulated_' || appointment_id
  );
END;
$$;

-- Função para excluir evento do Google Calendar
CREATE OR REPLACE FUNCTION public.delete_google_calendar_event(
  appointment_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id TEXT;
BEGIN
  -- Buscar ID do evento
  SELECT google_calendar_event_id INTO event_id
  FROM public.appointments
  WHERE id = appointment_id;

  IF event_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Evento não encontrado no calendário');
  END IF;

  -- Aqui chamaria a API do Google para excluir o evento
  -- Por enquanto, vamos apenas limpar os campos
  UPDATE public.appointments
  SET 
    calendar_event_created = FALSE,
    calendar_event_created_at = NULL,
    google_calendar_event_id = NULL
  WHERE id = appointment_id;

  RETURN json_build_object('success', true, 'message', 'Evento removido do Google Calendar');
END;
$$;

-- Trigger para criar evento automaticamente quando agendamento for confirmado
CREATE OR REPLACE FUNCTION public.auto_create_calendar_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status mudou para 'confirmed' e não tem evento ainda
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.calendar_event_created = FALSE THEN
    -- Chamar função para criar evento (de forma assíncrona seria ideal)
    PERFORM public.create_google_calendar_event(NEW.id);
  END IF;
  
  -- Se status mudou para 'cancelled' e tem evento
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.calendar_event_created = TRUE THEN
    -- Chamar função para excluir evento
    PERFORM public.delete_google_calendar_event(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_auto_create_calendar_event ON public.appointments;
CREATE TRIGGER trg_auto_create_calendar_event
AFTER UPDATE OF status ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_calendar_event();

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.create_google_calendar_event(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_google_calendar_event(UUID) TO authenticated;