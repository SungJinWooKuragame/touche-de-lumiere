# 🚀 RESET COMPLETO DO BANCO DE DADOS

## ⚠️ IMPORTANTE: BACKUP AUTOMÁTICO

O Supabase faz backup automático, mas se você tem dados importantes, faça backup manual antes.

## 📋 COMO EXECUTAR O RESET

### 1. 🔧 Acesse o Supabase Dashboard

1. **Acesse**: [Supabase Dashboard](https://app.supabase.com)
2. **Selecione**: Projeto "Touche de Lumière" 
3. **Vá para**: SQL Editor (menu lateral)

### 2. 🗃️ Execute o Script Completo

1. **Copie TODO o conteúdo** do arquivo: `RESET_COMPLETO_DB.sql`
2. **Cole** no SQL Editor
3. **Clique**: "Run" (▶️)
4. **Aguarde** a execução (pode demorar alguns segundos)

## ✅ O QUE O SCRIPT FAZ

### 🧹 Limpeza Completa:
- ✅ Remove todas as tabelas existentes
- ✅ Recria schema público
- ✅ Remove dados conflitantes

### 🏗️ Reconstrução Total:
- ✅ Cria tipos (`app_role`)
- ✅ Cria todas as tabelas (profiles, user_roles, services, appointments)
- ✅ Cria tabelas de email (auth_email_logs, email_template_config)

### 🔧 Funções Corrigidas:
- ✅ **`handle_new_user()`** - CORRIGIDA para salvar telefone
- ✅ **`handle_auth_email_custom()`** - Para emails personalizados
- ✅ **`has_role()`** - Para verificar permissões
- ✅ **`get_email_template_config()`** - Para templates de email

### 🔒 Segurança (RLS):
- ✅ Todas as políticas de Row Level Security
- ✅ Permissões corretas para owner/client
- ✅ Proteção de dados sensíveis

### 📊 Dados Iniciais:
- ✅ Serviços padrão (Massagem, Reiki, etc.)
- ✅ Templates de email multilíngues (PT/EN/FR)
- ✅ Configurações básicas

## 🎯 RESULTADO ESPERADO

Após executar o script:

### ✅ Banco Completamente Novo:
- Todas as tabelas recriadas
- Funções corrigidas
- Dados limpos

### ✅ Erro de Signup Resolvido:
- Função `handle_new_user()` corrigida
- Telefone será salvo corretamente
- Cadastro funcionará perfeitamente

### ✅ Sistema de Emails:
- Templates personalizados configurados
- Suporte multilíngue ativo
- Logs de email funcionando

## 🧪 TESTE APÓS RESET

1. **Acesse seu site**
2. **Tente criar uma conta** com:
   - Nome completo ✅
   - Email ✅  
   - Telefone ✅
   - Senha ✅
3. **Verifique**: Cadastro deve funcionar sem erro!

## 🚨 SE DER ALGUM ERRO

1. **Verifique**: Se todo o script foi executado
2. **Procure**: Mensagens de erro específicas no SQL Editor
3. **Reexecute**: Apenas a parte que falhou

---

**🎉 Resultado Final**: Banco completamente novo e funcional com todas as correções aplicadas!