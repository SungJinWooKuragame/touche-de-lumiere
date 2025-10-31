# 🚀 GUIA DE DEPLOY MANUAL - EMAILS PERSONALIZADOS

## ⚠️ IMPORTANTE: Supabase CLI não encontrado

Como o Supabase CLI não está instalado, siga este guia manual para configurar os emails personalizados.

## 📋 OPÇÃO 1: CONFIGURAÇÃO MANUAL (RECOMENDADA)

### 1. 🔧 Configurar Edge Function no Dashboard Supabase

1. **Acesse**: [Supabase Dashboard](https://app.supabase.com)
2. **Vá para**: Edge Functions → Create a new function
3. **Nome**: `custom-auth-email`
4. **Copie todo o código** do arquivo: `supabase/functions/custom-auth-email/index.ts`
5. **Cole** no editor online
6. **Deploy** a função

### 2. 🗃️ Executar SQL no Database

1. **Acesse**: SQL Editor no Supabase Dashboard
2. **Copie todo o conteúdo** do arquivo: `supabase/migrations/20251031120000_custom_auth_email_templates.sql`
3. **Cole** no SQL Editor
4. **Execute** (botão Run)

### 3. 🔑 Configurar API Key do Resend

1. **Acesse**: Settings → Edge Functions → Secrets
2. **Adicione nova secret**:
   - **Nome**: `RESEND_API_KEY`
   - **Valor**: `re_CWsu8Tzp_Kf6fn5rCkGeDwv79VpQ6SjAT`
3. **Salve** a configuração

## 📋 OPÇÃO 2: INSTALAR SUPABASE CLI

Se preferir usar o CLI, instale primeiro:

```bash
npm install -g supabase
```

Depois execute:
```bash
powershell -ExecutionPolicy Bypass -File .\deploy-custom-emails.ps1
```

## ✅ COMO TESTAR

### 1. Teste Básico:
1. **Acesse**: Seu site local (http://localhost:8080)
2. **Clique**: "Criar Conta"
3. **Preencha**: Dados de teste
4. **Crie a conta**
5. **Verifique**: Email na caixa de entrada

### 2. Teste Multilíngue:
1. **Mude o idioma** no site (PT/EN/FR)
2. **Crie nova conta** em cada idioma
3. **Verifique** se o email vem no idioma correto

### 3. Teste Reset de Senha:
1. **Clique**: "Esqueci minha senha"
2. **Digite**: Email de teste
3. **Verifique**: Email de reset

## 🔍 MONITORAMENTO

### Console do Browser:
- **F12** → Console
- **Procure**: Mensagens com "📧"
- **Exemplo**: "Email personalizado enviado com sucesso"

### Logs do Supabase:
- **Acesse**: Edge Functions → custom-auth-email → Logs
- **Procure**: Sucesso ou erros de envio

### Database:
- **Tabela**: `auth_email_logs`
- **Query**: `SELECT * FROM auth_email_logs ORDER BY created_at DESC;`

## 🎯 RESULTADO ESPERADO

### Email de Verificação Personalizado:
- ✅ Visual do "Touche de Lumière"
- ✅ Cores e design profissional
- ✅ Idioma correto (PT/EN/FR)
- ✅ Nome do site na marca
- ✅ Informações de contato
- ✅ Design responsivo

### Email de Reset de Senha:
- ✅ Mesmo visual personalizado
- ✅ Avisos de segurança
- ✅ Idioma correto
- ✅ Instruções claras

## 🚨 TROUBLESHOOTING

### Se o email não chegar:
1. ✅ Verifique spam/lixo eletrônico
2. ✅ Confirme API key do Resend
3. ✅ Verifique logs no Supabase
4. ✅ Teste com outro email

### Se o visual não estiver personalizado:
1. ✅ Confirme se a função foi deployada
2. ✅ Verifique console do browser
3. ✅ Confirme se a migração SQL foi executada

### Se o idioma estiver errado:
1. ✅ Mude idioma no site antes de criar conta
2. ✅ Verifique logs da função
3. ✅ Fallback é sempre português

## 📞 PRÓXIMOS PASSOS

Após configurar:

1. **Teste completo** em todos os idiomas
2. **Monitore** envios pelos logs
3. **Customize** templates se necessário
4. **Configure** domínio próprio no Resend (opcional)

---

**🎉 Resultado Final**: Emails de verificação profissionais e multilíngues para o Touche de Lumière!