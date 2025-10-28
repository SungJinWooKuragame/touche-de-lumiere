# 🔧 CONFIGURAÇÃO DA API KEY RESEND

## ✅ Sua API Key Recebida:
```
re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT
```

## 🚀 COMO CONFIGURAR NO SUPABASE:

### Método 1: Via Dashboard (Recomendado)
1. **Acesse**: https://supabase.com/dashboard
2. **Selecione** seu projeto: `tkysbxtcrrxhlpwhquah.supabase.co`
3. **Navegue**: Settings → Edge Functions → Secrets
4. **Adicione nova secret**:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT`
5. **Clique**: Save

### Método 2: Via CLI (Terminal)
```bash
# Na pasta do projeto
supabase secrets set RESEND_API_KEY=re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT
```

## 📡 DEPLOY DAS FUNÇÕES:

### 1. Deploy da função de email:
```bash
supabase functions deploy send-notification-email
```

### 2. Deploy da função WhatsApp (opcional por enquanto):
```bash
supabase functions deploy send-whatsapp
```

## ✅ TESTE IMEDIATO:

Após configurar a API key:

1. **Execute o SQL**: Copie e cole o `setup-supabase.sql` no SQL Editor do Supabase
2. **Acesse o site**: Vá para o painel admin local
3. **Confirme um agendamento**: Clique em confirmar qualquer agendamento pendente
4. **Verifique**: O email deve ser enviado automaticamente! 📧

## 🔍 VERIFICAR SE FUNCIONOU:

### Logs do Supabase:
- Dashboard → Edge Functions → send-notification-email → Logs
- Procure por: "Email sent successfully"

### Console do site:
- F12 → Console
- Procure por: "📧 Email enviado para..."

### Email recebido:
- Verifique a caixa de entrada do cliente
- Pode ir para spam na primeira vez

## ⚠️ PROBLEMAS COMUNS:

### Se não funcionar:
1. ✅ Verificar se a API key está salva corretamente
2. ✅ Verificar se a função foi deployada
3. ✅ Verificar logs de erro no Supabase
4. ✅ Verificar se o email do cliente está correto

### Resend Domain:
- Por enquanto usa: `onboarding@resend.dev` (domínio de teste)
- Para produção, configure seu próprio domínio no Resend

---

**🎯 PRÓXIMO PASSO: Configure a API key no Supabase e teste!**