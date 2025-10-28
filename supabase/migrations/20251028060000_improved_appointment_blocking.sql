-- Melhoria no sistema de bloqueio de horários
-- Esta migração adiciona melhorias no controle de conflitos de agendamentos

-- Função melhorada para verificar sobreposições
CREATE OR REPLACE FUNCTION public.prevent_overlapping_appointments()
RETURNS trigger AS $$
DECLARE
  new_duration INT;
  new_start_timestamp TIMESTAMP;
  new_end_timestamp TIMESTAMP;
  conflict_count INT;
BEGIN
  -- Se estiver cancelando ou excluindo, pular verificações
  IF NEW.status = 'cancelled' OR TG_OP = 'DELETE' THEN
    RETURN NEW;
  END IF;

  -- Obter a duração do serviço selecionado
  SELECT s.duration_minutes INTO new_duration
  FROM public.services s
  WHERE s.id = NEW.service_id;

  IF new_duration IS NULL THEN
    RAISE EXCEPTION 'Serviço inválido para agendamento';
  END IF;

  -- Criar timestamps completos para verificação
  new_start_timestamp := NEW.appointment_date + NEW.appointment_time;
  new_end_timestamp := new_start_timestamp + make_interval(mins => new_duration);

  -- Verificar conflitos com agendamentos existentes não-cancelados
  SELECT COUNT(*) INTO conflict_count
  FROM public.appointments a
  JOIN public.services s ON s.id = a.service_id
  WHERE a.appointment_date = NEW.appointment_date
    AND a.id IS DISTINCT FROM NEW.id
    AND a.status NOT IN ('cancelled', 'rejected')
    AND NOT (
      new_end_timestamp <= (a.appointment_date + a.appointment_time)
      OR new_start_timestamp >= (a.appointment_date + a.appointment_time + make_interval(mins => s.duration_minutes))
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Horário indisponível: conflito com outro agendamento. Escolha um horário diferente.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recriar trigger
DROP TRIGGER IF EXISTS trg_prevent_overlapping_appointments ON public.appointments;
CREATE TRIGGER trg_prevent_overlapping_appointments
BEFORE INSERT OR UPDATE OF appointment_date, appointment_time, service_id, status
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_overlapping_appointments();

-- Função melhorada para obter horários ocupados
CREATE OR REPLACE FUNCTION public.get_busy_time_slots(p_date date)
RETURNS TABLE (start_time time without time zone, end_time time without time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.appointment_time AS start_time,
         (a.appointment_time + make_interval(mins => s.duration_minutes))::time AS end_time
  FROM public.appointments a
  JOIN public.services s ON s.id = a.service_id
  WHERE a.appointment_date = p_date
    AND a.status NOT IN ('cancelled', 'rejected')
  ORDER BY a.appointment_time;
END;
$$;

-- Adicionar função para verificar disponibilidade de horário específico
CREATE OR REPLACE FUNCTION public.is_time_slot_available(
  p_date date,
  p_time time,
  p_service_id uuid,
  p_exclude_appointment_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_duration INT;
  slot_start_timestamp TIMESTAMP;
  slot_end_timestamp TIMESTAMP;
  conflict_count INT;
BEGIN
  -- Obter duração do serviço
  SELECT duration_minutes INTO service_duration
  FROM public.services
  WHERE id = p_service_id AND active = true;

  IF service_duration IS NULL THEN
    RETURN false;
  END IF;

  -- Criar timestamps do slot solicitado
  slot_start_timestamp := p_date + p_time;
  slot_end_timestamp := slot_start_timestamp + make_interval(mins => service_duration);

  -- Verificar conflitos
  SELECT COUNT(*) INTO conflict_count
  FROM public.appointments a
  JOIN public.services s ON s.id = a.service_id
  WHERE a.appointment_date = p_date
    AND a.id IS DISTINCT FROM p_exclude_appointment_id
    AND a.status NOT IN ('cancelled', 'rejected')
    AND NOT (
      slot_end_timestamp <= (a.appointment_date + a.appointment_time)
      OR slot_start_timestamp >= (a.appointment_date + a.appointment_time + make_interval(mins => s.duration_minutes))
    );

  RETURN conflict_count = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_time_slot_available(date, time, uuid, uuid) TO anon, authenticated;

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments (appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON public.appointments (appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services (active) WHERE active = true;