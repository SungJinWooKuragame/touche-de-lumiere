-- Create site settings table for CMS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Only owners can update settings
CREATE POLICY "Owner can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Only owners can insert settings
CREATE POLICY "Owner can insert site settings"
  ON public.site_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Insert default settings
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

-- Create updated_at trigger
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();