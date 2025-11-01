-- [ARCHIVED] Original migration preserved for history
-- This file has been superseded by 20251101090000_full_schema_refresh.sql

-- ========================================
-- 🔧 CORREÇÃO: Garantir colunas necessárias em appointments
-- ========================================

-- Adicionar coluna de motivo de cancelamento se não existir
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Adicionar índice para busca por status
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);

-- Adicionar índice para busca por data
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (appointment_date);

-- Comentários
COMMENT ON COLUMN public.appointments.cancellation_reason IS 'Motivo do cancelamento do agendamento';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Colunas de appointments verificadas e criadas se necessário (ARCHIVED)';
END $$;
