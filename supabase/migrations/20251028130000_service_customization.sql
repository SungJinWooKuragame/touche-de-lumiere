-- Add service customization fields
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS icon_emoji TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hover_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS card_style JSONB DEFAULT '{}';

-- Update existing services with default icons based on name
UPDATE public.services 
SET icon_name = CASE 
  WHEN LOWER(name) LIKE '%relaxa%' OR LOWER(name_en) LIKE '%relax%' THEN 'heart'
  WHEN LOWER(name) LIKE '%terap%' OR LOWER(name_en) LIKE '%therap%' THEN 'zap'
  WHEN LOWER(name) LIKE '%reiki%' THEN 'sparkles'
  WHEN LOWER(name) LIKE '%combo%' OR LOWER(name) LIKE '%combina%' THEN 'star'
  ELSE 'sparkles'
END
WHERE icon_name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.services.icon_name IS 'Lucide icon name for service display';
COMMENT ON COLUMN public.services.icon_emoji IS 'Optional emoji icon as alternative to icon_name';
COMMENT ON COLUMN public.services.hover_color IS 'Hex color code for hover effects';
COMMENT ON COLUMN public.services.card_style IS 'JSON object with additional styling options';