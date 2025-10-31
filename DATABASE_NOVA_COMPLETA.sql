-- ========================================
-- CRIAR DATABASE NOVA - TOUCHE DE LUMIÈRE
-- ========================================
-- Execute este script após deletar e recriar o projeto no Supabase
-- ⚠️ Para usar: Delete o projeto atual → Crie novo projeto → Execute este script

-- ========================================
-- 1. TIPOS PERSONALIZADOS
-- ========================================
CREATE TYPE public.app_role AS ENUM ('owner', 'client');

-- ========================================
-- 2. TABELAS PRINCIPAIS
-- ========================================

-- Tabela de perfis dos usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de roles dos usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Tabela de serviços
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- 3. TABELAS DE SISTEMA DE EMAILS
-- ========================================

-- Log de emails de autenticação
CREATE TABLE public.auth_email_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  language VARCHAR(5) DEFAULT 'pt',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuração de templates de email
CREATE TABLE public.email_template_config (
  id SERIAL PRIMARY KEY,
  template_type VARCHAR(50) NOT NULL,
  language VARCHAR(5) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  sender_name VARCHAR(100) DEFAULT 'Touche de Lumière',
  sender_email VARCHAR(100) DEFAULT 'noreply@touchedelumiere.com',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_type, language)
);

-- ========================================
-- 4. FUNÇÕES IMPORTANTES
-- ========================================

-- Função para criar perfil do usuário (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir perfil com TODOS os dados dos metadados
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Atribuir role de cliente por padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

-- Função para logs de email personalizado
CREATE OR REPLACE FUNCTION public.handle_auth_email_custom()
RETURNS TRIGGER AS $$
DECLARE
  user_language text := 'pt';
  user_name text := '';
BEGIN
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_language := COALESCE(NEW.raw_user_meta_data->>'language', 'pt');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  END IF;

  INSERT INTO public.auth_email_logs (user_id, email, event_type, language, created_at)
  VALUES (NEW.id, NEW.email, TG_OP, user_language, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para buscar configuração de templates
CREATE OR REPLACE FUNCTION public.get_email_template_config(
  template_type_param VARCHAR(50),
  language_param VARCHAR(5) DEFAULT 'pt'
)
RETURNS TABLE (
  subject VARCHAR(500),
  sender_name VARCHAR(100),
  sender_email VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    etc.subject,
    etc.sender_name,
    etc.sender_email
  FROM public.email_template_config etc
  WHERE etc.template_type = template_type_param 
    AND etc.language = language_param
    AND etc.is_active = true
  LIMIT 1;
  
  -- Fallback para português se não encontrar o idioma
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      etc.subject,
      etc.sender_name,
      etc.sender_email
    FROM public.email_template_config etc
    WHERE etc.template_type = template_type_param 
      AND etc.language = 'pt'
      AND etc.is_active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ========================================
-- 5. TRIGGERS
-- ========================================

-- Trigger para criar perfil quando usuário se registra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para log de emails personalizados
CREATE TRIGGER trigger_auth_email_custom
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_email_custom();

-- Triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ========================================
-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_config ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. POLÍTICAS DE SEGURANÇA (RLS POLICIES)
-- ========================================

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Políticas para user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Políticas para services
CREATE POLICY "Anyone can view active services" ON public.services
FOR SELECT USING (active = true);

CREATE POLICY "Owner can manage services" ON public.services
FOR ALL USING (public.has_role(auth.uid(), 'owner'));

-- Políticas para appointments
CREATE POLICY "Clients can view their own appointments" ON public.appointments
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can create appointments" ON public.appointments
FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Owner can view all appointments" ON public.appointments
FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update appointments" ON public.appointments
FOR UPDATE USING (public.has_role(auth.uid(), 'owner'));

-- Políticas para auth_email_logs
CREATE POLICY "Owner can view auth email logs" ON public.auth_email_logs
FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

-- Políticas para email_template_config
CREATE POLICY "Anyone can read email template config" ON public.email_template_config
FOR SELECT USING (true);

CREATE POLICY "Owner can manage email template config" ON public.email_template_config
FOR ALL USING (public.has_role(auth.uid(), 'owner'));

-- ========================================
-- 8. PERMISSÕES
-- ========================================

GRANT SELECT ON public.auth_email_logs TO authenticated;
GRANT SELECT ON public.email_template_config TO authenticated;
GRANT ALL ON public.email_template_config TO service_role;
GRANT ALL ON public.auth_email_logs TO service_role;

-- ========================================
-- 9. DADOS INICIAIS
-- ========================================

-- Inserir serviços padrão
INSERT INTO public.services (name, description, duration_minutes, price) VALUES
  ('Massagem Relaxante', 'Massagem completa para relaxamento profundo e alívio do estresse', 60, 150.00),
  ('Massagem Terapêutica', 'Tratamento focado em dores musculares e tensões específicas', 60, 180.00),
  ('Reiki', 'Terapia energética para equilíbrio e bem-estar', 45, 120.00),
  ('Massagem + Reiki', 'Combinação de massagem relaxante com sessão de Reiki', 90, 250.00);

-- Inserir templates de email multilíngues
INSERT INTO public.email_template_config (template_type, language, subject, sender_name, sender_email) VALUES
-- Templates de cadastro
('signup', 'pt', '✨ Confirme seu cadastro - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),
('signup', 'en', '✨ Confirm your signup - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),
('signup', 'fr', '✨ Confirmez votre inscription - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),

-- Templates de reset de senha
('reset_password', 'pt', '🔐 Redefinir Senha - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),
('reset_password', 'en', '🔐 Reset Password - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),
('reset_password', 'fr', '🔐 Réinitialiser le mot de passe - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com');

-- ========================================
-- 🎉 DATABASE CRIADA COM SUCESSO!
-- ========================================
-- 
-- ✅ Funcionalidades implementadas:
-- • Sistema de perfis com nome e telefone
-- • Sistema de roles (owner/client)
-- • Serviços e agendamentos
-- • Templates de email multilíngues
-- • Sistema de segurança completo (RLS)
-- • Logs de autenticação
-- 
-- 🚀 Próximos passos:
-- 1. Testar cadastro de usuário
-- 2. Configurar Edge Function para emails
-- 3. Adicionar primeiro usuário como owner
-- 
-- ========================================