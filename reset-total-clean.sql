-- ====================================
-- RESET TOTAL - LIMPA TODO O BANCO DE DADOS
-- Remove TODOS os dados incluindo owner
-- Mantém apenas a estrutura do banco
-- ====================================

-- ⚠️ ATENÇÃO MÁXIMA: Este script é EXTREMAMENTE DESTRUTIVO!
-- ⚠️ Remove TUDO, incluindo a conta owner!
-- ⚠️ Você precisará criar uma nova conta após executar!
-- ⚠️ Execute apenas se tiver certeza absoluta!

BEGIN;

-- 1. Deletar todos os agendamentos
DELETE FROM public.appointments;

-- 2. Deletar todos os serviços
DELETE FROM public.services;

-- 3. Deletar configurações do site
DELETE FROM public.site_settings;

-- 4. Deletar configurações do Google Calendar
DELETE FROM public.google_calendar_settings;

-- 5. Deletar horários de funcionamento
DELETE FROM public.operating_hours;

-- 6. Deletar TODAS as roles (incluindo owner)
DELETE FROM public.user_roles;

-- 7. Deletar TODOS os perfis (incluindo owner)
DELETE FROM public.profiles;

-- 8. Deletar TODOS os usuários da tabela de autenticação
-- IMPORTANTE: Isso remove as contas de login do Supabase Auth
DELETE FROM auth.users;

COMMIT;

-- ====================================
-- VERIFICAÇÃO PÓS-RESET
-- Execute para confirmar que tudo foi limpo:
-- ====================================

-- SELECT 
--   'Usuários' as tabela, COUNT(*) as total FROM public.profiles
-- UNION ALL
-- SELECT 'Roles', COUNT(*) FROM public.user_roles
-- UNION ALL
-- SELECT 'Agendamentos', COUNT(*) FROM public.appointments
-- UNION ALL
-- SELECT 'Serviços', COUNT(*) FROM public.services
-- UNION ALL
-- SELECT 'Configurações', COUNT(*) FROM public.site_settings;

-- ====================================
-- RESULTADO ESPERADO:
-- Todas as contagens devem ser 0
-- ====================================

-- ====================================
-- PRÓXIMOS PASSOS APÓS RESET:
-- ====================================
-- 1. Criar uma nova conta de usuário na aplicação
-- 2. No SQL Editor, promover o novo usuário a owner:
--
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES (
--      (SELECT id FROM public.profiles WHERE email = 'seu-novo-email@example.com'),
--      'owner'::app_role
--    );
--
-- 3. Fazer logout e login novamente para aplicar a role
-- 4. Acessar o painel admin e configurar serviços
-- ====================================
