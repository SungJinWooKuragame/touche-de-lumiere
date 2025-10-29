-- ====================================
-- RESET COMPLETO - MANTÉM APENAS OWNER
-- Remove todos os dados exceto conta owner
-- ====================================

-- ATENÇÃO: Este script é DESTRUTIVO!
-- Execute apenas se tiver certeza!

BEGIN;

-- 1. Identificar o ID do owner
-- (Substitua pelo email do owner se necessário)
DO $$
DECLARE
  owner_id UUID;
BEGIN
  -- Buscar ID do owner pela role
  SELECT ur.user_id INTO owner_id
  FROM public.user_roles ur
  WHERE ur.role = 'owner'
  LIMIT 1;

  -- Se não encontrar owner por role, buscar pelo email
  -- Descomente e ajuste o email se necessário:
  -- IF owner_id IS NULL THEN
  --   SELECT id INTO owner_id
  --   FROM public.profiles
  --   WHERE email = 'seu-email-owner@example.com'
  --   LIMIT 1;
  -- END IF;

  -- Exibir owner que será mantido (para segurança)
  RAISE NOTICE 'Owner ID que será mantido: %', owner_id;

  -- 2. Deletar todos os agendamentos
  DELETE FROM public.appointments;
  RAISE NOTICE 'Todos os agendamentos foram removidos';

  -- 3. Deletar todos os serviços
  DELETE FROM public.services;
  RAISE NOTICE 'Todos os serviços foram removidos';

  -- 4. Deletar configurações do site
  DELETE FROM public.site_settings;
  RAISE NOTICE 'Configurações do site removidas';

  -- 5. Deletar configurações do Google Calendar
  DELETE FROM public.google_calendar_settings;
  RAISE NOTICE 'Configurações Google Calendar removidas';

  -- 6. Deletar horários de funcionamento
  DELETE FROM public.operating_hours;
  RAISE NOTICE 'Horários de funcionamento removidos';

  -- 7. Deletar roles de usuários que NÃO são owner
  DELETE FROM public.user_roles
  WHERE user_id != owner_id;
  RAISE NOTICE 'Roles de não-owners removidas';

  -- 8. Deletar perfis de usuários que NÃO são owner
  -- Isso também deletará os usuários do auth.users via CASCADE
  DELETE FROM public.profiles
  WHERE id != owner_id;
  RAISE NOTICE 'Usuários não-owners removidos';

  -- Verificação final
  RAISE NOTICE '====================================';
  RAISE NOTICE 'RESET CONCLUÍDO!';
  RAISE NOTICE 'Usuários restantes: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Owner ID mantido: %', owner_id;
  RAISE NOTICE '====================================';
END $$;

COMMIT;

-- ====================================
-- VERIFICAÇÃO PÓS-RESET
-- Execute estas queries separadamente para confirmar:
-- ====================================

-- Ver usuário owner mantido:
-- SELECT p.*, ur.role 
-- FROM public.profiles p
-- LEFT JOIN public.user_roles ur ON ur.user_id = p.id
-- WHERE ur.role = 'owner';

-- Contar registros restantes:
-- SELECT 
--   'Usuários' as tabela, COUNT(*) as total FROM public.profiles
-- UNION ALL
-- SELECT 'Roles', COUNT(*) FROM public.user_roles
-- UNION ALL
-- SELECT 'Agendamentos', COUNT(*) FROM public.appointments
-- UNION ALL
-- SELECT 'Serviços', COUNT(*) FROM public.services;