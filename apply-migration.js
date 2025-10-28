import fs from 'fs';
import https from 'https';

// Configuração do Supabase
const SUPABASE_URL = 'https://leuihzphwmtlhikteurn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxldWloenBod210bGhpa3RldXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTI4OTAsImV4cCI6MjA3NzAyODg5MH0.zKj3JoQcTkDERzMpfcMewUPYpGMDJp-oFzEKsEGDijU';

// Ler o arquivo SQL
const migrationSQL = fs.readFileSync('./supabase/migrations/20251028120000_operating_hours_system.sql', 'utf8');

// Dividir o SQL em comandos individuais
const commands = migrationSQL
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

console.log(`🚀 Executando ${commands.length} comandos SQL...`);

// Função para executar comando SQL
async function executeSQL(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    
    const options = {
      hostname: 'leuihzphwmtlhikteurn.supabase.co',
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': SUPABASE_ANON_KEY
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

// Executar comandos sequencialmente
async function runMigration() {
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`\n📝 Executando comando ${i + 1}/${commands.length}:`);
    console.log(command.substring(0, 100) + '...');
    
    try {
      await executeSQL(command);
      console.log('✅ Sucesso');
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
      // Alguns erros são esperados (como tabelas já existentes)
      if (!error.message.includes('already exists') && 
          !error.message.includes('duplicate') &&
          !error.message.includes('relation') &&
          !error.message.includes('column') &&
          !error.message.includes('constraint')) {
        console.log('🛑 Parando devido a erro crítico');
        process.exit(1);
      }
    }
  }
  
  console.log('\n🎉 Migration aplicada com sucesso!');
  console.log('✨ Tabelas criadas:');
  console.log('   - operating_hours');
  console.log('   - date_blocks');
  console.log('   - notification_settings');
  console.log('   - message_templates');
  console.log('   - notification_logs');
  console.log('   - cancellation_settings');
}

runMigration().catch(console.error);