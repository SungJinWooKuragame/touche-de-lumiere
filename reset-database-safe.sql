-- ====================================
-- RESET SEGURO DO BANCO DE DADOS
-- Preserva usuários confirmados e suas roles
-- Limpa todas as outras tabelas
-- ====================================

-- IMPORTANTE: Execute no SQL Editor do Supabase
-- Este script preserva:
-- ✅ auth.users (tabela do Supabase Auth)
-- ✅ public.profiles (dados dos usuários confirmados)
-- ✅ public.user_roles (roles dos usuários confirmados)

-- E limpa:
-- 🗑️ appointments (todos os agendamentos)
-- 🗑️ services (todos os serviços)
-- 🗑️ site_settings (configurações do site)
-- 🗑️ google_calendar_settings (configurações do Google Calendar)
-- 🗑️ operating_hours (horários de funcionamento)

BEGIN;

-- 1. Deletar todos os agendamentos
-- (cascata vai limpar relacionamentos)
DELETE FROM public.appointments;
RESET SEQUENCE ONLY;

-- 2. Deletar todos os serviços
-- (cascata vai limpar relacionamentos com appointments)
DELETE FROM public.services;
RESET SEQUENCE ONLY;

-- 3. Deletar configurações do site
DELETE FROM public.site_settings;
RESET SEQUENCE ONLY;

-- 4. Deletar configurações do Google Calendar
DELETE FROM public.google_calendar_settings;
RESET SEQUENCE ONLY;

-- 5. Deletar horários de funcionamento
DELETE FROM public.operating_hours;
RESET SEQUENCE ONLY;

-- 6. Recriar serviços padrão (opcional)
-- Descomente as linhas abaixo se quiser recriar os serviços básicos

/*
INSERT INTO public.services (
    name, name_pt, name_en, name_fr,
    description, description_pt, description_en, description_fr,
    duration_minutes, price, active,
    icon_name, hover_color
) VALUES
(
    'Massagem Relaxante', 'Massagem Relaxante', 'Relaxing Massage', 'Massage Relaxant',
    'Massagem completa para relaxamento profundo e alívio do estresse', 
    'Massagem completa para relaxamento profundo e alívio do estresse',
    'Complete massage for deep relaxation and stress relief',
    'Massage complet pour une relaxation profonde et un soulagement du stress',
    60, 80.00, true, 'heart', '#3B82F6'
),
(
    'Massagem Terapêutica', 'Massagem Terapêutica', 'Therapeutic Massage', 'Massage Thérapeutique',
    'Tratamento focado em dores musculares e tensões específicas',
    'Tratamento focado em dores musculares e tensões específicas',
    'Treatment focused on muscle pain and specific tensions',
    'Traitement axé sur les douleurs musculaires et les tensions spécifiques',
    75, 90.00, true, 'zap', '#10B981'
),
(
    'Reiki', 'Reiki', 'Reiki', 'Reiki',
    'Terapia energética para equilíbrio e bem-estar',
    'Terapia energética para equilíbrio e bem-estar',
    'Energy therapy for balance and well-being',
    'Thérapie énergétique pour l équilibre et le bien-être',
    45, 60.00, true, 'sparkles', '#8B5CF6'
),
(
    'Massagem + Reiki', 'Massagem + Reiki', 'Massage + Reiki', 'Massage + Reiki',
    'Combinação de massagem relaxante com sessão de Reiki',
    'Combinação de massagem relaxante com sessão de Reiki',
    'Combination of relaxing massage with Reiki session',
    'Combinaison de massage relaxant avec séance de Reiki',
    90, 120.00, true, 'star', '#F59E0B'
);
*/

-- 7. Recriar configurações básicas do site (opcional)
-- Descomente as linhas abaixo se quiser recriar as configurações

/*
INSERT INTO public.site_settings (key, value, description) VALUES
('hero_title_pt', 'Bem-estar para Corpo e Alma', 'Título principal em português'),
('hero_title_en', 'Wellness for Body and Soul', 'Main title in English'),
('hero_title_fr', 'Bien-être pour le Corps et l Âme', 'Titre principal en français'),
('hero_subtitle_pt', 'Massagens terapêuticas, relaxamento e Reiki para sua harmonia completa', 'Subtítulo em português'),
('hero_subtitle_en', 'Therapeutic massages, relaxation and Reiki for your complete harmony', 'Subtitle in English'),
('hero_subtitle_fr', 'Massages thérapeutiques, relaxation et Reiki pour votre harmonie complète', 'Sous-titre en français'),
('contact_phone', '+33 6 80 53 73 29', 'Número de telefone de contato'),
('contact_email', 'contact@touchedelumiere.fr', 'Email de contato'),
('contact_address', 'Paris, França', 'Endereço do estabelecimento');
*/

COMMIT;

-- ====================================
-- VERIFICAÇÃO FINAL
-- Execute estas queries para verificar o resultado:
-- ====================================

-- Contar usuários preservados:
-- SELECT COUNT(*) as usuarios_preservados FROM public.profiles;

-- Contar roles preservadas:
-- SELECT COUNT(*) as roles_preservadas FROM public.user_roles;

-- Verificar tabelas limpas:
-- SELECT COUNT(*) as appointments FROM public.appointments;
-- SELECT COUNT(*) as services FROM public.services;
-- SELECT COUNT(*) as site_settings FROM public.site_settings;

-- ====================================
-- ✅ RESET CONCLUÍDO COM SEGURANÇA!
-- ====================================