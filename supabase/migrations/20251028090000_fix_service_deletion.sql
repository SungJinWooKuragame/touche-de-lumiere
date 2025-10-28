-- Permitir deleção de serviços mesmo com agendamentos vinculados
-- Esta migração modifica o constraint para permitir SET NULL quando um serviço é deletado

-- Primeiro, remover o constraint existente
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_service_id_fkey;

-- Adicionar novo constraint com ON DELETE SET NULL
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_service_id_fkey 
FOREIGN KEY (service_id) 
REFERENCES public.services(id) 
ON DELETE SET NULL;

-- Permitir service_id ser NULL
ALTER TABLE public.appointments 
ALTER COLUMN service_id DROP NOT NULL;

-- Adicionar coluna para armazenar nome do serviço quando deletado
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS deleted_service_name TEXT;

-- Função para preservar nome do serviço antes da deleção
CREATE OR REPLACE FUNCTION public.preserve_service_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar appointments com o nome do serviço antes de deletar
  UPDATE public.appointments 
  SET deleted_service_name = OLD.name
  WHERE service_id = OLD.id AND deleted_service_name IS NULL;
  
  RETURN OLD;
END;
$$;

-- Trigger para preservar nome do serviço
DROP TRIGGER IF EXISTS preserve_service_name_trigger ON public.services;
CREATE TRIGGER preserve_service_name_trigger
  BEFORE DELETE ON public.services
  FOR EACH ROW 
  EXECUTE FUNCTION public.preserve_service_name();

-- View para mostrar agendamentos com nome do serviço (ativo ou deletado)
CREATE OR REPLACE VIEW public.appointments_with_service AS
SELECT 
  a.*,
  COALESCE(s.name, a.deleted_service_name, 'Serviço Removido') as service_name,
  s.duration_minutes,
  s.price as service_price
FROM public.appointments a
LEFT JOIN public.services s ON a.service_id = s.id;

-- Garantir permissões
GRANT SELECT ON public.appointments_with_service TO anon, authenticated;