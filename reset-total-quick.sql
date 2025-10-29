-- RESET TOTAL RÁPIDO - Database completamente limpa
-- ⚠️ REMOVE TUDO incluindo owner!

BEGIN;

DELETE FROM public.appointments;
DELETE FROM public.services;
DELETE FROM public.site_settings;
DELETE FROM public.google_calendar_settings;
DELETE FROM public.operating_hours;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

COMMIT;

-- ✅ Banco zerado! Próximo passo:
-- 1. Criar nova conta na aplicação
-- 2. Promover a owner com:
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ((SELECT id FROM public.profiles WHERE email = 'seu-email@example.com'), 'owner'::app_role);
