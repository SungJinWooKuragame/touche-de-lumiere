# 🚀 CONFIGURAÇÃO RÁPIDA - SEM CLI

Como o Supabase CLI não pode ser instalado via npm no Windows, vamos configurar diretamente:

## 📋 CONFIGURAÇÃO MANUAL (5 MINUTOS):

### 1. ✅ **SUA API KEY JÁ RECEBIDA:**
```
re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT
```

### 2. 🌐 **CONFIGURE NO SUPABASE DASHBOARD:**

1. **Acesse**: https://supabase.com/dashboard/projects
2. **Selecione** seu projeto (que termina com `...tkysbxtcrrxhlpwhquah`)
3. **Navegue para**: Settings (⚙️) → Edge Functions
4. **Na seção "Secrets"**, clique em **"Add new secret"**
5. **Preencha**:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT`
6. **Clique**: "Add secret"

### 3. 📤 **DEPLOY DAS FUNÇÕES:**

#### Método 1: Upload Manual
1. **Acesse**: Edge Functions → "Create a new function"
2. **Nome**: `send-notification-email`
3. **Cole o código** do arquivo `supabase/functions/send-notification-email/index.ts`
4. **Deploy**

5. **Repita** para `send-whatsapp`:
   - **Nome**: `send-whatsapp`
   - **Cole o código** do arquivo `supabase/functions/send-whatsapp/index.ts`

#### Método 2: GitHub Integration
1. **No Supabase**: Settings → Integrations → GitHub
2. **Conecte** seu repositório `touche-de-lumiere`
3. **Auto-deploy** das functions

### 4. 🗃️ **EXECUTE O SQL:**
1. **Acesse**: SQL Editor no Supabase Dashboard
2. **Cole todo o conteúdo** do arquivo `setup-supabase.sql`
3. **Execute** (botão Run)

### 5. ✅ **TESTE IMEDIATO:**
1. **Acesse**: http://localhost:8080/admin
2. **Confirme qualquer agendamento** pendente
3. **Verifique**: Console (F12) deve mostrar "📧 Email enviado..."
4. **Check email**: Deve receber email com template bonito!

## 🔍 **VERIFICAR SE FUNCIONOU:**

### ✅ Checklist:
- [ ] API key `RESEND_API_KEY` configurada no Supabase
- [ ] Função `send-notification-email` deployada
- [ ] SQL `setup-supabase.sql` executado
- [ ] Teste de confirmação de agendamento realizado
- [ ] Email recebido na caixa de entrada

### 📊 Logs:
- **Supabase**: Edge Functions → send-notification-email → Logs
- **Browser**: F12 → Console → Procurar "📧"

---

**🎯 RESULTADO ESPERADO:**
Quando confirmar agendamento → Email profissional enviado automaticamente! 📧✨