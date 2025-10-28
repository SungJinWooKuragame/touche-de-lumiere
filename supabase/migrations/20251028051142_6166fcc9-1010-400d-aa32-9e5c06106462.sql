-- Prevent overlapping appointments and expose busy time slots per day
-- 1) Validation trigger to block overlapping intervals (considers service duration)
CREATE OR REPLACE FUNCTION public.prevent_overlapping_appointments()
RETURNS trigger AS $$
DECLARE
  new_duration INT;
BEGIN
  -- If cancelling, skip overlap checks
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Get the duration for the selected service
  SELECT s.duration_minutes INTO new_duration
  FROM public.services s
  WHERE s.id = NEW.service_id;

  IF new_duration IS NULL THEN
    RAISE EXCEPTION 'Serviço inválido para agendamento';
  END IF;

  -- Check overlap against existing non-cancelled appointments on the same date
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.services s2 ON s2.id = a.service_id
    WHERE a.appointment_date = NEW.appointment_date
      AND a.id IS DISTINCT FROM NEW.id
      AND a.status <> 'cancelled'
      AND NOT (
        (NEW.appointment_time + make_interval(mins => new_duration)) <= a.appointment_time
        OR NEW.appointment_time >= (a.appointment_time + make_interval(mins => s2.duration_minutes))
      )
  ) THEN
    RAISE EXCEPTION 'Horário indisponível: conflito com outro agendamento';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recreate trigger to ensure it's present and up-to-date
DROP TRIGGER IF EXISTS trg_prevent_overlapping_appointments ON public.appointments;
CREATE TRIGGER trg_prevent_overlapping_appointments
BEFORE INSERT OR UPDATE OF appointment_date, appointment_time, service_id, status
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_overlapping_appointments();

-- Helpful index for date filtering
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (appointment_date);

-- 2) Expose busy time ranges per day without revealing user data
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
    AND a.status <> 'cancelled';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_busy_time_slots(date) TO anon, authenticated;