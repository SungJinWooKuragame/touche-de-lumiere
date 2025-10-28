-- ====================================
-- SCRIPT COMPLETO DE MIGRAÇÃO SUPABASE
-- Execute este script no SQL Editor do seu novo projeto
-- ====================================

-- 1. PRIMEIRA MIGRAÇÃO: Estrutura básica
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'client');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create appointments table
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
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

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for services
CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (active = true);

CREATE POLICY "Owner can manage services"
  ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for appointments
CREATE POLICY "Clients can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Owner can view all appointments"
  ON public.appointments FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update appointments"
  ON public.appointments FOR UPDATE
  USING (public.has_role(auth.uid(), 'owner'));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign client role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Owner can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owner can insert site settings"
  ON public.site_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 3. GOOGLE CALENDAR INTEGRATION
CREATE TABLE public.google_calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  calendar_id TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.google_calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage google calendar settings"
  ON public.google_calendar_settings FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_google_calendar_settings_updated_at
  BEFORE UPDATE ON public.google_calendar_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. OPERATING HOURS SYSTEM
CREATE TABLE public.operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(day_of_week)
);

ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view operating hours"
  ON public.operating_hours FOR SELECT
  USING (true);

CREATE POLICY "Owner can manage operating hours"
  ON public.operating_hours FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_operating_hours_updated_at
  BEFORE UPDATE ON public.operating_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. MULTILINGUAL SERVICES
ALTER TABLE public.services 
ADD COLUMN name_fr TEXT,
ADD COLUMN name_pt TEXT,
ADD COLUMN name_en TEXT,
ADD COLUMN description_fr TEXT,
ADD COLUMN description_pt TEXT,
ADD COLUMN description_en TEXT;

-- 6. APPOINTMENT BLOCKING IMPROVEMENTS
ALTER TABLE public.appointments
ADD COLUMN google_event_id TEXT,
ADD COLUMN phone TEXT;

-- Add indexes for better performance
CREATE INDEX idx_appointments_date_time ON public.appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- ====================================
-- DADOS INICIAIS
-- ====================================

-- Default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('hero_title_fr', 'Bien-être pour le Corps et l''Âme'),
  ('hero_title_pt', 'Bem-estar para Corpo e Alma'),
  ('hero_title_en', 'Wellness for Body and Soul'),
  ('hero_subtitle_fr', 'Massages thérapeutiques, relaxation et Reiki pour votre harmonie complète'),
  ('hero_subtitle_pt', 'Massagens terapêuticas, relaxamento e Reiki para sua harmonia completa'),
  ('hero_subtitle_en', 'Therapeutic massages, relaxation and Reiki for your complete harmony'),
  ('contact_phone', '+33 (0) 00 00 00 00'),
  ('contact_email', 'contact@touchedelumiere.fr')
ON CONFLICT (key) DO NOTHING;

-- Default services with multilingual support
INSERT INTO public.services (
  name, description, duration_minutes, price,
  name_fr, name_pt, name_en,
  description_fr, description_pt, description_en
) VALUES
  (
    'Massagem Relaxante', 
    'Massagem completa para relaxamento profundo e alívio do estresse', 
    60, 
    150.00,
    'Massage Relaxant',
    'Massagem Relaxante', 
    'Relaxing Massage',
    'Massage complet pour relaxation profonde et soulagement du stress',
    'Massagem completa para relaxamento profundo e alívio do estresse',
    'Complete massage for deep relaxation and stress relief'
  ),
  (
    'Massagem Terapêutica', 
    'Tratamento focado em dores musculares e tensões específicas', 
    60, 
    180.00,
    'Massage Thérapeutique',
    'Massagem Terapêutica',
    'Therapeutic Massage', 
    'Traitement ciblé sur les douleurs musculaires et tensions spécifiques',
    'Tratamento focado em dores musculares e tensões específicas',
    'Treatment focused on muscle pain and specific tensions'
  ),
  (
    'Reiki', 
    'Terapia energética para equilíbrio e bem-estar', 
    45, 
    120.00,
    'Reiki',
    'Reiki',
    'Reiki',
    'Thérapie énergétique pour équilibre et bien-être',
    'Terapia energética para equilíbrio e bem-estar',
    'Energy therapy for balance and well-being'
  ),
  (
    'Massagem + Reiki', 
    'Combinação de massagem relaxante com sessão de Reiki', 
    90, 
    250.00,
    'Massage + Reiki',
    'Massagem + Reiki',
    'Massage + Reiki',
    'Combinaison de massage relaxant avec séance de Reiki',
    'Combinação de massagem relaxante com sessão de Reiki', 
    'Combination of relaxing massage with Reiki session'
  )
ON CONFLICT DO NOTHING;

-- Default operating hours (Segunda a Sexta, 9h às 18h)
INSERT INTO public.operating_hours (day_of_week, start_time, end_time, is_enabled) VALUES
  (1, '09:00:00', '18:00:00', true), -- Segunda
  (2, '09:00:00', '18:00:00', true), -- Terça
  (3, '09:00:00', '18:00:00', true), -- Quarta
  (4, '09:00:00', '18:00:00', true), -- Quinta
  (5, '09:00:00', '18:00:00', true), -- Sexta
  (6, '09:00:00', '14:00:00', false), -- Sábado (desabilitado)
  (0, '09:00:00', '14:00:00', false)  -- Domingo (desabilitado)
ON CONFLICT (day_of_week) DO NOTHING;

-- ====================================
-- SCRIPT CONCLUÍDO COM SUCESSO! ✅
-- ====================================