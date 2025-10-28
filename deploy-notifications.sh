#!/bin/bash

# 🚀 Script de Deploy - Sistema de Notificações
# Execute este script após configurar a API key do Resend

echo "🚀 DEPLOY DO SISTEMA DE NOTIFICAÇÕES"
echo "=================================="

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo "📥 Instale: npm install -g supabase"
    exit 1
fi

echo "📧 Fazendo deploy da função de email..."
supabase functions deploy send-notification-email

if [ $? -eq 0 ]; then
    echo "✅ Função de email deployada com sucesso!"
else
    echo "❌ Erro no deploy da função de email"
    exit 1
fi

echo ""
echo "📱 Fazendo deploy da função WhatsApp..."
supabase functions deploy send-whatsapp

if [ $? -eq 0 ]; then
    echo "✅ Função WhatsApp deployada com sucesso!"
else
    echo "⚠️ Erro no deploy WhatsApp (não é crítico para emails)"
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
echo "1. Execute o setup-supabase.sql no SQL Editor"
echo "2. Teste confirmando um agendamento no painel admin"
echo "3. Verifique se o email foi enviado"
echo ""
echo "🔍 LOGS: Supabase Dashboard → Edge Functions → send-notification-email → Logs"