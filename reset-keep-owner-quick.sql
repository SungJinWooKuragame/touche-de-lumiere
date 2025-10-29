-- RESET RÁPIDO - Mantém apenas OWNER
-- Cole no SQL Editor do Supabase

BEGIN;

-- Deletar todos os agendamentos
DELETE FROM public.appointments;

-- Deletar todos os serviços  
DELETE FROM public.services;

-- Deletar configurações
DELETE FROM public.site_settings;
DELETE FROM public.google_calendar_settings;
DELETE FROM public.operating_hours;

-- Deletar usuários que NÃO são owner (mantém apenas owner)
DELETE FROM public.profiles
WHERE id NOT IN (
  SELECT user_id FROM public.user_roles WHERE role = 'owner'
);

-- Deletar roles de não-owners
DELETE FROM public.user_roles
WHERE role != 'owner';

COMMIT;

-- ✅ VERIFICAÇÃO (execute separadamente):
-- SELECT 'Total de usuários:' as info, COUNT(*) as total FROM public.profiles
-- UNION ALL
-- SELECT 'Usuário owner mantido:', email FROM public.profiles WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'owner');