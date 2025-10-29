-- RESET RÁPIDO - Cole no SQL Editor do Supabase
-- Preserva usuários confirmados, limpa todo o resto

BEGIN;

-- Limpar agendamentos
DELETE FROM public.appointments;

-- Limpar serviços  
DELETE FROM public.services;

-- Limpar configurações
DELETE FROM public.site_settings;
DELETE FROM public.google_calendar_settings;
DELETE FROM public.operating_hours;

COMMIT;

-- Verificação (execute separadamente):
-- SELECT 'Usuários preservados:' as info, COUNT(*) as total FROM public.profiles
-- UNION ALL
-- SELECT 'Agendamentos removidos:', COUNT(*) FROM public.appointments
-- UNION ALL  
-- SELECT 'Serviços removidos:', COUNT(*) FROM public.services;