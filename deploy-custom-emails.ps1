# 🚀 DEPLOY DO SISTEMA DE EMAILS PERSONALIZADOS
# Execute este script após configurar a API key do Resend

Write-Host "DEPLOY DO SISTEMA DE EMAILS PERSONALIZADOS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Verificar se Supabase CLI está instalado
try {
    supabase --version | Out-Null
    Write-Host "Supabase CLI encontrado!" -ForegroundColor Green
} catch {
    Write-Host "Supabase CLI nao encontrado!" -ForegroundColor Red
    Write-Host "Instale: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Fazendo deploy da funcao de email personalizado..." -ForegroundColor Blue
supabase functions deploy custom-auth-email

if ($LASTEXITCODE -eq 0) {
    Write-Host "Funcao de email personalizado deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro no deploy da funcao de email personalizado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Fazendo deploy da funcao de notificacao existente..." -ForegroundColor Blue
supabase functions deploy send-notification-email

if ($LASTEXITCODE -eq 0) {
    Write-Host "Funcao de notificacao deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro no deploy da funcao de notificacao" -ForegroundColor Red
}

Write-Host ""
Write-Host "Aplicando migracao do banco de dados..." -ForegroundColor Blue
supabase db reset

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migracao aplicada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro ao aplicar migracao" -ForegroundColor Red
    Write-Host "Execute manualmente: supabase db reset" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configurando API key do Resend..." -ForegroundColor Blue
supabase secrets set RESEND_API_KEY=re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT

if ($LASTEXITCODE -eq 0) {
    Write-Host "API key configurada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro ao configurar API key" -ForegroundColor Red
    Write-Host "Configure manualmente no dashboard: Settings Edge Functions Secrets" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Teste criar uma nova conta no site" -ForegroundColor White
Write-Host "2. Verifique se o email personalizado foi enviado" -ForegroundColor White
Write-Host "3. Teste reset de senha em diferentes idiomas" -ForegroundColor White
Write-Host "4. Monitore os logs no Supabase Dashboard" -ForegroundColor White
Write-Host ""
Write-Host "IDIOMAS SUPORTADOS:" -ForegroundColor Cyan
Write-Host "Portugues (pt) - Padrao" -ForegroundColor White
Write-Host "English (en)" -ForegroundColor White  
Write-Host "Francais (fr)" -ForegroundColor White
Write-Host ""
Write-Host "MONITORAMENTO:" -ForegroundColor Cyan
Write-Host "Logs: Edge Functions custom-auth-email Logs" -ForegroundColor White
Write-Host "Console: F12 Console Procurar email" -ForegroundColor White
Write-Host "Tabela: auth_email_logs no Database" -ForegroundColor White
Write-Host ""
Write-Host "Agora os emails de verificacao terao o visual do Touche de Lumiere!" -ForegroundColor Magenta