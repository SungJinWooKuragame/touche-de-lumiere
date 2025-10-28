# Sistema de Notificações - Configuração

## 📧 Email (Resend)

Para configurar o envio de emails, você precisa:

1. **Criar conta no Resend**: https://resend.com
2. **Obter API Key** na dashboard do Resend
3. **Configurar no Supabase**:
   - Acesse: Supabase Dashboard → Settings → Edge Functions → Secrets
   - Adicione: `RESEND_API_KEY` = sua_api_key_aqui

### Domínio Personalizado (Recomendado)
- Configure um domínio no Resend para emails profissionais
- Atualize o campo `from` na função `send-notification-email`
- Exemplo: `from: "Touche de Lumière <agendamentos@seudominio.com>"`

## 📱 WhatsApp Business API

Para ativar notificações por WhatsApp:

1. **Meta Business Account**: https://business.facebook.com
2. **WhatsApp Business API** através do Meta for Developers
3. **Configurar no Supabase**:
   - `WHATSAPP_ACCESS_TOKEN` = token_da_meta_api
   - `WHATSAPP_PHONE_NUMBER_ID` = id_do_numero_de_telefone

### Configuração Detalhada WhatsApp:
1. Acesse: https://developers.facebook.com
2. Crie um App Business
3. Adicione o produto "WhatsApp"
4. Configure um número de telefone
5. Obtenha o Access Token e Phone Number ID

## 🚀 Ativação das Funções

### 1. Deploy das Functions no Supabase:
```bash
# Na pasta do projeto
supabase functions deploy send-notification-email
supabase functions deploy send-whatsapp
```

### 2. Configurar Secrets:
```bash
# Email
supabase secrets set RESEND_API_KEY=your_resend_api_key

# WhatsApp (opcional)
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

## 📋 Como Testar

### Teste de Email:
1. Configure `RESEND_API_KEY` no Supabase
2. Confirme um agendamento no painel admin
3. Verifique se o email chegou

### Teste de WhatsApp:
1. Configure as variáveis WhatsApp no Supabase
2. Certifique-se que o telefone do cliente está no formato: `+5544999999999`
3. Confirme um agendamento
4. Verifique se a mensagem chegou no WhatsApp

## ⚠️ Problemas Comuns

### Email não envia:
- ✅ Verificar se `RESEND_API_KEY` está configurada
- ✅ Verificar se o domínio está verificado no Resend
- ✅ Checar logs no Supabase Functions

### WhatsApp não envia:
- ✅ Verificar formato do telefone: `+[código país][número]`
- ✅ Verificar se `WHATSAPP_ACCESS_TOKEN` está válido
- ✅ Verificar se o número de telefone está aprovado pela Meta
- ✅ Checar cotas de mensagens da Meta API

### Logs de Debug:
- Supabase Dashboard → Edge Functions → Logs
- Procurar por erros nas functions `send-notification-email` e `send-whatsapp`

## 💡 Melhorias Futuras

### Templates Personalizados:
- Configurar templates no Resend para emails mais bonitos
- Adicionar variáveis dinâmicas (nome da clínica, endereço, etc.)

### Notificações Automáticas:
- Lembretes 24h antes da consulta
- Confirmação automática por email após agendamento online
- Follow-up pós-consulta

### Integrações Adicionais:
- SMS via Twilio
- Notificações push via Firebase
- Telegram Bot para notificações

---

*Configure pelo menos o Resend para emails básicos funcionarem!*