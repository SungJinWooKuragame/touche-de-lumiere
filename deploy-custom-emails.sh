#!/bin/bash

# 🚀 DEPLOY DO SISTEMA DE EMAILS PERSONALIZADOS
# Execute este script após configurar a API key do Resend

echo "🎨 DEPLOY DO SISTEMA DE EMAILS PERSONALIZADOS"
echo "============================================="

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo "📥 Instale: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrado!"
echo ""

echo "📧 Fazendo deploy da função de email personalizado..."
supabase functions deploy custom-auth-email

if [ $? -eq 0 ]; then
    echo "✅ Função de email personalizado deployada com sucesso!"
else
    echo "❌ Erro no deploy da função de email personalizado"
    exit 1
fi

echo ""
echo "📧 Fazendo deploy da função de notificação existente..."
supabase functions deploy send-notification-email

if [ $? -eq 0 ]; then
    echo "✅ Função de notificação deployada com sucesso!"
else
    echo "❌ Erro no deploy da função de notificação"
fi

echo ""
echo "🗃️ Aplicando migração do banco de dados..."
supabase db reset

if [ $? -eq 0 ]; then
    echo "✅ Migração aplicada com sucesso!"
else
    echo "❌ Erro ao aplicar migração"
    echo "💡 Execute manualmente: supabase db reset"
fi

echo ""
echo "🔧 Configurando API key do Resend..."
supabase secrets set RESEND_API_KEY=re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT

if [ $? -eq 0 ]; then
    echo "✅ API key configurada com sucesso!"
else
    echo "❌ Erro ao configurar API key"
    echo "💡 Configure manualmente no dashboard: Settings → Edge Functions → Secrets"
fi

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo "==================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Teste criar uma nova conta no site"
echo "2. Verifique se o email personalizado foi enviado"
echo "3. Teste reset de senha em diferentes idiomas"
echo "4. Monitore os logs no Supabase Dashboard"
echo ""
echo "🌐 IDIOMAS SUPORTADOS:"
echo "• Português (pt) - Padrão"
echo "• English (en)"  
echo "• Français (fr)"
echo ""
echo "🔍 MONITORAMENTO:"
echo "• Logs: Edge Functions → custom-auth-email → Logs"
echo "• Console: F12 → Console → Procurar '📧'"
echo "• Tabela: auth_email_logs no Database"
echo ""
echo "✨ Agora os emails de verificação terão o visual do Touche de Lumière!"