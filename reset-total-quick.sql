-- RESET TOTAL RÁPIDO - Database completamente limpa
-- ⚠️ REMOVE TUDO incluindo owner e contas de autenticação!

BEGIN;

-- Deletar dados das tabelas públicas
DELETE FROM public.appointments;
DELETE FROM public.services;
DELETE FROM public.site_settings;
DELETE FROM public.google_calendar_settings;
DELETE FROM public.operating_hours;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- Deletar TODOS os usuários da tabela de autenticação do Supabase
DELETE FROM auth.users;

COMMIT;

-- ✅ Banco zerado! Próximo passo:
-- 1. Criar nova conta na aplicação (signup)
-- 2. Promover a owner com:
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ((SELECT id FROM public.profiles WHERE email = 'seu-email@example.com'), 'owner'::app_role);

