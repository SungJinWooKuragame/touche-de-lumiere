-- [DEPRECATED] This migration has been superseded by 20251101090000_full_schema_refresh.sql
-- Keeping as a no-op to avoid conflicts if executed again.

-- Adicionar coluna de motivo de cancelamento se não existir
DO $$ BEGIN
  RAISE NOTICE 'Skipping deprecated migration: 20251101010000_fix_appointments_columns.sql (use 20251101090000_full_schema_refresh.sql)';
END $$;

-- Adicionar índice para busca por status
-- No-op: handled by consolidated migration

-- Adicionar índice para busca por data
-- No-op: handled by consolidated migration

-- Comentários
-- No-op: handled by consolidated migration

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Deprecated migration executed as no-op: appointments columns';
END $$;
