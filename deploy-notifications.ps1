# 🚀 Script de Deploy - Sistema de Notificações (PowerShell)
# Execute este script após configurar a API key do Resend

Write-Host "🚀 DEPLOY DO SISTEMA DE NOTIFICAÇÕES" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Verificar se Supabase CLI está instalado
try {
    supabase --version | Out-Null
    Write-Host "✅ Supabase CLI encontrado!" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "📥 Instale: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📧 Fazendo deploy da função de email..." -ForegroundColor Blue
supabase functions deploy send-notification-email

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Função de email deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy da função de email" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📱 Fazendo deploy da função WhatsApp..." -ForegroundColor Blue
supabase functions deploy send-whatsapp

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Função WhatsApp deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Erro no deploy WhatsApp (não é crítico para emails)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Configurando API key do Resend..." -ForegroundColor Blue
supabase secrets set RESEND_API_KEY=re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ API key configurada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao configurar API key" -ForegroundColor Red
    Write-Host "💡 Configure manualmente no dashboard: Settings → Edge Functions → Secrets" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Execute o setup-supabase.sql no SQL Editor" -ForegroundColor White
Write-Host "2. Teste confirmando um agendamento no painel admin" -ForegroundColor White
Write-Host "3. Verifique se o email foi enviado" -ForegroundColor White
Write-Host ""
Write-Host "🔍 LOGS: Supabase Dashboard → Edge Functions → send-notification-email → Logs" -ForegroundColor Yellow