-- 🕐 SISTEMA DE GESTÃO DE HORÁRIOS E NOTIFICAÇÕES
-- Created: 2025-10-28
-- Description: Sistema completo de horários de funcionamento, bloqueios e notificações

-- ========================================
-- 1. HORÁRIOS DE FUNCIONAMENTO POR DIA
-- ========================================

CREATE TABLE operating_hours (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 1=segunda, ..., 6=sábado
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_day_of_week UNIQUE (day_of_week),
  CONSTRAINT valid_times CHECK (
    (is_open = false) OR 
    (is_open = true AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
  )
);

-- Inserir horários padrão (segunda a sexta: 8h-18h, sábado: 8h-12h, domingo: fechado)
INSERT INTO operating_hours (day_of_week, is_open, open_time, close_time) VALUES
(0, false, NULL, NULL), -- Domingo
(1, true, '08:00', '18:00'), -- Segunda
(2, true, '08:00', '18:00'), -- Terça
(3, true, '08:00', '18:00'), -- Quarta
(4, true, '08:00', '18:00'), -- Quinta
(5, true, '08:00', '18:00'), -- Sexta
(6, true, '08:00', '12:00'); -- Sábado

-- ========================================
-- 2. BLOQUEIOS DE DATAS E HORÁRIOS
-- ========================================

CREATE TABLE date_blocks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  block_type VARCHAR(50) NOT NULL CHECK (block_type IN ('vacation', 'custom', 'maintenance', 'external_commitment')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- NULL = bloqueia dia inteiro
  end_time TIME,   -- NULL = bloqueia dia inteiro
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern JSONB, -- Para bloqueios recorrentes (ex: toda quarta das 14h-16h)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_date_range CHECK (start_date <= end_date),
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  )
);

-- ========================================
-- 3. CONFIGURAÇÕES DE NOTIFICAÇÃO
-- ========================================

CREATE TABLE notification_settings (
  id SERIAL PRIMARY KEY,
  notification_type VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'sms'
  is_enabled BOOLEAN DEFAULT false,
  provider VARCHAR(100), -- 'smtp', 'twilio', 'whatsapp_business_api', etc.
  api_key TEXT,
  api_secret TEXT,
  phone_number VARCHAR(20),
  sender_email VARCHAR(255),
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_username VARCHAR(255),
  smtp_password TEXT,
  settings JSONB, -- Configurações extras específicas do provedor
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_notification_type UNIQUE (notification_type)
);

-- ========================================
-- 4. TEMPLATES DE MENSAGENS
-- ========================================

CREATE TABLE message_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(100) NOT NULL, -- 'appointment_confirmed', 'appointment_cancelled', etc.
  notification_type VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'sms'
  language VARCHAR(5) DEFAULT 'pt',
  subject VARCHAR(500), -- Para emails
  message_body TEXT NOT NULL,
  variables JSONB, -- Lista de variáveis disponíveis: {client_name}, {date}, {time}, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_template_key_type_lang UNIQUE (template_key, notification_type, language)
);

-- Inserir templates padrão para confirmação de consulta
INSERT INTO message_templates (template_key, notification_type, language, subject, message_body, variables) VALUES
-- EMAIL TEMPLATES
('appointment_confirmed', 'email', 'pt', '✅ Sua consulta foi confirmada!', 
'Olá {client_name},

Sua consulta foi CONFIRMADA! 🎉

📋 Detalhes:
- Serviço: {service_name}
- Data: {appointment_date}
- Horário: {appointment_time}
- Duração: {duration} minutos
- Localização: {address}

Caso precise cancelar, acesse seu painel até {cancellation_deadline}.

Até breve!
{business_name}', 
'["client_name", "service_name", "appointment_date", "appointment_time", "duration", "address", "cancellation_deadline", "business_name"]'),

('appointment_cancelled_by_owner', 'email', 'pt', '⚠️ Importante: Sua consulta foi cancelada',
'Olá {client_name},

Infelizmente precisamos cancelar sua consulta:
- Data: {appointment_date}
- Horário: {appointment_time}
- Serviço: {service_name}

Motivo: {cancellation_reason}

Pedimos desculpas pelo transtorno. Por favor, agende um novo horário quando for conveniente.

Atenciosamente,
{business_name}',
'["client_name", "appointment_date", "appointment_time", "service_name", "cancellation_reason", "business_name"]'),

('appointment_denied', 'email', 'pt', 'Informação sobre sua solicitação de agendamento',
'Olá {client_name},

Infelizmente não conseguimos confirmar sua consulta para:
- Data: {appointment_date}
- Horário: {appointment_time}

Motivo: {denial_reason}

Por favor, escolha outro horário disponível em nosso site.

Atenciosamente,
{business_name}',
'["client_name", "appointment_date", "appointment_time", "denial_reason", "business_name"]'),

-- WHATSAPP/SMS TEMPLATES
('appointment_confirmed', 'whatsapp', 'pt', NULL,
'✅ Consulta confirmada!
📅 {appointment_date} às {appointment_time}
🏥 {service_name}
📍 {address}',
'["appointment_date", "appointment_time", "service_name", "address"]'),

('appointment_cancelled_by_owner', 'whatsapp', 'pt', NULL,
'⚠️ Sua consulta de {appointment_date} às {appointment_time} foi cancelada. Motivo: {cancellation_reason}. Pedimos desculpas. Reagende quando desejar.',
'["appointment_date", "appointment_time", "cancellation_reason"]'),

('appointment_denied', 'whatsapp', 'pt', NULL,
'❌ Sua solicitação de agendamento para {appointment_date} às {appointment_time} não foi confirmada. Por favor, escolha outro horário.',
'["appointment_date", "appointment_time"]');

-- ========================================
-- 5. LOG DE NOTIFICAÇÕES ENVIADAS
-- ========================================

CREATE TABLE notification_logs (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id),
  notification_type VARCHAR(50) NOT NULL,
  template_key VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  provider_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. CONFIGURAÇÕES DE CANCELAMENTO
-- ========================================

CREATE TABLE cancellation_settings (
  id SERIAL PRIMARY KEY,
  minimum_hours_before INTEGER DEFAULT 4, -- Mínimo de horas antes para cancelamento
  max_cancellations_per_client INTEGER DEFAULT 3, -- Máximo de cancelamentos por cliente
  require_penalty_after_limit BOOLEAN DEFAULT false,
  penalty_amount DECIMAL(10,2),
  enable_waitlist BOOLEAN DEFAULT true,
  auto_release_cancelled_slots BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO cancellation_settings (minimum_hours_before, max_cancellations_per_client, enable_waitlist, auto_release_cancelled_slots) 
VALUES (4, 3, true, true);

-- ========================================
-- 7. ATUALIZAR TABELA APPOINTMENTS
-- ========================================

-- Adicionar campos para cancelamento e motivos
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50); -- 'client' ou 'owner'
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS slot_released BOOLEAN DEFAULT true; -- Se o horário foi liberado após cancelamento

-- Adicionar campo para contagem de cancelamentos do cliente
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_cancellation_count INTEGER DEFAULT 0;

-- ========================================
-- 8. ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX idx_date_blocks_date_range ON date_blocks (start_date, end_date);
CREATE INDEX idx_date_blocks_type ON date_blocks (block_type);
CREATE INDEX idx_notification_logs_appointment ON notification_logs (appointment_id);
CREATE INDEX idx_notification_logs_status ON notification_logs (status);
CREATE INDEX idx_operating_hours_day ON operating_hours (day_of_week);

-- ========================================
-- 9. FUNÇÕES UTILITÁRIAS
-- ========================================

-- Função para verificar se um horário está disponível
CREATE OR REPLACE FUNCTION is_time_slot_available(
  check_date DATE,
  check_time TIME,
  duration_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  day_of_week_num INTEGER;
  operating_hour RECORD;
  end_time TIME;
  block_count INTEGER;
BEGIN
  -- Calcular dia da semana (0=domingo, 1=segunda, etc.)
  day_of_week_num := EXTRACT(DOW FROM check_date);
  
  -- Verificar horário de funcionamento
  SELECT * INTO operating_hour 
  FROM operating_hours 
  WHERE day_of_week = day_of_week_num;
  
  -- Se não estiver aberto neste dia
  IF NOT FOUND OR NOT operating_hour.is_open THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular horário de fim do agendamento
  end_time := check_time + (duration_minutes || ' minutes')::INTERVAL;
  
  -- Verificar se está dentro do horário de funcionamento
  IF check_time < operating_hour.open_time OR end_time > operating_hour.close_time THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar bloqueios de data/horário
  SELECT COUNT(*) INTO block_count
  FROM date_blocks
  WHERE start_date <= check_date 
    AND end_date >= check_date
    AND (
      -- Bloqueio de dia inteiro
      (start_time IS NULL AND end_time IS NULL) OR
      -- Bloqueio de horário específico que conflita
      (start_time IS NOT NULL AND end_time IS NOT NULL AND 
       NOT (end_time <= check_time OR start_time >= end_time))
    );
  
  -- Se há bloqueios, não está disponível
  IF block_count > 0 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para obter próximos horários disponíveis
CREATE OR REPLACE FUNCTION get_available_time_slots(
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 30,
  slot_duration INTEGER DEFAULT 60
) RETURNS TABLE(
  available_date DATE,
  available_time TIME,
  day_name TEXT
) AS $$
DECLARE
  current_date DATE;
  current_time TIME;
  day_of_week_num INTEGER;
  operating_hour RECORD;
  slot_time TIME;
BEGIN
  current_date := start_date;
  
  -- Loop através dos dias
  WHILE current_date <= start_date + days_ahead LOOP
    day_of_week_num := EXTRACT(DOW FROM current_date);
    
    -- Buscar horário de funcionamento para este dia
    SELECT * INTO operating_hour 
    FROM operating_hours 
    WHERE day_of_week = day_of_week_num AND is_open = true;
    
    -- Se estiver aberto neste dia
    IF FOUND THEN
      slot_time := operating_hour.open_time;
      
      -- Loop através dos horários do dia
      WHILE slot_time + (slot_duration || ' minutes')::INTERVAL <= operating_hour.close_time LOOP
        -- Verificar se este horário está disponível
        IF is_time_slot_available(current_date, slot_time, slot_duration) THEN
          -- Verificar se não há agendamento confirmado neste horário
          IF NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE date = current_date 
              AND time = slot_time 
              AND status IN ('confirmed', 'pending')
          ) THEN
            available_date := current_date;
            available_time := slot_time;
            day_name := CASE day_of_week_num
              WHEN 0 THEN 'Domingo'
              WHEN 1 THEN 'Segunda-feira'
              WHEN 2 THEN 'Terça-feira'
              WHEN 3 THEN 'Quarta-feira'
              WHEN 4 THEN 'Quinta-feira'
              WHEN 5 THEN 'Sexta-feira'
              WHEN 6 THEN 'Sábado'
            END;
            
            RETURN NEXT;
          END IF;
        END IF;
        
        -- Próximo slot (incremento de 30 minutos)
        slot_time := slot_time + INTERVAL '30 minutes';
      END LOOP;
    END IF;
    
    current_date := current_date + 1;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 10. POLÍTICAS DE SEGURANÇA (RLS)
-- ========================================

-- Habilitar RLS
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para operating_hours (todos podem ler, apenas admin pode editar)
CREATE POLICY "Everyone can view operating hours" ON operating_hours FOR SELECT USING (true);
CREATE POLICY "Only admins can modify operating hours" ON operating_hours FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Políticas para date_blocks
CREATE POLICY "Everyone can view date blocks" ON date_blocks FOR SELECT USING (true);
CREATE POLICY "Only admins can modify date blocks" ON date_blocks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Políticas para configurações (apenas admin)
CREATE POLICY "Only admins can access notification settings" ON notification_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Only admins can access message templates" ON message_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Only admins can access cancellation settings" ON cancellation_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Políticas para logs (admin pode ver todos, clientes podem ver apenas os seus)
CREATE POLICY "Admins can view all notification logs" ON notification_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Clients can view their own notification logs" ON notification_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.id = notification_logs.appointment_id 
      AND a.client_id = auth.uid()
  )
);

-- ========================================
-- MIGRATION COMPLETE ✅
-- ========================================

COMMENT ON TABLE operating_hours IS 'Horários de funcionamento por dia da semana';
COMMENT ON TABLE date_blocks IS 'Bloqueios de datas e horários (férias, compromissos, etc.)';
COMMENT ON TABLE notification_settings IS 'Configurações de provedores de notificação (email, WhatsApp, SMS)';
COMMENT ON TABLE message_templates IS 'Templates de mensagens para notificações automáticas';
COMMENT ON TABLE notification_logs IS 'Log de todas as notificações enviadas';
COMMENT ON TABLE cancellation_settings IS 'Configurações do sistema de cancelamento';