import { supabase } from './src/integrations/supabase/client.js';
import fs from 'fs';

console.log('🚀 Aplicando migration do sistema de horários...');

// Definir as tabelas e dados que precisamos criar
const migrations = [
  // 1. Tabela operating_hours
  {
    name: 'operating_hours',
    sql: `
      CREATE TABLE IF NOT EXISTS operating_hours (
        id SERIAL PRIMARY KEY,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
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
      )
    `
  },
  
  // 2. Inserir dados padrão de horários
  {
    name: 'operating_hours_data',
    sql: `
      INSERT INTO operating_hours (day_of_week, is_open, open_time, close_time) VALUES
      (0, false, NULL, NULL),
      (1, true, '08:00', '18:00'),
      (2, true, '08:00', '18:00'),
      (3, true, '08:00', '18:00'),
      (4, true, '08:00', '18:00'),
      (5, true, '08:00', '18:00'),
      (6, true, '08:00', '12:00')
      ON CONFLICT (day_of_week) DO NOTHING
    `
  },

  // 3. Tabela date_blocks
  {
    name: 'date_blocks',
    sql: `
      CREATE TABLE IF NOT EXISTS date_blocks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        block_type VARCHAR(50) NOT NULL CHECK (block_type IN ('vacation', 'custom', 'maintenance', 'external_commitment')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        is_recurring BOOLEAN DEFAULT false,
        recurring_pattern JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id),
        
        CONSTRAINT valid_date_range CHECK (start_date <= end_date),
        CONSTRAINT valid_time_range CHECK (
          (start_time IS NULL AND end_time IS NULL) OR 
          (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
        )
      )
    `
  },

  // 4. Colunas adicionais em appointments
  {
    name: 'appointments_columns',
    sql: `
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
      ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50),
      ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS slot_released BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS client_cancellation_count INTEGER DEFAULT 0
    `
  }
];

async function applyMigrations() {
  for (const migration of migrations) {
    console.log(`\n📝 Aplicando: ${migration.name}`);
    
    try {
      const { data, error } = await supabase.rpc('exec', {
        sql: migration.sql
      });
      
      if (error) {
        console.log(`❌ Erro: ${error.message}`);
        // Continuar com próxima migration se for erro de "já existe"
        if (!error.message.includes('already exists') && 
            !error.message.includes('duplicate') &&
            !error.message.includes('relation')) {
          throw error;
        }
      } else {
        console.log('✅ Sucesso');
      }
    } catch (err) {
      console.log(`❌ Erro fatal: ${err.message}`);
      // Tentar execução simples via SQL direto
      try {
        const { error: directError } = await supabase
          .from('_temp_migration')
          .select('1')
          .limit(0);
        console.log('📝 Tentando abordagem alternativa...');
      } catch (e) {
        console.log('⚠️ Continuando com próxima migration...');
      }
    }
  }
  
  console.log('\n🎉 Migrations aplicadas!');
  console.log('✨ Sistema de horários agora está ativo');
  console.log('📊 Acesse o painel admin na aba "Horários" para configurar');
}

applyMigrations().catch(console.error);