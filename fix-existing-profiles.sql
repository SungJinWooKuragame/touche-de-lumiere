-- ====================================
-- CORREÇÃO DE PERFIS EXISTENTES
-- ====================================
-- Este script corrige perfis que foram criados antes do trigger estar funcionando corretamente
-- e não têm full_name ou phone salvos na tabela profiles.

-- ⚠️ ATENÇÃO: Execute este script APENAS UMA VEZ após confirmar que o trigger está correto!

BEGIN;

-- Atualizar perfis que não têm full_name mas têm dados em auth.users
UPDATE public.profiles p
SET 
  full_name = COALESCE(au.raw_user_meta_data->>'full_name', ''),
  phone = COALESCE(au.raw_user_meta_data->>'phone', '')
FROM auth.users au
WHERE p.id = au.id
  AND (p.full_name IS NULL OR p.full_name = '' OR p.phone IS NULL OR p.phone = '');

-- Verificar quantos perfis foram atualizados
SELECT 
  COUNT(*) as total_perfis,
  COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as com_nome,
  COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as com_telefone
FROM public.profiles;

COMMIT;

-- ✅ Perfis existentes corrigidos!
-- Agora todos os perfis devem ter full_name e phone (se foram fornecidos no signup)
