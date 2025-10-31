-- ========================================
-- CONFIGURAÇÃO DE TEMPLATES DE EMAIL PERSONALIZADOS
-- ========================================

-- Função para interceptar eventos de autenticação e enviar emails personalizados
CREATE OR REPLACE FUNCTION handle_auth_email_custom()
RETURNS TRIGGER AS $$
DECLARE
  user_language text := 'pt';
  user_name text := '';
BEGIN
  -- Extrair dados do usuário
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_language := COALESCE(NEW.raw_user_meta_data->>'language', 'pt');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  END IF;

  -- Registrar no log para debug
  INSERT INTO auth_email_logs (user_id, email, event_type, language, created_at)
  VALUES (NEW.id, NEW.email, TG_OP, user_language, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabela para log de emails de autenticação
CREATE TABLE IF NOT EXISTS auth_email_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'INSERT' para signup, 'UPDATE' para password reset
  language VARCHAR(5) DEFAULT 'pt',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para capturar eventos de signup
DROP TRIGGER IF EXISTS trigger_auth_email_custom ON auth.users;
CREATE TRIGGER trigger_auth_email_custom
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_email_custom();

-- ========================================
-- CONFIGURAÇÕES DE EMAIL PERSONALIZADAS
-- ========================================

-- Tabela para armazenar configurações de template
CREATE TABLE IF NOT EXISTS email_template_config (
  id SERIAL PRIMARY KEY,
  template_type VARCHAR(50) NOT NULL, -- 'signup', 'reset_password', 'email_change'
  language VARCHAR(5) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  sender_name VARCHAR(100) DEFAULT 'Touche de Lumière',
  sender_email VARCHAR(100) DEFAULT 'noreply@touchedelumiere.com',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(template_type, language)
);

-- Inserir configurações padrão
INSERT INTO email_template_config (template_type, language, subject, sender_name, sender_email) VALUES
-- Signup templates
('signup', 'pt', '✨ Confirme seu cadastro - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),
('signup', 'en', '✨ Confirm your signup - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),
('signup', 'fr', '✨ Confirmez votre inscription - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),

-- Reset password templates
('reset_password', 'pt', '🔐 Redefinir Senha - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),
('reset_password', 'en', '🔐 Reset Password - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com'),
('reset_password', 'fr', '🔐 Réinitialiser le mot de passe - Touche de Lumière', 'Touche de Lumière', 'noreply@touchedelumiere.com')

ON CONFLICT (template_type, language) DO UPDATE SET
  subject = EXCLUDED.subject,
  updated_at = NOW();

-- ========================================
-- FUNÇÃO PARA BUSCAR CONFIGURAÇÃO DE TEMPLATE
-- ========================================

CREATE OR REPLACE FUNCTION get_email_template_config(
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
  FROM email_template_config etc
  WHERE etc.template_type = template_type_param 
    AND etc.language = language_param
    AND etc.is_active = true
  LIMIT 1;
  
  -- Se não encontrar na linguagem especificada, usar português como fallback
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      etc.subject,
      etc.sender_name,
      etc.sender_email
    FROM email_template_config etc
    WHERE etc.template_type = template_type_param 
      AND etc.language = 'pt'
      AND etc.is_active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- POLICIES PARA SEGURANÇA
-- ========================================

-- Enable RLS
ALTER TABLE auth_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_config ENABLE ROW LEVEL SECURITY;

-- Policies para auth_email_logs (apenas admin pode ver)
CREATE POLICY "Admin can view auth email logs" ON auth_email_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Policies para email_template_config (admin pode gerenciar, todos podem ler)
CREATE POLICY "Anyone can read email template config" ON email_template_config
FOR SELECT USING (true);

CREATE POLICY "Admin can manage email template config" ON email_template_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Grant permissions
GRANT SELECT ON auth_email_logs TO authenticated;
GRANT SELECT ON email_template_config TO authenticated;
GRANT ALL ON email_template_config TO service_role;
GRANT ALL ON auth_email_logs TO service_role;