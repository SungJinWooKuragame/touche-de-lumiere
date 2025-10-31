# 📧 Sistema de Emails Personalizados - Touche de Lumière

## 🎯 Objetivo
Personalizar completamente os emails de verificação e reset de senha do Supabase Auth com o visual e marca do "Touche de Lumière", suportando múltiplos idiomas (PT, EN, FR).

## ✨ Funcionalidades Implementadas

### 📋 Templates Personalizados
- **Signup/Verificação**: Email de confirmação de cadastro
- **Reset de Senha**: Email para redefinir senha
- **Design Premium**: Visual profissional com gradientes e marca
- **Multilíngue**: Suporte a Português, Inglês e Francês

### 🌍 Sistema de Idiomas
- **Detecção Automática**: Captura o idioma atual do usuário (i18n)
- **Fallback Inteligente**: Se idioma não disponível, usa português
- **Traduções Completas**: Todos os textos traduzidos nos 3 idiomas

### 🔧 Arquitetura Técnica
- **Edge Function**: `custom-auth-email` para processar emails
- **Interceptação**: Captura eventos de signup/reset
- **Templates HTML**: Emails responsivos e profissionais
- **Logging**: Rastreamento de emails enviados

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
```
supabase/functions/custom-auth-email/index.ts  # Função principal
supabase/migrations/20251031120000_custom_auth_email_templates.sql  # Migração
deploy-custom-emails.ps1  # Script deploy Windows
deploy-custom-emails.sh   # Script deploy Linux/Mac
EMAILS_PERSONALIZADOS.md  # Esta documentação
```

### Arquivos Modificados:
```
src/i18n/locales/pt.ts  # Traduções português
src/i18n/locales/en.ts  # Traduções inglês  
src/i18n/locales/fr.ts  # Traduções francês
src/pages/Login.tsx     # Integração com função personalizada
```

## 🚀 Como Fazer Deploy

### 1. Executar Script Automático:
```bash
# Windows PowerShell
.\deploy-custom-emails.ps1

# Linux/Mac
chmod +x deploy-custom-emails.sh
./deploy-custom-emails.sh
```

### 2. Deploy Manual (se preferir):
```bash
# 1. Deploy da função
supabase functions deploy custom-auth-email

# 2. Aplicar migração
supabase db reset

# 3. Configurar API key
supabase secrets set RESEND_API_KEY=sua_api_key_aqui
```

## 🧪 Como Testar

### 1. Teste de Signup:
1. Acesse o site em diferentes idiomas (PT/EN/FR)
2. Crie uma nova conta
3. Verifique o email recebido
4. Confirme que está no idioma correto

### 2. Teste de Reset:
1. Na tela de login, clique "Esqueci minha senha"
2. Digite um email existente
3. Verifique o email de reset
4. Confirme visual e idioma

### 3. Monitoramento:
- **Console Browser**: F12 → Console → Procurar "📧"
- **Supabase Logs**: Edge Functions → custom-auth-email → Logs  
- **Database**: Tabela `auth_email_logs` para histórico

## 📊 Estrutura do Banco

### Tabela `email_template_config`:
```sql
- template_type: 'signup', 'reset_password'
- language: 'pt', 'en', 'fr'
- subject: Assunto do email
- sender_name: 'Touche de Lumière'
- sender_email: 'noreply@touchedelumiere.com'
```

### Tabela `auth_email_logs`:
```sql
- user_id: ID do usuário
- email: Email de destino
- event_type: Tipo de evento (INSERT/UPDATE)
- language: Idioma usado
- created_at: Timestamp
```

## 🎨 Visual dos Emails

### Características do Design:
- **Header**: Logo e marca "Touche de Lumière"
- **Gradientes**: Cores roxas/azuis elegantes
- **Responsivo**: Funciona em mobile e desktop
- **Profissional**: Visual premium e confiável
- **Informativo**: Dados de contato e localização

### Elementos Incluídos:
- ✨ Ícones e emojis
- 📍 Endereço da clínica
- 📱 Telefone de contato
- 🎨 Design com marca consistente
- 🔒 Avisos de segurança

## 🔧 Configurações Avançadas

### Personalizar Templates:
1. Acesse `supabase/functions/custom-auth-email/index.ts`
2. Modifique as constantes `translations`
3. Redeploy: `supabase functions deploy custom-auth-email`

### Adicionar Novo Idioma:
1. Adicione tradução em `translations`
2. Adicione entrada na tabela `email_template_config`
3. Teste com o novo idioma

### Modificar Sender:
1. Configure domínio no Resend
2. Atualize `sender_email` nos templates
3. Redeploy função

## 🚨 Troubleshooting

### Email não enviado:
1. Verificar API key do Resend
2. Verificar logs da função
3. Verificar configuração do domínio

### Template não personalizado:
1. Verificar se função foi deployada
2. Verificar console browser por erros
3. Verificar tabela `auth_email_logs`

### Idioma errado:
1. Verificar configuração i18n
2. Verificar parâmetro language enviado
3. Verificar fallback para português

## 📈 Próximas Melhorias

- [ ] Dashboard admin para editar templates
- [ ] Preview de templates no admin
- [ ] Métricas de entrega de email
- [ ] Templates para outros eventos (email change, etc.)
- [ ] A/B testing de templates
- [ ] Integração com outros provedores de email

---

**🎯 Resultado**: Emails de verificação agora são profissionais, multilíngues e com a identidade visual completa do Touche de Lumière!