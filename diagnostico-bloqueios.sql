-- =====================================================
-- 🔍 DIAGNÓSTICO COMPLETO - SISTEMA DE BLOQUEIOS
-- =====================================================
-- Execute este SQL no Supabase SQL Editor para verificar
-- se todas as tabelas e dados estão corretos
-- Data: 21/11/2025

-- =====================================================
-- 1️⃣ VERIFICAR SE TABELAS EXISTEM
-- =====================================================
SELECT 
  '1. VERIFICAÇÃO DE TABELAS' as secao,
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('operating_hours', 'date_blocks', 'site_settings', 'services', 'appointments', 'profiles')
ORDER BY table_name;

-- =====================================================
-- 2️⃣ HORÁRIOS DE FUNCIONAMENTO
-- =====================================================
SELECT 
  '2. HORÁRIOS DE FUNCIONAMENTO' as secao,
  day_of_week,
  CASE day_of_week
    WHEN 0 THEN '🌙 Domingo'
    WHEN 1 THEN '📅 Segunda'
    WHEN 2 THEN '📅 Terça'
    WHEN 3 THEN '📅 Quarta'
    WHEN 4 THEN '📅 Quinta'
    WHEN 5 THEN '📅 Sexta'
    WHEN 6 THEN '📅 Sábado'
  END as dia_semana,
  CASE WHEN is_open THEN '✅ Aberto' ELSE '❌ Fechado' END as status,
  COALESCE(open_time::text, '-') as abertura,
  COALESCE(close_time::text, '-') as fechamento
FROM public.operating_hours
ORDER BY day_of_week;

-- =====================================================
-- 3️⃣ BLOQUEIOS ATIVOS (FUTUROS + HOJE)
-- =====================================================
SELECT 
  '3. BLOQUEIOS ATIVOS' as secao,
  id,
  title as titulo,
  block_type as tipo,
  start_date as data_inicio,
  end_date as data_fim,
  COALESCE(start_time::text, 'DIA INTEIRO') as hora_inicio,
  COALESCE(end_time::text, 'DIA INTEIRO') as hora_fim,
  CASE 
    WHEN start_time IS NULL AND end_time IS NULL THEN '🌞 Bloqueio Dia Inteiro'
    ELSE '⏰ Bloqueio Parcial'
  END as tipo_bloqueio,
  created_at::date as criado_em
FROM public.date_blocks
WHERE end_date >= CURRENT_DATE
ORDER BY start_date, start_time NULLS FIRST;

-- =====================================================
-- 4️⃣ CONSULTAS FUTURAS (PRÓXIMOS 30 DIAS)
-- =====================================================
SELECT 
  '4. CONSULTAS FUTURAS' as secao,
  a.id,
  a.appointment_date as data,
  a.appointment_time as hora,
  a.status,
  p.full_name as cliente,
  p.phone as telefone,
  s.name as servico,
  s.duration_minutes as duracao_min,
  -- Verificar se existe bloqueio no mesmo dia
  (
    SELECT COUNT(*) 
    FROM public.date_blocks b
    WHERE a.appointment_date BETWEEN b.start_date AND b.end_date
  ) as bloqueios_conflitantes
FROM public.appointments a
LEFT JOIN public.profiles p ON p.id = a.client_id
LEFT JOIN public.services s ON s.id = a.service_id
WHERE a.status IN ('pending', 'confirmed')
  AND a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY a.appointment_date, a.appointment_time;

-- =====================================================
-- 5️⃣ VERIFICAR CONFLITOS CRÍTICOS
-- =====================================================
-- Consultas confirmadas que estão em períodos bloqueados
SELECT 
  '5. ⚠️ CONSULTAS EM PERÍODOS BLOQUEADOS' as secao,
  a.appointment_date as data_consulta,
  a.appointment_time as hora_consulta,
  p.full_name as cliente,
  a.status,
  b.title as bloqueio_titulo,
  b.start_date as bloqueio_inicio,
  b.end_date as bloqueio_fim,
  COALESCE(b.start_time::text, 'DIA INTEIRO') as bloqueio_hora_inicio,
  COALESCE(b.end_time::text, 'DIA INTEIRO') as bloqueio_hora_fim,
  '✅ CONSULTA MANTIDA (comportamento correto)' as observacao
FROM public.appointments a
INNER JOIN public.date_blocks b 
  ON a.appointment_date BETWEEN b.start_date AND b.end_date
LEFT JOIN public.profiles p ON p.id = a.client_id
WHERE a.status IN ('pending', 'confirmed')
  AND a.appointment_date >= CURRENT_DATE
ORDER BY a.appointment_date, a.appointment_time;

-- =====================================================
-- 6️⃣ ESTATÍSTICAS GERAIS
-- =====================================================
SELECT 
  '6. ESTATÍSTICAS DO SISTEMA' as secao,
  'Total de Serviços Ativos' as metrica,
  COUNT(*)::text as valor
FROM public.services WHERE active = true
UNION ALL
SELECT 
  '6. ESTATÍSTICAS DO SISTEMA',
  'Total de Consultas Futuras',
  COUNT(*)::text
FROM public.appointments 
WHERE status IN ('pending', 'confirmed') AND appointment_date >= CURRENT_DATE
UNION ALL
SELECT 
  '6. ESTATÍSTICAS DO SISTEMA',
  'Total de Bloqueios Ativos',
  COUNT(*)::text
FROM public.date_blocks WHERE end_date >= CURRENT_DATE
UNION ALL
SELECT 
  '6. ESTATÍSTICAS DO SISTEMA',
  'Dias com Atendimento na Semana',
  COUNT(*)::text
FROM public.operating_hours WHERE is_open = true
UNION ALL
SELECT 
  '6. ESTATÍSTICAS DO SISTEMA',
  'Total de Clientes Cadastrados',
  COUNT(DISTINCT client_id)::text
FROM public.appointments;

-- =====================================================
-- 7️⃣ VERIFICAR PERMISSÕES (GRANTS)
-- =====================================================
SELECT 
  '7. PERMISSÕES NAS TABELAS' as secao,
  schemaname as schema,
  tablename as tabela,
  string_agg(DISTINCT privilege_type, ', ') as permissoes
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
  AND schemaname = 'public'
  AND tablename IN ('operating_hours', 'date_blocks', 'site_settings', 'services', 'appointments')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- 8️⃣ VERIFICAR FUNÇÃO RPC get_busy_time_slots
-- =====================================================
SELECT 
  '8. FUNÇÃO RPC' as secao,
  routine_name as funcao,
  routine_type as tipo,
  data_type as retorno,
  CASE 
    WHEN routine_name = 'get_busy_time_slots' THEN '✅ Existe'
    ELSE '❌ Não encontrada'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_busy_time_slots';

-- =====================================================
-- 9️⃣ TESTE PRÁTICO - SIMULAR BUSCA DE HORÁRIOS OCUPADOS
-- =====================================================
-- Substitua '2025-11-25' pela data que você quer testar
SELECT 
  '9. TESTE: HORÁRIOS OCUPADOS EM 2025-11-25' as secao,
  start_time as hora_inicio,
  end_time as hora_fim,
  '❌ INDISPONÍVEL' as status
FROM public.get_busy_time_slots('2025-11-25'::date)
ORDER BY start_time;

-- =====================================================
-- 🎯 INTERPRETAÇÃO DOS RESULTADOS
-- =====================================================
-- 
-- ✅ TUDO OK SE:
-- 1. Seção 1: Todas as 6 tabelas existem
-- 2. Seção 2: 7 linhas (Domingo a Sábado) com horários configurados
-- 3. Seção 3: Seus bloqueios aparecem aqui
-- 4. Seção 4: Consultas futuras aparecem
-- 5. Seção 5: Se aparecer algo, é normal (consultas preservadas)
-- 6. Seção 7: Permissões incluem SELECT para anon e authenticated
-- 7. Seção 8: Função get_busy_time_slots existe
-- 
-- ⚠️ PROBLEMAS SE:
-- - Seção 1: Menos de 6 tabelas → Migration não foi executado
-- - Seção 2: Vazio ou menos de 7 linhas → operating_hours não populado
-- - Seção 7: Sem permissões → Grants faltando
-- - Seção 8: Função não existe → RPC não criado
-- 
-- =====================================================

-- 🔟 COMANDOS ÚTEIS DE LIMPEZA (CUIDADO!)
-- =====================================================
-- ⚠️ DESCOMENTE APENAS SE QUISER LIMPAR DADOS DE TESTE

-- Remover TODOS os bloqueios (use com cuidado!)
-- DELETE FROM public.date_blocks WHERE block_type = 'custom';

-- Resetar horários para padrão
-- DELETE FROM public.operating_hours;
-- INSERT INTO public.operating_hours(day_of_week, is_open, open_time, close_time) VALUES
--   (0, false, null, null),
--   (1, true,  '08:00', '18:00'),
--   (2, true,  '08:00', '18:00'),
--   (3, true,  '08:00', '18:00'),
--   (4, true,  '08:00', '18:00'),
--   (5, true,  '08:00', '18:00'),
--   (6, true,  '08:00', '12:00');
